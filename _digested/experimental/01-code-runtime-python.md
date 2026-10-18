> **页名注记**：本篇文件名沿用 0.1.7 线改名前的话题名 `code-runtime-python`，正文按现行包名 `ptc-runtime-python` 与 seam 键 `ctx.ptcRuntime` 重锚；页内全部路径与行号对 `dsh-v0.2.1-rc.2` 成立。

# ptc-runtime-python：CPython 子进程后端

本页是 experimental 专题的第一个面——「换 provider」形状的定位与启用总述见 [`00-map.md`](./00-map.md)；本页只讲机制，全部行锚对 `_coverage/` 所列核验 commit 成立。

## seam 合同

它实现 `packages/ptc-runtime/ptc-runtime/` 的 `PtcRuntime` Service Definition——抽象类 `PtcRuntime extends Service`（`packages/ptc-runtime/ptc-runtime/src/index.ts:104`），构造器把实例注册成服务名 `ptcRuntime`（同文件 `:146`），`ctx.ptcRuntime` 由 `declare module` 声明（`:91`）；抽象面只有两个信息性描述字段 `language` / `isolation`（`:114`/`:122`）和一个 `run(spec)`（`:162`），语言可移植性由跨后端共享的保留词与保留全局集合承担（`PORTABLE_RESERVED_WORDS` `:78`、`RESERVED_BINDING_GLOBALS` `:42`）。`PythonPtcRuntime extends PtcRuntime`（`packages/experimental/ptc-runtime-python/src/index.ts:744`）声明 `language = 'python'`、`isolation = 'process'`（`:756`-`:757`），并在构造器直接拒绝 Windows——POSIX rlimits、位置 fd 3、负 PID 进程组信号在 Windows 都不存在（`:784`）。

## 与默认 node provider 的关系

两者都是 `ctx.ptcRuntime` 的实现，谁生效不是「后装者赢」——vendored Cordis 对同一 isolate 的重复服务注册直接抛错 `service "ptcRuntime" has been registered at <fiber>`（`vendor/cordis/src/reflect.ts`），同时挂两个等于 load 失败，选择永远是组合层的决定。headless 不再自带这一行、经 base 继承 node 后端（`packages/bundle/base/cordis.patch.yml:397-398`；0.1.7-rc.1 起 headless patch 已无此行）；`apps/cli/package.json:127` 把 python 包声明为 devDependency，供快照与 profile 组合经真实 Loader 解析，shipped 组合无一挂载它。启用样板见 keyless 快照 `snapshots/session/ptc-python-turn/cordis.yml`：先把默认 PTC runtime 行 `disabled: true`（`:25`-`:26`），再 insert `@deepseek-ai/dsh-experimental-ptc-runtime-python`（`:35`-`:36`）——工具面不变，PTC 模式的消费者仍只绑 seam 键。

## 进程模型

每次 `run()` 起一个全新 CPython 3.10+ 子进程（无常驻内核、无跨 run 状态），`spawn(argv[0], …, { detached: true })` 用四根 pipe 让 fd 3 成为协议通道（`packages/experimental/ptc-runtime-python/src/index.ts:1165`-`:1169`），子进程环境只暴露 `TMPDIR`（`pythonEnvironment()` `:444`）。**受信 Python 源码不再落盘**：`src/launch.ts` 的 `PYTHON_BOOTSTRAP_LOADER`（`:5`-`:12`）是一段极小解释器入口，`bootstrapInput()` 读包内 `py/protocol.py` 与 `py/bootstrap.py` 编码后经子进程 stdin 送入（`:20`-`:23`），宿主用 `child.stdin.end(input)` 写入（`index.ts:2337`）——沙箱可见的临时目录里不再有可被同 UID 模型代码改写的启动脚本，写入失败直接以 `failed to load python bootstrap` 结算为 `worker-exit`（`:2331`-`:2336`）。`pythonBin` 在 load 时一次性解析并冻结：绝对路径就地验证、basename 搜 `PATH`（跳过空段与相对段，杜绝静默落到平台默认 PATH）、可执行普通文件检查加五秒强杀期限的 CPython ≥3.10 版本探针（`resolvePythonBin` `:407`、`validatePythonBin` `:448`、`MIN_CPYTHON` `:437`、`PYTHON_PROBE_TIMEOUT_MS` `:440`）。程序在共享文件系统沙箱下运行：插件 `inject = ['sandbox', 'sandboxPolicy']`（`:745`），每次 run 先解析 sandbox policy（`:982`）再算好受限 argv 交给 `ctx.sandbox`（`:1026`），拿不到围栏时以 `sandbox-unavailable` 结算。

## stdio 帧协议

帧在子进程 fd 3 上走 JSON-lines，一行一对象，stdout/stderr 留给程序自己的输出（`PROTOCOL_FD = 3`，`packages/experimental/ptc-runtime-python/src/protocol.ts:18`）。host→child：`boot` 首帧携带全部上限与命名空间声明（`:47`），`boot-ack` 之后的 `run` 只带程序体（`:63`-`:65`）；child→host：`boot-ack` / `call` / `log` / `done`（`:71`、`:76`、`:92`、`:132`），宿主对每个**顺序合法**的 `call` 回一个 `reply`（`:146`/`:154`）；重复或乱序的 id 静默丢弃（同文件 `:77` "the host answers each id at most once and ignores duplicates"）。`done.error.kind` 有 `exception` / `invalid-output` / `output-limit` / `timeout` 四种（`:116`）；wall/CPU 预算、abort、进程死亡由宿主侧观察，不走帧。子进程侧的结算帧由 `py/bootstrap.py` 的 `send_done` 写出（`:1328`、`:1440`）——裸 except 兜底改写一帧本地捕获的字面量 done，程序重绑模块全局也丢不掉结算帧。宿主把每个入站帧当敌意输入逐字段重建：`validateChildFrame` 重建不干净就返回 `undefined` 静默丢弃（`protocol.ts:661`），伪造的 `done` 可以同时携带 `value` 和 `error`，所以消费者必须先查 `error`、置位时忽略 `value`（同文件 `:128`）。

## 上限与失败行为

fd-3 原始帧 64 MiB parse cap（`FRAME_PARSE_CAP_BYTES`，`packages/experimental/ptc-runtime-python/src/index.ts:152`），host 堆受限时被 `hostFrameParseCeiling()` 进一步压低（`:305`-`:306`），超限 run 以 `worker-exit` 结算而不是先 `JSON.parse` 再 OOM；`MAX_PENDING_REPLIES = 1024` 同时封 reply 积压与在途 binding call（`:177`）。全部上限都是 load 时验证的 Config 字段，默认 `cpuSeconds` 60、`maxWallMs` 600000、`addressSpaceMb` 512（Darwin 不施加 RLIMIT_AS）、`maxLogBytes` 65536、`maxValueBytes` 32768、`graceMs` 3000、`pythonBin` `python3`（`:747`-`:753`）。CPU 超时由内核 SIGXCPU 上报并分类为 `timeout`（`:2312`-`:2313`），墙钟到点同为 `timeout`（`:1015`）；teardown 把全部在途 run 结算为 `abort` 并逐个 await 子进程退出（`:969`）；强杀走进程组 SIGTERM→grace→SIGKILL（`killGroup` `:2090`、`:2121`、`:2129`、`:2216`），组清空由 50ms 信号 0 探活轮询发现（`GROUP_REAP_POLL_MS` `:318`、`:2239`）——`setsid()` 逃出进程组的孤儿是文档化的唯一例外。

## 源码入口

| 文件 | 一句话 |
|---|---|
| `packages/experimental/ptc-runtime-python/src/index.ts` | 插件入口：spawn、帧泵、load 时预算门、containment、teardown |
| `packages/experimental/ptc-runtime-python/src/launch.ts` | 受信 Python 源码经 stdin 送入子进程的引导装载器 |
| `packages/experimental/ptc-runtime-python/src/protocol.ts` | 宿主侧帧编解码、敌意帧校验、lossless-JSON 计量器 |
| `packages/experimental/ptc-runtime-python/py/bootstrap.py` | 子进程侧：fd-3 通道、程序执行、binding 分发、结算 |
| `packages/experimental/ptc-runtime-python/py/protocol.py` | Python 侧帧镜像 TypedDict 与 `PROTOCOL_FD` |
| `packages/ptc-runtime/ptc-runtime/src/index.ts` | seam 的 Service Definition（`ctx.ptcRuntime`） |

seam 三角色与换 provider 的通则见 [`../capability-seams/00-map.md`](../capability-seams/00-map.md)。
