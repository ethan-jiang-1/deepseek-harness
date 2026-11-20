# 09-dsh-testing-infrastructure.md: 测试基建

## 概念 (Concept)
DSH 的测试基建不是一个杂物间，而是一个“待晋升”的过渡层。其目的是提供标准化的 Harness，减少冗余代码。如果某个包获得了独立的产品消费方，它就会从 `test-support/` 毕业移出。

## 背后思考 (Insight)
*   **非产品化原则**：测试基建包不得演变成“第二产品”，其维护原则是极简，绝不引入冗余逻辑。
*   **文档化限制**：每个 Harness 包的 `README` 必须显式列出“已知限制 (Known Limitations)”，即它无法证明的测试面。

## 工程实践推荐 (Practice)
*   **Harness 复用**：优先使用 `packages/test-support/` 中的 harness（如 `llm-replay`），而不是手写 mock。
*   **版本锚定**：如 Python SDK 测试，直接从 TS 源读取会话版本号，确保跨语言契约同步。

## 参考 (Reference)
*   [CI 门禁](./07-dsh-ci-gates-and-reliability.md)
*   [插件测试 playbook](../plugin-testing/14-dsh-plugin-testing-playbook.md)

# 测试基建：test-support 七件套、横切 helper 与 Python 面

> 本篇盘点 DSH 的测试基础设施：`packages/test-support/` 七件套、两个横切 helper、benchmarks 支撑、vitest setup 三件套、Python 侧。各工具服务哪些层见 [02](../philosophy/02-dsh-testing-tiers-and-selection.md)；快照 owning 工具的规则细节见 [10](../mechanisms/10-dsh-snapshot-machinery.md)。

## 现象是什么：一个"待晋升"的基建组

`packages/test-support/` 组 README 的自我定位："每个包都是支持层基础设施；**当某个包获得产品约定与产品消费方时，它就会移出本组**"——测试基建被当作过渡层治理，不沉淀成第二产品。七件套 + 两个横切 helper 构成全部测试 harness 基建。

(以下内容保持与原件一致...)
