# 11 — 快照机制的对外面：插件仓能拿到的发布包、夹具与接线事实

> 本篇补 [04](./04-snapshot-machinery.md) 的一个视角缺口：04 站在**主仓语料消费者**一侧讲机制（世代、四面、manifest、sidecar、门禁）；本篇讲同一套机制**作为发布物**对仓外暴露了什么。与 [08–10](./08-plugin-testing.md) 同族，面向插件作者。只收 DSH 一手事实（基线 `639ed01539`）；外部仓的实践校准、组织与价值判断在 `_faq_on_digested/21_recorded-session-snapshots/`，本篇不重复。

## 现象是什么：一个半公开的机制

`packages/test-support/` 的两个快照支撑包都是 **npm 公开发布物**：`package.json` 里 `publishConfig.access: "public"`、无 `private`，版本 `0.2.0-rc.2` 与产品同版本矩阵（`@deepseek-ai/dsh-llm-replay`、`@deepseek-ai/dsh-session-snapshot`）。但 `docs/user/develop/` 与 `docs/cookbook/` 对它们**零提及**（grep 事实）——`llm-replay` 在 `docs/` 里只出现在生成的目录中（config-catalog、module-graph、capability-seams、event-producer-consumer），唯一权威是包自己的 README 与 `src/`。

一句话定性：**能装、能挂、能自带夹具，但没有面向外部作者的文档。** 主仓把它们当内部测试基建使用并随矩阵发布；外部消费是「事实可行」，不是「官方支持面」。

## 硬事实一：夹具的接受面比主仓语料宽

主仓提交的夹具是 **projected**（省略顶层 `seq`/`time` 包络，见 [04](./04-snapshot-machinery.md) 夹具格式一节）。但回放器的解析对 **complete**（原始带包络的运行日志）同样接受，唯一禁令是不能混：

> `session snapshot line N cannot mix projected and complete body rows` — `packages/test-support/llm-replay/src/index.ts`（`parseSessionFixture` 的 bodyKind 检查）

**机制推论：「录制」不需要任何 DSH 内部工具**——真跑一次、留下明文日志，这份日志本身就是可回放夹具。三个前提都不是默认满足的：

1. **明文。** 会话持久化默认 `compression: 'zstd'`（`packages/session/session-persistence-jsonl/README.md` 的配置表），而回放器只 `readFileSync` 后逐行 `JSON.parse`——读不了 `.zstd`。`compression: 'none'` 才有明文；另一条恒为明文的路是 Web 会话导出（`session-log-export` 经持久化层读取后重新序列化）。
2. **header 带整数 `version`。** 无版本号的 header 被严格恢复拒绝（`Session format version must be a non-negative safe integer`）。
3. **夹具不比运行时新。** 历史版本经 build-static format catalog 在内存里向前迁移后再回放；反过来不行。

另一个解析边界：**首行必须是 JSON 对象**（`session snapshot line 1 must be a JSON object`）。把裸 `ReplayEntry[]` 脚本塞进 `file` 会在第一行报错——裸脚本的正确位置是 `overrideFile`（整脚本替换形态）。

## 硬事实二：挂载面就是一个普通 function 插件

`dsh-llm-replay` 是最标准的具名导出形态，无 default export：

```ts
export const name = 'llm-replay'
export const inject = ['llm']
export function apply(ctx: Context, config: Config = {}): void
```

`Config` 五字段 `file / overrideFile / childFiles / providers / paceMs`，环境变量只是缺省（`apply` 里 `config.file ?? process.env.DSH_SNAPSHOT_FILE`，`overrideFile`、`childFiles` 同理）——**不经 snapshot harness、纯靠 config 也能挂**。两种安装形态：`providers` 非空时注册路由式回放 adapter（模型发现可用、零 provider I/O）；为空时装 catch-all `llm/stream` waterfall，短路所有 provider。`assertConsumed()`（把「静默少消费」变成明确诊断）只在编程式 `installLlmReplay` 上暴露，Cordis 插件形态拿不到。

## 硬事实三：接线语义在与组合层的交界上

这部分是外部使用最容易踩的坑，全部可对到基线源码：

- **`llm-deepseek` 与 `llm-deepseek-account` 都是 base bundle 的 adapter 挂载行**（`packages/bundle/base/cordis.patch.yml:525`、`:528`）。要替换 provider，相关挂载行必须**全部** `disabled: true`——只加一个同名新行不等于替换，真 adapter 仍在组合里注册并接流。
- **patch 未命中是警告，不是报错**：vendor include 对不存在的行 id 只 `warn('patch: entry %C not found')`，name 不匹配也只 warn 并跳过（`vendor/include/src/index.ts`）。写错 id/name 时组合照常启动——`--dump-config` 是核对 patch 是否真落位的手段（`apps/cli/src/args.ts` 的 `--patch` 可重复、叠加在 profile 层之后）。
- **overlay 的 `config:` 是逐顶层键整键替换**（vendor include 的 `target[key] = value`），不是深合并——录制/回放 overlay 里要把该插件需要的 config 键写全。
- **`session-title-first-prompt-llm` 也 inject `llm`**（`packages/session/session-title-first-prompt-llm/src/index.ts`）——它同样是一条 `llm/stream` 消费方，在回放里按 first-call 序占用脚本位；不想让它吃位就在回放 overlay 里显式禁用（标题会走 fallback）。

## 硬事实四：git 卫生与实测占用（基线树实测）

| 事实 | 数字 / 出处 |
|---|---|
| `snapshots/` 整树提交 | 基线树 **210 场景 / 1278 文件 / 6.7MB**（`git ls-tree -r -l` 字节口径；`du` 按 4KB 块会虚高到 ~10MB），折算 **~32KB/场景** |
| 最大单文件 | 77KB（`snapshots/session/dynamic-tool-updates/tool-schemas.expected.json`——schema sidecar 是大头） |
| 按扩展名 | jsonl 4.1MB / json 1.7MB / md 0.6MB——全是逐行文本，packfile 再压缩 |
| 运行时原始日志**不进** git | `.gitignore:14` 的 `.sessions/`——**录制原料不进，证据进** |
| diff 人工过目是成文义务 | `snapshots/AGENTS.md`：「every resulting JSONL, prompt, schema, protocol, UI, and workspace diff is reviewed before commit」 |

## 校准：快照层在证据体系里的位置（四篇 postmortem 对照）

| 事故 | 事后钉住它的回归面 | 是快照吗 |
|---|---|---|
| `docs/postmortem/0001`（多余 default export 吃掉 `inject`） | 无 key 真 Loader 子进程 e2e（`apps/cli/tests/profiles/acp/tests/acp.e2e.ts`） | 否——需要的是真实装载路径 |
| `docs/postmortem/0002`（`!!js` 让文件系统工具永久禁用） | `verify-cordis-config` 静态门 + `UNKNOWN_TOOL` 语义守卫 | **快照是共谋**：「A snapshot refresh is fixture production, not correctness review.」 |
| `docs/postmortem/0003`（Web agent 用裸 Vite 糊弄验收） | 分层真路径 e2e | 否——会话日志在这里是**事后取证记录**，不是回归面 |
| `docs/postmortem/0004`（Landlock 提示行误判为沙箱失败） | 原生边界单测 + `snapshots/session/partial-landlock-child-failure/` | **是**——唯一以快照为组装回归 pin 的一篇 |

**四篇里只有一篇。** 快照层证明的是「这份转录下的真实装配、循环、日志与已声明效果」；它不向模型发请求，因此不证明真实模型会遵守新写的 persona 或 skill，也推不出未录制行为——那是 with-key e2e 的职责。

## 为什么这么定（解释）

1. **为什么 test-support 包会发布**：产品按同一版本矩阵发布全家桶（prerelease 映射 `next` dist-tag，见 `scripts/release/families.ts` 的发现规则——只跳过 `private: true`）。发布是矩阵行为，不构成对外支持承诺；这也解释了「发布了却没有外部文档」的不对称。
2. **为什么夹具接受面天然覆盖原始日志**：主仓自己的 writer-oracle 与迁移测试就要读未投影的原始日志（`writer.expected.jsonl` 一族，见 [04](./04-snapshot-machinery.md)）；外部「真跑一次留日志」能直接当夹具，是这个内部需求的副产品，不是为外部设计的接口。
3. **为什么 patch 用 warn 而不是报错**：组合层对「部分 patch 不命中」采取容错（配置在 HMR 与版本演进中会漂移）；代价是接线错误静默失效。主仓自己用 corpus gate 与 `--dump-config` 核对习惯来补这一层——外部消费者没有这些门禁，所以这一条是外部接线最大的坑。

## 源码锚点

- `packages/test-support/llm-replay/package.json`、`packages/test-support/session-snapshot/package.json`——发布状态
- `packages/test-support/llm-replay/src/index.ts`——`parseSessionFixture`（双接受 / 首行对象 / version）、`apply`（config ?? env）、`name`/`inject`、`installLlmReplay` 与 `assertConsumed`
- `packages/bundle/base/cordis.patch.yml:525,528`——两个真实 adapter 挂载行
- `vendor/include/src/index.ts`——`patch: entry %C not found` 的 warn、name mismatch 跳过、config 逐键整替换
- `packages/session/session-title-first-prompt-llm/src/index.ts`——`inject` 含 `llm`
- `packages/session/session-persistence-jsonl/README.md`——`compression` 默认 `'zstd'`
- `.gitignore:14`、`snapshots/AGENTS.md`——git 卫生与 diff 评审义务
- `docs/postmortem/0001`–`0004`——校准表

## 最小例证

1. **双接受可检索**：`grep -n "cannot mix projected and complete" packages/test-support/llm-replay/src/index.ts`——错误串本身就是规则原文。
2. **patch 未命中只是 warn 可复现**：读 `vendor/include/src/index.ts` 的 `warn('patch: entry %C not found', id)`——没有任何 throw 路径。
3. **体积口径可复现**：`git ls-tree -r -l 639ed015397290b3745d163aafe02ffee4aa3f84 snapshots | awk '{s+=$4} END {print s/1024}'` ≈ 6727 KB；换 `du -sh` 会得到虚高的块口径。
