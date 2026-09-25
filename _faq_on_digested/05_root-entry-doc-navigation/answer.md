# Answer · DSH 跑起来之后根入口文档的消费方式

## 一句话结论

静态设计（04）承诺的“按需加载”，在运行时不是靠模型自觉兑现的，而是被拆成三件由机器执行的事：

1. **注入（push）**：`AGENTS.md` 指令链由 `dsh-agent-instructions` 在会话第一步注入（baseline），触达更深目录后再注入 nested（touch-driven），有 `maxBytes` 预算、按 digest 去重。
2. **导航（pull）**：不在注入链里的内容（package README、architecture、catalog、skill 正文），由模型用 read/grep/glob 工具按需拉取——工具的模型提示词本身就规定了“用 read 不用 cat、用 grep 不用 rg、用 glob 不用 find”。
3. **回收（recycle）**：超预算由 `ctx.tokenMeter` 度量、compaction 压缩回收，保留 tool-call/result 配对。

所以“按图索骥”的“索”不是写作美德，而是运行时保证：该进的被塞进来，该拉的能拉到，塞多了会被收走。

## 静态层 ↔ 运行时层 的对应

| 04 的静态层 | 05 的运行时机制 |
|---|---|
| L1 常驻：根 `AGENTS.md` ≤ 1950 词 | baseline 注入，`maxBytes` 限整条链 |
| L2 区域入口：architecture、子树 AGENTS | touch-driven nested 注入（触达才加载） |
| L3 按需合同：package README | 模型用 `read` 工具拉取 |
| L4 穷举索引：generated catalogs | 模型用 `grep`/`glob` 查询 |
| L5 理由与流程：Agent Notes、skills | skill catalog 只给摘要，`skill()` 才加载正文 |
| （预算上限） | token meter + compaction 回收 |

静态层的字数预算是“写文档时”的容量控制；运行时层的 `maxBytes` / token meter 是“注入时”的容量控制。它们是同一个预算的两端。

## 三个机制各管一段

- [`01-runtime-injection.md`](./01-runtime-injection.md)：入口怎么进上下文。
- [`02-on-demand-navigation.md`](./02-on-demand-navigation.md)：模型怎么走图。
- [`03-budget-and-guarantee.md`](./03-budget-and-guarantee.md)：超了怎么办，以及 README 怎么保证被读到/被维护。

## 继续阅读

- [`01-runtime-injection.md`](./01-runtime-injection.md)
- [`02-on-demand-navigation.md`](./02-on-demand-navigation.md)
- [`03-budget-and-guarantee.md`](./03-budget-and-guarantee.md)
- [`research.md`](./research.md)
- 静态设计（另一半）：[`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md)
- 完整五层管线（迁移视角）：[`07_borrowing-harness-idea/11-progressive-disclosure-pipeline.md`](../07_borrowing-harness-idea/11-progressive-disclosure-pipeline.md)
