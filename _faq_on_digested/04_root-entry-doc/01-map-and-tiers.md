# 01 · 根入口的读者分流、常驻内核与“一个事实一个家”

## 一、`README.md` 对人，`AGENTS.md` 对模型，`CLAUDE.md` 不另起炉灶

DSH 根目录最直观的设计是把**人类访客**和**coding agent**从第一秒就分到两条不同的阅读轨道上：

- [`README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)（及 `README.zh.md`）面向人，讲清楚产品是什么、怎么跑起来、怎么参与开发；在开发小节末尾专门用一句 `For agents, follow AGENTS.md.` 把模型引走，避免模型把面向用户的宣传介绍当成改代码的工作规范。
- `CLAUDE.md` 在根目录和 `packages/` 下都是指向同级 `AGENTS.md` 的符号链接（symlink），并由根规矩明令“只改真实文件 `AGENTS.md`”。这样无论外部工具默认认 `CLAUDE.md` 还是 `AGENTS.md`，读到的永远是同一份字节，从根上消灭双份规则漂移。

---

## 二、根 `AGENTS.md` 为什么是“路由地图”而不是“仓库摘要”？

打开根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)，正文第一句话只有一行，却同时交底了系统心智模型和两条主干路由：

- 系统本质：DeepSeek Harness 是一个全插件化的 Cordis agent harness；
- 改代码前先去哪：动 `packages/` 之前先读 [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)（而 `architecture.md` 开头又自带前置分流：不熟 Cordis 先看 `cordis-primer.md` 或 `cordis-tutorial/`）；
- 写文档前先去哪：遵循 [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)。

紧接着的常驻章节全按“每会话必用、且别处替代不了”的标准筛选：

1. **API 演进与会话持久化红线**：挑明公共 API 尚处 pre-stable（改接口必须同步改全仓调用方），但已发布会话格式只能平迁新增后继版本、绝不覆盖或删除既有世代，且只有 `dsh` profile 允许作为受支持应用入口启动。这几条直接挡住模型拿通用开源库经验瞎猜兼容性。
2. **顶层仓库布局表（Repository layout）**：每个目录和包分组只用三五个词点明职责边界（如 `packages/core/` 管主干 API、`packages/preset/` 管会话级插件装配），给模型一张全局坐标网，而不是铺开几百个子目录。
3. **标准命令速查表（Commands）**：直接列出 `pnpm run test`、`test:coverage`、`build:artifacts`、`doc-sync` 等动作及各自适用时机（比如本地按改动面跑最小验证集，不盲跑全量套件）。
4. **工程规矩清单（Conventions）与防御模式入口**：每条规矩控制在 1–3 行，只讲行为硬约束（如“所有注册必须走 `ctx.effect()`”、“瀑布流监听器委托下游必须调 `next()`”、“模型可见输入必须进会话日志”），更深的语义全部挂相对链接跳往对应专题文档或 Agent Note。

这就是**地图**与**摘要**的本质区别：摘要试图把所有知识浓缩塞进一段话，越写越厚；地图只保留“遇什么事守哪条底线、去哪个文件查详情”。根 `AGENTS.md` 之所以清爽，关键在于它明确拒绝承载教程、单包细节、完整类型签名和历史演变故事。

---

## 三、文档分层表（Tier Taxonomy）：解决“写在哪”也就解决了“去哪找”

[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 用一张分层归属表规定了**一个事实只住一个家（one home per fact）**——不属于当前层的细节一律外链，重复抄写直接视为文档噪音：

| 文档层级 | 唯一负责承载的事实 | 明确排除（外链到别处）的内容 |
|---|---|---|
| **根 `AGENTS.md`** | 每轮会话都要守的全局规矩（每条 1–3 行 + 权威链接）、目录与命令速查 | 背景故事、完整示例、下层细节复述 |
| **`docs/architecture.md`** | 系统装配、核心包分工、agent 主循环、能力接缝与扩展点有序总图 | 具体 TypeScript 类型定义、单包配置项、历史选型争论 |
| **`docs/subsystems/*.md`** | 跨包精确类型语义、状态流转契约、内嵌生成的 Cordis API 签名 | 大段使用教程或冗长的行为流水账 |
| **`docs/defensive-patterns/`** | 代码审查与实现时按产物类别逐条核对的防御规则 | 类型定义（归 subsystems）与当初为什么立规矩（归 Agent Notes） |
| **`docs/cookbook/`** | 新增工具、新增包、审查持久化改动等分步操作指南与验收命令 | 架构层面的取舍论证 |
| **`.agents/notes/`** | 重大技术决策的起因、放弃的备选方案与复盘依据 | 当前使用说明、迁移待办清单 |
| **`.agents/skills/`** | 可按需唤起的多步作业流程与评审检查单 | 产品运行期契约（不能把产品规范只藏在 skill 里） |
| **`packages/*/*/README.md`** | 该包的职责契约、配置含义、Model Experience（模型/Token/KV 影响）与已知限制 | 逐函数重复 JSDoc，或手抄全局生成目录 |
| **生成式目录（`docs/*-catalog.md` 等）** | 从源码提取的工具表、配置表、持久化表、事件图与依赖图 | 任何人工手改或解释性长文 |

一旦“写在哪里”有了唯一答案，模型遇到陌生任务时“去哪里查”也就不用靠猜了：改包看该包 `README.md`，看全局怎么串起来翻 `architecture.md`，查全仓谁发了某个事件搜 `event-producer-consumer.md`，查某条反直觉约束当初防什么坑翻 `.agents/notes/`。

---

## 四、为什么绝大多数包只有 `README.md` 而没有自己的 `AGENTS.md`？

翻看 `packages/` 目录会发现，除了统一的 [`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md) 以及 `client/`、`web/`、`experimental/`、`schedule/` 等少数有特殊子域纪律的目录外，上百个具体插件包下面只有 `README.md`，并没有挨个放 `AGENTS.md`。

这不是漏写，而是分层规则的自然结果：

- 所有包共用的编码与文档纪律（如“改行为同 commit 更新包 README 与 JSDoc”、“按规范格式写 Model Experience”）统一收口在 `packages/AGENTS.md`；
- 包组内有哪些包、占了哪些 `ctx` 服务键，归包组目录的 `README.md`（及 [`packages/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md)）；
- 单个包自己的接口契约与边界限制，唯一归宿就是该包的 `README.md`——既给人看，也给改这个包的模型看，没必要再拆出一份专供模型读的影子文件。
