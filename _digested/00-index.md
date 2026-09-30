# `_digested` — DeepSeek Harness 源码消化

这个目录是对 DeepSeek Harness 源码的**消化分析**：从 TypeScript 源码出发，理解机制、架构和设计意图。它不是用户指南，也不是给 upstream 的补丁。

> **产品源码审计基线**：DeepSeek Harness `dsh-v0.2.0-rc.2`，commit `639ed015397290b3745d163aafe02ffee4aa3f84`。每次同步产品源码后，在 [`_change_log/`](./_change_log/00-index.md) 记录范围，并按 [`_coverage/`](./_coverage/00-index.md) 逐专题复核。最近一次合入见 [`_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md`](./_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md)；0008 轮语料维护的**独立复核**（约 60 处过期断言、20 处缺落点、3 孤儿页的处置与修复记录）见 [`_change_log/0008-independent-recheck.md`](./_change_log/0008-independent-recheck.md)；0009 轮的**独立反查**（D1 全量引用反查、D2 正向覆盖三路、D3 硬数字重测两路、D4 口径一致性，按维度而非目录切）见 [`_change_log/0009-independent-recheck.md`](./_change_log/0009-independent-recheck.md)。自 0008 起同步口径为**整树照搬**：产品源码完全等于 upstream tag，本地维护 `_digested/`、`_faq_on_digested/`、`_agent_ready_development/`、`_misc/` 四个语料目录（`_misc` 为低重要性杂项：`_references` 冻结存档只随轮更新基线行，`_scratch` 不跟踪内容）。

## 30 秒看懂

dsh 的进程里运行的是一棵**插件树**：对话循环、读写文件、跑命令、接模型、画 Web 界面，都是树上的插件。本目录按这棵树的主轴切专题，每个专题看它的一个面——所以「插件」不是某个目录的主题，而是所有目录的底座。两个例外：`capability-seams/` 讲同一个能力有多个插件实现时怎么换实现而不改调用方（插件的竞聘位），`plugin-inventory/` 讲动手写之前先看现成插件给了什么（插件的货架）。

`_digested/` 面向已熟悉 agent harness / plugin 运行时，但尚未建立 DeepSeek Harness 概念体系的读者。这里先抓住思想主轴，再进入源码机制——而不是把 `packages/` 目录平铺成分类货架。

每个专题的 `00-map.md` 是按主干顺序阅读的**概念导读**，只建立职责、关系和阅读入口；同目录编号正文是按问题查找的**机制参考**，记录状态对象、算法、失败行为和源码入口。图放在该专题的 `figures/`。

文件不叫 `README.md`：仓库的 bilingual pairing 门禁会把任意 `README.md` 当成产品文档语料。研究目录用 `00-index.md` / `00-map.md`。

## 分支纪律

| 分支 | 上面有什么 |
|------|------------|
| `master` | 干净的 upstream 镜像。不放研究材料，不改产品代码。 |
| `ethan` | 研究分支。源码整树照搬 upstream tag；研究材料位于 `_digested/`、`_agent_ready_development/`、`_faq_on_digested/` 与 `_misc/`。 |
| `ethan2` | `ethan` 的工作副本，两者在每次同步后保持指向同一提交。 |

同步方式（0008 起为**整树照搬**，见 `_change_log/0008-0.1.5-rc.2-to-0.1.7-rc.1.md`）：把产品源码对齐到选定的 upstream tag（不做内容合并、不留本地源码补丁，四个语料目录整体保留），再按 `_change_log/` 审计过期结论；完成后把另一条分支快进到同一提交。（旧口径「非快进 merge + 逐冲突解决」在 0008 执行时退役。）

## 与同级目录的关系

| 目录 | 本质 | 受众 |
|------|------|------|
| **`_digested/`** | 源码消化，机制剖析 | 想彻底搞懂背后发生了什么的人 |
| `_agent_ready_development/` | 面向 coding agent 的 SDD、GitHub Flow 与 Development Harness 独立教程 | 想理解规格、交付流程和仓库开发 Harness 怎样协作的读者 |
| `_faq_on_digested/` | 跨消化材料的二次研究 | 我自己（产出者） |

本仓库不另做用户手册。官方怎么用、怎么扩展，仍读 `docs/` 和 package README。

## 子目录

专题按 **Harness 自己的主轴** 切，不按 OpenSpec 的 schema / CLI workflow 切。

| 目录 | 聚焦 | 一句话 |
|------|------|--------|
| `system-overview/` | 总体系统专题 | 按下回车之后，这些插件怎么拼成一次能跑的对话——先读这。 |
| `cordis-runtime/` | 被 vendor 的框架 | 插件框架本体：插件长什么样、`ctx` 从哪来、事件怎么派发。 |
| `composition-boot/` | 启动组合 | 开机那一下：配置文件怎么变成一棵运行中的插件树（profile、bundle、patch 三层）。 |
| `runtime-profiles/` | 运行时配置 | 五种官方启动方式（web / headless / sdk / sdk-minimal / acp）各自带哪些插件、差在哪。 |
| `session-and-loop/` | 会话与驱动 | 对话存在哪、怎么读回来：session log 的格式、世代与投影。 |
| `agent-loop/` | 推进、边界与 Goal 驱动 | 一次对话怎么推进与收尾：turn/step 边界、goal 状态机、自动续轮。 |
| `capability-seams/` | 可替换能力 | 同一个能力（读文件、跑命令……）有多个插件实现时，怎么换实现而不改调用方——插件的竞聘位。 |
| `plugin-inventory/` | 现成插件货架 | 316 个包按组列成清单：能力在哪、以什么形态给、怎么拿——动手写之前先查这里。 |
| `experimental/` | 实验原型面 | 还没承诺稳定合同的原型插件（多代理、浏览器、语音……），随时会改名或消失。 |
| `tools-prompt-llm/` | 模型可见面 | 模型每一步看见什么：工具清单、系统提示词、历史投影怎么组装。 |
| `surfaces-entrypoints/` | 人对机器的入口 | 人从哪里进去：CLI、Web、桌面、ACP、SDK 五个入口怎么复用同一台运行时。 |
| `_coverage/` | 覆盖矩阵 | 维护索引：每个专题承诺回答什么、最后对到哪个源码 commit。 |
| `harness-idea/` | 消化后的理解与判断 | 判断层：dsh 这种 harness 形态做对了什么、边界与成本在哪。 |
| `_change_log/` | 上游同步记录 | 每次 upstream 同步的范围、审计与修复记录。 |

## 术语速查

这里的一行解释只求能定位到专题；权威定义见官方术语表 [`docs/glossary.md`](../docs/glossary.md) 与生成目录 [`docs/capability-seams.md`](../docs/capability-seams.md)。

| 术语 | 在本仓库指什么 |
|------|----------------|
| plugin | 最小扩展单元：导出 `apply(ctx, config)` 的模块，经 `ctx.effect()` 注册能力 |
| `ctx` | 插件共享的服务总线；`ctx.fs`、`ctx.tools`、`ctx.llm` 都是它上面的键 |
| Cordis | dsh vendor 进来的插件框架；`ctx`、事件、waterfall、Loader 都属于它 |
| seam | 同一能力的 Service Definition + Provider + Consumer 三角色齐备，换实现不改调用方 |
| core / service / bundle | 生成表里非 seam 的服务形态：主干服务、独立服务、组合点（`ctx.agentLoop` 是 bundle） |
| bundle | 插件的打包交付单位（`dsh-base`、`dsh-web-app`……）；profile 由 bundle 叠出 |
| profile | 一次启动的 bundle 组合名：web / headless / sdk / sdk-minimal / acp，桌面是应用自有组合 |
| preset | Web 端四个内置模式（Standard / PTC / Minimal / Creator）的声明式 patch |
| surface | 「面」：模型可见面（prompt 与工具 schema），或人对机器的入口（CLI / Web / 桌面 / ACP / SDK） |
| gate | 可机械失败的检查脚本，由 `scripts/run-gates.ts` 按 mode 聚合 |
| waterfall | Cordis 的监听器链派发；监听器必须调 `next()` 委托，不调即短路 |

## 阅读路径

![消化阅读主干](./figures/topics.svg)

- **熟悉 agent / plugin 运行时，但不熟 dsh** → [`system-overview/00-map.md`](./system-overview/00-map.md)
- **想先搞懂 Cordis 在这棵树里到底是什么** → [`cordis-runtime/00-map.md`](./cordis-runtime/00-map.md)，官方入门仍是 [`docs/cordis-primer.md`](../docs/cordis-primer.md)
- **想搞懂 `dsh --profile web` 怎么变成进程的** → [`runtime-profiles/00-map.md`](./runtime-profiles/00-map.md)
- **想搞懂一次 `dsh --profile web` 怎么变成插件树** → [`composition-boot/00-map.md`](./composition-boot/00-map.md)
- **想搞懂一轮对话怎么跑** → [`session-and-loop/00-map.md`](./session-and-loop/00-map.md)
- **想搞懂磁盘上的 session 文件怎么跨格式世代读** → [`session-and-loop/04-格式世代与迁移.md`](./session-and-loop/04-格式世代与迁移.md)
- **想加能力或换后端** → [`capability-seams/00-map.md`](./capability-seams/00-map.md)
- **想先看 dsh 已经给了什么再动手** → [`plugin-inventory/00-map.md`](./plugin-inventory/00-map.md)
- **想研究实验原型** → [`experimental/00-map.md`](./experimental/00-map.md)
- **想搞懂模型看见什么** → [`tools-prompt-llm/00-map.md`](./tools-prompt-llm/00-map.md)
- **想搞懂 CLI / Web / 桌面 / ACP 怎么复用同一套 runtime spine** → [`surfaces-entrypoints/00-map.md`](./surfaces-entrypoints/00-map.md)
- **想给 Web UI 加功能、或新增一个 `packages/client/*` 插件包** → [`surfaces-entrypoints/05-客户端架构与插件纪律.md`](./surfaces-entrypoints/05-客户端架构与插件纪律.md)
- **想搞懂一个 `@Remote` 方法怎么变成 `ctx.remote.<ns>` 上的类型化 stub** → [`surfaces-entrypoints/06-Typert类型图与Remote生成.md`](./surfaces-entrypoints/06-Typert类型图与Remote生成.md)
- **想搞懂 dsh 为什么对读者友好（harness 思想）** → [`harness-idea/00-map.md`](./harness-idea/00-map.md)

推荐主干顺序：

```text
system-overview/
  → cordis-runtime/
  → composition-boot/
  → session-and-loop/
  → capability-seams/ 或 tools-prompt-llm/
  → surfaces-entrypoints/
```

按推荐顺序读 `00-map.md`，遇到具体机制再进入编号正文。专题承诺的核验范围以 [`_coverage/00-index.md`](./_coverage/00-index.md) 为准；未列问题不隐含完整覆盖。跨专题研究放在 `_faq_on_digested/`。

## 验证

修改本目录后运行：

```sh
node _digested/verify.mjs
```

该检查验证 Markdown / SVG / 校验脚本的严格 UTF-8 与单个结尾换行、Markdown 相对链接和锚点，以及 SVG 的 XML 结构与实体。
