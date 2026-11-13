# Change Log · 上游同步记录

这个目录记录每次从 `upstream`（`deepseek-ai/deepseek-harness`）同步到本地 `ethan` 的变更摘要。每条记录包含：

- 版本跨度（from → to）
- commit hash 范围
- 提交数量（能数清时）
- 核心变更分类
- 对 `_digested/` / `_faq_on_digested/` 的影响

`_change_log/` 下的记录，按编号递增：

- [`0000-baseline.md`](./0000-baseline.md)——研究起点，不是一次同步
- [`0001-0.1.0-rc.5-to-0.1.0-rc.7.md`](./0001-0.1.0-rc.5-to-0.1.0-rc.7.md)——第一次合入
- [`0002-0.1.0-rc.7-to-0.1.1-rc.1.md`](./0002-0.1.0-rc.7-to-0.1.1-rc.1.md)——第二次合入
- [`0003-0.1.1-rc.1-to-0.1.1-rc.2.md`](./0003-0.1.1-rc.1-to-0.1.1-rc.2.md)——第三次合入
- [`0004-0.1.1-rc.2-to-0.1.2-alpha.3.md`](./0004-0.1.1-rc.2-to-0.1.2-alpha.3.md)——第四次合入（最大，1155 commits）
- [`0004-plan-digest-revision.md`](./0004-plan-digest-revision.md)——第四次同步的消化材料修订计划
- [`0005-0.1.2-alpha.3-to-0.1.2-rc.1.md`](./0005-0.1.2-alpha.3-to-0.1.2-rc.1.md)——第五次合入（305 commits）
- [`0006-0.1.2-rc.1-to-0.1.5-rc.1.md`](./0006-0.1.2-rc.1-to-0.1.5-rc.1.md)——第六次合入（1512 commits；session 格式升到 v3、客户端资源面、subprocess containment、约 700 篇 Note 归档）
- [`0006-plan-digest-revision.md`](./0006-plan-digest-revision.md)——第六次同步的消化材料修订计划
- [`0007-0.1.5-rc.1-to-0.1.5-rc.2.md`](./0007-0.1.5-rc.1-to-0.1.5-rc.2.md)——第七次合入（4 commits；最后一个 RC，feedback 提交对称化）
- [`0008-plan-digest-revision.md`](./0008-plan-digest-revision.md)——第八次同步的消化计划（五阶段）
- [`0008-0.1.5-rc.2-to-0.1.7-rc.1.md`](./0008-0.1.5-rc.2-to-0.1.7-rc.1.md)——第八次合入（3304 commits，历次最大；session 格式升 v4、sandbox 组转正、整树照搬口径自本卷生效；页尾附 0008 独立复核勘误节）
- [`0008-independent-recheck.md`](./0008-independent-recheck.md)——0008 轮语料维护的独立反查（五路并行审计 + 修复执行记录；约 60 处过期断言、20 处缺落点、3 孤儿页、4 处口径矛盾）
- [`0009-0.1.7-rc.1-to-0.2.0-rc.2.md`](./0009-0.1.7-rc.1-to-0.2.0-rc.2.md)——第九次合入（794 commits；session 格式保持 v4、Schedule 转正为 bundle、账号/模型面大改、user-questions timed waits、llm 动态工具更新；语料反查随同步执行，另完成独立反查，见 [`0009-independent-recheck.md`](./0009-independent-recheck.md)）
- [`0009-span-fact-inventory.md`](./0009-span-fact-inventory.md)——0009 跨度事实清单（源码→语料反向审计底稿，供覆盖审计使用）
- [`0010-ledger-and-pin-recheck.md`](./0010-ledger-and-pin-recheck.md)——0010 轮**同基线换角反查**（变更三账本＋merge 主题正查＋无引文行号钉专项；约 60 处漂移重锚、图鉴补 acp/sdk 两节、subprocess 计数与 release 间隔口径回归）
- [`0011-0.2.0-rc.2-to-0.2.1-rc.2.md`](./0011-0.2.0-rc.2-to-0.2.1-rc.2.md)——第十次合入（1925 commits；**对齐口径在本卷定型**，见下节）
- [`0011-independent-recheck.md`](./0011-independent-recheck.md)——0011 轮**独立反查**（按维度而非目录切：D1 引用反查、D2 正向覆盖、D3 硬数字残留、D4 钉版锚点、D5 文风纪律；实测并定义了「按路径求交」的三类盲区——按数字陈述的文件、引用已整族删除机制的文件、引文不可溯源的文件）

- [`0012-0.2.1-rc.2-to-0.2.1-rc.3.md`](./0012-0.2.1-rc.2-to-0.2.1-rc.3.md)——第十二次合入（6 个提交、640 个文件；导航入口自定义与 New Session 空白复用、官方 `/models` listing 进入共享 transport、客户端分析事件、侧栏 pin/selection 分离；343 包；**口径定稿**：对齐已发布 tag，不跟 master 分支头、不 merge）
- [`0013-0.2.1-rc.3-to-0.2.1-rc.5.md`](./0013-0.2.1-rc.3-to-0.2.1-rc.5.md)——第十三次合入（跨 rc.4 与 rc.5，6 个内容提交、388 个文件；思考块渲染可定制、ACP stdout 诊断纪律、客户端 tooltip；343 包不变；**例外扩为 6 项、验收改为内容级**，见「同步操作手册」）
- [`0014-delegation-corpus-onboarding.md`](./0014-delegation-corpus-onboarding.md)——同基线内容修订（委派专题新增入门三页、28 页统一骨架、10 张新图；跨语料对齐 FAQ 27 的委派深度口径与基线，FAQ 22 引文锚点）
- [`0015-test-strategy-corpus-reorg.md`](./0015-test-strategy-corpus-reorg.md)——同基线内容修订（测试专题 13 页重排为 16 页：新增资产账本、防漏机制、决策程序三页，重写插件契约页；新增 2 张图；计数收拢到 03）

编号递增。`0000` 只记录开始消化时的 checkout；同步记录从 `0001` 起。记录里的路径与页面名是**当轮**的样子；页面后来迁移或改名时，现行入口以 [`catalog.json`](../catalog.json) 与 [`_coverage`](../_coverage/00-index.md) 为准，不改写历史记录。

**选基线的口径（0012 定稿）**：只同步**已发布版本的内容**，目标是当前版本的 **release tag**（取 [`../catalog.json`](../catalog.json) 的 `baseline.tag`）。alpha / beta 不追；0.2.1 线尚未 final，所以取最后一个 RC。0006 曾按 npm `latest` 选到 `0.1.5-rc.1`，0007 起改成「最后一个 RC」，沿用至今。

**「跟上 master」的正确含义**：取 master 上**已发布版本的内容**，不是 master 分支头。master 可能领先 release tag 很多未发版提交（0012 时是 **1533 个**）；跟分支头会把未发布机制写进语料，也会让「版本」失去意义。tag 就是目标的唯一名字。

**执行口径（0011 定稿、0012 复核、0013 修订）**：**`ethan` = 目标 release tag 的原样 + 6 项本地独有内容**。

| # | 本地独有内容 | 说明 |
|---|---|---|
| 1–4 | `_digested/`、`_faq_on_digested/`、`_dsh_plugin_agent_ready_development/`、`_misc/` | 研究语料。下划线前缀是这几项的辨识特征。`_misc/` 另有不入库的 `_model_vendors/`（多 vendor 研究笔记，高频改动且可能含账号/密钥），忽略规则写在 `_misc/.gitignore`，因此产品树无需改动 |
| 5 | `.pi/` | 本地工程配置。**没有**下划线，别把它当中性目录冲掉 |
| 6 | `scripts/verify-repository-references.{ts,spec.ts}` | 产品树单文件例外，让引用门禁跳过语料里的历史 commit 与锁文件，见 0013 |

除这 6 项之外**每一个字节都与该 tag 逐路径相同**，不留任何其他本地源码补丁、配置行或口径行。

忽略规则尽量下沉到语料目录自己的 `.gitignore`（如 `_misc/.gitignore` 管住 `_scratch/` 与 `_model_vendors/`），这样根 `.gitignore` 保持与上游一致，也就不必为它增设例外。

### 同步操作手册（照做即可，无需重新推导口径）

```sh
# 1. 取上游 tag，确认目标
 git fetch upstream --tags
git tag -l 'dsh-v*' --sort=creatordate \
  --format='%(creatordate:iso-strict)  %(refname:short)  %(objectname:short)' | tail -5
# 选基：alpha/beta 不追；未 final 的线取最后一个 RC

# 2. 备份例外内容（read-tree 会冲掉工作区）
BK=/tmp/dsh-sync-backup && rm -rf "$BK" && mkdir -p "$BK"
git archive HEAD _digested _faq_on_digested \
  _dsh_plugin_agent_ready_development _misc .pi \
  scripts/verify-repository-references.ts \
  scripts/verify-repository-references.spec.ts | tar -x -C "$BK"

# 3. 对齐产品树（换成本轮 tag）
git read-tree -u --reset dsh-vX.Y.Z-rcN

# 4. 回填例外内容（6 项全部）
git checkout HEAD -- _digested _faq_on_digested \
  _dsh_plugin_agent_ready_development _misc .pi \
  scripts/verify-repository-references.ts \
  scripts/verify-repository-references.spec.ts
```

**验收用内容比对，不要用路径列表**。`read-tree --reset` 只改写 index，工作区按需更新，所以「路径集合相同」不等于「内容相同」；而 `git diff --name-only <tag>` 看的是工作区与 tag 的路径+内容，可用但不够严格。权威判据是**把 index 写成树，与 tag 树逐条比对**：

```sh
RTREE=$(git rev-parse dsh-vX.Y.Z-rcN^{tree})
ITREE=$(git write-tree)
git -c core.quotePath=false diff-tree -r --name-status "$RTREE" "$ITREE" \
  | grep -vE '(_digested|_faq_on_digested|_dsh_plugin_agent_ready_development|_misc|\.pi)/' \
  | grep -vE 'scripts/verify-repository-references(\.spec)?\.ts$'
# 必须为空
```

末尾那两条 `grep -v` 就是「6 项例外」的机器可执行形式；改例外集合时同步改这两行。再用一次集合比对兜底（两边都要 `core.quotePath=false`，否则中文路径会一边转义一边不转义，出现假的 65 条差异）：

```sh
EXRE='^(_digested|_faq_on_digested|_dsh_plugin_agent_ready_development|_misc|\.pi)/'
git -c core.quotePath=false ls-tree -r --name-only dsh-vX.Y.Z-rcN | grep -vE "$EXRE" | sort > /tmp/a.txt
git -c core.quotePath=false ls-files | grep -vE "$EXRE" | sort > /tmp/b.txt
comm -13 /tmp/a.txt /tmp/b.txt   # 多出，必须为空
comm -23 /tmp/a.txt /tmp/b.txt   # 缺失，必须为空
```

**不要 merge**：`git merge-base` 因 0008–0009 的 `read-tree` 停在 `46a7f68b09`（0.1.7-rc.1），直接 merge 会得到 2047 个冲突文件；逐冲突解决等于把本地材料的取舍混进产品树，而且下一次同步还要重来一遍。

### 已犯过的错（别再犯）

- **把「跟上 master」读成 master 分支头**（0012）。当时对齐到 `22ddee37`，多出 1533 个未发版提交，已回退。target 的唯一名字是 **tag**。0013 时 master 领先 rc.5 达 2508 个未发版提交，同样不跟。
- **用临时 index + `git add -A` 做验收**（0013）。空 index 会让所有文件都算 untracked，`.gitignore` 于是生效，`*.local`、`snapshots/.../workspace.expected/.agents/worktrees/` 下的夹具被静默漏掉，产出假的「4 个文件缺失」。验收只走上面两条：tag 树 vs index 树、集合 comm。
- **把版本号写进链接路径，然后每轮批量替换**（0013）。语料的外部引用曾经固定到 `blob/dsh-v0.2.1-rc.N/...`，结果是「换一个版本核验」变成改 322 行文本。实测 128 个目标路径中 125 个在 rc.2 与 rc.5 之间逐字节相同——版本号在链接里不承载信息。**已改为链接一律指向 `blob/master/`**，核验版本只记在 `catalog.json` 一处；`_digested/verify.mjs` 与 `_dsh_plugin_agent_ready_development/verify.mjs` 的白名单锁死只允许 `master`（`main`、tag、SHA 一律拒）。**同步时不要再改这批链接**；真需要版本的地方只写路径与文字，不写裸 URL。
- **只看路径不看内容**。`read-tree` 之后的 index 与工作区可能短暂不一致，必须 `git write-tree` 后比 blob，才叫零差异。
- **中文路径的 `quotePath` 陷阱**。`git ls-tree` 不转义、`git ls-files` 默认转义，混用时会出现约 65 条假差异（正好是语料里带中文的文件数）。两边都加 `-c core.quotePath=false`。

### 同步后必跑的检查

```sh
node _digested/verify.mjs              # 语料自检
pnpm run verify-repository-references  # 验证第 6 项例外仍然生效
```

**这条口径是本目录的唯一权威**：同步前先读本节，照「同步操作手册」做一遍即可，不需要再向任何人确认「是全树跟上还是只保留下划线目录」——**答案是：全树跟上目标 tag，只保留上表 6 项**。

### 语料自身怎么改：读宪章

同步口径管的是「产品树怎么追上上游」，不管「语料内容怎么写」。语料内部的引用形态、版本号能出现在哪、升级时哪些动作该做哪些不该做，见 [`../CORPUS-CHARTER.md`](../CORPUS-CHARTER.md)。四份语料各带一份**逐字一致**的副本（语料名已在正文中中性化；`_misc` 的冻结存档例外写在公共正文里），因为每份都得能单独取走使用；改一处时四份一起改，由校验器比对哈希。

最关键的一条提前说：**改 URL 不等于复核**。把一批链接从旧 tag 扫成新 tag，一个结论都没核对，却消耗了整轮注意力，还制造出「修订了很多」的错觉。

每次 sync 同时执行以下维护动作：

1. 在本目录新增一条记录，写清产品源码 commit 范围和触及的专题。
2. 更新 [`../catalog.json`](../catalog.json) 的 `baseline`（唯一一处）；[`../00-index.md`](../00-index.md) 与 [`../_coverage/00-index.md`](../_coverage/00-index.md) 的渲染行由 `render-indexes.mjs` 更新。
3. 在 `catalog.json` 把受影响页面的 `status` 标为 `needs-recheck`；完成源码、图与链接审计后写入 `verifiedAt` 与最终状态。
4. `verify.mjs` 不再维护单独的基线常量，读取 `catalog.json` 的 `baseline`；`claims.json` 不再有 `baseline` 字段。若计数指标（包数、notes 数、服务/工具数）随版本变化，一并改 `claims.json` 的 expected 值。
5. 运行 `node _digested/render-indexes.mjs`、`node _digested/verify.mjs` 与 `pnpm run verify-repository-references`。
