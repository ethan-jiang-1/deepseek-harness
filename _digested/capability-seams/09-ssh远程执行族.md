# SSH 远程执行族：一条连接，三个既有 seam 的远程 provider

> [`01`](./01-三角色与分包装.md) 说过：换执行世界时 Consumer 一字不改。本篇是这句话的现行完整样本——`packages/ssh/` 不发明任何新的「远程世界」私有键，而是给 **三个既有 seam**（`ctx.fs` / `ctx.subprocess` / `ctx.sandbox`）各提供一个远程 provider，共享一条 SSH 连接。依赖这些 seam 的 Consumer 随 provider 组合切换到远程，tool 源码不改。全族 opt-in，没有任何 bundle 出货。

源码核验入口：`packages/ssh/ssh/`、`packages/ssh/fs-ssh/`、`packages/ssh/subprocess-ssh/`、`packages/ssh/sandbox-ssh/`、[`docs/subsystems/ssh.md`](../../docs/subsystems/ssh.md)、[`docs/capability-seams.md`](../../docs/capability-seams.md)。上游决策全文见 [`2026-09-11-posix-ssh-runtime.md`](../../.agents/notes/implemented/architecture/2026-09-11-posix-ssh-runtime.md)。

## `ctx.ssh`：连接、helper 身份与传输生命期

`dsh-ssh` 是 `ctx.ssh` 的 Service Definition（`packages/ssh/ssh/src/index.ts` 的 `SshConnection`，`super(ctx, 'ssh')`），在生成的 seam 表里 role 列为 `core`——它不是「一个接口多个后端」，而是一份所有远程 provider 共用的连接事实。配置全部是部署自有事实：OpenSSH host alias、远端 Node 可执行、已安装的 helper 入口及其 SHA-256、默认 workspace，可选的 PTC bootstrap 路径 + 摘要对（Config 接口逐字段校验）。客户端本身只允许 POSIX。`[Service.init]` 等 `ready`：握手验证远端返回的 helper 摘要与配置的 `helperHash`、bootstrap 摘要与 `bootstrapHash`，不符就拒绝连接；`ptcLaunch` getter 把验证过的远端坐标交给 PTC 组合，script 部署在未配置 bootstrap 时拒绝——经配置换值，不经 inject。

传输分两类通道。私有管理 RPC 走 OpenSSH master 的一条 exec 流（`start()` 用 `ssh -T -M -S … -o ControlPersist=no -o BatchMode=yes -o StrictHostKeyChecking=yes -o ForwardAgent=no -o ClearAllForwardings=yes` 起 helper 进程；协议版本 `SSH_PROTOCOL_VERSION = 2`，`packages/ssh/ssh/src/protocol.ts`）；每条程序流（stdin/stdout/stderr/fd 7 控制流/终端）经 `connectStream()` 用 `ssh -O forward` 转发一条独立 Unix socket、建一条独立 SSH channel，并在 `authenticateStream` 里用每流一把的 256-bit TLS-PSK 做双向认证（`packages/ssh/ssh/src/stream-security.ts` 的 `PSK-AES256-GCM-SHA384`、TLS 1.2）。程序输出因此伪造不了管理应答，暂停一条输出也不占控制流的 channel 窗口；但所有 channel 共享连接带宽与传输失败。helper 以 `--disable-sigusr1` 启动，同用户信号不能打开它的 Node 调试器。心跳周期性发 `heartbeat`（超时上限 `leaseMs / 2`），失约即判失败；helper 侧对 EOF、终止信号与租约到期启动远端托管清理。

生命期合同是「一条会话，不重连」：`dispose()` 先向 helper 发 `close`、join 全部转发 socket 与取消子进程、等在途 operation 全部结算，再删本地临时目录。连接丢失把 pending operation 全部置废（close → `fail`），**从不自动重连、从不重放**一次可能已执行的启动或变更——客户端如实报告「远端结果未知」。

## 一条连接分出三个面

| 面 | provider 包 | 注入 | 远端职责 |
|---|---|---|---|
| `ctx.fs` | `packages/ssh/fs-ssh/`（`SshFileSystem`） | `['ssh', 'sandboxPolicy']` | 文件身份、读写、受护栏的原子变更 |
| `ctx.subprocess` | `packages/ssh/subprocess-ssh/`（`SshSubprocessRuntime`） | `['ssh']` | 可执行查找、普通进程、fd 7 控制、终端 |
| `ctx.sandbox` | `packages/ssh/sandbox-ssh/`（`SshSandboxProvider`） | `['ssh']` | 文件效果遏制（remote file-effect confinement） |

**fs-ssh** 把每个 fs 方法直译成一次 helper 请求（`packages/ssh/fs-ssh/src/index.ts`）；`resolve()` 在远端主机上规范化路径，`processPath` / `fileUrl` 只是远端命名空间里的执行坐标，`processPathFromHostPath()` 恒为 `undefined`——装了远端 artifact 不等于任意宿主路径可移植。写与编辑把逐调用 policy 发给 helper（调用方未给时由 `ctx.sandboxPolicy.resolve()` 补齐），helper 在原子变更旁边就地强制。错误映射保住共享错误码表：已知 `RemoteOperationError.code` 映回同名 `FsError`，其余传输失败归 `FS_IO_ERROR`、取消归 `FS_ABORTED`。基类行为大多原样保留：helper 复用 `fs-local` / `fs-sandbox` 的实现（`packages/ssh/fs-ssh/README.md`），符号链接身份、stale-version 拒绝、diff base、发布语义都在；`watch()` 没有 override，远端路径的监听请求落进基类的 `FS_IO_ERROR` 拒绝。

**subprocess-ssh** 把 `SubprocessHandle` 语义搬过 SSH：`RemoteProcess`（`packages/ssh/subprocess-ssh/src/index.ts`）在远端分配进行中就返回句柄，piped stdin 与 fd 7 在分配期间照常收写；`done` 报直接结果，`terminate()` / `waitForExit()` 观察的是远端受管范围，直接退出不证明范围静默；`resolveExecutable` 查的是远端可执行命名空间，查找未命中与 SSH 失败是两类错误。helper 侧的执行器是 `LocalSubprocessRuntime`（`packages/ssh/ssh/src/helper.ts`）——远端主机上的进程所有权、平台回退与本地执行同义，SSH 只搬请求与观察，不自己遏制载荷。终端保留异步共享接口，`shellActivity` 转发给执行 provider（`spawnTerminal`）。

**sandbox-ssh 与本地 confine 的差别**在「谁选后端、何时解析」。本地组合里 `ctx.sandbox.confine` 在 spawn 前由进程内 provider 包 argv；远程组合里 `confine` 把 `argv` + 完整 policy 发给 helper（`packages/ssh/sandbox-ssh/src/index.ts`），helper 先把 policy 的 workspaceRoot 在远端文件系统上解析、再交给它自己装载的 sandbox provider 求 argv 与 enforcement 事实（`helper.ts` 装载的是 `LocalSandboxProvider` + `SandboxPolicyService`）。也就是说：**远端主机按它自己的 OS 选已安装的后端**，Bash 与 Node 拿到的是同一个后端的 enforcement 级别、denial signature 与 runner 失败分类；本地包 README 的平台限制在远端原样继承。`danger-full-access` 不发请求、不经 confine——连接不发明额外的本地/远程标志。confine 失败或后端不可用包装成 `SandboxUnavailableError`，在调用方拿到任何可执行 argv 之前拒绝。

helper 本体是随包发布的捆绑产物：tsdown 入口 `helper-entry.ts` 出 `./helper` 导出（`packages/ssh/ssh/tsdown.config.ts`、`package.json`），部署时整体装到远端；helper 在远端起一套最小 Cordis 组合——`SandboxPolicyService`（默认 `read-only`）+ `SandboxedFileSystem` + `LocalSubprocessRuntime`。写入路径在 helper 里同样先经 policy 规范化再进 `ctx.fs.writeText` / `ctx.fs.editText`。

## 启用：opt-in，且没有任何 bundle 出货

核验结论（全仓 grep `packages/bundle`、`apps/`、`snapshots/`）：**没有任何一个 bundle、app 或快照 fixture 挂载 ssh 组的包**；`packages/bundle/web-app/src/index.ts` 里唯一与 SSH 有关的 import 是 `@deepseek-ai/dsh-launch-environment` 的 `launchedThroughSsh`（经 SSH 登进宿主机跑 harness 的另一件事，与远程执行族无关）。启用路径是自定义 headless / custom profile 显式挂四包并填部署事实——host alias、远端 Node、helper、`helperHash`、workspace 一个都不能少（`packages/ssh/ssh/README.md` 的字段表）。已知边界同样写在 README：无 Windows 端点、无自动 provisioning、无重连或重放；Web workspace UI 仍假设宿主文件系统访问，要用 headless 或 Consumer 尊重 provider 路径的组合。

## 值得记录的失败语义

- **不重放原则**贯穿三面：取消不撤销已完成的远端效果；一次丢失连接后的启动或变更结果未知，客户端不把它伪装成成功或失败。
- **fs 侧**：传输丢失报 I/O 失败，但变更可能已经提交且不会自动重试（`packages/ssh/fs-ssh/README.md`）。
- **subprocess 侧**：`done` 报直接退出，`waitForExit()` 单独观察远端受管范围；连接丢失后远端终止在客户端侧不可确认，租约清理是远端动作不是客户端确认（`packages/ssh/subprocess-ssh/README.md`）。
- **sandbox 侧**：confine 失败先于任何 argv 交付拒绝；远端 `partial` 后端仍然只是 partial，文件效果模式不限制网络或进程可见性（`packages/ssh/sandbox-ssh/README.md`）。
- **信任边界**：摘要比对 pin 的是部署 artifact，不是敌意远端 OS；TLS-PSK 挡同用户连接与路径替换，不挡远端内存检查（`packages/ssh/ssh/README.md`）。

## 源码入口

| 路径 | 一句话 |
|---|---|
| `packages/ssh/ssh/src/index.ts` | `SshConnection`：配置校验、握手 + 摘要验证、管理 RPC、流转发、心跳租约、dispose |
| `packages/ssh/ssh/src/helper.ts` | 远端 helper 组合：本地 fs/subprocess/sandbox 包在远端就位；`sandbox` / `fs.write` 的 policy 规范化 |
| `packages/ssh/ssh/src/stream-security.ts` | 每流 TLS-PSK 双向认证 |
| `packages/ssh/ssh/src/protocol.ts` | 帧协议、版本、进程/文本流上限 |
| `packages/ssh/fs-ssh/src/index.ts` | `ctx.fs` 远程 provider：远端规范化、逐调用 policy、错误码映射 |
| `packages/ssh/subprocess-ssh/src/index.ts` | `ctx.subprocess` 远程 provider：`RemoteProcess`、远端受管范围观察、终端 |
| `packages/ssh/sandbox-ssh/src/index.ts` | `ctx.sandbox` 远程 provider：逐调用远端解析，`danger-full-access` 旁路 |
| [`docs/subsystems/ssh.md`](../../docs/subsystems/ssh.md) | 执行坐标、传输语义与 `SshConnection` 公开 API 速查 |

一次 bash 在本地如何走 confine → spawn 见 [`02-一次bash从tool到sandbox.md`](./02-一次bash从tool到sandbox.md)；远端受管范围与本地 native containment 的对应关系见 [`07-原生containment与native-system.md`](./07-原生containment与native-system.md)。
