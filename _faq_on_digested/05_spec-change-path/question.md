# Question 05 · `docs/` 是不是 Spec Driven Development 的源头？

## 背景

`04_root-entry-documentation` 回答了 DSH 如何**说清楚自己**：根入口、tier taxonomy、生成目录、预算门禁，让模型能按图索骥。

但“看懂系统”和“修改系统”是两件事。一次修改往往需要经过：

```text
Issue → proposed Note → Plan → implementation → docs/types/README
      → tests/snapshots → implemented Note → review
```

本问题要回答：

1. `docs/` 在这条链里是不是 SDD 的源头？
2. 一次修改的 spec 分别住在哪些文件里？
3. DSH 是如何把“未来式提案”转成“现在式合同”的？
4. 能不能给一个真实例子，从头走到尾？

## 证据边界

- 证据只使用 DSH 仓库本身：`.github/`、`.agents/notes/`、`docs/`、`AGENTS.md`、`packages/`、`scripts/`。
- 不引入外部资料作为证据。
- 当前基线：`0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`；历史 git commit 只用于展示提案 → 实现的生命周期。

## 文件

- [`answer.md`](./answer.md)：总答案
- [`01-docs-is-current-contract.md`](./01-docs-is-current-contract.md)：为什么 `docs/` 不是源头，而是当前合同层
- [`02-spec-layers.md`](./02-spec-layers.md)：一次修改的 spec 分层
- [`03-change-lifecycle.md`](./03-change-lifecycle.md)：从 Issue 到 review 的完整生命周期
- [`04-example-web-capability-seam.md`](./04-example-web-capability-seam.md)：真实例子：Web capability seam
- [`research.md`](./research.md)：证据原文与 git 历史
