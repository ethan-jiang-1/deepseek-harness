# 10 · 会话快照：固定模型决策，重跑当前实现

会话快照把一条已知交互轨迹变成可重复的组装回归检查。回放器提供录制的模型流；当前应用仍经 `dsh` profile 启动，重新组装请求、执行工具并持久化日志。通过表示这条轨迹在所测组合下符合已有期望，不能据此判断当前模型会怎样响应新提示词。

![回放、录制与刷新及其验收边界](./figures/snapshot-modes.svg)

## 固定什么，重新执行什么

普通场景从选中的 Session JSONL 提取用户任务与 Assistant 流，包含已决定的工具名称和参数。回放提供这些模型输出，不把历史工具结果直接当作当前工具执行结果；当前 loop、工具注册、执行器、输入装配、日志与工作区操作仍然运行。异常模型流可由 manifest 声明的 override 补充或替换；外部服务及不确定输入由场景夹具控制。

| 对象 | 回放中的作用与比较 |
|---|---|
| 模型输出 | 按录制顺序提供 Assistant 流，固定已有选择；不请求模型作新选择 |
| 模型输入 | 当前组合重新生成 system prompt、工具 schema 与请求记录，再与对应期望比较 |
| 执行与持久化 | 当前实现重跑工具与生命周期；规范化后的 Session 日志、输出及对应协议或界面期望参与比较 |
| 工作区 | 从场景本地种子开始，运行结束后独立捕获实际树；声明写入的场景比较完整最终树，否则检查未变化 |

同一份 Session 同时保存模型回放输入和期望事件，但它不独占验收依据。模型说“已写入”、工具返回成功、日志里有调用，都不能替代外部文件比较。[测试决策流](../execution/05-dsh-testing-decision-procedure.md)说明如何为其他失败类选证据。

## 请求 sidecar 与独立工作区期望

JSONL 保留事件顺序与数据关系；规范化移除易变包络、映射临时路径和身份，并把 system prompt 与工具 schema 正文替换成可读 sidecar 的引用。每个 header class 有自己的 pin，必要时显式引用其他场景的 sidecar；父子角色可有各自的提示词和 schema 期望。回放检查实际请求头、提示词、工具 schema 及其变化，避免大段输入被规范化后失去比较。它检查到达模型的输入，不只检查 YAML 中的声明。

修改工作区的场景声明 `workspace.final: true`，并独立提交完整 `workspace.expected/`。剔除 harness 自有根项后，比较完整用户工作区的文件内容、符号链接和空目录，不能只挑预期新增文件；空树用忽略的 `.empty` 标记保留目录。**record 和 refresh 都不改写这份期望。** 需求改变时，由场景维护者独立审查并调整期望，防止把实现的新错误自动接受为答案。

## replay、refresh 与 record

| 模式 | 模型来源 | 对提交资产的处理 | 能建立的结论 |
|---|---|---|---|
| `replay` | 已有录制流，无模型 API 请求 | 只读比较，不写提交期望 | 固定决策下，当前实现仍符合已知轨迹和独立结果 |
| `refresh` | 仍使用已有录制流 | 按所有权政策更新当前 writer 日志、sidecar 和对应输出；工作区期望保持只读 | 为仍有效的决策轨迹生产新期望，需要审查差异 |
| `record` | 可重新录制的场景调用真实模型 | 按政策写当前格式录制与对应期望；工作区期望保持只读 | 捕获本次模型行为；是否符合需求仍由独立验收判断 |

回放与刷新不加载根 `.env`；录制模式才加载它并使用真实 provider。录制跳过刻意编写的场景和显式保留的历史 Session 输入。写模式串行运行，回放可在受控并发下运行。具体命令和环境选项由[快照配置](https://github.com/deepseek-ai/deepseek-harness/blob/master/vitest.snapshot.config.ts)与[包说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md)维护。

刷新是期望生产，不能代替正确性审查；主仓要求提交前审查所有生成差异。修改 prompt 或 skill 后，即使旧流仍能回放，也没有验证当前模型是否理解、选择或遵守了新方法；这类结论需要真实模型任务和独立结果判断。

## 世代、历史输入与当前 writer

父角色使用 `session[.vN].jsonl`，子角色使用 `session.<ordinal>[.vN].jsonl`；文件名与 header 版本必须一致，各模式选择数值最高的保留世代。解析器接受的日志表示另见[夹具输入](./11-dsh-snapshot-external-face.md#发布与夹具输入)。

普通 owner 的 record／refresh 可更新当前 writer 对应的版本命名输出，不能概括成“所有已提交世代永不可写”。前代文件保留，不因写新代而重命名或删除；显式声明 `sessionFormat.version` 的历史／退役工具输入保持冻结，共享 Session 引用也只读。历史输入与当前 writer 的事件布局可能不同，适配器以单独的 writer 期望验证当前输出；版本升级本身不要求刷新全部夹具。

## 诊断与源码核验入口

| 症状 | 首先检查 |
|---|---|
| 刷新后变绿，但工具消失或行为退化 | 实际请求与 sidecar 差异、场景守卫、独立需求；不要仅接受新日志 |
| 模型声称成功，文件却不对 | `workspace.final`、完整工作区期望及外部比较 |
| 历史输入能读，持久化输出却不同 | 选中的世代、显式历史声明与当前 writer 期望 |
| persona／skill 更新后回放通过 | 已装配输入是否改变；当前模型选择仍需另行验证 |

- [录制流提取](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/src/index.ts)：`deriveReplayScript` 只从模型事件构造回放流。
- [Headless 场景驱动](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/headless.snapshot.ts)：真实 profile、日志与请求比较、写模式和完整工作区断言；[写文件场景](https://github.com/deepseek-ai/deepseek-harness/tree/master/snapshots/session/fs-write)与[加载 skill 场景](https://github.com/deepseek-ai/deepseek-harness/tree/master/snapshots/session/skill-load)提供具体资产。
- [共享快照实现](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/test-support/session-snapshot/src)：manifest 所有权、规范化、sidecar、世代与工作区比较；[manifest 测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/tests/manifest.spec.ts)、[临时目录写回测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/tests/suite.spec.ts)和[工作区测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/tests/workspace.spec.ts)核对对应限制。
- [主仓快照规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)与[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：必需场景、差异审查与各接口职责。

外部仓能消费哪些发布包及如何接入，见[快照的对外面](./11-dsh-snapshot-external-face.md)；非录制会话的 expected output 归属见[测试基建](../execution/09-dsh-testing-infrastructure.md)。
