# 90 · 动手：把插件组合成产品 profile

## 这一篇回答什么

DSH 中产品型插件仍是由 `dsh` 启动的 named profile：bundle 提供 patch 和代码依赖，profile 决定组合与顺序。本页给出产品决策顺序；[93](./93-app-plugin-walkthrough.md) 演示 Web profile composition，[91](./91-checklist.md) 用于交付验收。

## 两条施工路线

| 你在做什么 | 推荐路线 |
|---|---|
| **普通插件**：给已有 DSH profile 增加能力 | [10 概念](../10-foundations/10-taxonomy.md) → [91 数据卡](./91-checklist.md) → [92 选型矩阵](./92-native-reference-architectures.md) → 按需读 [11–14](../10-foundations/11-five-homes.md) 与相关 package README |
| **产品型 profile**：一组 bundle 组成面向用户的应用入口 | 本页七问 → [92 选型矩阵](./92-native-reference-architectures.md) → [93 Web profile 走查](./93-app-plugin-walkthrough.md) → [91 交付检查](./91-checklist.md) → [18 安装生命周期](../10-foundations/18-install-upgrade.md) |

`00-answer` 是总览，不取代基础事实页。产品型 profile 的完整施工示例从 [93](./93-app-plugin-walkthrough.md) 开始，不必把 10–33 的调研章节按顺序通读。

## 产品型 profile 七问

按顺序回答。每一问都必须区分 DSH 当前能力和产品自建行为。

1. **用哪个受支持 profile 启动？** Web 产品通常基于 shipped Web template；Node app 仍由 `dsh --profile <name>` 启动。
2. **如何分发功能？** 说明产品 bundle、`dsh.bundle.patch` 与所依赖的 plugin packages；bundle 顺序决定 patch 覆盖顺序。
3. **模型可调用哪些工具？** 列出产品工具与通用文件/进程工具，并确认每个工具所用 provider 和 policy。
4. **Session 从哪条目录开始？** 只需指定工作目录就传绝对 `cwd`；还要加入 DSH 侧栏分组时，传已有 registration 的 `workspaceId`。产品业务 project ID 另行定义。
5. **每块数据的 data card 填什么？** 分列 fact、owner、authority、source、mechanism/path、scope/key、readers、writers、rebuildability 和 retention。
6. **哪些数据需要隔离？** 列出 profile、共享 `$DSH_HOME`、产品额外数据路径和 browser origin 的数据；profile 名不是隔离措施。
7. **如何升级与退出？** 区分 CLI bundle 安装后的重启、Web Plugin Manager 的 HMR 结果、用户数据迁移和卸载残留。

## 七步施工顺序

| # | 决定 | 产出 | 依据 |
|---|---|---|---|
| 1 | 定启动 profile | shipped template 或 custom profile；不创建替代 `dsh` 的应用 bin | [application launch](../../../docs/architecture.md#application-launch) |
| 2 | 定包和组合 | bundle manifest、依赖包、完整 bundle 顺序 | [FAQ 24](../../24_plugin-publish-and-agent-data-planes/answer.md)、[93 §1–2](./93-app-plugin-walkthrough.md) |
| 3 | 定模型能力 | preset 工具清单，以及每个 provider/policy 的适用范围 | [17](../10-foundations/17-config-layers.md) |
| 4 | 定目录与 Session | 产品 project root、初始 Session `cwd`、DSH Workspace registration 分开说明 | [16](../10-foundations/16-startup-resolution.md)、[Workspace API](../../../docs/subsystems/workspace.md) |
| 5 | 定数据权威 | 每块事实一个数据卡行；明确重建和删除语义 | [91](./91-checklist.md)、[15](../10-foundations/15-four-spaces.md) |
| 6 | 定作用域和隔离 | profile-local、home-shared、独立 path 或独立 `$DSH_HOME` | [13](../10-foundations/13-scope-and-keys.md)、[92](./92-native-reference-architectures.md) |
| 7 | 验证生命周期 | 冷启动、bundle 加载、设置迁移、卸载和恢复测试 | [91](./91-checklist.md)、[18](../10-foundations/18-install-upgrade.md) |

## 一页判断

```text
先选 DSH 启动组合
├─ 给现有 profile 加能力 → 普通插件 / bundle
└─ 提供产品入口 → shipped template 或 custom profile + product bundle

再分别回答
├─ 模型工具：产品专用 / 通用文件与进程 / 混合
├─ 项目目录：Session cwd / DSH Workspace navigation / 产品 project root
├─ 数据：逐块填写 data card，说明权威、路径、scope/key、读写者与保留
└─ 隔离：共享 home / 明确重定向的 providers / 独立 DSH_HOME
```

产品工具可写项目文件，模型工具也可使用独立的 Session cwd；Workspace registration 只决定 Host 导航和分组，不决定文件权限。

## 常见返工原因

1. 直接创建自定义 Web profile，却只安装产品 bundle；新 profile 默认只有 `dsh-base`。
2. 用 `dsh plugin add` 安装后，期待 CLI 返回 `ChangeResult.application`；CLI bundle membership 变更后需重启 profile。
3. 认为换 profile 会隔离会话、Workspace registry 或 credentials；这些服务通常仍由同一 `$DSH_HOME` 提供。
4. 将产品项目根、Session 初始 `cwd`、当前 working directory 与 DSH Workspace 混成一个路径。
5. 认为 Workspace registration 可以替代文件工具、policy 或产品权限检查。
6. 把普通 runtime dependency 当作 bundle membership；package 的 Cordis rows 需要通过 bundle 进入 profile composition。

## 动手时只需要记住三句

- **先确定启动组合，再逐块设计数据事实。**
- **Session cwd、Workspace 导航和模型工具权限是不同决定。**
- **把 DSH 合同、产品自建 API 与外部模式分别标清。**

## 边界

- 本页是施工顺序，不复述数据机制定义；定义见 [10](../10-foundations/10-taxonomy.md)。
- DSH 行为以当前 `docs/`、package README、类型和源码为准；外部样本不构成 DSH API 合同。
