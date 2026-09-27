# AGENTS.md 入口链：文件态骨架 + 会话态加载

> **术 · 入口链。** 本页是实战：入口链的文件怎么写、加载机制长什么样。十维评估里「归属」维亮红、或 [`落地总纲`](./06-step-by-step-guide.md) Phase 2 开工时，来这页抄作业。文件态的设计论证归 [FAQ 04](../04_root-entry-doc-design/answer.md)，会话态机制归 [FAQ 05](../05_root-entry-doc-navigation/answer.md)；本页拥有「两种状态各怎么落到你的仓库」。

## 入口文件是 agent 唯一稳定的第一印象

每次新会话它都被读，其它内容都要靠它指路——它写坏了，后面的 owner 表、cookbook、决策记录做得再好都白搭：agent 根本走不到那里。常见的坏法有三种：写成大而全总览（上下文被无关细节淹没）；规则复制多份（改一处忘一处，漂移开始）；或者干脆没有入口（每个会话都从目录树裸猜）。入口链就是治这三种病的实物结构。

## 文件态：照着写就行

DSH 的真实骨架（可直接 `ls` 验证）：

```text
CLAUDE.md（symlink → 同目录 AGENTS.md，每目录只有一份真实文件）
  └─ 根 AGENTS.md（standing orders + 布局 + 命令，每条 link 到 home）
       ├─ 子树 AGENTS.md（只在「该子树有专属常驻规则」时才有，数量刻意克制）
       │    └─ 按需 link 到各 package README.md（当前合同的事实层）
       └─ docs/architecture.md（有序地图）、docs/AGENTS.md（文档 tier）
            cookbook/（怎么做）、.agents/notes/（为什么）
```

四个环节，每个都有 DSH 的实践依据：

**1. `CLAUDE.md` 是 symlink，不产生第二份事实。** 不同 agent 宿主认不同的入口文件名（Claude 类读 `CLAUDE.md`，其它读 `AGENTS.md`），但每个目录里事实只该有一份。DSH 原话：

> **DSH 原话 ·** symlink 规则（根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)）
>
> `CLAUDE.md` symlinks `AGENTS.md` at root and `packages/`; edit the real file.

落地就是一条命令：`ln -s AGENTS.md CLAUDE.md`。DSH 仓库有 4 处这样的 symlink（root、`packages/`、`vendor/`、`.agents/notes/implemented/`）。

**2. 根 `AGENTS.md` 只放 standing orders。** 每轮都要在上下文里的规则，每条 1–3 行、链到 home；教程、故事、流程一律不写。字数预算不是建议，是门禁：`scripts/doc-budgets.manifest.json` 逐文件卡上限（根文件 ≤ 1,950 词），`verify-doc-budgets` 执行。

**3. 子树 `AGENTS.md` 是「合适个数」**：只在「有子树专属常驻规则」时放，宁可少放——大多数 package 只有 README.md 是**正确结果，不是缺口**。

**4. AGENTS.md 串起 README.md，而不是吞掉它**：AGENTS 是路由/常驻指令层，README 是「当前合同」事实层，通过 link 串进地图。分工的完整规则是 [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md) 的 tier taxonomy 表——根/子树/包 README/Skills 每行同时写「放什么」和「禁放什么」。

**给数值：推荐区间，不是 DSH 的现位。** 数值不迁移，门禁迁移——值得搬的不是 DSH 的某个具体数，而是「存在一个会被机器执行的数」：接成 `exit non-zero` 检查（见 [`可执行反馈`](./09-executable-feedback.md)），上限只降不升、上涨要在 PR 里论证。DSH 的棘轮语义（`verify-doc-budgets` 头注释）：`Ceilings ratchet down with at least 5% headroom; raising one requires the justification defined in docs/AGENTS.md`。区间本身是本 FAQ 的综合推荐，锚点数字以基线 `46a7f68b09` 的文件为准：

| 预算点 | 推荐区间 | DSH 锚点 |
|---|---|---|
| 根入口文件 | 300–1,500 词起步，取下沿、只降不升 | ≤1,950 词（`scripts/doc-budgets.manifest.json`；大仓多轮棘轮的现位，不是起点） |
| 子树入口文件 | 有专属常驻规则才放；放了的单个 ≤600 词 | 通则 ≤600 词在 `docs/AGENTS.md`（无机器条目）；manifest 里的 ≤750（packages）/ ≤1,320（docs）是逐文件例外 |

中文按字符折算（字数 ≈ 词数 × 1.5–2），或直接对字符数设上限——`wc -w` 式计数对无空格文本会把整段计成 1 词，直接搬词数会虚松一个数量级。这层预算管的是常驻层信噪比的**分母**（每轮必读内容的厚度）；**分子**（每行确实都是带 home 的 standing order）由 tier taxonomy 管。两头都抓，信噪比才真的被控制住。

**可迁移结论**：这是「写文件」的工程，几乎零架构依赖；宿主自动加载（Claude Code 读 `CLAUDE.md`）意味着**第一环不写代码就免费生效**。这就是 [`落地总纲`](./06-step-by-step-guide.md) Phase 2 的完整内容。

## 会话态：DSH 的运行时怎么加载这条链

文件态是「地图」，会话态是「地图在活 session 里怎么被走」。DSH 用 [`packages/context/agent-instructions`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/agent-instructions/README.md) 插件把文件态变成三件机器执行的事：

- **注入（push）**：会话第一步注入根 AGENTS 链（baseline）；模型用 read/write/edit 触达更深目录后才注入子树 AGENTS（**touch-driven**）；`maxBytes` 限制整条链（自建 host 从 32–128 KB 起步，锚点是 dsh-base 默认的 65,536 字节）；同目录 `CLAUDE.md` 与 `AGENTS.md` 内容相同只渲染一次；digest 未变不重复注入。DSH 原话：

  > **DSH 原话 ·** 预算与丢弃顺序（[`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/agent-instructions/README.md)）
  >
  > Rendering keeps the most specific files first: it drops whole broader files before truncating the most-specific file, and emits a visible `Workspace instruction budget ...` notice naming the omitted and truncated paths. The rendered bytes never exceed `maxBytes`.

- **导航（pull）**：不在注入链里的 README / catalog / skill 正文，由模型用 read/grep/glob 按需拉取。这一层的关键在**入口链的「可导航性」**：根文件里的每个链接都是 pull 的起点——agent 从 standing order 的一句话跳到 owning README，再跳到 cookbook。链接断了或指错，pull 就失败，agent 退回裸猜。所以 Phase 1 的验收里有一条「任何一条规则 10 秒内指出唯一 home」——那不只是文档卫生，是 pull 路径的健康检查。DSH 的[文档门禁](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)（`doc-sync` 的一部分）机械校验链接与锚点，保证 pull 路径不断。
- **回收（recycle）**：超预算由 token meter 度量、compaction 压缩回收——注入的内容以 user-role 消息进历史，和普通对话一样被压缩，不享受特权通道；压缩时保留 tool-call/result 配对。完整机制展开在 [`披露管线`](./13-progressive-disclosure-pipeline.md) 层 4。

## 从哪开始

今天就做文件态（半小时见效果）：`ln -s AGENTS.md CLAUDE.md`；根文件只写常驻规则+布局+命令，每条链到 home；给根文件定字数上限。会话态不急——上下文没爆炸就不用碰，文件态 + 宿主自动加载已经覆盖「不糊涂」的大头；真到长任务活不下来那天，再去 [`披露管线`](./13-progressive-disclosure-pipeline.md) 抄注入层。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「07 · 入口链」一节）——按需核对，不读不影响理解。
