# 03 · 找现成轮子：四步流程与三个坑

## 方法与基线

开发 DSH 插件最常见的浪费，是动手后才发现某个 seam、工具或配置字段早已存在。DSH 的能力不在一个目录、也不在一份文档里；下面四步把这个“先查货架”的动作做成可重复的流程。

要判断“有没有现成的”，先看产品树里的四份底表，而不是从 `packages/` 第一项读到 last：`packages/README.md` 的包组表、`docs/capability-seams.md` 的服务表、`docs/tool-catalog.md` 的工具表、`packages/bundle/*/cordis.patch.yml` 的挂载行。本文的 343 包 / 52 组读数按 `dsh-v0.2.1-rc.3`（commit `1f81c047fc`）的产品树点数；计数会随同步漂移，复核时以当时的生成目录与 patch 行为准。

## 四步流程

**第一步，查货架（有什么）。** 打开 [`packages/README.md`](../../packages/README.md) 的包组表：343 个包按 52 个组列出，组序即源码目录顺序。每个包的 `package.json` 给出形态线索（`dsh.bundle.patch`、`dsh.client.inject`、`bin`、`dsh.profile`），各包 README 给职责与 Config 字段。新手先按组读 `packages/README.md` 与各组 README，再回到具体包。

**第二步，按「要什么」对横切清单（以什么形态给）。** 要服务查 [`docs/capability-seams.md`](../../docs/capability-seams.md) 的 99 个 `ctx` 键（58 core + 35 seam + 5 service + 1 bundle）；要模型工具查 [`docs/tool-catalog.md`](../../docs/tool-catalog.md) 与四份 preset patch（base 层约 25 个固定名、web 由四 preset 各自决定、sdk-minimal 只有持久 shell＋`read_image`＋`working_directory`）；要打包查 6 个 profile bundle ＋ 12 个可选 bundle（`OPTIONAL_BUNDLES`，另 2 个官方按需在 `ON_DEMAND_BUNDLES`，见 [`packages/boot/app-boot/src/profile.ts:223`](../../packages/boot/app-boot/src/profile.ts)）；要模式查 [`packages/bundle/web-app/presets/standard.patch.yml`](../../packages/bundle/web-app/presets/standard.patch.yml) 与同目录另外三份 patch；要技能查 `packages/skill/` 与各 bundle 的 skill 挂载行。

**第三步，判可见性（默认拿不拿得到）。** 同一个包在哪一层被拿到由 patch 行决定：base 出厂即见（[`packages/bundle/base/cordis.patch.yml`](../../packages/bundle/base/cordis.patch.yml)）→ web-app 层（[`packages/bundle/web-app/cordis.patch.yml`](../../packages/bundle/web-app/cordis.patch.yml) 的 insert / disable）→ preset 会话级（`presets/*.patch.yml`）→ `OPTIONAL_BUNDLES` 默认关 → 未挂载现货（全仓有包、没有 patch 行）。两个常见误判：`tool-str-replace-editor`「不见了」其实是全仓下线，要它必须显式 insert；全文搜索「没有」其实是 `session-query-sqlite` 出厂 `openAt: never`。

**第四步，选出路（怎么拿）。** 按代价从低到高：调配置（[`docs/config-catalog.md`](../../docs/config-catalog.md)）→ patch 换 Provider（同 id 整行替换，[`docs/cordis-primer.md`](../../docs/cordis-primer.md)）→ `dsh plugin --profile <name> add` 挂现货（[`packages/boot/app-boot/README.md`](../../packages/boot/app-boot/README.md)）→ 写胶水插件消费现成服务（109 行的 `tool-present` 是官方样本：`inject = ['tools', 'fs', 'sessionProjections', 'workingDirectory']`，[`packages/deliverables/tool-present/src/index.ts:26-27`](../../packages/deliverables/tool-present/src/index.ts)）。四条出路的扩展面见 [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)。

## 必须自写的判定

从 [`docs/capability-seams.md`](../../docs/capability-seams.md) 里 P=1 或 P=0 的行读出白名单：`ctx.approval` / `ctx.userQuestions` / `ctx.authorization` 三个零 Provider seam（headless 部署的审批与提问、新凭据流）、`ctx.worktrees` 的自有 Provider（唯一实现与消费方同族）、browserUse / computerUse / speechToText 的非实验 Provider、第三家 LLM adapter。写之前先按 [answer.md](./answer.md) 的信号（自消费、零 Provider、P≥2）确认缺口是真的，再确认代价值得——缺口清单只说明「没人做」，不说明「做了有回报」。

## 三个过去踩的坑

1. **把 `packages/` 当货架平铺**。343 个包里 util 18 包与 test-support 7 包是纯库和测试基建，不是插件位；九种形态（Def / Impl / Tool / cmd / UI / adapter / bundle / lib / 驱动）的判据落在 `package.json` 字段与包 README 上，先分清形态再找现货。
2. **只看 base 层就下结论「没有」**。货架现货大量藏在光谱右侧：`tool-lsp`、`tool-terminal`、`tool-session-query`（5 个检索工具）、`web-search-exa`、`mcp-client`、`hooks-codex` 都默认不挂载——「默认看不到」≠「没有」。
3. **以为接新模型必须写 adapter**。`llm-pi-ai` 以休眠态随 base 挂载，settings 出现 `llm-pi-ai:` 段即注册多 Provider routes，零 route 时保持休眠（[`packages/llm/llm-pi-ai/src/index.ts:286-311`](../../packages/llm/llm-pi-ai/src/index.ts)）；catalog 替换走 `cordis.yml` 的 `models` 列表（[`packages/llm/llm-deepseek/src/config.ts:98`](../../packages/llm/llm-deepseek/src/config.ts)）。先调配置，最后才写 adapter。

## 阅读地图

[`packages/README.md`](../../packages/README.md)（包组）→ [`docs/capability-seams.md`](../../docs/capability-seams.md)（服务与角色）→ [`docs/tool-catalog.md`](../../docs/tool-catalog.md)（模型工具）→ [`packages/bundle/base/cordis.patch.yml`](../../packages/bundle/base/cordis.patch.yml) 与 [`packages/bundle/web-app/cordis.patch.yml`](../../packages/bundle/web-app/cordis.patch.yml)（挂载与可见性）→ [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)（扩展形态）→ [FAQ 13](../13_expert-plugin-repo-organization/answer.md)（仓库组织）；插件作者教程见 [`docs/user/develop/basic/index.md`](../../docs/user/develop/basic/index.md)。
