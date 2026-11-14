# 02 · DSH 的两层 Hooks：原生拦截扩展点与 Claude Code / Codex 兼容桥

## 一句话结论

**有，而且分成了职责完全清楚的两层：**

1. **原生层（写新逻辑走这里）**：DSH 没有单独发明一套叫“native hooks”的配置脚本体系——在 DSH 里，原生 hook 就是一个普通的 TypeScript Cordis 插件。它直接订阅核心生命周期与工具执行管道上的强类型扩展点（如 `agent/pre-step`、`tools/pre-execute`、`ctx.tools.guard()`），返回类型安全的决策对象，没有进程拉起和 JSON 序列化开销。
2. **兼容桥层（复用存量配置走这里）**：[`packages/experimental/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/experimental) 下的 [`dsh-hooks-claude-code`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-claude-code/README.md) 与 [`dsh-hooks-codex`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-codex/README.md) 共享 [`dsh-hook-protocol`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hook-protocol/README.md) 协议底座，让你把现成的 Claude Code 或 Codex `hooks.json` 原样挂进 DSH 会话跑起来（仅限 `command` 钩子子集：Claude Code 方言支持 7 个事件，Codex 方言支持 5 个事件）。

一句话定性：**兼容桥是为了保住你已有的 `hooks.json` 脚本投资，而不是 DSH 的能力上限；桥能做的所有事，原生插件都能直接做，而且更强、更稳。**（设计取舍详见 [interception extension points Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-06-30-interception-extension-points.md)。）

---

## 一、先看长什么样：兼容桥 vs 原生插件

假设你想拦截危险的 `rm` 命令或特定工具调用，两条路在 DSH 里的写法差别非常直观：

### 路线 A：直接复用现成的 Claude Code `hooks.json`（兼容桥）

不用改原来的 `.claude/hooks.json` 和脚本，只需在启动 overlay（如 `cordis.patch.yml`）里显式挂上实验桥插件：

```yaml
plugins:
  - name: '@deepseek-ai/dsh-hooks-claude-code'
    config:
      configPath: ./.claude/hooks.json
      projectDir: .
```

六个内置 profile 默认都不挂载这两个桥插件，必须显式启用。

### 路线 B：直接写一个原生 Cordis 插件（原生扩展点）

如果是新需求，写十几行 TypeScript 就能拿到完整的上下文与类型检查。若要做“任何监听顺序都绕不过去”的硬护栏，直接注册单调只拒的 `ctx.tools.guard()`；若要支持弹窗审批或给出拒绝理由，监听 `tools/pre-execute` 瀑布流即可：

```ts
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-tools'

export const name = 'guard-rm'
export const inject = ['tools']

export function apply(ctx: Context) {
  // 1. 审批/拦截瀑布流：可返回 allow / deny / ask，委托下游必须调 next()
  ctx.on('tools/pre-execute', async (exec, next) => {
    if (exec.name === 'bash' && String(exec.args.command ?? '').includes('rm -rf /')) {
      return { kind: 'deny', reason: 'Blocked destructive root removal.' }
    }
    return next()
  })

  // 2. 单调硬护栏：只允许放行（undefined）或拒绝（reason），不受监听器注册顺序影响
  ctx.tools.guard((exec) => {
    if (exec.name === 'write' && String(exec.args.path ?? '').endsWith('.env')) {
      return 'Writing .env directly is forbidden by policy.'
    }
  })
}
```

---

## 二、原生层：按阶段划分权力，不靠监听器顺序博弈

Claude Code 和 Codex 的钩子本质上是“在配置文件里挂外部进程”；DSH 的原生拦截面则是 [`docs/tool-execution-pipeline.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md) 与 [`docs/subsystems/core.md#interception-decisions`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/core.md#interception-decisions) 定义的一条严格流水线：

`agent/created` → `agent/pre-step` → `tools/pre-execute` → `ctx.tools.guard()` → `tools/execute` → 工具执行 → `tools/post-execute` → `finalizeContent` → `tools/result` → `agent/turn-stopping`

它与外部 shell hooks 最大的设计差异在于**每个扩展点只拥有单一、明确的权力**：

| 原生扩展点 | 对应 CC / Codex 事件 | 这一阶段能做什么（与不能做什么） |
|---|---|---|
| `agent/created` | `SessionStart` | 串行初始化生命周期通知（携带 `SessionStartSource`）；可通过 `agent.inject()` 注入初始上下文，但**不能阻止会话创建** |
| `agent/pre-step` | `UserPromptSubmit`（覆盖更广：每步前都触发，不止首条用户消息） | 瀑布流返回 `PreStepDecision`：`enter`（替换或追加本步进入模型的完整消息批）或 `reject`（直接拦下，不打开 step、不留模型可见消息） |
| `tools/pre-execute` | `PreToolUse` | 瀑布流返回 `allow` / `deny`（带理由）/ `ask`（走审批 seam，fail-closed，仅单次放行） |
| `ctx.tools.guard()` | 两家均无直接对应 | **单调只拒（deny-only）**：任何 guard 返回拒绝理由即终止调用，后续监听器无法把已拒绝的操作“复活” |
| `tools/execute` | 两家均无直接对应 | 包裹实际工具派发（适合做超时、重试、耗时统计），可派生子 `AbortSignal`，但不能删掉取消信号 |
| `tools/post-execute` | `PostToolUse` | 可拦截结果并附带反馈、替换模型可见内容或结构化值、追加 `additionalContexts` |
| `tools/result` | 两家均无直接对应 | **只读终态观察者**：异常被隔离，不能篡改工具结果 |
| `agent/turn-stopping` | `Stop` | 回合即将自然结束时触发；若需强制续轮，调用 `agent.steer()` 附带模型可见理由再走一步 |

至于 `PreCompact` / `PostCompact`、桌面通知 `Notification` 以及 Codex 专属的 `PermissionRequest`，DSH 明确放在这套拦截决策面之外，由各自的专用能力插件负责。

---

## 三、兼容桥层：支持什么、刻意不做什么

`dsh-hooks-claude-code` 和 `dsh-hooks-codex` 把外部 `hooks.json` 翻译到上面同一批原生扩展点上，共用 `dsh-hook-protocol` 执行子进程、解析退出码与合并输出：

- **覆盖的事件范围**：
  - Claude Code 桥支持 **7 个事件**：`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStart`、`SubagentStop`。
  - Codex 桥支持 **5 个事件**：`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`（不含两个 Subagent 事件）。
- **严格贴合各方言的决策边界**：Claude Code 桥的 `PreToolUse` 支持 `deny` 和 `ask`；Codex 桥的 `PreToolUse` 只支持阻断（`deny`），不额外发明 Codex 当时没有的 `ask` 审批语义。
- **最严优先合并（most-restrictive merge）**：同一事件命中多个钩子时，按配置顺序**串行**执行，结果按 `deny > ask > allow` 折叠。之所以串行而不是像外部工具那样并发，是为了让会话日志里的 `hook/invoked` 与 `hook/result` 严格成对相邻；由于合并函数与顺序无关，最终放行/拒绝结论与并发执行一致，代价只是串行耗时相加。
- **日志留痕但不污染模型上下文**：每次在打开的 turn 内调用钩子，都会写入一对仅用于审计的 `hook/invoked` 和 `hook/result` 会话事件（见 [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)）。模型看不到钩子进程本身，只看到拦截理由或注入的上下文消息。

使用兼容桥前，有 **5 个刻意保留的边界/限制** 必须心里有数：

1. **只跑 `{ "type": "command" }` 钩子**：`http`、`mcp_tool`、`prompt`（LLM 裁判）和 `agent` 类型会被解析并跳过（打印告警）。
2. **`updatedInput` 只告警不改写**：工具入参改写牵涉会话历史、UI 展示与审计的一致性（归口在 [pre-tool-input-rewrite 提案](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/proposed/feature/2026-06-30-pre-tool-input-rewrite.md)），桥遇到 `updatedInput` 会打日志告警但按原参数继续。
3. **`{"continue": false}` 只记录不强停整轮运行**：当前拦截面没有硬停整个 run 的原语，两个桥都只记录该标志而不中断会话。
4. **`Stop` 阻断没有自动防死循环上限**：Claude Code 官方有连续 8 次 block 上限，DSH 桥目前不设硬上限——如果你的 `Stop` 脚本无条件返回 block，模型就会一直续步，脚本必须自己看条件收敛。
5. **`transcript_path` 恒为空值**（Claude Code 桥传 `""`，Codex 桥传 `null`）：DSH 持久化层不暴露底层文件路径，且默认 Zstandard 压缩的会话日志也没法让外部 shell 脚本直接当纯文本读。

---

## 四、三家横向对照表（Claude Code vs Codex vs DSH）

外部两家数据取自官方文档核验留档（见 [research.md](./research.md)；注意官方文档仍在演进，Claude Code 已增至 33 个事件、Codex CLI 增至 12 个事件，比桥包 README 初写时的 30 / 10 基线各多了几个新事件）：

### 1. 配置、发现与安全信任

| 对比维度 | Claude Code | OpenAI Codex CLI | DSH 兼容桥 | DSH 原生插件 |
|---|---|---|---|---|
| **声明位置** | 四层 `settings.json` + plugin / skill / subagent frontmatter，逐层累加合并 | 各配置层旁的 `hooks.json` 或 `config.toml` 内联 `[hooks]` + plugin + 企业 `requirements.toml`，全量合并 | 单一进程级 `configPath`，启动时读取一次 | `cordis.yml` 或启动 overlay（`--patch`）插件条目 |
| **事件数量** | 33 个 | 12 个 | CC 桥 7 个 / Codex 桥 5 个 | 8 个核心拦截点 + 全部 Cordis 生命周期事件 |
| **处理器类型** | `command` / `http` / `mcp_tool` / `prompt` / `agent` | `command` / `mcp_tool`（外加旧版旁路 `notify`） | 仅 shell 形式 `command` | 直接写 TypeScript 函数，无子进程边界 |
| **信任机制** | 交互模式受工作区信任弹窗门控；`-p` / SDK 视为已信任；支持企业 `allowManagedHooksOnly` | **逐钩子内容哈希信任评审**（改脚本即重新待审）+ 企业托管锁死 | 随宿主配置信任；配置文件解析失败仅告警，不阻断启动 | 与插件同级信任，受 Loader 与 overlay 规则管控 |
| **运行期热更** | 支持 live reload 与 `ConfigChange` 事件 | 信任评审通过后生效，提供 `/hooks` 面板 | 不热更（启动读一次） | 支持 Cordis 插件级热替换与作用域自动回收 |

### 2. 执行契约与控制力

| 对比维度 | Claude Code | OpenAI Codex CLI | DSH 兼容桥 | DSH 原生插件 |
|---|---|---|---|---|
| **同事件并发** | 全部并行（相同 handler 去重） | 同事件命令钩子并发启动 | **按配置顺序串行**（保证日志事件成对相邻） | 同一瀑布流内按插件注册顺序链式委托 |
| **默认超时** | 600s（部分事件 30s/10s；超时的 `PreToolUse` **不阻断**调用） | 600s（`SessionEnd` / `Interrupt` 默认 1s、上限 3s） | 默认 `600000` ms（600s） | 进程内异步调用，由 `AbortSignal` 统一取消 |
| **`PreToolUse` 能力** | `allow` / `deny` / `ask` / `defer` + `updatedInput`（并行改写谁最后跑完算谁） | `deny` / `allow` + `updatedInput`（不支持 `ask`） | CC 桥支持 `deny` / `ask`；Codex 桥仅 `deny`；均不执行 `updatedInput` | 强类型 `allow` / `deny` / `ask` + 独立的单调 `ctx.tools.guard()` |
| **`Stop` 续轮机制** | block 理由成为下一条指令，最多连续拦 8 次 | block 理由自动生成续轮用户 prompt，`continue:false` 可覆盖 | 经 `agent.steer()` 强制再走一步，**无内置次数上限** | 直接调 `agent.steer()`，由插件自行控制收敛条件 |
| **上下文注入与溢出** | 部分事件支持纯文本 stdout + `additionalContext`；超 10,000 字符落盘截断 | 同左；默认约 2,500 token 溢出落盘到临时文件并给首尾预览 | JSON `additionalContext`（Codex 桥部分事件兼认纯文本 stdout），作为带 `source` 标记的用户消息追加 | `agent.inject()` 或 `additionalContexts`，纯追加不破坏前序 KV Cache |
| **审计方式** | 落在会话 transcript | transcript + `hook_outputs` 溢出文件 | 会话日志写入 `hook/invoked` 与 `hook/result` 对（对模型不可见） | 拦截与注入结果直接体现在标准会话事件流中 |

---

## 五、选型建议：什么时候挂桥，什么时候写插件？

| 你的实际场景 | 推荐做法 |
|---|---|
| 手头已经有跑熟的 Claude Code / Codex `hooks.json` 命令脚本，想迁来先用起来 | **挂兼容桥**。上线前核对一遍上面的 5 条边界（特别是没有 `updatedInput`、`continue:false` 不停机、`Stop` 脚本需自备防死循环条件）。 |
| 为团队编写新的安全护栏、目录限制、命令审计或动态上下文注入 | **写原生 Cordis 插件**。几十行 TypeScript 就能搞定，不仅省掉每次工具调用 fork 子进程的开销，还能用上 `ctx.tools.guard()` 的单调安全保证。 |
| 想实现类似 Claude Code `prompt` / `agent` 钩子那种“让小模型当安全裁判”的效果 | **写原生插件**。在 `tools/pre-execute` 监听器里直接调用模型服务即可，兼容桥不会执行非 `command` 处理器。 |
| 想调整 agent 主循环某一步的默认策略 | **依然写原生插件**。DSH 的铁律是“用扩展点挂插件，不手改主循环”（见 [FAQ 08](../08_plugin-seam-maturity/answer.md)）。 |

## 延伸阅读与证据入口

- **DSH 协议与桥实现说明**：[`dsh-hook-protocol` README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hook-protocol/README.md)、[`dsh-hooks-claude-code` README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-claude-code/README.md)、[`dsh-hooks-codex` README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hooks-codex/README.md)
- **DSH 原生拦截契约与设计决策**：[`docs/tool-execution-pipeline.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md)、[`docs/subsystems/core.md#interception-decisions`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/core.md#interception-decisions)、[interception extension points Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-06-30-interception-extension-points.md)
- **Claude Code 与 Codex 官方文档核验详表**：[research.md](./research.md)
