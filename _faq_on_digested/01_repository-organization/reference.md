# Reference · 仓库组织与阅读路线核心入口清单

本页汇总本专题涉及的 DSH 上游权威文档、关键包目录、自动生成索引与门禁脚本，方便读码时直接跳转查阅。

---

## 一、全局地图与工程规范

- [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md) — 仓库根级开发公约、顶层目录速览、常用命令与架构红线
- [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) — 系统核心架构：Cordis 插件底座、Profile/Bundle 组装、事件域、Turn 流程、会话日志与扩展落点表
- [`docs/development.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md#typescript-project-layout) — 本地开发环境准备、Host/Client 双 TypeScript 编译面、`build:artifacts` 与 `typecheck` 分工
- [`docs/cordis-primer.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md) — Cordis 上下文、服务注入、waterfall 事件委托与配置加载入门
- [`docs/defensive-patterns/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns/README.md) — 生命周期、并发、子进程清理与跨端状态同步的防御性编程规范
- [`pnpm-workspace.yaml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/pnpm-workspace.yaml) — 工作区成员范围、构建脚本白名单与第三方补丁登记

---

## 二、应用入口、启动器与配置组合

- [`apps/cli/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md) · [`apps/cli/src/bin.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/bin.ts) · [`apps/cli/src/profile-boot.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/profile-boot.ts) — `dsh` 命令行分发、Profile 补丁合成与进程生命周期管理
- [`apps/web/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/apps/web) — 浏览器端最薄挂载入口与组装级 Web 测试（`apps/web/tests/`）
- [`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md) · [`apps/desktop-host/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop-host/src/index.ts) — Electron 桌面壳与复用 `runProfile` 的私有宿主入口
- [`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md) · [`packages/boot/app-boot/src/profile.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/profile.ts) — Cordis 启动器、`PROFILE_TEMPLATES` 与默认关闭的 `OPTIONAL_BUNDLES` 清单
- [`packages/boot/app-boot/src/official-bundle-packages.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/official-bundle-packages.ts) — 按需下载安装的官方扩展包清单（`ON_DEMAND_BUNDLES`）
- [`packages/bundle/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/README.md) · [`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml) · [`packages/bundle/web-app/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml) — 官方基础与应用级默认插件层
- [`packages/preset/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/README.md) · [`packages/bundle/web-app/presets/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle/web-app/presets) — 按会话隔离的 Agent Preset 声明与内置四大模式补丁

---

## 三、包分组、典型家族与边界门禁

- [`packages/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md) — `packages/<group>/<pkg>/` 全部分组索引、依赖方向规则与包 `README` 合同要求
- [`packages/core/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/README.md) — 主干契约层（`scope`、`session`、`system-prompt`、`tools`、`agent`、`agent-loop`）
- [`packages/fs/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/README.md) · [`packages/ssh/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/ssh/README.md) — 文件系统 capability seam 拆包样本与跨组远程实现样本
- [`packages/session/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/README.md) · [`packages/session-query/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session-query/README.md) — 会话 JSONL 持久化、相邻版本迁移、增量投影与 SQLite FTS5 检索家族
- [`packages/host/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/host/README.md) · [`packages/client/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/README.md) · [`packages/api/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/README.md) · [`docs/subsystems/client-resources.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/client-resources.md) — Web 宿主、浏览器客户端树、Remote 网关与内容寻址资源模型
- [`packages/experimental/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/README.md#status) — 实验能力包组的成熟度定义与转正要求
- [`vendor/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/README.md) · [`native/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/native/README.md) · [`python/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/python/README.md) — 框架源码钉死规则、原生系统扩展与 Python SDK 载体说明
- [`scripts/verify-application-entrypoints.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-application-entrypoints.ts) · [`scripts/product-package-policy.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/product-package-policy.ts) — 唯一应用启动器门禁与非实验包分类策略门禁

---

## 四、自动生成的全局速查目录（只读查表，勿手改）

- [`docs/module-graph.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/module-graph.md) — 全仓包级静态依赖图（由 `pnpm run gen-module-graph` 生成）
- [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md) — 全部 `ctx` 服务、Provider 实现方与直接消费方对照表
- [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md) — 模型可见工具名称、所属包与权限分类总表
- [`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md) — 各插件 `Config` 可配置字段参考总表
- [`docs/event-producer-consumer.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/event-producer-consumer.md) — 全仓事件生产者与消费者映射表
- [`docs/persistence-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-catalog.md) — 会话持久化事件与存储格式目录
- [`website/docs.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/website/docs.ts) — 权威 Markdown 文档向文档网站的路由投影清单

> 核验状态见 [核验基线登记](../00-baseline.md)。
