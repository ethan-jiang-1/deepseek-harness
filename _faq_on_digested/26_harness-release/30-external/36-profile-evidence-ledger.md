# 36 · profile 样本证据台账（参考）：每个形态读到了什么、没验证什么

## 这一篇回答什么

> **角色：外部参考层（E1/E2）。** [34](./34-profile-delivery-forms.md) 写八种形态，[35](./35-profile-assembly-ownership.md) 写共用机制；本篇只记证据：每个样本 pin 在哪个版本、读了什么、哪些只是 README 主张、哪些根本没有验证；另有一次 2026-11-01 的 npm registry 只读核对。

**口径。** `[SRC]` = 读过固定 tag/commit 的目标源码；`[R]` = README/作者声明；`[DSH]` = DSH `0.2.1-rc.3` 契约；`[TEST]`/`[CI]` = 读过测试与同 SHA CI 记录，但本轮没有执行；`[OBS]` = 只读目录/注册表元数据的普查；**没有 `[RUN]`**（表示实际运行过）。npm 下载含 CI/镜像，星标不是质量。

![八个样本的证据覆盖](../figures/36-evidence-matrix.svg)

## 逐样本台账

| 样本 | 版本 pin | 已读 | 测试/CI | 仅 README | 未验证 |
|---|---|---|---|---|---|
| `dsh-web` | v0.4.13 / `88409fb` | root/aggregate manifest、`aggregate.yml`、generator、`dsh-update`、retirement tests | 固定 SHA 的 aggregate/retirement 测试读过，未运行 | 半挂载、商店/皮肤/updater、standalone 共存、restart UX | 真实 profile add/boot/upgrade；pnpm resolution；四个 satellite 的版本与行为 |
| `dsh-codex-ui` | 2.0.9 / `29a999e` | 六个 rows、theme/composer/sidebar 激活路径、settings card、slot 测试 | same-SHA Node 22/24 CI 读过，未运行 | 禁用即零残留、整套 settings 0 DOM、`ds-bot` 冲突 | 真实 disable/unmount/reload 后的 token/DOM 残留；全部 peer range；portal 清理 |
| `dsh-suite` | 0.9.1 / `b904373`（SLSA） | 18 deps/rows/defaults、updater state/门控/恢复、冲突边界 | same-SHA Node 22/24 与 restore 测试读过，未运行 | README 的“共同加载”、组件面板、restart UX | 真实 upgrade/partial failure/restore；transitive lock；同 id 与其它聚合包冲突 |
| `dsh-all` | 0.1.73 / `2c6b35b` | 12 insert rows、11 exact deps、no-op entry、`kit-pins`、profile manager routes/guards | same-SHA aggregate check、mount/headless 读过，未运行 | README 的 11 个基线、按需安装、影响面表 | aggregate+member 重复安装；partial install 回滚；profile CRUD 的真实 OS 权限/symlink/恶意请求 |
| `dsh-plugins-plus` | 0.2.0（npm tarball） | registry tarball、README；`gitHead` 指向 0.1.8 manifest，无对齐源码 | 无匹配 source/test/CI | 接管 planner、`unset`/继承、legacy import、HMR、session 快照 | 目标实现全部未核；`builtin-id-plus` 是否稳定；桌面 log overlay |
| `dsh-agent-plugins-market` | 0.13.0 / `d3364da` | layouts adapter、source/install/filter、validation、credentials/OAuth、hooks、uninstall | same-SHA tests 与 CI run `40302671805` 读过，未运行 | 十种布局的语义保真度、八 tab UX、真实 OAuth callback | hook 决策与权限效果；workspace filter 运行时；`state.json` 损坏恢复；跨 peer range |
| `better-session` | 0.1.10（npm tarball） | 发布 patch：5 exact deps、5 rows、SQLite default；README 闭环 | 无匹配 source/test/CI（无 tag、无 `gitHead`） | edit/retry/fork、UI slots、确认弹窗 | session schema/事务/迁移；并发 retry；外部 tool side effect；UI slot 契约 |
| `dsh-wallpaper-engine` | 1.4.0 / `3b0103b` | 8 packages/rows、host/client、格式 fallback、video limits、preset schema、token contract | same-SHA Windows/Ubuntu CI 读过，未运行 | WebGL/ffmpeg 真实表现、preset obsolete UX、跨 skin 共存 | 真实 GPU/OS、Web sandbox 威胁模型、unload teardown、预设跨版本导入 |

## 注册表复核（2026-11-01）

对 8 个 npm 包做了**只读** registry 核对（`registry.npmjs.org/<pkg>/<version>`）与一次 GitHub tags 查询。它只证明**发行物存在、manifest 字段是什么**，不证明行为；行为仍是 `[R]`/`[SRC]`。本节的证据级别是 `[OBS]`（只读元数据），不是 `[SRC]`。

| 样本 | pin 存在 | pin 的来源 | 复核到的 manifest |
|---|---|---|---|
| `dsh-web` | ✓ 0.4.13 | 仓库 tag（未单独核对） | `dsh.bundle.patch: ./cordis.patch.yml`；`engines.dsh: >=0.2.1-rc.3`；24 个 direct 依赖（“20 多个家族/卫星包”对得上） |
| `dsh-codex-ui` | ✓ 2.0.9 | `gitHead` | `gitHead` 与上表的 `29a999e` 一致；`engines.dsh: >=0.2.0-rc.1 <0.3.0-0`；带 SLSA provenance |
| `dsh-suite` | ✓ 0.9.1 | 有 provenance、无 `gitHead` | 18 个 exact 依赖（与上表一致）；`dsh.bundle.patch` 是数组，含 `cordis.patch.yml` 与 `ptc-minimal.patch.yml`；**无 `gitHead`** |
| `dsh-all` | ✓ 0.1.73 | 本地 tgz 发布 | 11 个 exact 依赖（与上表一致）；DSH 范围写在 `dsh.engines.dsh`——**DSH 不读这个字段**（`DshManifest` 只有 `manifestVersion`/`bundle`/`profile`/`client`），实际生效回退到 `@deepseek-ai/dsh` peer；**无 `gitHead`** |
| `dsh-plugins-plus` | ✓ 0.2.0 | `gitHead` | `gitHead` 指向的 commit 里 `package.json` 是 **0.1.8**，与 [34](./34-profile-delivery-forms.md)/[35](./35-profile-assembly-ownership.md) 的说法一致；无 `engines.dsh`，靠 peer |
| `dsh-agent-plugins-market` | ✓ 0.13.0 | 有 provenance、无 `gitHead` | 26 个 DSH peer、无 `engines.dsh`；**无 `gitHead`** |
| `better-session` | ✓ 0.1.10 | npm tarball | **无 `gitHead`**，GitHub `tags` 返回 `[]`——两条与上表一致；5 个 exact 依赖与 34 的清单逐条相同；`engines.dsh: >= 0.2.1-rc.1 < 0.2.2` |
| `dsh-wallpaper-engine` | ✓ 1.4.0 | npm tarball | 7 个子包 + 主包 = 8；**没有 glass 子包**；`engines.dsh: ^0.2.0-rc.1`；**无 `gitHead`** |

**结论**：8 个 pin 都存在，上表的版本号与依赖数没有漂移。但 `gitHead` 只覆盖 2 个样本，其余没有可直接 diff 的 commit：有 provenance 的包其源码提交写在 attestation 里（本次没有逐一核对 attestation 内容），其余只能靠 npm tarball。引用时按来源理解。

**复核命令**（需要网络；不安装、不运行，容器里可直接跑）：

```sh
npm view '@linxin666/dsh-web-all@0.4.13' --json | jq '{version, engines, dsh, peerDependencies}'
curl -s https://registry.npmjs.org/@sidleo3/dsh-plugins-plus/0.2.0 | jq '{gitHead, engines}'
gh api repos/morlay/dsh-plugin/tags --jq 'length'
```

## 生命周期样本（在 37，不在本篇）

[37](./37-lifecycle-stages.md) 另列 15 张阶段样本 + 1 张反例（装 4、起 5、配 3、首启 3、反例 1），按“装/起/配/首启”而不是交付形态组织。**本篇台账不覆盖它们**：它们的逐行证据就在 37 的阶段样本表里（每行一个 S/R 字母），未验证项写在对应阶段小节。原册对 `install/11`、`install/13`、`boot/21`、`config/31` 有隔离实测，其余为包清单/源码/README；本篇没有重跑，所以不把原册的实测升为本篇的 T。

## 采用信号与样本边界

npm last-month（2026-09-30 ~ 10-29，含 CI/镜像）：`dsh-codex-ui` 119,610、`dsh-wallpaper-engine` 109,268、`dsh-web` 99,694、`better-session` 8,561、`dsh-suite` 8,230、`dsh-plugins-plus` 6,094、`dsh-agent-plugins-market` 4,752、`dsh-all` 3,558。GitHub 星标（2026-10-31）从 `dsh-web` 9,865、`dsh-wallpaper-engine` 4,189 到 `dsh-plugins-plus` 0 不等；下载与星标不可互证，也不代表用户数或机制质量。

这一桶本身很薄：profile 级交付的作者通常有三条去路——DIY 一个桌面壳、发单个插件、或被上游收编；其中 DIY 桌面壳是外部现象，不是 DSH 支持路径，官方 Desktop 之外不承诺；留下来的多是 npm 下载高、星标低的“打包型”样本。2026-10-31 的普查用 `keywords:dsh-bundle` 找到 322 个包，按月下载排前 20 后人工判形态，过门槛成卡 3 个、进候选池 4 个；另用 2026-10-31 的 7,924 条注册表描述做正则召回，补了接管、进口、闭环三种形态。（`[OBS]`）

## 怎么复核

- **隔离 profile**：`dsh --profile <scratch> --from-default-profile web`，只动 disposable home；不碰用户 profile、Session DB 和壁纸库。
- **四层读回**：安装后分别读 package 版本、`dsh.profile.bundles`、patch row/`disabled`、effective config；不要只看 `dsh plugin add` 的 exit code。
- **逐样本重点**：`dsh-web` 看 roster/row disabled/升级/tombstone；`dsh-codex-ui` 看 disable/unmount 后的 token/DOM 残留；`dsh-suite` 在 update 各阶段注入失败；`dsh-all` 测 aggregate+member 重复；`dsh-plugins-plus` 先解决 source pin 再谈接管；`dsh-agent-plugins-market` 测 refresh/OAuth/hook/删除所有权；`better-session` dump effective SQLite path 并测 edit/retry/fork 的副作用；`dsh-wallpaper-engine` 在目标 GPU/OS 测 fallback、预设导入和卸载。
- **失败注入**：remove/install 之间杀进程、坏 registry、磁盘满、凭据缺失、OAuth deny、坏 `state.json`；记录 partial state 与 repair 命令。

## 边界

- 八个样本都没有安装或启动；`[SRC]`/`[TEST]`/`[CI]` 不等于本轮行为观察，README 体验主张单独标注。
- 注册表复核（见上）只证明发行物存在与 manifest 字段，不把任何行为结论升级为 T；`gitHead` 缺失的样本也没有可 diff 的源码锚点。
- `dsh-plugins-plus` 与 `better-session` 的目标源码未 pin，机制结论只到发布物或 README；不能把邻近 commit 当目标实现。
- 版本、下载、星标和默认值会变；引用时回到对应 tag/commit 与 npm 版本。
- 台账不评价 package 是否适合作为依赖；采用前另核 license、兼容范围、供应链和数据生命周期。
