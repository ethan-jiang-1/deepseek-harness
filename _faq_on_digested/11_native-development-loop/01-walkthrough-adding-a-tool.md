# 01 · 实战走查：按 DSH 的窄切片闭环加一个新能力

[`answer.md`](./answer.md) 讲了原理，这一篇用具体场景走一遍：当你想在 DSH 里加一个新能力时，究竟在写什么、每一步怎么落到“窄证据切片闭环”上。

---

## 先分清：DSH 里扩展能力其实有两种完全不同的活法

动手前先别急着建 npm 包。在 DSH 里，“加能力”分轻重两档，选对品种能省掉大半工夫：

| 对比维度 | 1. 行为编排型扩展（轻，零编译） | 2. 运行时代码插件（重，TypeScript 包） |
|---|---|---|
| **你在写什么** | `SKILL.md` 技能说明、`workflow` 纯 JS 编排脚本、或 `*.patch.yml` 配置覆层 | 标准 Cordis 插件（`name` / `inject` / `apply` + `defineTool` 或服务实现） |
| **放在哪** | `.agents/skills/<name>/SKILL.md`、任意 `.js` 脚本路径、自定义 patch 文件 | 仓库内 `packages/<group>/<pkg>/`，或独立外部插件仓（见 [FAQ 13](../13_expert-plugin-repo-organization/answer.md)） |
| **怎么生效** | 会话目录自动发现技能（或敲 `/技能名` 加载）；`workflow` 工具直接跑脚本；`dsh --patch` 叠加配置 | 仓内挂进 bundle/preset patch；外部包声明 `dsh.bundle` 后用 `dsh plugin --profile <name> add` 安装 |
| **最小验证是什么** | 开一轮真实模型会话试跑（`dsh --profile headless "..."`），看编排产物对不对 | 跑单包的 `vitest` + `typecheck` + `doc-sync` |

很多完整功能都是**两者组合**出来的：先写一个小巧的 TypeScript 工具插件负责确定性读写和 UI 卡片展示，再配一份 `SKILL.md` 教模型在什么时机调用它、怎么用 `workflow` 脚本批量跑（支持 `agent()`、`pipeline()`、`parallel()`、`phase()`、`log()` 等原语）。

下面以写一个 **TypeScript 工具插件** 为例，完整走一遍仓库内的六步闭环。假设需求是：**给对话加一个 `log_decision` 工具，让模型能随时记录讨论中拍板的决定，并在 Web 界面上渲染成可定位源文件的卡片。**

---

## 六步闭环实战：`tool-decision-log`

### 第 1 步：核对现场——先读权威契约，不靠猜

写代码前先翻三份一手材料，前后不到五分钟：

1. 读 [`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)：看清哪些是 `defineTool` 自动白送的，哪些规矩必须自己守。
2. 读 [`docs/cookbook/adding-a-package.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-package.md) 与 [`docs/development.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)：确认纯后端插件只需要挂进 `tsconfig.host.json`。
3. 挑一个体量相近的现成工具包（比如 [`packages/goal/tool-goal/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/tool-goal/src/index.ts)）看一眼真实目录结构。

### 第 2 步：圈定窄 diff——只动真正归属这一片的文件

对照建包清单，这笔改动的边界非常干净：新建 `packages/decision-log/tool-decision-log/` 下的 `package.json`、`tsconfig.json`、`src/index.ts`、`README.md`（及双语配对）、`tests/tool-decision-log.spec.ts`，外加在根 `tsconfig.host.json` 的 `references` 里添一行路径。不碰核心 `agent-loop`，也不改无关配置。

### 第 3 步：改源头——只写“推导不出来的本质”，守住两条硬约束

在 `src/index.ts` 里用 `defineTool` 声明工具：

```typescript
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'tool-decision-log'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'log_decision',
    description: 'Record a key decision made during the session.',
    parameters: {
      key: { type: 'string', required: true, description: 'Stable kebab-case key.' },
      title: { type: 'string', required: true, description: 'One-line decision summary.' },
      status: { type: 'string', enum: ['proposed', 'accepted', 'rejected'], description: 'Decision status.' },
      sourceFile: { type: 'string', description: 'Optional related file path.' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          key: { type: 'string', required: true },
          saved: { type: 'boolean', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: `Recorded decision "${value.key}".` }],
    },
    async execute(args, exec) {
      if (!/^[a-z][a-z0-9-]*$/.test(args.key)) throw new Error('key must be kebab-case')
      if (args.title.trim().length === 0) throw new Error('title must not be empty')
      // 写入会话事件流或调用持久化服务，并留意响应 exec.signal 取消信号
      return { key: args.key, saved: true }
    },
    presentCall: (args) => ({
      card: 'generic',
      title: `log_decision: ${args.key}`,
      locations: args.sourceFile ? [{ path: args.sourceFile }] : undefined,
    }),
    presentResult: (_args, result) => ({
      card: 'generic',
      content: result.meta?.summary ?? 'Decision logged.',
    }),
  })))
}
```

写这段代码时，你会直观体会到 DSH 的分工逻辑：

- **框架自动替你派生的部分**：入参基础类型校验、把 JSON Schema 拼进系统提示词、跟着 `ctx.effect()` 自动在卸载时注销工具、连 PTC 代码模式下的 TypeScript SDK 类型声明都顺手生成好了。如果挂进了正式组装层，跑一次生成器就能自动刷新 `docs/tool-catalog.md`。
- **必须由作者亲手守住的两条底线**：
  1. **Schema 表达不了的业务约束在 `execute` 里手检**：比如非空字符串、`kebab-case` 格式、跨字段互斥，以及异步操作对 `exec.signal` 中断信号的响应。
  2. **UI Presenter 必须是绝对纯函数**：`presentCall` 和 `presentResult` 不仅在实时对话时跑，在**历史会话日志重放**时也会跑。里面严禁读磁盘文件、严禁查当前外部状态、严禁调 `Date.now()`；任何需要在结果卡片上展示的快照信息（比如当时的 diff 摘要），必须在 `execute` 阶段算好塞进 `presentationMeta` 随日志存下来。

### 第 4 步：跑最小匹配证据——不到一分钟验完核心回归

不跑动辄几分钟的全仓测试，只挑跟这几个新文件直接挂钩的三条命令：

```sh
# 1. 只跑这个新包的单测（覆盖合法调用、空参拦截、纯函数卡片渲染）
pnpm vitest run packages/decision-log/tool-decision-log/tests/tool-decision-log.spec.ts

# 2. 验证新包加进 tsconfig.host.json 后编译与跨包类型引用无误
pnpm run typecheck

# 3. 校验新增的包 README、JSDoc 与生成目录同步门禁
pnpm run doc-sync
```

如果这个工具已经挂进了出厂 profile、真正改变了模型在真实会话里的可见工具面，再按 [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 补一条无密钥录制会话快照（`pnpm run test:snapshot`）。

### 第 5 步：判断要不要写 Agent Note——看有没有“持久取舍”

按照现行 [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md#when-to-write-one) 的判据，不要为了凑数写 Note：

- **不该写 Note 的细节**：比如“参数缺省时在 `execute` 里兜底 `status ?? 'proposed'`”——这种一眼看代码和 README 就明白的局部实现，属于明确豁免项，写了反而是噪音。
- **真正该写 Note 的情况**：假设你在设计时专门权衡过“为什么把决策记在当前会话事件流里，而主动放弃了建一张跨会话 SQLite 表（因为现阶段不需要跨会话检索，避免引入 schema 迁移负担）”——这种**未来维护者光看代码看不出来、容易重新翻案的架构取舍**，才值得在同 PR 里写进 `.agents/notes/implemented/`，把被否掉的备选方案一并记下。

### 第 6 步：老实写 PR 报告——跑了什么就写什么

提 PR 时，Motivation 讲清解决什么问题，Testing 折叠区只贴上面真正跑过的那三条命令的输出；全量 `test:coverage` 和 Windows/Linux 矩阵直接注明交由 CI 验证。

走完这一圈就能看明白：所谓“DSH 原生开发习惯”，就是**每次只切一个职责清楚的小片，让框架生成衍生样板，用几秒钟的定向单测快速拿反馈，把真正算不清楚的设计取舍留档，其余交给 CI 兜底。**
