# 80 · 决策：选模板、bundle 和设置层

## 五个问题

1. **运行时从哪来？** 用户已装 npm、官方 Desktop、Python wheel、源码树。
2. **用哪个模板/surface？** `web`、`headless`、`sdk`/`sdk-minimal`、`acp`，或自定义 TUI profile。
3. **发行版 bundle 放哪、顺序如何？** base → app bundle → 发行版 bundle；默认值放 bundle patch。
4. **设置/更新/卸载谁负责？** 应用内 Plugin Manager（默认）/ `dsh plugin`（仅 web）/ 安装器（仅 shell）、用户设置、文档。
5. **第一次打开看到什么？** 原生只有 token 门；发行版用 onboarding 或启动载体回答。

## 目标 × 模板

| 目标 | 模板 | profile 内容 | 启动 |
|---|---|---|---|
| 浏览器发行版 | `web` | base + web-app + 发行版 bundle | `dsh --profile <name>` / `dsh web` |
| 一次性任务/脚本 | `headless` | base + headless + 发行版 bundle | `dsh --profile <name> "task"` |
| 自动化/IDE | `sdk` / `sdk-minimal` | base + sdk-app，或 standalone | client spawn `dsh --profile sdk` |
| ACP 客户端 | `acp` | base + acp-app | `dsh --profile acp` |
| TUI/自定义 | 自定义 | 自定义 + terminal app bundle | `dsh --profile <tui>` |
| 官方 Desktop | `desktop`（保留） | Electron 独占 | 双击应用 / 内置命令 |
| 内网/远程 | `web` + 容器/反代 | base + web-app + 发行版 bundle | 反代后的 `dsh web` |

**没有“自建第二层 launcher/桌面壳”这一行。** 发行版要桌面体验就用官方 Desktop；要做 Web 就用 web profile + 应用内 Plugins 页/CLI 自动化；容器是部署包装。

## profile 安排清单

1. **名字**：profile 用稳定、非 shipped 的名字；不要占用 `desktop`；`plugin` 需 `--profile plugin`。
2. **模板**：Web/headless/SDK/ACP 先选 shipped 模板；自定义 TUI 才从 base/自定义开始。
3. **bundle 集**：base + app bundle + 发行版 bundle；顺序固定；发行版 bundle 在 app 之后。
4. **默认值**：发行版端口/主题/preset/开关写 bundle patch；不要写进 app bundle。
5. **用户设置**：profile patch / Settings UI；不要另建第二套真值。
6. **首建/重置**：只在全新 profile 用 `--from-default-profile`；已有 profile 不重置。
7. **安装**：默认应用内 Plugins 页；CLI `dsh plugin --profile <name> add <bundle>` 仅 web 自动化；不手写 manifest。
8. **校验**：`--dump-config`、启动日志、profile roster、页面/任务。
9. **更新**：应用内 Plugin Manager（默认）或 `dsh plugin update`（仅 web 自动化）；bundle 成员变化要重启；回退是重装旧版本，DSH 没有命令级回滚。
10. **文档**：安装/启动/设置/升级/卸载/排障与发布物同版本。
11. **首启**：token 门之后由发行版回答首屏；可推迟；不依赖 `welcome-notice`，Desktop 有替代。

## 设置安排清单

1. 发行版默认值 → bundle patch。
2. 首启/用户设置 → profile patch（Settings UI 同层）。
3. 机器级偏好 → home patch；发行版不要静默写。
4. 本次诊断/覆盖 → `--patch`。
5. 密钥/部署 → env/.env/credentials，不进 profile patch。
6. UI 状态 → 客户端 localStorage；换 origin 会丢。
7. patch 不要只写一项：`config` 是整份替换，缺必填字段会启动失败。
8. 需要 app 参数生效时，保留 row 的 `!!js` 表达式；字面值会让 `--port` 失效。

## 失败模式

大多数“装好了但没用”能归到三类：状态层（base-only/半挂载/skipped bundle）、config 层（整份替换/字面值）、membership 层（重置/双写者/端口）。

![失败模式：症状、原因、检查与修复](./figures/80-failure-modes.svg)

### startup 实测失败

| 失败 | 症状 | 原因 | 修复 |
|---|---|---|---|
| 自定义 flag 被拒 | `unknown option '--project'` | web-startup 拥有整条命令行 | 用 web flags/profile-as-mode，或替换 web-startup |
| patch 没生效 | bundle 在 roster，row 不存在 | 裸 `- id` 被当 override target | 改用 `- insert:` |
| session 建了但没选中 | 返回用户仍是旧 session | Host create 不切换 Client current；fresh 可能落到最近工作区的 blank | client 调 `uiWorkspace.openSession(sessionId)` |
| 替换 web-startup 漏 flag | flag 被静默忽略：仍是无 TLS 的 listener，广告与信任停在本机 | 发行版 parser 没实现这些 web flag | 实现全部 web flags 或显式拒绝未知 flag |

## 反模式

| 反模式 | 问题 |
|---|---|
| 新 bin/`node dist/server.js` | 绕过 launcher，不受支持 |
| 自建第二层 launcher/桌面壳 | 第二个 launcher/profile 写者/更新器 |
| 发布 profile 目录 | 覆盖用户 patch/依赖 |
| 手写 `dsh.profile.bundles` | 与 `dsh plugin` 漂移 |
| base-only profile 期待 Web | 没有 web-app/端口/页面 |
| config 字面值 | 缺必填字段；app 参数失效 |
| wildcard bind | Web 拒绝；远程要反代/TLS/trusted-host |
| 两套设置真值 | 设置页/发行版 store/profile patch 漂移 |

## 默认建议

- **能用一个 bundle + 一个 shipped 模板解决，就不要造第二层。**
- **默认发 bundle，让用户在应用内 Plugins 页装**（web 与 Desktop 同一句）；CLI `--profile` 面绑定（不能 `desktop`），面向 GUI 时只作 web 自动化。
- **只有 shell/自托管才用安装器**：确保 dsh 版本、创建 profile（首次）、装 bundle、`exec dsh --profile`；不写 `--profile desktop`。
- **设置从 bundle 默认值开始**，用户覆盖留 profile/home；不要把所有设置塞进发行版自有文件。
- **更新走应用内 Plugin Manager（默认）或 `dsh plugin`（仅 web）**；保留旧 exact version/enabled，文档写清重启，以及回退是重装旧版本而不是一条命令。

![决策：模板 → bundle → 设置 → 启动](./figures/80-decision.svg)
