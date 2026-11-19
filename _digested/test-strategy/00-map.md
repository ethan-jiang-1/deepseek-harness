# Test Strategy · 测试思想、资产分布、防漏与决策程序

本专题系统性地论述 DSH 测试体系：不仅是“如何测”，而是“**什么构成了有意义的绿灯**”。

## 决策速查表 (The DSH Way)

| 场景 | 决策程序 | 核心原理解释 |
| :--- | :--- | :--- |
| **测试面决策** | [05-dsh-testing-decision-procedure.md](./execution/05-dsh-testing-decision-procedure.md) | 选最便宜且看得见失败的那层，证据链互补。 |
| **插件测试** | [15-dsh-plugin-testing-contract.md](./plugin-testing/15-dsh-plugin-testing-contract.md) | 五级台阶、契约账本与测试组合。 |
| **防假绿/可靠性** | [08-dsh-testing-reliability-and-flake-analysis.md](./execution/08-dsh-testing-reliability-and-flake-analysis.md) | Flake 归因与 CI 门禁编排。 |

---

## 专题目录结构

### 1. 思想与原则 (Philosophy)
- [`01-dsh-testing-philosophy-and-doctrine.md`](./philosophy/01-dsh-testing-philosophy-and-doctrine.md)：测试教义与思想。
- [`02-dsh-testing-tiers-and-selection.md`](./philosophy/02-dsh-testing-tiers-and-selection.md)：分层理论与后缀选中机制。

### 2. 执行与防漏 (Execution)
- [`03-dsh-testing-asset-census.md`](./execution/03-dsh-testing-asset-census.md)：资产分布与宽底座原则。
- [`04-dsh-testing-anti-omission-mechanisms.md`](./execution/04-dsh-testing-anti-omission-mechanisms.md)：六面防漏纪律。
- [`05-dsh-testing-decision-procedure.md`](./execution/05-dsh-testing-decision-procedure.md)：变更证据决策流。
- [`06-dsh-testing-rules-ownership.md`](./execution/06-dsh-testing-rules-ownership.md)：规则所有权与证据归属。
- [`07-dsh-ci-gates-and-reliability.md`](./execution/07-dsh-ci-gates-and-reliability.md)：CI 编排与门禁。
- [`08-dsh-testing-reliability-and-flake-analysis.md`](./execution/08-dsh-testing-reliability-and-flake-analysis.md)：可靠性与 flake 治理。
- [`09-dsh-testing-infrastructure.md`](./execution/09-dsh-testing-infrastructure.md)：基建职责与限制。

### 3. 机制深潜 (Mechanisms)
- [`10-dsh-snapshot-machinery.md`](./mechanisms/10-dsh-snapshot-machinery.md)：会话快照机制。
- [`11-dsh-snapshot-external-face.md`](./mechanisms/11-dsh-snapshot-external-face.md)：快照的对外面（夹具、版本）。
- [`12-dsh-probe-and-evidence-collection.md`](./mechanisms/12-dsh-probe-and-evidence-collection.md)：探针与取证。

### 4. 插件落地 (Plugin Testing)
- [`13-dsh-plugin-testing-policy.md`](./plugin-testing/13-dsh-plugin-testing-policy.md)：插件测试政策。
- [`14-dsh-plugin-testing-playbook.md`](./plugin-testing/14-dsh-plugin-testing-playbook.md)：实战组合与类型解剖。
- [`15-dsh-plugin-testing-contract.md`](./plugin-testing/15-dsh-plugin-testing-contract.md)：插件仓契约。
