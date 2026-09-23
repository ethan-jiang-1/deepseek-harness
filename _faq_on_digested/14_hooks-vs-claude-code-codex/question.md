# FAQ 14 · DSH 有没有类似 Claude Code / Codex 的 hooks 机制？三家的 hooks 怎么比？

## 问题

Claude Code 和 Codex 都有 hooks 机制：在 settings / config 里声明 shell 命令，挂到会话启动、prompt 提交、工具调用前后、运行停止这些生命周期点上，钩子能拦截、放行、注入上下文。DSH（DeepSeek Harness）有没有对应的东西？

如果有，它是哪一种形状——像 CC/Codex 那样的「用户在配置文件里写 shell 命令」的钩子，还是别的机制？三家的 hooks 放在一起比较：

1. **声明方式**：钩子写在哪、什么格式、谁能看到（user / project / local 作用域）。
2. **触发点**：各有哪些 hook 事件，挂在生命周期的哪些时刻。
3. **执行合同**：钩子怎么被调用（stdin payload、超时、并发、顺序），失败怎么处理。
4. **控制力**：钩子能对运行做什么——拦截 prompt / 工具、注入模型可见上下文、改写输入输出、强制继续；哪些事件有哪些权力。
5. **审计**：钩子的调用与结果是否留痕、在哪里。

以及 DSH 自己的定位：它做 hooks 是为了「兼容外部生态」还是「原生扩展」？两条路各自的能力边界在哪，什么场景该选哪条？

## 回答目标

读完本 FAQ，应当能够：

1. 一句话回答「DSH 有没有 hooks」：**两条路都有**——原生 Cordis 插件直接编程的拦截扩展点（typed Decision），加两个把 Claude Code / Codex 现有 `hooks.json` 原样跑起来的兼容桥。
2. 对照三家的官方合同，逐轴比较声明、事件、执行、控制力、审计。
3. 说出 DSH 桥相对参考实现的取舍：支持哪些事件、刻意不做什么（payload 字段、并行、配置分层、`continue:false`）、为什么。
4. 知道什么场景用桥（复用已有 hooks.json）、什么场景写原生插件（全 API、无序列化边界）。

## 范围与基线

DSH 侧机制结论以本仓库工作树为准（`ethan` 分支 `207b02e809946e7fe27b6aa9db93ebf4e7c74fbf`；其产品源码与 `_digested/` 基线 `dsh-v0.1.5-rc.2`=`fb2c4b9e` 一致，HEAD 之上的提交只动了研究目录），与 FAQ 01/08 同源；上游合入后按 `_digested/_change_log/` 复核。DSH 侧机制细节的逐条出处已收敛在 [`../_digested/capability-seams/08-外部生态桥：MCP与hooks.md`](../../_digested/capability-seams/08-外部生态桥：MCP与hooks.md)，本篇在其上做跨生态比较，不重复抄源码行号。

外部两家的结论来自官方文档（检索时点与全部来源 URL 记在 [research.md](./research.md)）；外部文档随时间漂移，DSH 桥 README 各自声明了撰写时的对照基线（Claude Code 30 个事件、Codex 10 个事件），research.md 记录的是复核时的读数，两者可能不同。
