# 原生 containment：受管范围与 native/system

本页记录上游同步 0006（`0.1.2-rc.1` → `0.1.5-rc.1`）里 `ctx.subprocess` 公开语义的替换，以及 `native/` 从 `landlock-run` 到 `system` 的重组。核验入口：`packages/subprocess/`、`native/system/`、`packages/session/session-persistence-jsonl/`。上游决策全文见 [`2026-08-28-subprocess-native-containment.md`](../../.agents/notes/implemented/architecture/2026-08-28-subprocess-native-containment.md)。

## 公开语义：进程组 → 受管范围

旧基线的 `SubprocessHandle.pid` 是公开的（spawn 失败为 `-1`），`terminate()` 在每平台都是 SIGTERM → grace → SIGKILL 的进程组/树语义，`waitForExit()` 观察整棵树。新语义把「进程组」换成一个 **provider 私有选定的受管范围（managed range）**：

- `SubprocessHandle` 删掉 `pid`（`packages/subprocess/subprocess/src/types.ts:167`）；`spawn` 同步返回 live handle，target identity 保持 provider 私有（`packages/subprocess/subprocess/src/index.ts:95`）。异步建立的范围身份无法用 pid 表示，也不该让消费者从 pid 推断启动是否提交。
- `done` 报直接目标的结果或 provider 失败；`waitForExit()` 观察同一个受管范围，并在 provider 无法再观察该范围时 **throw**（`packages/subprocess/subprocess/src/types.ts:189`），而不是声称安静。
- 唯一保留 `pid` 的是终端句柄 `SubprocessTerminalHandle.pid`（`packages/subprocess/subprocess/src/types.ts:235`）：PTY 身份与前台 inspection 需要它，而受管范围恰好覆盖 `setsid` 与 reparent 出去的后代。

消费者同步改动：shell 的 `ShellProcess.done` 文案改为「永不 reject——provider rejection 结算为 `killed`，stderr 上是 stage-neutral error」（`packages/shell/shell/src/types.ts:168`-`:170`），bash-local 的注记是 `subprocess failed before reporting an outcome: …`（`packages/shell/bash-local/src/index.ts:294`）；lsp 删掉 `LspConnection.pid` getter，`waitForProcessTreeExit` 改名 `waitForManagedRangeExit`（`packages/lsp/lsp-stdio/src/connection.ts:217`）；e2b provider 的公开 `pid` 删除，改私有 remote process-group 跟踪（`packages/e2b/subprocess-e2b/src/process.ts:158`）。契约文档同步把小节改名为 “Handles: streams, readers, and managed-range termination”（`docs/subsystems/subprocess.md:133`）。

## Linux：user-systemd transient scope + 一次性 bootstrap

同一 runtime 里第一个合格的普通或 PTY 调用做深探：runner entry、libc `execve` / `fcntl` 绑定、可读的 user manager、literal-argv transient scope（`packages/subprocess/subprocess-local/src/linux-scope.ts:112`）。失败的深探会重试，第一次成功被缓存；之后每个合格调用仍在 spawn 前做一次轻量 manager 可达性检查。一旦选定，scope、协议、状态查询或 pre-exec 阶段的失败都通过这次 launch 报告，**不切换回退**。

父进程建一个 0700 目录和一份完整的 0600 `launch-request.json`（目标 cwd 与完整环境），`DSH_SUBPROCESS_RUNNER` 指向这份请求；`systemd-run --user --scope --quiet --collect --expand-environment=no` 把进程登记进 scope（`launchLinuxScope`，`packages/subprocess/subprocess-local/src/linux-scope.ts:460`），随后一次性 bootstrap 消费并校验请求、切到目标 cwd、恢复完整目标环境、按目标 PATH 规则解析裸可执行名、清掉 fd 0–2 的 `FD_CLOEXEC`、用原始 argv 调 libc `execve()`（`packages/subprocess/subprocess-local/src/linux-execve.ts:1` 的 koffi libc 绑定）。bootstrap 原地变成目标、保留继承的 stdio，不留下 supervisor。

范围归属由「请求被消费」或「manager 观察到 unit 已加载」建立；在两者之前 unit 不存在仍属未决。之后每次查询同时读 `LoadState` 与 `ActiveState`：已建立的 unit 变为 `not-found` / `inactive` 或已被回收，证明范围空；`active` / `activating` / `reloading` / `deactivating` 都不是终态。未知或畸形的组合、manager 结果不可读时 `waitForExit()` reject，而不是声称安静。未决区间每 50ms 查一次，建立后指数退避到既有的 5 秒 systemctl 上界；`terminate()` 会叫醒睡眠中的观察者立刻复查。

## Windows：私有 runner + kill-on-close Job

父进程用 bootstrap cwd/env 起私有 runner（`packages/subprocess/subprocess-local/src/spawn-runner.ts:445`），等到 runner 的 spawn 事件后才发恰好一条 start 请求；runner 把目标以 suspended 创建、分配给一个 unnamed kill-on-close Job 后再 resume（`packages/subprocess/subprocess-local/src/windows-job.ts:124`）。fd 3 走 Node IPC，fd 4–6 送目标的 stdin/stdout/stderr，用户字节不经过 IPC。runner 是目标进程句柄与 Job 的唯一 owner：只有在直接结果经 IPC 回调送出、且 Job 报告活跃进程数为零之后才正常退出；父进程只把这一次干净退出映射为成功的 `waitForExit()`。

选择器是每次 spawn 的 `DSH_SUBPROCESS_RUNNER`（`packages/subprocess/subprocess-local/src/runner-launch.ts:12`），协议与请求/结果记录在 `packages/subprocess/subprocess-local/src/runner-protocol.ts:17`。三种形态进入同一个 runner core：源码态走 TypeScript source launcher，built 态经包导出的 `./runner`（`packages/subprocess/subprocess-local/package.json:21`），Python SDK 单文件可执行经 `python/sdk-runtime/runtime-bootstrap.mjs`。公开 `dsh` CLI 没有隐藏的 runner 模式，打包也不额外附带第二个 Node 可执行文件。

## 回退与「不重放」

macOS 普通启动、Windows ConPTY 和其他未支持宿主保留原有 PGID / `taskkill /T` / identity-fenced PTY 观察，并给出一条 **provider 生命期警告**：逃出这些可观察关系的后代不保证被终止、也不保证推迟 `waitForExit()`。被选中的 native 路径一旦可能已经执行过目标，provider 就**不重放**命令，避免执行两次。在 JavaScript 可观察的宿主退出路径上，`LocalSubprocessRuntime` 不用 promise、不用 timer，同步强杀每个还活着的句柄；PTY 回退扫描保持尽力而为。

## native/system：两个并列能力

`native/landlock-run/` 目录与包改名：入口包是 `@deepseek-ai/node-addon-system`（`native/system/packages/entry/package.json:2`），平台包是 `@deepseek-ai/node-addon-system-<platform>`，workspace 根是私有的 `@deepseek-ai/node-addon-system-workspace`（`native/system/package.json:2`）。`native/README.md:5` 已改成「`system/` workspace owns the Landlock launcher and POSIX flock binding」。

入口包暴露两个并列的能力子路径、**没有根导出**：`./landlock-run`（`:12`）与 `./flock`（`:16`）；import 任一入口都不会加载 addon，缺 Landlock 二进制时 probe 为不可用，缺 flock 绑定时获取 reject，都不静默授予（`native/system/AGENTS.md:11`）。新增的 flock 是 `tryLockExclusive(fd): Promise<void>`（`native/system/packages/entry/src/flock.ts:46`）：Node-API v8，在异步 work 里跑一次 `flock(fd, LOCK_EX | LOCK_NB)`，只做非阻塞互斥，不提供阻塞等待或共享锁 API，调用方持有 fd 并靠 close 释放；逐条行为合同（独立 C oracle、跨进程、fd 继承、EBADF 等条件）写在 `native/system/docs/flock-contract.md:3`。

平台矩阵从 2 个平台包扩到 4 个：新增 `darwin-x64` / `darwin-arm64`，只含 `bin/system.node`（`native/system/packages/darwin-arm64/prebuilds.json:3`）；Linux 包继续含 `bin/landlock-run` + `bin/glibc/system.node` + `bin/musl/system.node`（`native/system/packages/linux-x64/prebuilds.json:5`、`:14`、`:21`；`native/system/docs/support-matrix.md:7`、`:8`）。二进制命名不变（`native/system/docs/naming.md:16`）。`native/system/test/link-platform.mjs:1` 只是把下载下来的平台产物 symlink 进 entry 的 `node_modules/@deepseek-ai/` 的 **ABI 测试辅助脚本**；native 侧没有新增名为 link 的产品能力。

## 产品消费者：session 写租约

flock 第一次进入 session 持久化路径：`packages/session/session-persistence-jsonl/src/lease.ts:34` 导入 `@deepseek-ai/node-addon-system/flock`，在 `:94` 用 `tryLockExclusive(handle.fd)` 实现 POSIX 端的 session 写租约（Windows 保留原有 named semaphore 实现，不建锁文件）。内核是仲裁者：持锁者进程死亡时内核释放锁，崩溃的持锁者不会阻塞后继者；争用映射为 `SessionAlreadyOwnedError`；因为 POSIX 锁认 inode 而不是路径，拿到锁后还要校验被锁 inode 仍是锁路径上的文件，否则重试。浏览器 worker 把 native flock 入口 stub 成立即成功——它单进程，进程内的写声明已经排除了所有写者。sandbox 侧的消费者只是 import 改名（`packages/sandbox/sandbox-local/src/index.ts:33`、`packages/sandbox/sandbox-local/src/profiles.ts:7`）。

## 源码入口

| 路径 | 一句话 |
|---|---|
| `packages/subprocess/subprocess/src/types.ts` | 公开句柄：`SubprocessHandle`（无 pid）、`SubprocessTerminalHandle`（保留 pid） |
| `packages/subprocess/subprocess-local/src/managed-owner.ts` | `BoundProcessOwner`：信号、等待空范围、宿主退出强杀、清理 |
| `packages/subprocess/subprocess-local/src/linux-scope.ts` | 深探、scope 启动与范围归属状态机 |
| `packages/subprocess/subprocess-local/src/spawn-runner.ts` | 一次性 Linux `execve` bootstrap 与 Windows Job-owning runner |
| `packages/subprocess/subprocess-local/src/windows-job.ts` | 父侧 runner 启动、IPC 与结果 |
| `packages/subprocess/subprocess-local/src/runner-protocol.ts` | 私有请求/结果记录与严格解码 |
| `native/system/packages/entry/src/flock.ts` | `tryLockExclusive` |
| `packages/session/session-persistence-jsonl/src/lease.ts` | 利用 flock 的 session 写租约 |

一次 bash 的完整链路与失败合同见 [`02-一次bash从tool到sandbox.md`](./02-一次bash从tool到sandbox.md)；外发代理对子进程环境的叠加见 [`06-外发代理策略.md`](./06-外发代理策略.md)；`packages/session/session-persistence-jsonl/` 里随这次同步进来的格式世代与迁移机制归 session-and-loop 专题，见 [`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)。
