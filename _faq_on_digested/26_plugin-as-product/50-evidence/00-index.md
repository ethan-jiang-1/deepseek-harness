# 50 · 证据入口：当前证据、v1/v2 历史与阅读顺序

`50-evidence/` 只放证据，不放结论。结论在 `10`–`40`；这里回答“这句话凭什么”。

## 当前证据 / 本轮审计（优先）

| 文件 | 用途 |
|---|---|
| [reference.md](./reference.md) | API 速查、`$DSH_HOME` 目录、证据薄弱处、外部来源 |
| [research-native.md](./research-native.md) | DSH 原生 33 个数据落点、44 事件清单、关键决定 |
| [research-external.md](./research-external.md) | 外部插件约 97 个候选、15 个深读的样本与来源 |
| [quality-review.md](./quality-review.md) | 本轮结构/一致性审计；计数结论截至 2026-10-27，不替代 API 证据 |

## 历史快照（不要当当前合同）

| 文件 | 说明 |
|---|---|
| [v1/research.md](./v1/research.md) | 第一轮外部核验底稿；编号/计数是当时快照 |
| [v1/review.md](./v1/review.md) | 第一轮 review 记录 |
| [v2/plan.md](./v2/plan.md) | 第二轮调查计划；记录执行偏差 |
| [v2/review.md](./v2/review.md) | 第二轮 review 记录；编号是 v2 当时编号 |

## 阅读顺序

1. 先看 [reference](./reference.md) 的“证据薄弱处”，知道哪些是 C/H，哪些是 S/R/U。
2. 原生结论查 [research-native](./research-native.md)；外部结论查 [research-external](./research-external.md)。
3. 想知道“这轮改了什么、还漏什么”，看 [quality-review](./quality-review.md)；它是审计快照，不替代 reference。
4. 只有追溯方法时才读 v1/v2；它们不覆盖当前结论。

## 标签

**C** 当前合同（docs/源码/测试） · **H** 历史事实（Note/旧文档） · **P** 提案（未实现） · **S** 第三方源码阅读 · **R** README/作者声明 · **U** 未确认。

只有 C 能写成“DSH 现在如何”；H 只能写“当时如何”；P 不能当已实现；S/R/U 不能冒充合同。外部插件没有安装实测，S 只代表源码阅读。
