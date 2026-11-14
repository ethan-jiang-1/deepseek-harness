# FAQ 29 · 文档里到处出现的 `keyless` 到底指什么？塞了假 API Key 或改写了磁盘文件还算 `keyless` 吗？

## 问题背景

翻看 DSH 的测试规范、Vitest 配置和快照套件源码，`keyless`（以及同义的 `no-key`）几乎无处不在——`keyless CI`、`keyless snapshot`、`Replay is the keyless default`，还有测试环境变量里的 `'keyless-web-no-call'`。

但把仓库里这几处真实用法摆在一起看，直觉很容易打架：

- 有的端到端测试明明给 `DEEPSEEK_API_KEY` 塞了非空字符串，描述却写着它是 `keyless`；
- `pnpm run test:snapshot:refresh` 会直接改写提交在仓库里的期望输出与会话快照文件，源码注释依然标它是 `keyless`；
- 还有人把 `keyless` 直接等同于录制回放（`dsh-llm-replay`），可没有模型参与的组装检查和手写假服务端也挂着同一个词。

`keyless` 到底是在说“当前机器没配环境变量”、某一个固定测试档位，还是测试证据本身的某种性质？它的证明边界又停在哪里？

## 具体要回答什么

1. 判断一次运行算不算 `keyless` 的唯一标准是什么？为什么塞了假 API Key、会写磁盘文件、或者用了手写 mock 的测试也都算 `keyless`？
2. DSH 为什么要把“跑一次真实智能体”拆成有密钥录制与无密钥回放两半？单靠手写单测或只跑真模型 API 各自卡在什么地方？
3. 无密钥会话回放（`dsh-llm-replay`）底层是怎么运转的？为什么说它是“用今天的代码真跑一遍”，而不是静态读一遍旧日志？
4. 同属 `keyless` 的五档测试证据含金量差多少？哪些问题是所有 `keyless` 测试都绝对证明不了、必须靠真模型（`with-key`）兜底的？
