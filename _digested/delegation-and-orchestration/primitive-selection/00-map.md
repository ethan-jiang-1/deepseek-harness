# Primitive Selection · 原语选择

## 一句话

本组回答：**官方对「什么时候用哪个原语」给了什么明文语义；原语之间怎么互相路由；哪里没说清。** 机制在各原语页（[`../delegation-primitives/`](../delegation-primitives/00-map.md)），组合与收窄在 [`../preset-composition-and-contract-placement/`](../preset-composition-and-contract-placement/00-map.md)。

## 选择不是挑工具

DSH 把路由知识放在**原语自身**：工具 description 与 prompt section 携带自己的使用边界，模型读了边界自己选。没有中心选择器，也没有一层“编排策略”组件。因此：

- **看不见的原语不会被选中**：没装工具行，边界句也不在模型视野里；组合是选择面的唯一开关（[`02`](./02-cross-primitive-routing-and-the-official-upgrade-order.md)）。
- **边界句是提示，不是闸**：`ONLY when the user explicitly asks` 之类的句子靠模型遵守，没有机械执行（[`03`](./03-unspecified-gaps-and-contradictions-in-usage-policy.md)）。
- **选错不会被上层纠正**：正确性只能靠证据分层去证明（[`../completion-and-observation/07`](../completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md)）。

## 页面

| 页 | 回答 |
|---|---|
| [`01`](./01-per-primitive-usage-sentences-from-tool-descriptions.md) | 每个原语的官方边界句逐字是什么、住在哪个模型可见面 |
| [`02`](./02-cross-primitive-routing-and-the-official-upgrade-order.md) | 原语之间怎么互路由、从轻到重的升级顺序有什么明文证据 |
| [`03`](./03-unspecified-gaps-and-contradictions-in-usage-policy.md) | 官方没说的部分：主语冲突、单向路由、后台决策散落、timed 选择无 guidance |

## 阶梯（从轻到重）

`todo_write` → `subagent` / `subagent_fork` → `workflow` → `ralph` → `goal`；`jobs` / `schedule` 是正交的两个平面（执行 / 时间），`agent-teams` 是部署级 opt-in 顶配。排序证据与互斥关系见 [`02`](./02-cross-primitive-routing-and-the-official-upgrade-order.md)。

## 入口问题

| 你在问 | 进入 |
|---|---|
| 这个任务该用哪个原语？ | [`02`](./02-cross-primitive-routing-and-the-official-upgrade-order.md) 的路由表 + 本组上节 |
| workflow 说“只在用户显式要求时用”，那模型自己能开吗？ | [`01`](./01-per-primitive-usage-sentences-from-tool-descriptions.md)、[`03`](./03-unspecified-gaps-and-contradictions-in-usage-policy.md) |
| fresh 还是 fork？ | [`01`](./01-per-primitive-usage-sentences-from-tool-descriptions.md) 的 subagent 节 |
| goal 还是 ralph？ | [`01`](./01-per-primitive-usage-sentences-from-tool-descriptions.md) 的 ralph 三分路由 + [`../delegation-primitives/03`](../delegation-primitives/03-fresh-agent-iteration-loop-and-round-handoff.md) |
| 为什么明明有这些原语，系统却像没有统一编排？ | [`../design-perspectives/03`](../design-perspectives/03-why-primitives-instead-of-a-central-scheduler.md) |

## 与其他组的关系

- 原语机制：[`../delegation-primitives/`](../delegation-primitives/00-map.md)。
- 策略载体与合同归属：[`../preset-composition-and-contract-placement/04`](../preset-composition-and-contract-placement/04-contract-placement-between-policy-and-engine.md)。
- 外部叙事的逐条对照：[`../design-perspectives/02`](../design-perspectives/02-external-narratives-versus-source-truth.md)。
