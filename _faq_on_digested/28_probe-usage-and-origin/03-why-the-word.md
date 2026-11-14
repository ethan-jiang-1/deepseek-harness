# 28/03 · 它是 DSH 独有的术语吗？——不是

> **查询手册，不是读物。** 想搞清这个词先读 [00 第 1 级](./00-ladder.md)；本篇是给「想确认这是不是官方术语」这一具体疑问。
>
> 一篇一句：**不是。** 探针不是 DSH 的术语，也没有统一的探针机制；但按 01 的四条特征去扫，主仓里确实有五层「自己长出来的探针」，而「探针」这个词在硬件、内核与网络里本来就是主词——被 agent 工程借用了。
>
> 为了让人能读懂，这篇分四步：**结论一** DSH 有没有探针框架、**结论二** 这个词从哪来、**结论三** agent 工程为什么需要它、**结论四** 用它时该声明什么。

## 结论一：DSH 没有统一的探针框架，但探针散布在五层

**「探针」不是 DSH 的类型、字段或官方命名**——`docs/` 没有「探针」这一节，没有哪个 seam 叫 probe，也没有一条 `pnpm run probe` 命令。这一点决定了它不能当术语用。

**先用一句话说清「五层」是什么**：探针这个词在 DSH 里不是一个东西，是**一个词套在五类东西上**。下面先给一张速查表（只需要看第三列——**你什么时候会遇到它**），然后用一张详表补真实文件与配置项。

| 层 | 一句话 | 你什么时候会遇到它 |
| --- | --- | --- |
| **1 运行时能力探针** | 产品跑起来以后，用廉价动作问「这个能力还在不在」 | 看代码时扫到 `registryProbe` / `--probe` / `process.kill(pid, 0)` |
| **2 PATH 探针** | 启动时扫一眼环境（PATH 里有没有 `zenity`），据此选实现 | 改 directory-picker 相关代码 |
| **3 复现探针** | 开发期写的一次性脚本：起真外部进程，把协议跑通一次 | 调 SSH helper / PTC worker 这类跨进程机制 |
| **4 取证探针** | 不判对错，只把事实打印出来，人读了才知道 | 查 Windows ABI 这类「打印 sizeof / offsetof」的验证脚本 |
| **5 诊断车道** | 有入口、不在 CI 主清单、产物给人看的跑法 | 跑 `--dump-config` 或 `.perf.ts` |

**这五层里，哪几层就是 01 说的「探针」？** 只有 **3 复现探针**与 **4 取证探针**完全符合 01 的四条特征（驱动真组合、产出结构化事实、不承诺稳定、不冒充门禁）；**1** 是另一个意思（运行时自检）；**2** 是启动时的环境采样；**5** 是「不在 CI 主清单的诊断入口」。

细节（每层的真实文件与配置项）：

| 层 | 它是什么 | 原生落点 |
| --- | --- | --- |
| **运行时能力探针** | 产品运行期间，用廉价动作问「某个东西还在不在 / 行不行」。这是工程上 probe 的另一个常见含义（health probe、capability probe），**不是本篇讲的探针** | `ctx.pluginRegistryProbe`（并发比较公共安装源响应，配置项 `registryProbeEnabled` / `registryProbeTimeoutMs` / `registryProbeCacheTtlMs`）、Sandbox 的 "functional probes arbitrate multi-runner chains"、`landlock --probe`、`process.kill(pid, 0)` 存活探针、CUA 的 `getCapabilities`（`AXIsProcessTrusted()` + `CGPreflightScreenCaptureAccess()`）、`resolvePythonBin` 的 `PYTHON_PROBE_TIMEOUT_MS` |
| **PATH 探针** | 启动时采样一次环境事实，让下游据此选实现 | `packages/host/directory-picker-auto/src/probe.ts`——`hasLinuxChooserBinary()` 扫 `PATH` 找 `zenity` / `kdialog`，找不到就退回 `browse` 交互而不是每次 pick 都失败 |
| **复现探针** | 开发期写的一次性脚本：起真外部进程，把线协议跑通一次，留下握手结果 | `scripts/ssh-helper/probe.ts`（`probeHelper()`：起真 helper、走私有 wire 做 `hello`/`close`、30 秒强杀）、`scripts/ssh-helper/worker-probe.ts`（在 Seatbelt 拒绝访问 checkout 的条件下跑 PTC worker）、`apps/web/tests/support/listen-probe.mjs`（monkey-patch `Server.prototype.listen` 记录监听） |
| **取证探针** | 不 assert，只 dump 事实，靠人读 | `packages/subprocess/win32-process/verify/abi-probe.cpp` 与 `packages/sandbox/sandbox-windows-acl/verify/abi-probe.cpp`——打印 Windows 结构体的 sizeof 与 offsetof，README 给出 `g++ … && ./abi-probe.exe` 的运行命令。这是全仓最纯的一条探针 |
| **诊断车道** | 有入口但不在 CI 主清单，产物给人看 | `package-local .perf.ts stays diagnostic`（[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)）、`apps/web/stress-tests/reasoning-chunks.stress.ts`、`dsh --profile … --dump-config`（只打印组装后的 profile 树然后退出，零模型请求） |

**所以准确的说法分两句**：

1. **DSH 没有统一的探针机制**——没有目录约定、没有公共 API、没有命令。这一层确实是使用 DSH 的人长出来的，落地形态是各插件仓的 `probes/` 目录（[08](./08-real-repos.md)）。
2. **但探针作为一种已固化的做法散布在五层**，其中「复现探针」和「取证探针」完全符合本篇 01 的四条特征，只是各写各的、没有统一名字。产品不需要为它们提供框架——它只需要**让会话日志可读**，而这一点 DSH 是给了的（见下一节）。

判据：**说「DSH 里没有探针」是错的；说「DSH 里没有叫 probe 的公共机制」才对。**

## 结论二：这个词在别处是主词，不是借词

「探针」在工程史上是**自己长出来的**，不是谁起的名字：

| 领域 | 探针指什么 | 核心相同点 |
|---|---|---|
| 硬件 / 芯片 | 接在引脚上的测试针，ICD、JTAG | 旁路观察，不改变被测行为 |
| 内核（kprobe / eBPF） | 挂在内核函数上的观测点 | 观测真实的运行路径 |
| 可观测性 | OpenTelemetry 的 probe、合成监控 | 从外部问「现在到底发生什么」 |
| Kubernetes | liveness / readiness probe | 廉价动作，判断能不能用 |
| 数据库 / 网络 | TCP probe、route probe | 主动发一次，看回应 |

中文都译作「探针」，正是因为这五件事共享同一个姿态：**不通过被测对象自己汇报，而由外部实际探一下**。这和测试的姿态相反——测试要求被测对象在受控条件下可复现，探针接受被测对象在真实条件下不完全可控。

英文里这个词也不统一。除 probe 外，同族工作法常叫 **canary、smoke、doctor、diagnostics、trace dump、sanity check**。它们的语感略有差异：canary 强调「先放一只下去看会不会死」，doctor 强调「体检并报告」，smoke 强调「插电看冒不冒烟」。**探针是这一族里偏「取事实」的那一个**。

## 结论三：为什么 agent 工程**必须**重新把它捡起来

如果是普通 Web 应用，『跑一次看看』这件事早就被 e2e 和可观测性吃掉了，不必另立名字。agent 系统让它重新变得必要，原因有三条，都能在主仓的规则里找到对印：

1. **行为不可穷举。** 模型是一个外部进程，同一个请求两次可以有不同回复。凡是依赖模型行为的东西，断言只能钉住**输入侧**，钉不住输出。
2. **模型可见面是装配的产物。** 系统提示词由多个插件注入拼成，工具集合由 registry 汇总。这些都没有一个「函数返回值」可以断言，只有跑起来才看得见。
3. **不变量写在日志里，不写在类型里。** DSH 的核心不变量是 **model-visible ⟺ logged**：任何到达模型请求的东西都必须能从会话日志重建。这条不变量成立，才使得「跑一次 → 翻日志」成为一种**合法**的观察手段，而不是偷看，并且它把「探针」从经验做法升级成了有据可依的方法。

第 3 条是最关键的。**探针之所以在 DSH 语境里成立，不是因为它聪明，而是因为 DSH 把请求侧写进了日志**：`request/header` 记录本次请求的 envelope（call config、adapter 默认值标记、组装后的工具 schema），而渲染后的 system prompt 是 surface 节点 0 上的 `system/message` 事件。两者都是日志状态，所以「模型实际收到了什么」是一个**可以离线复核的事实**，而不是要靠猜。这就是本篇 04 要展开的原理。

## 结论四：这个词可以放心用，但要声明

因为同时存在「运行时 probe」和「开发探针」两个含义，在 DSH 语境里说「探针」时必须补一句**它连的是哪个面**：

- 「Web 探针」= 驱动真浏览器，产出渲染与交互证据；
- 「session 探针」= 跑一次会话，产出请求侧与会话日志证据；
- 「端口探针 / liveness 探针」= 运行时自检（不是本文的探针）。

判据：**说探针时，必须能说出它跑什么、留下什么、退出码什么意思。** 说不出来的时候，它大概率只是一次手工调试被记错了名字。
