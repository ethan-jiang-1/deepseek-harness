# SSH 远程执行族：一条连接，三个既有 seam 的远程 provider

源码核验入口：`packages/ssh/`、`packages/ssh/ssh/`、`packages/ssh/fs-ssh/`、`packages/ssh/subprocess-ssh/`、`packages/ssh/sandbox-ssh/`、`docs/subsystems/ssh.md`、[`docs/capability-seams.md`](../../docs/capability-seams.md)。上游决策全文见 [`2026-09-11-posix-ssh-runtime.md`](../../.agents/notes/implemented/architecture/2026-09-11-posix-ssh-runtime.md)；跨度记录见 [`../_change_log/0008-0.1.5-rc.2-to-0.1.7-rc.1.md`](../_change_log/0008-0.1.5-rc.2-to-0.1.7-rc.1.md)。

## 面的来历：~~ctx.e2b~~（0.1.7 线 E2B 组退役，机制记录见 [`../_change_log/0008-0.1.5-rc.2-to-0.1.7-rc.1.md`](../_change_log/0008-0.1.5-rc.2-to-0.1.7-rc.1.md)）

旧基线的 E2B 组合把远程 Linux 目录树与进程世界放在一个 `ctx.e2b` 后面（[`00-map.md`](./00-map.md) 与 [`01-三角色与分包装.md`](./01-三角色与分包装.md) 各留一条指针）。0008 跨度删除 `packages/e2b/` 组，接替面是 `packages/ssh/` 组：不新增任何 `ctx.e2b` 式的私有世界键，而是给 **三个既有 seam** 各提供一个远程 provider，共享一条 SSH 连接。组合卖点原样保留——依赖 `ctx.fs` / `ctx.subprocess` / `ctx.sandbox` 的 Consumer 随 provider 组合切换到远程，tool 源码不改（活样本见 [`01-三角色与分包装.md`](./01-三角色与分包装.md) 收尾句）。

## `ctx.ssh`：连接、helper 身份与传输生命期

`dsh-ssh` 是 `ctx.ssh` 的 Service Definition（`packages/ssh/ssh/src/index.ts:42`-`:44`），单一实现 `SshConnection`（`:47`），在生成的 seam 表里 role 列为 `core`、implementation 列为 `-`（[`docs/capability-seams.md:630`](../../docs/capability-seams.md)）——它不是「一个接口多个后端」，而是一份所有远程 provider 共用的连接事实。配置全部是部署自有事实：OpenSSH host alias、远端 Node 可执行、已安装的 helper 入口及其 SHA-256、默认 workspace，可选的 PTC bootstrap 路径 + 摘要对（`:17`-`:40`）。客户端本身只允许 POSIX（`:75` 的构造检查）。`[Service.init]` 等 `ready`（`:92`）：握手验证远端返回的 helper 摘要与配置的 `helperHash`、bootstrap 摘要与 `bootstrapHash`，不符就拒绝连接（`:280`-`:281`）；`nodeExecutable` / `bootstrapPath` 两个 getter（`:95`-`:104`）把验证过的远端坐标交给 PTC 组合，`bootstrapPath` 在未配置时拒绝（`:101`-`:103`），消费侧是 `NodePtcRuntime` 的 `nodeExecutable` / `bootstrapPath` 配置字段（`packages/ptc-runtime/ptc-runtime-node/src/index.ts:62`-`:63`）——经配置换值，不经 inject。

传输分两类通道。私有管理 RPC 走 OpenSSH master 的一条 exec 流（`start()` 用 `ssh -T -M -S … -o BatchMode=yes -o StrictHostKeyChecking=yes -o ForwardAgent=no -o ControlPersist=no` 起 helper 进程，`:263`-`:267`；协议版本 `SSH_PROTOCOL_VERSION = 1`，`packages/ssh/ssh/src/protocol.ts:10`）；每条程序流（stdin/stdout/stderr/fd 7 控制流/终端）经 `connectStream()` 用 `ssh -O forward` 转发一条独立 Unix socket、建一条独立 SSH channel（`:131`-`:180`），并在 `authenticateStream` 里用每流一把的 256-bit TLS-PSK 做双向认证（`packages/ssh/ssh/src/stream-security.ts:7` 的 `PSK-AES256-GCM-SHA384`、TLS 1.2，`:22` 的 `pskCallback`）。程序输出因此伪造不了管理应答，暂停一条输出也不占控制流的 channel 窗口；但所有 channel 共享连接带宽与传输失败。helper 以 `--disable-sigusr1` 启动（`:262`），同用户信号不能打开它的 Node 调试器。心跳按 `leaseMs` 三分之一间隔发 `heartbeat`（`:284`-`:288`），失约即判失败；helper 侧对 EOF、终止信号与租约到期启动远端托管清理。

生命期合同是「一条会话，不重连」：`dispose()` 先向 helper 发 `close`、join 全部转发 socket 与取消子进程、等在途 operation 全部结算，再删本地临时目录（`:188`-`:209`）。连接丢失把 pending operation 全部置废（close → `fail`，`:272`），**从不自动重连、从不重放**一次可能已执行的启动或变更——客户端如实报告「远端结果未知」。

## 一条连接分出三个面

| 面 | provider 包 | 注入 | 远端职责 |
|---|---|---|---|
| `ctx.fs` | `packages/ssh/fs-ssh/`（`SshFileSystem`，`packages/ssh/fs-ssh/src/index.ts:20`） | `['ssh', 'sandboxPolicy']`（`:21`） | 文件身份、读写、受护栏的原子变更 |
| `ctx.subprocess` | `packages/ssh/subprocess-ssh/`（`SshSubprocessRuntime`，`packages/ssh/subprocess-ssh/src/index.ts:229`） | `['ssh']`（`:230`） | 可执行查找、普通进程、fd 7 控制、终端 |
| `ctx.sandbox` | `packages/ssh/sandbox-ssh/`（`SshSandboxProvider`，`packages/ssh/sandbox-ssh/src/index.ts:10`） | `['ssh']`（`:11`） | 文件效果遏制（remote file-effect confinement） |

**fs-ssh** 把每个 fs 方法直译成一次 helper 请求（`packages/ssh/fs-ssh/src/index.ts:25`-`:80`）；`resolve()` 在远端主机上规范化路径（`:25`），`processPath` / `fileUrl` 只是远端命名空间里的执行坐标（`:29`-`:33`），`processPathFromHostPath()` 恒为 `undefined`——装了远端 artifact 不等于任意宿主路径可移植。写与编辑把逐调用 policy 发给 helper（`:82`-`:95`；调用方未给时由 `ctx.sandboxPolicy.resolve()` 补齐，`:85`、`:93`），helper 在原子变更旁边就地强制。错误映射保住共享错误码表：已知 `RemoteOperationError.code` 映回同名 `FsError`，其余传输失败归 `FS_IO_ERROR`、取消归 `FS_ABORTED`（`:97`-`:104`）。基类行为大多原样保留：helper 复用 `fs-local` / `fs-sandbox` 的实现（`packages/ssh/fs-ssh/README.md:42`），符号链接身份、stale-version 拒绝、diff base、发布语义都在；`watch()` 没有 override，远端路径的监听请求落进基类的 `FS_IO_ERROR` 拒绝（`packages/ssh/fs-ssh/README.md:70`）。

**subprocess-ssh** 把 `SubprocessHandle` 语义搬过 SSH：`RemoteProcess`（`packages/ssh/subprocess-ssh/src/index.ts:21`）在远端分配进行中就返回句柄，piped stdin 与 fd 7 在分配期间照常收写；`done` 报直接结果（`:157` 的 `terminate()`、`:178` 的 `waitForExit()` 观察的是远端受管范围，直接退出不证明范围静默）；`resolveExecutable` 查的是远端可执行命名空间（`:255`），查找未命中与 SSH 失败是两类错误。helper 侧的执行器是 `LocalSubprocessRuntime`（`packages/ssh/ssh/src/helper.ts:10`）——远端主机上的进程所有权、平台回退与本地执行同义，SSH 只搬请求与观察，不自己遏制载荷（`packages/ssh/subprocess-ssh/README.md:48`）。终端保留异步共享接口，`shellActivity` 转发给执行 provider（`spawnTerminal`，`:284`）。

**sandbox-ssh 与本地 confine 的差别**在「谁选后端、何时解析」。本地组合里 `ctx.sandbox.confine` 在 spawn 前由进程内 provider 包 argv；远程组合里 `confine` 把 `argv` + 完整 policy 发给 helper（`packages/ssh/sandbox-ssh/src/index.ts:13`-`:16`），helper 先把 policy 的 workspaceRoot 在远端文件系统上解析、再交给它自己装载的 sandbox provider 求 argv 与 enforcement 事实（`packages/ssh/ssh/src/helper.ts:142`-`:146`；装载的是 `LocalSandboxProvider` + `SandboxPolicyService`，`helper.ts:12`、`:30`）。也就是说：**远端主机按它自己的 OS 选已安装的后端**，Bash 与 Node 拿到的是同一个后端的 enforcement 级别、denial signature 与 runner 失败分类（`packages/ssh/sandbox-ssh/README.md:12`）；本地包 README 的平台限制在远端原样继承（`packages/ssh/sandbox-ssh/README.md:50`）。`danger-full-access` 不发请求、不经 confine（`helper.ts:145`；`packages/ssh/sandbox-ssh/README.md:30`——连接不发明额外的本地/远程标志）。confine 失败或后端不可用包装成 `SandboxUnavailableError`（`packages/ssh/sandbox-ssh/src/index.ts:28`），在调用方拿到任何可执行 argv 之前拒绝。

helper 本体是随包发布的捆绑产物：tsdown 入口 `helper-entry.ts` 出 `./helper` 导出（`packages/ssh/ssh/tsdown.config.ts:4`、`packages/ssh/ssh/package.json:23`），部署时整体装到远端；helper 在远端起一套最小 Cordis 组合——`SandboxPolicyService`（默认 `read-only`）+ `SandboxedFileSystem` + `LocalSubprocessRuntime`（`packages/ssh/ssh/src/helper.ts:30`-`:32`）。写入路径在 helper 里同样先经 policy 规范化再进 `ctx.fs.writeText` / `ctx.fs.editText`（`helper.ts:221`-`:236`）。

## 启用：opt-in，且没有任何 bundle 出货

核验结论（全仓 grep `packages/bundle`、`apps/`、`snapshots/`）：**没有任何一个 bundle、app 或快照 fixture 挂载 ssh 组的包**；`packages/bundle/web-app/src/index.ts:24` 里唯一的 "ssh" 命中是 `@deepseek-ai/dsh-launch-environment` 的 `launchedThroughSsh`（经 SSH 登进宿主机跑 harness 的另一件事，与远程执行族无关）。ssh 四包只出现在 `tsconfig.base.json` 的 paths 里（`:376`、`:426`、`:470`、`:487`）。启用路径是自定义 headless / custom profile 显式挂四包并填部署事实——host alias、远端 Node、helper、`helperHash`、workspace 一个都不能少（`packages/ssh/ssh/README.md:36`-`:45` 的字段表）。已知边界同样写在 README：无 Windows 端点、无自动 provisioning、无重连或重放；Web workspace UI 仍假设宿主文件系统访问，要用 headless 或 Consumer 尊重 provider 路径的组合（`packages/ssh/ssh/README.md:94`-`:95`）。

## 值得记录的失败语义

- **不重放原则**贯穿三面：取消不撤销已完成的远端效果（`packages/ssh/ssh/src/index.ts:106`-`:114` 的 JSDoc）；一次丢失连接后的启动或变更结果未知，客户端不把它伪装成成功或失败。
- **fs 侧**：传输丢失报 I/O 失败，但变更可能已经提交且不会自动重试（`packages/ssh/fs-ssh/README.md:32`）。
- **subprocess 侧**：`done` 报直接退出，`waitForExit()` 单独观察远端受管范围；连接丢失后远端终止在客户端侧不可确认，租约清理是远端动作不是客户端确认（`packages/ssh/subprocess-ssh/README.md:77`）。
- **sandbox 侧**：confine 失败先于任何 argv 交付拒绝；远端 `partial` 后端仍然只是 partial，文件效果模式不限制网络或进程可见性（`packages/ssh/sandbox-ssh/README.md:67`）。
- **信任边界**：摘要比对 pin 的是部署 artifact，不是敌意远端 OS；TLS-PSK 挡同用户连接与路径替换，不挡远端内存检查（`packages/ssh/ssh/README.md:96`、`packages/ssh/sandbox-ssh/README.md:68`）。

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

一次 bash 在本地如何走 confine → spawn 见 [`02-一次bash从tool到sandbox.md`](./02-一次bash从tool到sandbox.md)；远端受管范围与本地 native containment 的对应关系见 [`07-原生containment与native-system.md`](./07-原生containment与native-system.md)；e2b 时代「换 provider 不改 tool」的原始论证见 [`01-三角色与分包装.md`](./01-三角色与分包装.md)。
