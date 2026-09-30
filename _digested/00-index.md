# `_digested` — DeepSeek Harness 源码消化

这个目录是对 DeepSeek Harness 源码的**消化分析**：从 TypeScript 源码出发，理解机制、架构和设计意图。它不是用户指南，也不是给 upstream 的补丁。

> **产品源码审计基线**：DeepSeek Harness `dsh-v0.2.0-rc.2`，commit `639ed015397290b3745d163aafe02ffee4aa3f84`。每次同步产品源码后，在 [`_change_log/`](./_change_log/00-index.md) 记录范围，并按 [`_coverage/`](./_coverage/00-index.md) 逐专题复核。最近一次合入见 [`_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md`](./_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md)；0008 轮语料维护的**独立复核**（约 60 处过期断言、20 处缺落点、3 孤儿页的处置与修复记录）见 [`_change_log/0008-independent-recheck.md`](./_change_log/0008-independent-recheck.md)。自 0008 起同步口径为**整树照搬**：产品源码完全等于 upstream tag，本地只维护 `_digested/`、`_faq_on_digested/`、`_agent_ready_development/` 三个语料目录。

`_digested/` 面向已熟悉 agent harness / plugin 运行时，但尚未建立 DeepSeek Harness 概念体系的读者。这里先抓住思想主轴，再进入源码机制——而不是把 `packages/` 目录平铺成分类货架。

每个专题的 `00-map.md` 是按主干顺序阅读的**概念导读**，只建立职责、关系和阅读入口；同目录编号正文是按问题查找的**机制参考**，记录状态对象、算法、失败行为和源码入口。图放在该专题的 `figures/`。

文件不叫 `README.md`：仓库的 bilingual pairing 门禁会把任意 `README.md` 当成产品文档语料。研究目录用 `00-index.md` / `00-map.md`。

## 分支纪律

| 分支 | 上面有什么 |
|------|------------|
| `master` | 干净的 upstream 镜像。不放研究材料，不改产品代码。 |
| `ethan` | 研究分支。源码整树照搬 upstream tag；研究材料位于 `_digested/`、`_agent_ready_development/` 和 `_faq_on_digested/`。 |
| `ethan2` | `ethan` 的工作副本，两者在每次同步后保持指向同一提交。 |

同步方式（0008 起为**整树照搬**，见 `_change_log/0008-0.1.5-rc.2-to-0.1.7-rc.1.md`）：把产品源码对齐到选定的 upstream tag（不做内容合并、不留本地源码补丁，三个语料目录整体保留），再按 `_change_log/` 审计过期结论；完成后把另一条分支快进到同一提交。（旧口径「非快进 merge + 逐冲突解决」在 0008 执行时退役。）

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
| `system/` | 总体系统专题 | everything-is-a-plugin、组合层、循环、seam、扩展点怎么拼成一台运行中的 `dsh` |
| `cordis-runtime/` | 被 vendor 的框架 | `ctx` / plugin / effect / event / waterfall / fiber / Loader |
| `composition/` | 启动组合 | profile、bundle、patch 层、Harness home、`dsh --dump-config` |
| `runtime-profiles/` | 运行时配置 | web、headless、sdk、sdk-minimal、acp 五个 Launcher Profile 的共同基底与各自差异，以及不经 `dsh` 启动的桌面组合 |
| `session-and-loop/` | 会话与驱动 | session log、格式世代与相邻迁移、turn/step、model-visible ⟺ logged、agent scope |
| `agent-loop/` | 推进、边界与 Goal 驱动 | step/turn/activity/goal 四层结束边界、Goal 状态机、Round Driver 自动续轮 |
| `capability-seams/` | 可替换能力 | Service Definition / Provider / Consumer 三角色、如何组合一致的 fs / subprocess provider（本地 sandbox 与远程 ssh 两个执行世界——0.1.7 线起 sandbox 组转正、ssh 组接替 E2B），进程级库（外发代理、原生 containment）这类「刻意不是 seam」的形状，以及默认不挂的外部生态桥（MCP 客户端、Claude Code / Codex hook 桥）与新执行面（browser-use / computer-use / speechToText 等新 seam 的地图） |
| `experimental/` | 实验原型面 | `packages/experimental/` 的原型家族：ptc-runtime 的 CPython 子进程后端（0.1.7 线自 code-runtime 改名）、Agent Teams 多代理编组、Inspector CDP 调试面、webworker 的 preview 双包，以及 browser-use / computer-use driver、voice-input 语音转写、auto-review 等新原型——合同随时会变 |
| `tools-prompt-llm/` | 模型可见面 | tool registry、system prompt 作为 surface 节点、in-history 替换、LLM adapter、tool 执行瀑布、chunk 到 settlement、内容块投影 |
| `surfaces/` | 人对机器的入口 | CLI、Web host/client、桌面（Electron）、ACP、JSON-RPC SDK、客户端资源模型与右栏、客户端分层与插件纪律，以及 Typert 类型图到 Remote stub 的生成链 |
| `_coverage/` | 覆盖矩阵 | 维护用索引，按源码组追踪 digest 覆盖状态 |
| `harness-idea/` | 消化后的理解与判断 | dsh 作为 harness 做对了什么：插件图 + 事件流构成的运行时基底、可读性与正确路径、参与阶梯、动态可读性、技术选型与语言贴合、边界与成本，以及本专题自身的判断纪律 |
| `_change_log/` | 上游同步记录 | 每次 upstream 合入后的变更摘要与资料审计 |

## 阅读路径

![消化阅读主干](./figures/topics.svg)

- **熟悉 agent / plugin 运行时，但不熟 dsh** → [`system/00-map.md`](./system/00-map.md)
- **想先搞懂 Cordis 在这棵树里到底是什么** → [`cordis-runtime/00-map.md`](./cordis-runtime/00-map.md)，官方入门仍是 [`docs/cordis-primer.md`](../docs/cordis-primer.md)
- **想搞懂 `dsh --profile web` 怎么变成进程的** → [`runtime-profiles/00-map.md`](./runtime-profiles/00-map.md)
- **想搞懂一次 `dsh --profile web` 怎么变成插件树** → [`composition/00-map.md`](./composition/00-map.md)
- **想搞懂一轮对话怎么跑** → [`session-and-loop/00-map.md`](./session-and-loop/00-map.md)
- **想搞懂磁盘上的 session 文件怎么跨格式世代读** → [`session-and-loop/04-格式世代与迁移.md`](./session-and-loop/04-格式世代与迁移.md)
- **想加能力或换后端** → [`capability-seams/00-map.md`](./capability-seams/00-map.md)
- **想研究实验原型** → [`experimental/00-map.md`](./experimental/00-map.md)
- **想搞懂模型看见什么** → [`tools-prompt-llm/00-map.md`](./tools-prompt-llm/00-map.md)
- **想搞懂 CLI / Web / 桌面 / ACP 怎么复用同一套 runtime spine** → [`surfaces/00-map.md`](./surfaces/00-map.md)
- **想给 Web UI 加功能、或新增一个 `packages/client/*` 插件包** → [`surfaces/05-客户端架构与插件纪律.md`](./surfaces/05-客户端架构与插件纪律.md)
- **想搞懂一个 `@Remote` 方法怎么变成 `ctx.remote.<ns>` 上的类型化 stub** → [`surfaces/06-Typert类型图与Remote生成.md`](./surfaces/06-Typert类型图与Remote生成.md)
- **想搞懂 dsh 为什么对读者友好（harness 思想）** → [`harness-idea/00-map.md`](./harness-idea/00-map.md)

推荐主干顺序：

```text
system/
  → cordis-runtime/
  → composition/
  → session-and-loop/
  → capability-seams/ 或 tools-prompt-llm/
  → surfaces/
```

按推荐顺序读 `00-map.md`，遇到具体机制再进入编号正文。专题承诺的核验范围以 [`_coverage/00-index.md`](./_coverage/00-index.md) 为准；未列问题不隐含完整覆盖。跨专题研究放在 `_faq_on_digested/`。

## 验证

修改本目录后运行：

```sh
node _digested/verify.mjs
```

该检查验证 Markdown / SVG / 校验脚本的严格 UTF-8 与单个结尾换行、Markdown 相对链接和锚点，以及 SVG 的 XML 结构与实体。
