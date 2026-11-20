# Experimental · 实验能力收编地

## 一句话

`packages/experimental/` 是**全部实验能力的收编地**。它的定义不是「未发布区」，而是：完整公开合同仍在评估、没有产品支持承诺。单独成专题的理由不是这些包彼此相似，而是它们共享同一条边界——**实验合同**：行为或 API 可变、能力可被撤下，但工程、安全、文档、测试与已发布数据的义务一条不减。包清单以组 README（[`packages/experimental/README.md`](../../packages/experimental/README.md)）为准，包数指标见 `harness-idea/claims.json` 的 `experimental-package-total`。

## 为什么单独成专题

根 `AGENTS.md` 的仓库布局行写 `experimental/  evaluated capabilities without a product-support commitment`，并把成熟度与出货彻底解耦：「…is independent of optional delivery; nonexperimental packages need product use or an explicit classification」（[AGENTS](../../AGENTS.md)，分类脚本 `scripts/product-package-policy.ts`）。

三个词的分工由组 README 定义（`packages/experimental/README.md#status`）：**Experimental**＝完整公开能力仍在评估、无支持承诺；**Optional**＝由用户显式选择；**Official**＝项目维护并列入插件页——三者互不蕴含，发布、默认安装与 GUI 露出都不决定成熟度。是否仍属 experimental 只看合同状态与包边界，不看安装便利性：Agent Teams 四包位于 `experimental` 组内，同时以可选 bundle 出货（见下文与 [`02-agent-teams.md`](./02-agent-teams.md)）。

这份合同由政策和门禁执行：命名与发布政策、private 名单、三道隔离检查、以及反向的「非实验包必须有产品用途」检查都在 [`04-experimental-package-policy-and-isolation.md`](./04-experimental-package-policy-and-isolation.md)。一句话版本：默认前缀 `@deepseek-ai/dsh-experimental-`（少数保留旧 npm 名），**全组 public**、非实验发布包不依赖实验包（仅 CLI `@deepseek-ai/dsh` 经豁免在 `dependencies` 中携带 12 个 `OPTIONAL_BUNDLES`）、shipped 组合默认不启用。

产品包对实验面的合同差异在**消化侧**同样成立：产品包的机制页对的是有 release 门禁、快照锚定和 catalog 生成撑着的公开合同，而实验合同本身允许在两次上游同步之间改名、重组甚至消失——所以本专题的行锚只保证对「最近核验」那个 commit 成立，漂移时按 `_coverage/` 矩阵整专题复核。

## 三条启用通道

1. **显式组合**：源码 checkout 内 `dsh plugin --profile <name> add ./packages/experimental/<pkg>`，或直接往 `cordis.yml` / patch 里 insert。
2. **可选 bundle（`OPTIONAL_BUNDLES`）**：随安装出货、默认关，Web 插件页（或 `plugin_manager` 工具）一键开关（`packages/boot/app-boot/src/profile.ts`）。成员是 session-search、ralph-bundle、terminal-bundle、badge-skill-bundle、session-titles-bundle、agent-team-profile、voice-input-bundle、cot-translation-bundle、auto-review、inspector-profile、plugin-market-bundle、tool-worktree。
3. **纯实验 Provider**：无任何 shipped 挂载，只在显式组合里出现（ptc-runtime-python、browser-use / computer-use 各家 driver）。

注意 `ON_DEMAND_BUNDLES`（`packages/boot/app-boot/src/official-bundle-packages.ts`，现为 `subagent-claude-code` 与 `subagent-codex`）是**另一个档位**：按需安装的官方 bundle，两个包都在 `packages/subagent/`、不是实验包。

## 家族地图

| 家族 | 包 | 通道 |
|---|---|---|
| 会话检索 | tool-session-query、session-search | opt（session-search 带出 sqlite 与工具） |
| 会话标题 | session-title-all-prompts-llm、session-titles-bundle | opt（bundle 禁用首条 prompt provider 再插入） |
| 重复委派 | tool-ralph、ralph-bundle | opt（bundle 自带私有 workflow 引擎） |
| 持久终端 | tool-terminal、terminal-bundle | opt |
| 徽章技能 | skill-badge、badge-skill-bundle | opt（bundle 只插一行 skill provider） |
| hook 桥 | hook-protocol（线协议）、hooks-claude-code、hooks-codex | 显式组合 |
| webhook | webhook（`ctx.webhookRuntime`）、webhook-github | 显式组合 |
| 思维链翻译 | translator（`ctx.translator`）、client-ui-cot-translation（`ctx.cotTranslation`）、cot-translation-bundle | opt |
| 语音输入 | speech-to-text（`ctx.speechToText`）、speech-to-text-sensevoice、api-speech-to-text（`ctx.speechController`）、client-ui-voice-input、voice-input-bundle | opt |
| 插件市场 | plugin-market-bundle（带 `plugin-market` 与 Discover 页） | opt |
| Agent Teams | agent-team（`ctx.agentTeams`）、tool-agent-team、client-ui-agent-team、agent-team-profile | opt |
| 自动审查 | auto-review | opt |
| Claude Code mods | claude-code-mods（`ctx.claudeCodeMods`）、client-ui-claude-code-mods | 显式组合 |
| PTC 后端 | ptc-runtime-python（`ctx.ptcRuntime`） | 显式组合 |
| 桌面控制 | cua（库）、cua-macos、computer-use-cua-driver-mcp、computer-use-cua-driver-native | 显式组合 |
| 浏览器控制 | browser-use-playwright-mcp、browser-use-chrome-devtools-mcp、browser-use-stagehand-native、browser-use-runtime | 显式组合 |
| 工作树 | worktree（`ctx.worktrees`）、tool-worktree | opt（两包同在一个 bundle） |
| 调试面 | inspector（`ctx.inspector`）、session-inspector、inspector-profile | opt（成员是 bundle `inspector-profile`；裸 `inspector` 插件包不进 OPTIONAL_BUNDLES） |
| worker 预览 | webworker-packer、webworker-runtime | 显式组合（`apps/web` build:preview） |

（家族按能力域切，不按形状切：同一个 opt bundle 覆盖的包算一个家族；`webworker` 与 `inspector` 同属调试/预览工具面，Agent Teams 与 auto-review 是协作面。）

## 毕业路径

原型成熟后的去向是消化侧的预判，不是上游承诺——上游唯一的机制承诺是 promotion 规则本身：「Promotion moves a package to its product-role group and applies that group's naming rules; update affected imports and configuration rows atomically, then review its public contract, limitations, test evidence, release payload, runtime dependents, and named stable owner」（`packages/experimental/AGENTS.md`）。按各家族的形状推：

| 面 | 预判去向 | 依据 |
|---|---|---|
| ptc-runtime-python | `packages/ptc-runtime/` 组，与 `ptc-runtime-node` 并列成正式 provider | 该组已是「Definition + node provider」结构，Python 后端只补第二个 provider；`language`/`isolation` 字段本来就是为多后端设计的 |
| Agent Teams | 服务进产品能力组，Web UI 进 `packages/client/`，profile bundle 转正或内化 | 上游 Dev Note 已把 nested teams、cross-process mailbox、worktree 隔离列为未承诺方向——毕业前这些不影响现有合同 |
| 会话检索 / 持久终端 / ralph / 徽章 / 标题 | 各自产品组（session-query、terminal、workflow、skill、session） | 它们本来就是从这些组移出的包，opt bundle 只是启用通道 |
| hook 桥 / webhook | boot 或独立产品组 | 桥接面已经有稳定的线协议（hook-protocol）；webhook 的 `ctx.webhookRuntime` 是 core 服务 |
| 插件市场 | 仅 `plugin-market-bundle` 自身随转正迁出或退休 | `util/plugin-market-index`、`boot/plugin-market` 与 `client/ui-plugin-market` 已在各自产品组内，唯 `plugin-market-bundle` 留在 experimental 作为可选开关包 |
| 桌面 / 浏览器控制 | browser-use / computer-use 组已有产品组壳（driver 转正即换前缀） | 家族形状与现有产品组的对应关系；无上游时间表 |
| worktree | `ctx.worktrees` 已是三角色齐备的 seam，整族迁出即可 | Provider 与 Consumer 同族是当前的发育阶段 |
| voice-input / auto-review / cot-translation | speech-to-text 定义与 sensevoice provider 分开晋升；auto-review 进 guard/feedback 一侧 | 家族形状与现有产品组的对应关系；无上游时间表 |

这些都是按包形状与依赖方向做的消化侧推演；上游没有为任何一条给出时间表或承诺，读完本章不要把它们当成 roadmap。

## 阅读路径

| 文件 | 内容 |
|------|------|
| [`01-code-runtime-python.md`](./01-code-runtime-python.md)（文件名沿用改名前旧名，正文按 `ptc-runtime-python` 重锚） | `ctx.ptcRuntime` 的 CPython 子进程后端：seam 合同、fd-3 帧协议、上限与失败行为 |
| [`02-agent-teams.md`](./02-agent-teams.md) | `ctx.agentTeams` 服务、Lead Session log 持久化、九个成员级工具、统一 profile bundle 与 Web UI |
| [`03-inspector.md`](./03-inspector.md) | Inspector 四个子目录、暴露面、CDP 连接方式与鉴权 |
| [`04-experimental-package-policy-and-isolation.md`](./04-experimental-package-policy-and-isolation.md) | 命名与发布政策、private 名单、三道隔离门禁、反向的产品用途检查 |

四页共同回答一个问题：public-by-default（private 名单为空）但合同随时会变的实验能力在 DSH 里长什么样、怎么挂进来、毕业时往哪走；其余家族以本页家族表为地图，机制页待有需要再补。

> 承重词按 [`canon/GLOSSARY.md`](../canon/GLOSSARY.md) 的 DSH 原文用；本页自己的分类与指标不是 DSH 的词。
