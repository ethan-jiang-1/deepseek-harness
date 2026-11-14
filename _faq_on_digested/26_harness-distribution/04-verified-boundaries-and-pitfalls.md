# 04 · 实测验证过的边界、静默失效陷阱与排障手册

定制工作台最怕“自己脑补框架支持某种写法，上线后既不报错也不生效”。本篇把在干净隔离 `DSH_HOME` 下实测验证过的真实行为、社区常见封装踩过的静默失效坑，以及一套四层状态回读排障法浓缩在一处，帮你少走弯路。

---

## 一、最小可复现验证夹具：自己动手测一遍只需 30 秒

本目录附带了一份最小验证 Bundle 夹具（见 [`fixtures/profile-bundle/package.json`](./fixtures/profile-bundle/package.json) 与 [`fixtures/profile-bundle/cordis.patch.yml`](./fixtures/profile-bundle/cordis.patch.yml)），同时插入一条内置 Host 行（`@deepseek-ai/dsh-time-context`）和一条最小 Preset 行（`preset-faq26-fixture`）。任何时候你想验证当前 DSH 版本在真实 Profile 下的合成行为，都可以直接用隔离 `DSH_HOME` 跑下面这组无副作用命令：

```sh
TMP_HOME="$(mktemp -d)"
# 将 FIXTURE_DIR 指向本专题附带的 fixtures/profile-bundle 绝对路径
FIXTURE_DIR="/path/to/26_harness-distribution/fixtures/profile-bundle"

# 1. 从 web 模板初始化全新自命名 Profile
DSH_HOME="$TMP_HOME" pnpm dsh --profile kanban-smoke --from-default-profile web --dump-default-config >/dev/null

# 2. 装入本地验证 Bundle，观察 package.json 中的 bundles 顺序
DSH_HOME="$TMP_HOME" pnpm dsh plugin --profile kanban-smoke add "link:$FIXTURE_DIR"
cat "$TMP_HOME/profiles/kanban-smoke/package.json"

# 3. 导出最终合成配置，验证 Host 行与 Preset 行均已生效且标明来源
DSH_HOME="$TMP_HOME" pnpm dsh --profile kanban-smoke --dump-config | grep -E "faq26-proof-row|preset-faq26-fixture"
```

---

## 二、哪些今天真能跑通，哪些明令禁止或尚未支持？

把实测结果与源码契约摆在一起，当前能力边界一目了然：

| 你想做的事 | 当前真实状态 | 实测现象与正确做法 |
|---|---|---|
| 用 `--from-default-profile web` 初始化自命名 Profile 并追加定制 Bundle | **原生支持** | 生成独立的 `profiles/<name>/package.json`，内置 `dsh-base` / `dsh-web-app` 从 DSH 底座解析，外部 Bundle 从该 Profile 的 `node_modules` 解析。 |
| 重复对已有 Profile 传 `--from-default-profile` | **危险覆盖** | 实测会直接用模板覆盖掉该 Profile 已安装的外部 `dependencies`、`bundles` 列表及用户保存的 `cordis.patch.yml`！启动脚本必须先判目录是否存在。 |
| 启动插件在后台幂等注册 Workspace 并创建绑定指定 Preset 的 Session | **原生支持** | 同路径重复调 `workspaceController.create` 幂等返回同一 `workspaceId`；接着调 `sessionController.create({ workspaceId, agentPreset })` 会自动把新会话挂入 `attachedSessionIds`。 |
| 调 `session.create` 时同时传 `workspaceId` 和 `cwd` | **当场拒绝** | 直接报错 `gateway/bad-request`（`session.create accepts workspaceId or cwd, not both`）。两者只能二选一。 |
| 后端创建了新 Session，指望已打开的浏览器自动切过去 | **不会自动切换** | 实测老客户端保持原有选中会话，全新客户端也只按自身空白会话逻辑挑选；必须由前端客户端扩展显式调用 `openSession(sessionId)`。 |
| 在 `preset-standard` 上写局部 Patch 只往 `config.plugins` 追加一个工具 | **不支持（整块替换）** | 普通插件行的 `config` 不做内层数组合并；局部写 `config: { plugins: [...] }` 会把原行的 `id`、`name` 和其余默认工具全部冲掉。请插入独立的 `preset-<id>` 行。 |
| 用 CLI 启动或管理桌面端的 `profiles/desktop` | **明令禁止** | `dsh --profile desktop` 与 `dsh plugin --profile desktop add` 均被 CLI 主动拦截报错；桌面端扩展一律走应用内 **Plugins** 页安装。 |
| 已安装的某个第三方 Bundle 版本不兼容或文件损坏时启动 Profile | **容错跳过但有连带风险** | `app-boot` 会跳过该坏包并记入 `skippedBundles`，其余健康包照常启动；但如果其他 Patch 行强依赖该包里的必需服务，后续装载阶段仍会报错退出。 |
| 从源码树直接拉起 Web Profile，但还没跑前端构建 | **启动报错退出** | `--dump-config` 仍能过，但真起 `web` 服务时会因缺少前端编译产物在必需插件阶段直接失败（开发树下需先跑 `pnpm run build:artifacts` 或用 `dev:web`）。 |
| 多租户权限隔离或跨机器自动云同步 `$DSH_HOME` | **不在支持范围内** | 当前 DSH 面向单机单用户 Host 设计：存储域无跨进程文件锁，本地凭据与插件同处一个操作系统用户权限域内。 |

---

## 三、六个最隐蔽的“静默失效”现场

线上排障时，报错退出的问题反而好修，最折磨人的是下面六种**命令返回 0、服务也起来了，但定制效果悄悄没了**的情况：

1. **装进了 `profiles/web`，看的却是 Desktop 窗口**：终端执行 `dsh plugin --profile web add` 提示安装成功，用户切回桌面客户端却找不到新 Preset——因为两边根本不是同一个 Profile。
2. **禁用再重新启用 Bundle 后，配置覆盖反过来了**：在管理界面禁用再重新启用某个 Bundle 时，它会被追加到 `dsh.profile.bundles` 数组末尾，原本排在它后面的另一个 Bundle 对它的覆盖关系随之反转。
3. **写死 `webserver` / `web-startup` 字面量配置，吞掉了命令行参数**：如 [`02-profiles-and-ownership.md`](./02-profiles-and-ownership.md) 剖析，整块替换掉内置行的 `!!js` 动态表达式后，外层脚本传的 `--port` 和 `--no-open` 不报错但完全不起作用。
4. **全局 `$DSH_HOME/cordis.patch.yml` 锁死了设置页修改**：发行脚本往全局 Patch 写了默认值，用户在单 Profile 的 Settings 页面每次点保存看似成功（写进了第 2 层 Profile Patch），实际运行值永远被第 3 层全局 Patch 压住。
5. **前端扩展包只挂在 Preset 子树下，Web 界面一片空白**：`dsh.client` 模块扫描器不扫 `agent-preset` 内部的 `plugins` 数组；忘在根上挂一条已启用 Host 行时，后端工具都在，前端卡片却永远不会打包加载。
6. **把 `WorkspaceId` 当成了路径白名单**：以为会话关联了某个工作区，自己写的 Host 插件调 `ctx.fs` 就会被自动限制在该目录下——实际上 Host 插件代码跑在模型沙箱之外，不自己调 `ctx.fs.contains(root, target)` 校验就会发生目录穿越。

---

## 四、交付前必做：“四层状态回读”排障与验收法

不要听安装脚本自称“安装配置完成”就信以为真。无论是写自动化验收测试还是现场排障，按下面四层从底向上逐层**回读真实状态**，五分钟内就能定位断在哪一环：

1. **第一层：回读磁盘清单（包到底装进目标 Profile 没有？）**
   打开目标 `$DSH_HOME/profiles/<name>/package.json`，确认包名同时出现在 `dependencies` 和 `dsh.profile.bundles` 预期顺位上，且 `node_modules/<pkg>` 物理存在。
2. **第二层：回读合成树（Patch 行到底合进去没有、被谁覆盖了？）**
   执行 `dsh --profile <name> --dump-config`（带上与真实启动完全一致的 `DSH_HOME` 和 `--patch`），检查你的 Host 行与 `preset-<id>` 行是否存在、注释标出的来源层是否符合预期、关键内置行的 `!!js` 表达式是否完好。
3. **第三层：回读宿主运行态（插件真正激活成功了吗？）**
   真实拉起进程后，检查 `$DSH_HOME/logs/startup-*.log` 和终端输出里有没有 `skippedBundles`、`ERR_MODULE_NOT_FOUND` 或 `Config` 校验警告；通过 `agent-preset-registry` 列表确认新 Preset 已处于可用态。
4. **第四层：回读客户端与会话事实（用户肉眼看到的界面闭环了吗？）**
   用全新浏览器上下文通过 `?token=` 完成首启登录，核对三件事：定制前端插槽已渲染、新建或预建会话的 `header.cwd` 与 `agentPreset` 准确无误、触发一次真实工具调用后业务文件落在用户项目目录而非包目录内。
