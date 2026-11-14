# 01 · 动手前先查货架：四步找出现成能力与三个常见坑

给 DSH 写扩展最冤的返工，就是吭哧吭哧写完一个工具或模型适配器，回头发现仓库里早就有了，只是默认没打开。DSH 的几百个包分散在不同目录和组装层里，不要一上来就去翻 `packages/` 的源码目录，按下面四步查最快、最准。

---

## 四步查清有没有现成轮子

### 第 1 步：看包组总表，先摸清有哪些领域

打开 [`packages/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md)。全仓 50 多个功能组都按职责列在这张表里。看到相关的组，再点进该组的 `README.md` 和具体包的 `package.json`（留意 `dsh.bundle.patch`、`dsh.client.inject`、`dsh.profile` 这几个字段，一眼就能看出它是后端插件、前端界面还是组装包）。

### 第 2 步：按你需要的形态查“自动生成清单”

DSH 把全仓的服务、工具和配置都做成了门禁自动刷新的目录，比手工搜代码靠谱得多：

- **想复用底层服务**：查 [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)，99 个 `ctx` 服务谁定义、谁实现、谁在用写得明明白白。
- **想看有哪些模型工具**：查 [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)。
- **想看能不能改配置解决**：查 [`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)。
- **想看有哪些可选功能包**：看 [`packages/boot/app-boot/src/profile.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/profile.ts) 里的 `OPTIONAL_BUNDLES` 和 `ON_DEMAND_BUNDLES`。

### 第 3 步：查组装层，搞清楚为什么“默认没看到”

很多能力明明在仓库里，但在对话里看不到，通常是因为挂载层级的差异：

1. **全环境底座**：[`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml)（所有普通会话共享）。
2. **应用层开关**：[`packages/bundle/web-app/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml)（Web 端在这里启用或关闭一批插件）。
3. **会话模式（Preset）**：[`packages/bundle/web-app/presets/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets) 下的四份 `*.patch.yml`（Standard / PTC / Minimal / Creator 各自决定暴露哪些工具，详见 [FAQ 03](../03_preset-modes-specialty/answer.md)）。
4. **默认关闭或未挂载现货**：比如 `session-query-sqlite` 出厂配置是 `openAt: never`，看起来像“没有全文搜索”，其实改一行配置就能开；又如 `tool-str-replace-editor` 包还在仓库里，只是从默认组装里下线了，需要时显式 `insert` 即可。

### 第 4 步：按成本从低到高选接法

确认有现成底座后，优先选最轻的落地方式（完整指引见 [`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md)）：

1. **改配置**：在 `cordis.yml` 或设置页调整现成插件的 `Config`。
2. **写 Patch 换实现**：按同一个插件 `id` 整行替换成另一个现成 Provider（参考 [`docs/cordis-primer.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md)）。
3. **装入现有可选包**：用 `dsh plugin --profile <name> add <pkg>` 把仓库里没默认开启的包挂进目标 profile。
4. **写百行级“胶水插件”**：注入两三个现成服务拼出新工具——官方的 [`tool-present`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/deliverables/tool-present/src/index.ts) 就是只有百来行代码、直接注入 `['tools', 'fs', 'sessionProjections', 'workingDirectory']` 的标准范本。

---

## 新手最容易踩的三个坑

1. **把 `packages/` 当成平铺的插件商店**
   仓库里三百多个包里包含大量纯工具库（`packages/util/`）和测试夹具（`packages/test-support/`），它们根本不是 Cordis 插件。先看 `package.json` 和组 README 分清角色，别盲目模仿。
2. **只跑了一次默认对话就断定“DSH 没这功能”**
   像 `tool-lsp`（代码语义导航）、`tool-terminal`（持久交互终端）、`tool-session-query`（历史会话搜索）、`web-search-exa`、`mcp-client`、`hooks-codex` 等，统统是仓库里写好的现货，只是默认没挂在基础层上。“默认看不见”不等于“得自己写”。
3. **以为接新模型就得自己写 LLM Adapter**
   `llm-pi-ai` 已经随基础层一起装好了，只是没有配置路由时保持休眠；只要在配置里加上 `llm-pi-ai` 路由段，就能直接接入各类第三方主流模型（详见 [`packages/llm/llm-pi-ai`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/llm/llm-pi-ai)）。如果只是想调整官方通道的模型列表，改 `llm-deepseek` 的 `models` 配置就够了。

---

## 什么时候才真的需要从头写？

当你对照 [`answer.md`](./answer.md) 里的全景表，确认属于下面几类情况时，再动手新建插件包（仓库组织方式见 [FAQ 13](../13_expert-plugin-repo-organization/answer.md)，入门教程见 [`docs/user/develop/basic/index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md)）：

- 给无界面/企微飞书等部署环境实现 `ctx.approval` 应答器或 `ctx.userQuestions` 前端；
- 给 `ctx.authorization` 写第一个真实 OAuth/凭据获取 Provider；
- 接入全新的私有协议模型（连 `llm-pi-ai` 都覆盖不了），或给 `browserUse` / `computerUse` / `speechToText` 补充新的生产级驱动；
- 开发官方完全空白的领域业务工具、IM 渠道桥或长期记忆模块。
