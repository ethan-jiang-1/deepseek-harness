# 03 · 门禁防线、语义盲区与外部项目实操抄法

前两篇讲了运行时机制和仓库文档纪律。这一篇收尾解决三个最实际的问题：**哪些漂移是机器门禁真能当场拦死的？哪些漏洞连 DSH 自己的脚本也抓不住？如果我们自己写插件仓或做传统业务开发，到底该抄哪几样？**

---

## 一、机器能死卡的防线：生成目录、`doc-sync` 与只追加世代

纸面规定“请记得同步更新文档”一定会被忙忘。DSH 的工程原则（[`docs/defensive-patterns/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns/README.md)）是：**凡是能从代码重算或机械校验的事实，一律做成非零退出的门禁脚本，绝不靠人脑同步。**

### 1. 九对“生成器 + 新鲜度校验”孪生脚本：消灭手抄清单

仓库里最容易过期的“有哪些工具、哪些配置项、哪些服务”，全部禁止手写，统一由 [`package.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json) 里的 `gen-*` 脚本从源码提取生成，并在门禁里跑对应的 `verify-*`（`--check` 模式）比对字节一致性：

| 自动生成的权威目录 | 生成命令 | 门禁校验命令 | 额外卡住什么漂移？ |
|---|---|---|---|
| Cordis 服务与能力接缝目录 | `gen-cordis-catalog` | `verify-cordis-catalog` | 接口定义、Provider 与消费方计数失步 |
| 模型工具全集（[`tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)） | `gen-tool-catalog` | `verify-tool-catalog` | 新增或改名工具忘登记描述 |
| 插件 `Config` 配置项目录 | `gen-config-catalog` | `verify-config-catalog` | 甚至会报错拦截“运行时 Schema 放行了该字段、但 TS 类型漏声明”的不一致（[`gen-config-catalog.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.ts)） |
| 持久化存储与会话格式目录 | `gen-persistence-catalog` / `gen-session-format-catalog` | `verify-persistence-catalog` / `verify-session-format-catalog` | 落盘结构变更未同步进格式参考表 |
| 模块依赖图与工作区依赖表 | `gen-module-graph` / `gen-dependency-catalog` | `verify-module-graph` / `verify-dependency-catalog` | 包间依赖关系图与真实 `package.json` 脱节 |
| 客户端目录与官方 Bundle 目录 | `gen-client-catalog` / `gen-official-bundle-catalog` | `verify-client-catalog` / `verify-official-bundle-catalog` | 前端组件槽位与预设组装清单过期 |

### 2. `pnpm run doc-sync`：集中拦截断链、过期类型粘贴与容量超标

由 [`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts) 驱动的 `doc-sync` 跑着十几道文档叶子门禁，专抓四类高频腐烂：

- **抓死链与失效路径**：`verify-md-links` 检查所有本地 Markdown 链接与标题锚点真实存在；`verify-doc-refs` 扫描包内 TypeScript 注释和字符串里提到的 `docs/...` 或 `.agents/notes/...` 路径，文件一删改立刻报错；`verify-repository-references` 禁止维护态文档里写死易过期的裸 commit hash（要求用 tag 或 PR 号）。
- **抓文档里粘贴过期的代码块**：`verify-type-equiv` 直接比对文档里贴出来的 TypeScript 类型声明与源码真实定义——改了源码接口忘了改文档里的代码块，当场红灯。
- **抓常驻文档无限膨胀**：`verify-doc-budgets` 对照 [`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json) 卡死核心常驻文档的词数天花板（例如根 `AGENTS.md` ≤ 2080 词、`docs/architecture.md` ≤ 2410 词、`docs/AGENTS.md` ≤ 1430 词、`docs/testing.md` ≤ 1350 词）。写超了必须先把越界细节挪回子目录或精简废话。
- **抓 Note 状态串台与篡改封存**：[`verify-agent-note-format.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-agent-note-format.ts) 严禁 `implemented/` 目录下的已完成 Note 还留着 `## Proposal`、`## Migration plan`、`## Acceptance criteria` 等提案期标题（逼作者改写成现在时态）；[`archived-agent-notes.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/archived-agent-notes.ts) 逐个核对归档三件套的 `sha256` 封存哈希，改一个标点符号都会报 `sealed content hash changed`。

### 3. 行为快照与持久化契约：把隐性漂移变成显性 Diff

- **无密钥录制会话快照（[`snapshots/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)）**：任何非平凡的模型可见、协议可见或用户可见改动，必须在同一 PR 新增或刷新录制快照（详见 [FAQ 21](../21_recorded-session-snapshots/answer.md)）。提示词拼装顺序变了、工具描述多了一行，都会在快照 diff 里原形毕露；且已提交的快照世代只增不改名不删除。
- **持久化类型变更确认（[`docs/persistence-changes/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-changes/README.md)）**：公开代码 API 处于 `pre-stable`，改接口要求一次性改完所有调用方、不留兼容死代码；但**已发布的会话与存储数据格式**受严格保护——相邻迁移只能新增带版本号的后继格式，绝不覆盖或删除已提交世代，且每次持久化类型改动都必须提交包含新 Schema 快照在内的确认记录。

---

## 二、把底交透：哪五件事连 DSH 的门禁也防不住？

了解边界比背熟功能更重要。下面五条是在当前 DSH 仓库里实打实存在、机器完全兜不住的空白：

1. **没有任何跨文档的“语义矛盾检测器”**
   所有自动门禁干的都是“拿派生件对比唯一源头”或“查格式与哈希”，**没有任何门禁能读懂两段话的意思是不是打架**。就连检查最严的中英双语配对门禁，也在 [`docs/i18n/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/i18n/README.md) 里坦白交底：脚本只查哈希与 Markdown 结构，**判断不了中英文两边说的是不是同一件事**——语义准确性是 Reviewer 负责的那一半契约。
2. **“保持描述现行”与“随代码改文档”靠自觉和 Review**
   如果一笔 PR 改了运行时分支逻辑，但既没改公开 TS 类型签名、也没删文件，作者忘了更新包 `README` 或某篇现行 `implemented/` Note 里的文字叙述——`doc-sync` 会全绿通过。同样，[`verify-upgrade-guides.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-upgrade-guides.ts) 只校验**已经建好**的升级指南格式合不合格；如果你做了一个破坏性变更却压根没去建升级指南目录，脚本直接跳过放行。仓库在历史记录（[`2026-07-19-require-agent-notes-for-non-trivial-changes.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md)）里说得很透：**没有自动门禁试图给 diff 的轻重分级，语义边界统一由 Code Review 把关。**
3. **散文里手写的数字依然会跟配置脱节**
   仓库自己就留着一个活生生的例子：[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 正文里手写列出的词数目标（`architecture.md ≤ 2,400`、`testing.md 1,300`），与机器真正读取的 [`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json) 硬上限（`2410`、`1350`）并不相等（设计上允许在目标上方留一点缓冲天花板），但没有任何门禁检查这两处数字的对应关系——只要是手写进散文的数字，永远存在漏改风险。
4. **归档封存保证“内容不被偷改”，不保证“条目永不删除”**
   `archived/` 清单常被称为追加式封存，但它的精确语义是“只要这组归档文件还在树上，一个字节都不许动”；遇到整单回滚或未发版特性撤回（如前文提到的提交 [`81e05abaab`](https://github.com/deepseek-ai/deepseek-harness/commit/81e05abaab)、[`26706559b2`](https://github.com/deepseek-ai/deepseek-harness/commit/26706559b2)），归档三件套连同清单里的哈希记录是可以整组移除的。
5. **停留在聊天窗口里的决定不受任何制度保护**
   仓库治理只管得住进了 Issue、Commit、Note 和文档的东西。如果在对话里随口跟 Agent 说“我们改走方案 B”，既没调 `update_goal` 改目标，也没把结论写进仓库文件，下次开新会话或经历几轮压缩后，这个决定就跟没发生过一样。

---

## 三、拿来怎么用？三类读者的实操清单

千万别把 DSH 百人/多 Agent 主仓的全套重型家规原封不动搬进小项目。按你所处的角色，挑最划算的抄：

### 1. 日常指挥 DSH 跑跨天敏捷项目（使用者习惯）

- **把上下文当缓存，把仓库文件当持久内存**：隔两天还要算数的接口约定、排除掉的死胡同，让 Agent 顺手写进包 `README` 或轻量决策记录，别留在聊天历史里赌压缩摘要手下留情。
- **跨轮大活立 `goal`，改主意就改 `goal`**：调用 `update_goal` 更新目标文本，而不是在聊天框里口头补一句；重开昨天的会话时，趁着系统要求手动 `rearm` 才继续自动跑的停顿口，先核对一眼目标还对不对。
- **别拿 `todo` 当备忘录，杂活多用 `subagent` 切出去**：记住 `todo_write` 不会回灌模型视野；需要大海捞针翻日志或试错调研时，派 `subagent` 去干，只把干净结论带回主会话。

### 2. 开发独立 DSH 插件或定制工作台仓库（抄骨架，砍重税）

- **最值得抄的五样**（落地细节见 [FAQ 07](../07_borrowing-dsh-harness-idea/answer.md) 与 [FAQ 13](../13_expert-plugin-repo-organization/answer.md)）：① 根 `AGENTS.md` 保持百行级精悍路标，不塞长篇教程；② 同一事实只放一处，别处只放链接；③ “现在怎么用”写进 `README`，“为什么不选另一条路”按需写进轻量 `notes/`；④ 多工具/多配置清单写个几十行脚本自动生成并加 `--check`；⑤ 关键提示词或组装改动配几个录制快照（见 [FAQ 21](../21_recorded-session-snapshots/answer.md)）。
- **明确别抄的重资产**：双语三件套与 `.i18n.yaml` 哈希锁、主仓专属的复杂 Issue 关联机器人、以及动辄十几分钟的全平台 CI 矩阵。

### 3. 不依赖 DSH 的传统业务研发团队（六条通用工程原则）

把 DSH 源码里的机制抽掉框架外壳，搬进任何业务仓库都成立的其实是这六条：

1. **底账只追加，视图可重建**：业务事件流与审计日志不走原地 `UPDATE`；报表、搜索索引和缓存都做成可随时重放派生的只读视图。
2. **关键口径唯一源头化**：错误码、枚举值、核心业务指标定义各自只认一个权威文件（最好是代码或 Schema），Wiki 只贴链接不抄表格。
3. **架构决策（ADR）只取代不涂改**：技术方案掉头时新增一篇 ADR 挂上 `Supersedes` 双向链接，把旧方案的失败原因留作路标，严禁把旧文档偷偷改成反面；同时把归档老文档移出默认代码搜索范围。
4. **给常驻文档设字数红线**：新人入职手册和团队根 `AGENTS.md` 卡死篇幅上限，细节下沉到按需翻阅的专题页。
5. **把“防忘”做成秒级 CI 脚本**：死链检查、生成物 `--check` 新鲜度比对花不了几十行代码，却能挡住八成低级账实不符。
6. **白纸黑字划出 Reviewer 的语义责任田**：在团队规范里明写“CI 只保格式与链接，跨文档逻辑矛盾、改动是否漏写文档归 Code Review 负责”，打破“流水线绿了就能闭眼合入”的错觉。

---

## 附：常见腐化症状速查急救表

| 你在项目里看到的苗头 | 立刻该做的动作 | 千万别做的反模式 |
|---|---|---|
| 同一个默认参数或规则在两份文档里都能搜到 | 留唯一权威源头，另一处删掉正文改成链接 | 两边同时手改（下次必有一边忘改） |
| 文档里到处写着“目前已支持 / 下阶段将支持” | 删掉进度词，只写当前代码已交付的真实行为 | 靠人工定期去刷一张“功能完成度表” |
| 方案掉头了，旧设计文档还在现行目录晃眼 | 新写一篇决定记录互链，旧篇按价值归档冻结（移出默认搜索）或合并后删除 | 直接把旧文档原地改写成相反结论（淘汰理由全丢） |
| 团队每隔两个月就把同一个被否方案拿出来重吵一遍 | 补一篇记录，重点把“淘汰了什么备选及为什么不行”写死 | 只记最终选了 A，只字不提为什么放弃 B |
| 长任务跨了两天，模型开始顺着前天的旧假设乱改 | 检查并更新 `goal`，或在开新会话前先把已确认的新约束写进仓库文档 | 指望靠聊天口头纠正或靠 `todo` 列表帮模型记住 |
