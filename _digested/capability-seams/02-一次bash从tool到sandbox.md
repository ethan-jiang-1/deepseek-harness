# 一次 bash：从 tool 调用到 sandbox argv

> 模型发出一个 tool call，最后变成一个操作系统进程——中间隔着解析、准入、审批、默认化、遏制五层政策。本篇顺着 shell 家族把这条链追完，并给出每一层的失败合同。读懂它，你就知道「退出码 1」「超时被杀」「审批被拒」分别在哪一层结算、模型各自看见什么。seam 的角色分工见 [`01`](./01-三角色与分包装.md)，受管范围的平台实现见 [`07`](./07-原生containment与native-system.md)。

源码核验入口：`packages/shell/tool-bash/`、`packages/shell/shell/`、`packages/shell/bash-local/`、`packages/shell/bash-sandbox/`、`packages/shell/tool-bash-persistent/`、`packages/terminal/terminal-bash/`、`packages/sandbox/sandbox/`、`packages/subprocess/`。

![一次 bash：tool → resolve → confine → spawn](./figures/bash-spawn-trace.svg)

## 调用链

1. 模型发出 `tool/call`，name 是 bash 工具，`arguments` 是原始 JSON 字符串（未解析）。loop 记入 log。
2. 工具注册表解析并冻结参数；`tools/pre-execute` 只作 allow / deny / ask 决策。deny 或缺 answerer 的 ask 不进 body。
3. `tools/execute` 包住下面的 tool body。timeout 政策读 **tool** 的 `timeoutMs`；checkpoint 也在这一层先 flush。
4. `dsh-tool-bash` `execute`：`resolveSandboxPolicy` → 校验 args → **升权审批在这里**（`approveEscalation` + `ctx.approval`，不是 Definition 方法）→ 收成 `ShellExecRequest` → `ctx.shell.resolve` 得到 Spec。`stdin` / `env` / `stdoutMaxBytes` 不进模型 schema。
5. 当存在 `ctx.jobs` 且开启 `promote` 时，前台也先通过 `resolve({ ...request, onExpiry: 'none' })` 注册可接管任务并等待完成；无 `ctx.jobs` 或入池被拒时，直接走 `ctx.shell.execute(spec)`。
6. **bash-local**：`spawnSpec` 把 Spec 映成 `bash -c …` 的 `SubprocessSpawnSpec`，`this.ctx.subprocess.spawn(...)`。环境先合并 `ENV_OVERRIDES`（`NO_COLOR=1`、`TERM=dumb`、`PAGER=cat`、`GIT_PAGER=cat`），调用方显式 env 仍能盖掉。
7. **bash-sandbox**（子类）：在 spawn 前 `ctx.sandbox.confine(argv, policy)`，用包装后的 argv 再交给 subprocess。Windows 走另一套 ACL runner，合同仍是 confine → spawn。
8. body 结算后进入 `tools/post-execute`，随后 `tool/result` 入 log。

## `execute` 与 `result()` 的失败合同

`ShellExecutor` 只有一个执行方法 `execute(spec)`：准备期（解析/准入）可 throw；启动后前台投影 `result()` **只**对基础设施失败 reject，非零退出、超时杀、abort 杀都 **resolve** 成 `ShellRunResult`。Consumer 把结果写成模型可见文本，不要把退出码 1 当成 harness 崩溃。

`onExpiry: 'none'` 保留 handle，后台进程没有 timeout。handle 的 `done` 结算且**永不 reject**：provider 在给出直接结果之前失败时结算为 `killed`，stderr 上是一条 stage-neutral 注记（`subprocess failed before reporting an outcome: …`，由 `packages/shell/bash-local/src/index.ts` 构造并经 stderr reader 送出；合同措辞见 `packages/shell/shell/src/types.ts` 的 `ShellProcess.done`）。仍在跑的后台进程在组合拆除时停掉并等待。有 subprocess seam 时，这个边界是 `ctx.subprocess` 的 dispose——executor 单独 HMR 不会把活进程带走。

把本页引子的承诺兑现成一张表——失败种类在哪一层结算、模型看到什么：

| 失败种类 | 在哪结算 | 模型看到什么 |
|---|---|---|
| 准备期失败（参数校验、`tools/pre-execute` deny、缺 answerer 的 ask、升权审批被拒） | `execute` throw，不进 body | `tool/result` 的 `isError` 文本（如 `Error: <reason>`） |
| 命令非零退出 | 前台投影 `result()` **resolve** 成 `ShellRunResult`（带 exitCode） | 描述性结果文本：**退出码 1 不是 harness 崩溃**（`render.ts:19-21`） |
| 超时被杀 | resolve（`ShellRunResult.timeoutMs` 记录当时限） | 描述性结果文本 |
| abort 取消 | `waitOnJob` 或前台检测到 `result.aborted` 后 `throw toolAborted()`（`index.ts:319-320,529`） | `tool/result` 的 `isError: true`（`Error: tool call aborted`） |
| provider 基础设施失败（结果未知） | `done` 结算 `killed` / 生成出错 | 注记或 `isError` 文本；harness 不崩溃 |

具体的文案由 Consumer（`dsh-tool-bash` 的 `renderResult` / `presentBashResult`）拥有；这张表的承重事实是**命令非零退出与超时不以异常形式到达模型**——它们都是正常工具结果文本，只有准备期拒绝、基础设施失败与 abort 取消走 `isError`。

## 政策挂在哪

| 层 | 管什么 |
|----|--------|
| `tools/pre-execute` | hooks 等：准不准进 body |
| Consumer `execute` 里的 `approveEscalation` | sandbox 升权；走 `ctx.approval`，不在 `ShellExecutor` 上。tool-fs 复用同一条升级链：`packages/fs/tool-fs/src/sandbox.ts` 导入同一组 `ESCALATION_TARGETS` / `approveEscalation`，schema 广告的升级目标与逐调用审批都由它决定；`packages/sandbox/sandbox/src/escalation.ts` 明说该编排骨架由每个 sandbox-enforcing tool family（tool-bash、tool-fs）共享 |
| `approval/request` | 审批 seam；缺 answerer fail-closed |
| `ctx.sandbox.confine` | argv 怎么包（bwrap / seatbelt / windows-acl） |
| `ctx.shell.resolve` | cwd、timeout 默认与上限（实现拥有的 caps） |
| `ctx.subprocess.spawn` | 真正创建进程（本地或远程 subprocess-ssh）；provider 在 spawn 前选定受管范围，普通句柄不再暴露 pid |
| tool `timeoutMs` + timeout-policy | 整次 tool 调用的协作截止 |

local executor 注释写：command defaulting、deadline 分类、模型友好终端环境、后台 stdout/stderr 合并，归它；执行政策不归它。

## 受管范围

`ctx.subprocess` 的公开句柄不再有 `pid`（`packages/subprocess/subprocess/src/types.ts` 的 `SubprocessHandle`）：`spawn` 同步返回，target identity 是 provider 私有事实；`terminate()` 与 `waitForExit()` 作用于同一个 provider 选定的**受管范围**，provider 无法再观察该范围时 `waitForExit()` throw。原因：一条子进程可以 `setsid`、reparent 或活过直接父进程，从而离开任何单一进程关系描述的范围。唯一保留 `pid` 的是终端句柄（`SubprocessTerminalHandle`），PTY 身份与前台 inspection 需要它。

Linux 上合格的普通与 PTY 启动进入 user-systemd transient scope 加一次性 bootstrap，Windows 上合格的普通启动进入私有 runner 拥有的 kill-on-close Job；macOS 普通启动、Windows ConPTY 等未支持宿主回退到 PGID / `taskkill /T` / identity-fenced PTY 观察，并给出一条 provider 生命期警告（逃出可观察关系的后代不保证被终止或推迟 `waitForExit()`）。选中 native 路径后的失败不重放目标，避免执行两次。两条 native 路径、回退边界与 `native/system` 的 landlock-run + flock 双能力见 [`07-原生containment与native-system.md`](./07-原生containment与native-system.md)。

## 持久 bash 怎样判定「命令结束了」

`dsh-tool-bash-persistent` 把命令包进 start/end marker，再 `eval`。它**不**把 `PS1` 改成自己的提示符：setup 只做 `stty -echo`，好让后端自己的 prompt 就绪检测继续工作。

真正的受控 prompt 在 `dsh-terminal-bash`：bash 方言里 `PS1` 仍是 `CONTROLLED_PROMPT`，`PROMPT_COMMAND` 先打 OSC 133 结束标记，再重新赋上同一份 `PS1`。命令若改写了 `PS1`，下一轮 prompt 渲染前会被改回来。`shellDialect: pwsh` 时 `PS1`/`PROMPT_COMMAND` 无效，改用经 session 写入的 `prompt` 函数（`PWSH_PROMPT_SETUP`）并以 `ENCODING_PREAMBLE` 钉住 UTF-8；win32 的 persistent shell 由 `dsh-tool-pwsh-persistent` 提供，同一条 seam。

命令若没打出 end marker、却已经再次读 stdin（自己的 prompt，或前台子进程的 read），`waitReason === 'stdin_read'` 时返回已捕获输出，而不是空转到 tool deadline。`exec`、中断、交互式子进程走这条路。

## 和 jobs 的分界

job id、所有权、轮询、通知属于 `dsh-jobs`，不进 ShellExecutor。executor 独立于 session。这就是「Definition 对着所有 Consumer」：tool-bash 和 jobs 都可以 `resolve`/`execute`（后台保留 handle），不必让 shell 认识 session。
