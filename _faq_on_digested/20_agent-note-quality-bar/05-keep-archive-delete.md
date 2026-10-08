# 05 · 留下、归档还是删除

## 判据只有一条

> Judge every note semantically; word count and age are discovery aids, never archive criteria.

**「这篇 Note 还能不能指导未来的工作？」** 能，就留在活跃树；不能但仍有历史价值，就归档；连历史价值都不值，就删掉。字数和年龄只是帮你发现候选，从来不是判据本身。

这条判据由 [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) 拥有——它也是 `.agents/skills/` 里唯一一篇真正关于 Agent Note 的 skill。

## 四条分岔路

| 情况 | 动作 |
|---|---|
| 已交付，理由/备选/否定性保证/归属边界/持久化或协议语义/安全规则/重新引入条件**仍可能指导未来改动** | **留在活跃树**（长度无关） |
| 已交付、完整落地，但不太可能再指导未来工作，**历史决策价值仍在** | **归档**完整三件套 |
| 只描述小型 UI 调整或纯机械变更的 implemented | **直接删除**完整三件套，并修复或移除入站链接 |
| 提案过时 | **绝不归档**：要么转 `rejected/`，要么删掉 |

两个容易误判的地方：

- **「实现很小」不是删除理由。** 规则明确写了：局部 bug 修复、性能变更、新能力或实质行为决策，**不会仅因实现规模小就够格删除**。要判断的是**决定的**性质，不是实现的机械程度——一次机械的重命名或类型抽取，仍然可能记录下长期的命名、兼容或归属规则。
- **「没实现」不等于归档。** 归档是给已交付决定的；`proposed/` 永远不归档。

## 校准例子：字数是被用来说反话的

skill 给的两组例子，字数都是用来**反驳**「按篇幅判断」的：

**该删的（implemented）**

| 例子 | 字数 | 理由 |
|---|---|---|
| 侧栏折叠控件导轨 | 533 | 封闭的、次要的 UI 行为 |
| issue-policy 模块归属 | — | 已完成的功能搬迁与 import 重接，行为未变 |

**该留的（implemented）**

| 例子 | 字数 | 理由 |
|---|---|---|
| event-sourced sessions | 248 | 基础权威与持久化边界 |
| single Harness-home resolver | 596 | 跨产品归属规则 |
| project session directories | 628 | 持久化存储与身份政策 |
| parallel pre-push gates | 400 | 边缘案例，但仍指导门禁调度与资源调优 |
| dropped image content block | 334 | 保留到多模态能力落地——它写明了**协同重新引入的条件** |

233 词的侧栏控件该删，248 词的会话事件溯源该留。**差 15 个词，结论相反。**

**该留 vs 该删的 rejected**

| 例子 | 字数 | 结论 |
|---|---|---|
| 合并 compaction 包拆分 | 426 | 留——合并这两个包的诱惑仍然真实 |
| 通过 tool calls 传 streaming workflow 进度 | 972 | 删——它的 ACP/UI 前提已经过时 |
| 丢弃 ACP terminal metadata | 362 | 删——后来的 automation-only ACP 决定已经解决了这个问题 |

## 归档一次的完整动作

归档不是「挪个文件夹」，而是**五个精确动作**，多一步少一步都会失败：

1. 把完整的 `foo.md`、`foo.zh.md`、`foo.i18n.yaml` 三件套从 `implemented/<类型>/` 移到 `archived/<类型>/`——路径里**刻意没有 `implemented` 这一层**。
2. **不改正文。** 只在两个语言文件里，紧接 `Status: implemented` 下方插入一行 `Archived: YYYY-MM-DD`，两边用同一个日期。
3. 为这两处元数据改动**机械重录** sidecar 哈希。不翻译、不重排格式、不更新事实、不修链接。
4. 检查活跃 prose 里的**入站链接**：要么改指向当前权威，要么在确实有意引用历史快照时改指归档路径，要么删掉。**绝不去核实或修复归档件自己的出站链接。**
5. `pnpm run verify-archived-agent-notes --write`——追加式模式先证明既有 seal 全部匹配，再只添加新三件套的哈希；之后跑普通验证器。

之后，这个三件套**永久冻结**。

## 为什么会有「冻结」这么重的手段

因为归档件的价值恰恰在于它**没有被后续修改污染**。如果归档件还能被编辑，那它和一份过期的活文档就没有区别——读者无法判断看到的数字是当时的还是现在的。

手段是可执行的：`verify-archived-agent-notes` 把归档内容写进**只追加的哈希清单**，任何改动、缺失或不完整的三件套都会被拒绝。归档 AGENTS.md 里还专门记了一条例外——某篇 Note 有一次经授权的 Figma 链接移除，在脚本里有三条精确的旧值到新值例外；**除此之外不允许任何内容改动、反转或删除。**

对读者的含义很实际：

- 归档 Note **仍然可以链接**，但它是历史快照，不是当前权威；
- 文档门禁**跳过**归档源文件，包括它们的出站链接——所以「归档件里的链接是否还有效」不是任何人的责任；
- 想知道现在是什么样，去活跃树或当前文档。

## 删除也要收尾

删一个 implemented 或 rejected 三件套时，一并删除英文、中文、sidecar，并修复或删除入站链接。**删完不管链接，会留下悬空引用。**

## 与 supersession 的分工

这两件事容易混：

| | supersession（取代） | archive（归档） |
|---|---|---|
| 回答的问题 | **哪个活跃 Note 继续拥有这个决定？** | **一个已完成的决定还值不值得留在活跃语料里？** |
| 触发时机 | **每新增一篇 Note 都要做一次检查** | 定期审计或某篇明显不再指导未来时 |
| 结果 | 完全取代才合并 owner；部分取代保持双方活跃并互链 | 移到冻结树，或删掉 |

第一条是硬性的子树常设指令：

> Every new Agent Note triggers a supersession check. Search the active tree for older notes covering the same decision or mechanism […] and archive every qualifying implemented triplet in the same PR. Keep partial supersessions active and cross-linked.

**写新 Note 的时候就要顺手收敛旧的**，不要留到以后。完全取代的判据很严：新 owner 必须已经吸收了所有独有的 rationale、备选方案、后果、必需验证和已命名的覆盖缺口，并且全部入站链接都已修复——**部分取代不符合合并条件。**

## 证据入口

- [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md)：判定流程、五个归档动作、校准例子。
- [`archived/AGENTS.md`](../../.agents/notes/archived/AGENTS.md)：冻结规则与唯一授权的 seal 例外。
- [`.agents/notes/README.md` 的 "Archiving and deletion"](../../.agents/notes/README.md)：删除、归档、合并的完整条件。
- [`_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md`](../../_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md) 第 6 节：supersession 与 archive 的区别。
