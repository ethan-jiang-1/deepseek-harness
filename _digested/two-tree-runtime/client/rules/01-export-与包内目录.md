# export 与包内目录

核验入口：[`docs/subsystems/web-client.md`](../../../../docs/subsystems/web-client.md)、[`packages/client/AGENTS.md`](../../../../packages/client/AGENTS.md)、[`docs/subsystems/slots.md`](../../../../docs/subsystems/slots.md)、[`docs/subsystems/client-modules.md`](../../../../docs/subsystems/client-modules.md)、[`docs/subsystems/conversation.md`](../../../../docs/subsystems/conversation.md)、[`docs/web-styling.md`](../../../../docs/web-styling.md)。机检方：[`scripts/verify-client-domain-graph.ts`](../../../../scripts/verify-client-domain-graph.ts)、[`scripts/verify-client-ui-i18n.ts`](../../../../scripts/verify-client-ui-i18n.ts)、[`scripts/verify-client-packages.ts`](../../../../scripts/verify-client-packages.ts)。`packages/client/` 下当前 67 个包目录（2026-11-02 重测：`ls packages/client/*/package.json`，rc.5），本页每条规则都覆盖它们。0011 新增的 `client/ui-secret-mask` 属同一纪律范围：它对**已发送**用户文本里识别出的凭据做显示掩码，并在交互消息里给逐值揭示控件（`packages/bundle/web-app/cordis.patch.yml:388-389` 的罗盘行），是 client 侧安全相关行为的当前落点。（0008 复核注记：`ui-permission` 包已改名 `@deepseek-ai/dsh-client-ui-permission-presets`，目录 `ui-permission-presets/`，slot 行 id 仍是 `ui-permission`；0009 复核注记：`ui-settings-account` 与 `ui-sidebar-terminal` 已登记进 `packages/bundle/web-app/cordis.patch.yml` 的罗盘（`:137`、`:282`）。）

这两节是同一个问题的两面：包对外露什么（export），包内部怎么分域（目录）。

## export 纪律（`/client` 入口）

UI 插件包的 `/client` 入口是它的公开浏览器 API，不是便利 barrel（`packages/client/AGENTS.md:36`）。三条包级规则：插件导出的值不超出 cordis 载入所需 —— `apply`/`inject`（有 `Config` 时加 `Config`），加上被组件 type-only 消费的 store factory（`ReturnType<typeof createXXXStore>`），共享类型（owner data、注入值、合成 prop alias）也可导出，实现组件、纯 helper、常量与 store handle 留在包内，**新增任何值导出都要用户签字**而不是「有消费者就加」（`packages/client/AGENTS.md:38`）；同包测试直接 import 内部（包测试写相对 `../src/client/xxx.ts`，spec 在包外时用 `./src/*` 子路径），**绝不为让测试编译而放宽公开 API**（`packages/client/AGENTS.md:39`）；feature plugin 不得 runtime-import 或 re-export 另一个 feature plugin 的值，也不得为了拿到它们而声明 `dsh.client.external`，两条路都不通就停下升级，不许加个导出给自己解围（`packages/client/AGENTS.md:40`）。

## 包内目录制度

一个 UI feature = 一个 plugin package（`src/client/` 浏览器半边）；多域包在「其代码以后可能拆成独立包」的地方拆 —— `ui-conversation` 是范例：`contract/` 是**唯一**共享 API，各 domain 目录**永不 import 兄弟 domain**，`apply.ts` 是唯一的跨域组装点；注册一律在 `apply` 里经 `slots.register` 完成，绝不用模块级副作用（`packages/client/AGENTS.md:113`）。

`scripts/verify-client-domain-graph.ts` 把这条落成可机检的三层模型：第 0 层 `contract/` 共享契约 API，第 1 层 `<domain>/` 与 service 实现，第 2 层 `apply.ts`/`index.ts` 组装点与 re-export 壳（`scripts/verify-client-domain-graph.ts:8-12`）；`CONTRACT_DIRS` 只认 `contract`（`scripts/verify-client-domain-graph.ts:24`），`ASSEMBLY_FILES` 是 `apply.ts`/`index.ts`/`index.tsx`（`scripts/verify-client-domain-graph.ts:26`）；兄弟 domain 间的 import 会以「route shared API through contract/」报 fail，顶层非组装文件 import 任何 domain 也报 fail（`scripts/verify-client-domain-graph.ts:73-76`）。
