# FAQ 08 · "Everything is a plugin" 落到源码：哪些插件领域已经饱和，哪里仍是缺口？（纯技术视角）

## 问题

DSH 宣称 everything is a plugin。口号之外，以当前源码为准：哪一类插件领域已经"做得差不多了"，再从零造边际价值很低？哪一类地基（Service Definition / Consumer）已打但缺真实 Provider 或关键 Consumer？判断本身需要一条可复核的标准，而不是印象分。

## 回答目标

给出一条可操作的 seam 成熟度判据（三角色完整性 + Provider 数量 + Consumer 覆盖 + L0 可解决性），方法上以 `_digested/` 全部专题的机制结论为底、以 freshness-gated 的生成目录 [`docs/capability-seams.md`](../../docs/capability-seams.md) 的 59 个 `ctx` 服务为量化底座，把插件领域分成"饱和 / 缺口 / 空白"三层并诚实记下不可插件化的边界；业务价值判断与产品叙事不在本题范围，见 [FAQ 09](../09_plugin-business-ladder/answer.md)。
