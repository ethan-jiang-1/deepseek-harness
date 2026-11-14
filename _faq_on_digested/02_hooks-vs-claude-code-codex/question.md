# FAQ 02 · DSH 有没有类似 Claude Code / Codex 的 hooks 机制？三家的 hooks 怎么比？

## 问题

Claude Code 和 Codex 都有 hooks 机制：在 settings / config 里声明 shell 命令，挂到会话启动、prompt 提交、工具调用前后、运行停止这些生命周期点上，钩子能拦截、放行、注入上下文。DSH（DeepSeek Harness）有没有对应的东西？

如果有，它是哪一种形状——像 CC/Codex 那样的「用户在配置文件里写 shell 命令」的钩子，还是别的机制？三家的 hooks 放在一起比较：

1. **声明方式**：钩子写在哪、什么格式、谁能看到（user / project / local 作用域）。
2. **触发点**：各有哪些 hook 事件，挂在生命周期的哪些时刻。
3. **执行合同**：钩子怎么被调用（stdin payload、超时、并发、顺序），失败怎么处理。
4. **控制力**：钩子能对运行做什么——拦截 prompt / 工具、注入模型可见上下文、改写输入输出、强制继续；哪些事件有哪些权力。
5. **审计**：钩子的调用与结果是否留痕、在哪里。

以及 DSH 自己的定位：它做 hooks 是为了「兼容外部生态」还是「原生扩展」？两条路各自的能力边界在哪，什么场景该选哪条？

## 要回答的问题

要回答：

1. DSH 有没有与 Claude Code / Codex 对应的 hooks 机制？如果有，有哪几层？
2. 三家的官方合同在声明、事件、执行、控制力、审计五轴上分别是什么？
3. DSH 的兼容桥支持哪些事件、刻意不做什么、为什么？
4. 什么场景用桥、什么场景写原生插件？

## 范围与基线

DSH 侧机制结论以本仓库工作树为准（`ethan` 分支 `207b02e809946e7fe27b6aa9db93ebf4e7c74fbf`），与 FAQ 01/08 同源；上游合入后按产品源码变更复核。DSH 侧机制细节的逐条出处已收敛在 [`packages/experimental/hook-protocol/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/hook-protocol/README.md)，本篇在其上做跨生态比较，不重复抄源码行号。

外部两家的结论来自官方文档（检索时点与全部来源 URL 记在 [research.md](./research.md)）；外部文档随时间漂移，DSH 桥 README 各自声明了撰写时的对照基线（Claude Code 30 个事件、Codex 10 个事件），research.md 记录的是复核时的读数，两者可能不同。
