# 02 · 词背后的判断

同一个概念可以有多种说法，选哪个词不是文风问题，而是**把一条设计判断固定下来**。本篇列七条：每条判断都直接决定一批写法，写错词就等于写错了判断。

## 1. seam 是三角色，不是一个接口

**判断**：可替换能力由 Service Definition、Service Provider、Consumer 三方共同构成，缺一方就只是三者之一的名称。

**原文**：「seam 是完整能力，绝不是其中一个角色；该术语仅保留此义」（[glossary.zh](../../docs/glossary.zh.md)）。

**写法**：写「`dsh-shell` 是这个 seam 的 Service Definition」，不写「`dsh-shell` 是一个 seam」。

**反过来会怎样**：把单个包叫作 seam，就会以为换掉它能改变整面能力；实际只有三角色齐备时，换 Provider 才不用改 Consumer。

## 2. product 是整棵树，不是某个对象

**判断**：`product` 指整台运行中的 dsh；插件、bundle、profile 单独都不构成 product。

**原文**：「Every part of the product is a plugin, including the model adapter, the tool registry, the session log, and the agent loop itself, so each is replaceable from configuration」（[architecture](../../docs/architecture.md)）。

**写法**：可以说 `product data`、`product-user-visible`；不能说「产品型插件」「产品 profile」。

**反过来会怎样**：一旦允许「产品 + 对象名」的复合词，交付单位就会被写成「一个插件」，而它既不能拥有运行时，也不能拥有 app surface 和数据生命周期。

## 3. bundle 与 profile 刻意二分

**判断**：bundle 管发货，profile 管选型，两者不是同一层的两种叫法。

**原文**：bundle 是「Cordis 配置项及其挂载代码的分发格式」；profile 是「存放在 Harness home 中的具名组装」（[architecture.zh](../../docs/architecture.zh.md)）。

**写法**：问「怎么发」答 bundle，问「这次起哪个组合」答 profile；「发布物」两个字只在指单个可下载产物时用。

**反过来会怎样**：把 profile 当发布物，就会以为换 profile 等于换一个产品；实际它只是同一安装下的另一次组合。

## 4. surface 不是隐喻

**判断**：模型看到的 `surface` 是由会话日志折叠出的**有序消息历史**，不是「一层皮」也不是「一个界面」。

**原文**：一切都是投影，日志才是真源（[architecture](../../docs/architecture.md) 的会话段落；词表见 [`GLOSSARY`](./GLOSSARY.md)）。

**写法**：说「模型可见的历史」「由日志投影而来」；不写「表面」「皮」「外壳」这类比喻。

**反过来会怎样**：把 surface 当界面，就会以为改它能不影响日志；实际任何进入模型请求的东西都必须能从日志重建。

## 5. one home per fact

**判断**：每份事实只有一个归属处，其余地方只能链接或存引用。

**原文**：「The tier taxonomy: one home per fact」「Each fact has one home: the tier whose job it is; elsewhere, link there.」（[docs/AGENTS](../../docs/AGENTS.md)）。

**写法**：写不出「这条事实的家在哪」，就说明还没想清楚它该放哪。

**反过来会怎样**：同一张表在两处并列维护，下一轮同步就有两个必须同时改、又可能改得不一致的地方。

## 6. gate 必须可机械失败

**判断**：能被机器拒绝的规则才叫 gate；靠人记住的规则只能叫约定。

**原文**：仓库的可机械检查项由 `scripts/run-gates.ts` 按 mode 聚合；`docs/AGENTS.md` 同时要求写具体检查名，而不是只说一句 "gate"。

**写法**：写「`verify-md-links` 会拒绝」「`doc-sync` 覆盖这一类」，不写「有门禁保证」。

**反过来会怎样**：说「有 gate」但点不出脚本，等于没有 gate——下一次换人、换上下文就会重犯。

## 7. model-visible ⟺ logged

**判断**：任何到达模型请求的东西都必须能从会话日志重建；新增一种模型可见输入，就要新增一个会话事件。

**原文**：「anything that reaches a model request must be reconstructable from the session log; a new model-visible input requires a session event」（[AGENTS](../../AGENTS.md)）。

**写法**：写「这条信息怎么进日志」，而不是「运行时拼进去就行」。

**反过来会怎样**：模型看到了日志里没有的东西，回放、审计和 `--dump` 三处会同时失真，而失真点无法定位。

## 这七条怎么用

七条不是七种风格，是七次取舍。判断一句话能不能写，先问它对应哪一条：

- 说某能力可换 → 三角色齐了吗？
- 说某东西是产品 → 是整棵树还是单件？
- 说某物可下载 → 是 bundle 还是 profile？
- 说模型看见了什么 → 能不能从日志重建？
- 说某事实放在哪 → 它的家是哪一个？
- 说某规则有保障 → 哪个脚本会让它红？
- 加一种新输入 → 对应哪个事件？

答不上来的那一句，多半就是本卷在发明概念。
