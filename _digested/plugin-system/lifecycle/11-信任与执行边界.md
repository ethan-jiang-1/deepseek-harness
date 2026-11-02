# 信任与执行边界：四类执行者，四条不能混的边界

## 一句话

「插件会不会干坏事」不是一个问题，是**四类执行者**在**四个不同边界**上的问题。把它们混成一句「在 sandbox 里跑」是最危险的理解：插件宿主代码根本不在 sandbox 里。

## 四类执行者

| 执行者 | 在哪跑 | 谁批准 | 它能碰到什么 |
|---|---|---|---|
| **构建期脚本**（`prepare` / install script） | 用户的机器，安装那一刻 | 用户显式 `allowBuilds` | 文件系统、网络、任意命令——**与 sandbox 无关** |
| **Host 插件**（装进来的包） | 宿主进程内 | 用户装它这个动作本身 | 进程内存、环境变量、凭据引用、所有 `ctx` 服务 |
| **sandbox 内的子进程**（bash 工具等） | 宿主派生的子进程，受 confinement | 会话权限模式 / 单次批准 | 只到策略允许的文件面 |
| **remote / 外部 provider**（ssh、ACP、Codex 等） | 别的机器或别的进程 | 凭据与网络策略 | 由对端决定，宿主只能约束传输 |

## 四条边界

### B1 · 安装期执行代码 ≠ sandbox

依赖的构建脚本在**安装时**、在你的机器上跑；批准它的东西是 profile 的 `pnpm-workspace.yaml` 里的 `allowBuilds`，不是会话的 sandbox 模式。`plugin_manager` 把待决脚本以 `pendingBuilds` 暴露、批准后写进同一份文件（`packages/boot/plugin-manager/src/build-approval.ts`）。

判据：**装一个包 = 允许它的安装脚本在你机器上执行**。不放心就只装预构建产物。

### B2 · Host 插件在进程内，sandbox 保护不了它

官方原话：装进来的 Host 代码 **executes in-process outside the workspace sandbox**（`packages/boot/plugin-manager/README.md:31`）。也就是说：

- 它能读到进程环境、内存里的凭据引用、其它插件注册的服务；
- `workspace-write` 之类的限制对它**不生效**——那是给子进程用的；
- 卸载它只回收代码，不会追回它已经读过的东西。

判据：**审插件 = 审代码**，不是审它的 sandbox 声明。

### B3 · sandbox 只在同一世界里收窄，不是隔离

`packages/sandbox/README.md:12` 写明：confinement 是 same-world 的——共享宿主内核与文件系统，只按 `read-only` / `workspace-write` / `danger-full-access` 收窄**文件影响面**。真正的隔离要靠容器、microVM 或远程执行器（它们替换整个能力，而不是注册一个新 backend）。

判据：**sandbox 防误伤，不防恶意**。

### B4 · 对外暴露靠 token 与 cookie，宿主不替你加固反代

首屏与 API 的入口由 `connection` 的浏览器认证把守：token 换 cookie（`packages/client/connection/src/browser-auth.ts:263`），此后每个请求都要带 cookie。远程部署时：

- `--public-url` 只做**广告**，不授予信任；
- `--trusted-host` 才决定代理的 authority 被不被接受；
- 反代丢了 `set-cookie` 或改写了 authority，用户会卡在 401/403（authority 不受信是 403）或无限跳转。

判据：**暴露面由你的部署决定，宿主只提供机制**。

## 一张对照表：谁该批准什么

| 动作 | 谁批准 | 批准写在哪 | 换了 profile 还生效吗 |
|---|---|---|---|
| 执行依赖构建脚本 | 用户（安装时） | profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` | 不跨 profile |
| 安装一个插件 | 用户 | profile 依赖 + `dsh.profile.bundles` | 不跨 profile |
| 兼容版本冒险 | 用户（显式） | profile 的 `compatibility.json`（exact 包 + exact 版本） | 不跨 profile，且不随升级继承 |
| sandbox 内的一次性提权 | 用户（单次） | 进程内，不持久 | 不持久 |
| 远程访问 | 部署方 | 反代 + `--trusted-host` | 与 profile 无关 |

## 三条落地判断

1. **别把「能装」当成「能安全跑」**：装进来的 Host 代码与你自己的代码同权。
2. **别用 sandbox 模式给 Host 插件做安全承诺**：它只约束子进程，且只在同一世界里收窄。
3. **别把密钥放进配置层**：配置层是 patch，会被复制、导出、贴进 issue。

## 自证

```sh
# 1. 看一个依赖是否要求构建批准
grep -A3 'allowBuilds' "$DSH_HOME/profiles/<p>/pnpm-workspace.yaml" 2>/dev/null || echo "no allowBuilds"

# 2. 看当前会话的沙箱档位（子进程用，不是 Host 插件用）
#    read-only / workspace-write / danger-full-access
# 3. 看入口信任配置
dsh --profile <p> --dump-config | grep -E 'publicUrl|trustedHost' | head
```

## 边界

安装失败的处置在 [`03-安装.md`](./03-安装.md)；首屏认证链在 [`../composition/05-启动窗口与首屏交接.md`](../composition/05-启动窗口与首屏交接.md)；异常分类与恢复在 [`10-诊断地图.md`](./10-诊断地图.md)。
