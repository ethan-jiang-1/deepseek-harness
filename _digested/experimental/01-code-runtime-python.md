# code-runtime-python：CPython 子进程后端

本页是 experimental 专题的第一个面——「换 provider」形状的定位与启用总述见 [`00-map.md`](./00-map.md)；本页只讲机制，全部行锚对 `_coverage/` 所列核验 commit 成立。

## seam 合同

它实现 `packages/code-runtime/code-runtime/` 的 `CodeRuntime` Service Definition——抽象类 `CodeRuntime extends Service`（`packages/code-runtime/code-runtime/src/index.ts:101`），构造器把实例注册成服务名 `codeRuntime`（同文件 `:122`），`ctx.codeRuntime` 由 `declare module` 声明（`:89`-`:92`）；抽象面只有两个信息性描述字段 `language` / `isolation`（`:111`/`:119`）和一个 `run(request)`（`:134`），语言可移植性由跨后端共享的保留词与保留全局集合承担（`PORTABLE_RESERVED_WORDS` `:76`、`RESERVED_BINDING_GLOBALS` `:40`）。`PythonCodeRuntime extends CodeRuntime`（`packages/experimental/code-runtime-python/src/index.ts:805`）声明 `language = 'python'`、`isolation = 'process'`（`:816`-`:817`），并在构造器直接拒绝 Windows——POSIX rlimits、位置 fd 3、负 PID 进程组信号在 Windows 都不存在（`:838`-`:840`）。

## 与默认 worker-thread provider 的关系

两者都是 `ctx.codeRuntime` 的实现，谁生效不是「后装者赢」——vendored Cordis 对同一 isolate 的重复服务注册直接抛错 `service "codeRuntime" has been registered at <fiber>`（`vendor/cordis/src/reflect.ts:290`），同时挂两个等于 load 失败，选择永远是组合层的决定。headless profile 挂的是 worker 后端（`packages/bundle/headless/cordis.patch.yml:20`-`:21`）；`apps/cli/package.json:116` 把 python 包声明为 devDependency，与 Agent Teams 的三个包并列（`:114`-`:117`），供快照与 profile 组合经真实 Loader 解析（`apps/cli/src` 无任何 import），shipped 组合无一挂载它，README 也声明「no shipped profile mounts this private package」。启用样板见 keyless 快照 `snapshots/session/ptc-python-turn/cordis.yml`：先把默认 `code-runtime` 行 `disabled: true`（`:26`），再 insert `@deepseek-ai/dsh-experimental-code-runtime-python`（`:28`-`:30`）——工具面不变，PTC 模式的 `dsh-tools` 仍只消费 `ctx.codeRuntime`。

## 进程模型

每次 `run()` 起一个全新 CPython 3.10+ 子进程（无常驻内核、无跨 run 状态），`spawn(pythonBin, ['-u', '-I', bootstrapPath])` 用四根 pipe 让 fd 3 成为协议通道、`detached: true` 自成进程组（`packages/experimental/code-runtime-python/src/index.ts:1184`-`:1190`），子进程环境只暴露 `TMPDIR`（`:503`-`:505`），宿主立即销毁 stdin 让逃逸后代读 EOF 而不是钉住宿主句柄（`:1208`）。包装脚本走 per-run staging：`materializePyScripts()` 每次 run 把 `py/bootstrap.py` + `py/protocol.py` 同步拷进 `dsh-code-runtime-python-` 前缀的 mkdtemp 目录、settle 时删除（`:182`-`:198`）——外部解释器只能打开真实文件系统路径，而同 UID 的模型代码可能改写自己启动用的脚本，一 run 一份把损害限制在本 run 内。`pythonBin` 在 load 时一次性解析并冻结：绝对路径就地验证、basename 搜 `PATH`（跳过空段与相对段，杜绝静默落到平台默认 PATH）、可执行普通文件检查加五秒强杀期限的 CPython ≥3.10 版本探针（`resolvePythonBin` `:467`、`validatePythonBin` `:508`、`MIN_CPYTHON` `:497`、`PYTHON_PROBE_TIMEOUT_MS` `:500`）。

## stdio 帧协议

帧在子进程 fd 3 上走 JSON-lines，一行一对象，stdout/stderr 留给程序自己的输出（`PROTOCOL_FD = 3`，`packages/experimental/code-runtime-python/src/protocol.ts:18`）。host→child：`boot` 首帧携带全部上限与命名空间声明（`:46`-`:61`），`boot-ack` 之后的 `run` 只带程序体（`:63`-`:67`）；child→host：`boot-ack` / `call` / `log` / `done`（`:69`-`:135`），宿主对每个 `call` 回恰好一个 `reply`（`:144`-`:161`）。`done.error.kind` 只有 `exception` / `invalid-output` / `output-limit` 三种（`:116`）；wall/CPU 预算、abort、进程死亡由宿主侧观察，不走帧。子进程侧的结算帧由 `py/bootstrap.py` 的 `send_done` 写出（`packages/experimental/code-runtime-python/py/bootstrap.py:1333`）——裸 except 兜底改写一帧本地捕获的字面量 done，程序重绑模块全局也丢不掉结算帧。宿主把每个入站帧当敌意输入逐字段重建：`validateChildFrame` 重建不干净就返回 `undefined` 静默丢弃（`packages/experimental/code-runtime-python/src/protocol.ts:661`），伪造的 `done` 可以同时携带 `value` 和 `error`，所以消费者必须先查 `error`、置位时忽略 `value`（同文件 `:127`-`:129`）。

## 上限与失败行为

fd-3 原始帧 64 MiB parse cap（`FRAME_PARSE_CAP_BYTES`，`packages/experimental/code-runtime-python/src/index.ts:212`），host 堆受限时被 `hostFrameParseCeiling()` 进一步压低（`:365`-`:367`），超限 run 以 `worker-exit` 结算而不是先 `JSON.parse` 再 OOM；`MAX_PENDING_REPLIES = 1024` 同时封 reply 积压与在途 binding call（`:237`）。全部上限都是 load 时验证的 Config 字段，默认 `cpuSeconds` 60、`maxWallMs` 600000、`addressSpaceMb` 512（Darwin 不施加 RLIMIT_AS）、`maxLogBytes` 65536、`maxValueBytes` 32768、`graceMs` 3000、`pythonBin` `python3`（`:806`-`:814`）。CPU 超时由内核 SIGXCPU 上报并分类为 `timeout`（`:2365`-`:2367`），墙钟到点同为 `timeout`（`:2380`-`:2382`）；teardown 把全部在途 run 结算为 `abort` 并逐个 await 子进程退出（`:1020`-`:1030`）；强杀走进程组 SIGTERM→grace→SIGKILL（`killGroup` `:2115`、`:2146`、`:2154`），组清空由 50ms 信号 0 探活轮询发现（`GROUP_REAP_POLL_MS` `:378`、`pollGroup` `:2245`）——`setsid()` 逃出进程组的孤儿是文档化的唯一例外。

## 源码入口

| 文件 | 一句话 |
|---|---|
| `packages/experimental/code-runtime-python/src/index.ts` | 插件入口：spawn、帧泵、load 时预算门、containment、teardown |
| `packages/experimental/code-runtime-python/src/protocol.ts` | 宿主侧帧编解码、敌意帧校验、lossless-JSON 计量器 |
| `packages/experimental/code-runtime-python/py/bootstrap.py` | 子进程侧：fd-3 通道、程序执行、binding 分发、结算 |
| `packages/experimental/code-runtime-python/py/protocol.py` | Python 侧帧镜像 TypedDict 与 `PROTOCOL_FD` |
| `packages/code-runtime/code-runtime/src/index.ts` | seam 的 Service Definition（`ctx.codeRuntime`） |

seam 三角色与换 provider 的通则见 [`../capability-seams/00-map.md`](../capability-seams/00-map.md)。
