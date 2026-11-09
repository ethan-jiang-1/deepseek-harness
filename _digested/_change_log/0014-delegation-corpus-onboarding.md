# 0014 · 委派专题的入门层与全组骨架修订

**范围**：`_digested/delegation-and-orchestration/`（33 页 → 36 页，20 图 → 30 图）；跨语料触及 `_faq_on_digested/27_runtime-orchestration-choice/`、`_faq_on_digested/22_spec-drift-and-context-rot/02-runtime-anti-rot.md`、`_dsh_plugin_agent_ready_development/_coverage/00-corpus-maintenance.md`。
**基线**：不变，仍是 `dsh-v0.2.1-rc.5`（`b830ec95`）；产品树与该 tag 逐字节相同，因此新增页面的 `verifiedAt` 指向该 commit。
**日期**：2026-11-09。

## 为什么改

上一轮把 `orchestration-ladder/` 一拆五，结构对了，但读者画像仍停在复核者：入口是阶梯表与包路径，页面以「为什么是这个形状」+ 归档 note 起手，长句里塞多个行内锚点，13 页没有图。对不熟悉 DSH 的读者，第一屏就是术语墙。

本轮按「先地基、再机制、后判断」重排阅读顺序，不改任何机制结论。

## 改了什么

1. **新增入门三页**（组根目录）：
   - `01-one-task-five-ways.md`：同一个任务（查清四十处调用点）交给五种原语，每节七格（怎么说 / 谁持循环 / 活在哪 / 何时看到 / 怎么算完成 / 典型失败 / 深读）。
   - `02-terms-and-planes.md`：14 个承重词 + 三个平面（执行 / 持久 / 观测），DSH 已有的词指向 `canon/GLOSSARY.md`，只声明本组自己的分析词。
   - `03-newcomer-questions.md`：十二个新手问题，每问一段 + 深读链接。
2. **重写组 `00-map.md`**：加「第一次来先读三页」「四条读法」「六条不变量」三节；原有阶梯、症状表、目录简称、可审查性清单保留。
3. **27 个机制页统一骨架**（五个 `00-map` 不带这三节）：在「本页回答」之后插入「读完你能回答 / 心智模型」，在「源码入口」之前插入「常见误解（你以为 / 实际上）」。组内已有 `## 一句话` 的页面用「核心判断」避免重复标题。
4. **新增 10 张图**（全部 1080 宽，沿用既有配色；文字与页面口径逐条对齐，用 `rsvg-convert` 目检排版）：
   `five-ways`、`when-you-see-it`、`three-planes`、`reading-routes`、`goal-round-timeline`、`mount-shelves`、`terminal-states`、`nine-traps`、`narrowing-lever`、`jobs-lifecycle`。
5. **跨语料对齐**：
   - `FAQ 27`：基线由 rc.3 更新到 rc.5 并逐条复核（容量、Team 上限与 disable 清单、goal 门槛、ralph 轮预算均未变）；补正委派深度口径——`workflow` 的 `agent()` 不传 `maxDepth`，但分支 child 仍按 parent+1 计深度（原表述只说了前半句，四处 + 出处表）。`reference.md` 增加「复核记录」节。
   - `FAQ 22`：把 `wrapup.ts` 的引文改成逐字原文（原引文在分号处截断），引用与锚点分行登记。
   - `_dsh_plugin_agent_ready_development`：审计委派/编排断言，结论是不需要改（详见该语料维护记录的 2026-11-09 条）。

## 没改什么

- 机制结论与数字：深度仍是绝对量、终态仍是五个、shipped 里仍只有 in-process spawn 能钉独立 preset、`toolFilter`/`persona` 仍是退役配置。
- 六段「待证」保持原样（`composition/01`–`04`、`observation/02`、`observation/05`），没有把待证升格成结论。
- 页面 `status`：只把新增页与重写的组页登记为 `reverified`；其余页面沿用上一轮的状态，没有把「补了导语」写成「整页复核」。

## 复核

两轮只读对抗审计（独立子代理，只读、不采信既有陈述），全部发现逐条对过源码后修正：

- **入门三页**：11 处。goal 的完成证据不再写「要人认可」；`blocked` 门槛改成「只在 goal 自动续轮里按 admitted 轮数机械拒绝」；goal 工具只在某一轮的模型 turn 内可用；`subagent_fork` 的模型选择由「永远不开」改成「shipped 行不开、工具支持」；5 处出处改到真正包含该事实的行。
- **27 页新增三节**：6 处。provider 在本地委派里只贡献 seed（执行是 manager 与 external provider 的事）；`interrupt_agent` 对 local 只取消当前 turn、对 external 会整台处置；`list_agents(descendants)` 能走完整棵子树；工具 description 仅在该工具注册于作用域时可见；`blocked` 门槛只在 goal-round 授权下；`sdk-minimal` 不叠 base。`mount-shelves.svg` 里同一条判据同步改。

## 验证

```sh
node _digested/verify.mjs                    # 通过：197 md / 115 svg / 25 topics / 172 pages
node _digested/render-indexes.mjs --check    # 通过（覆盖矩阵由 catalog 重新生成）
node _digested/ref-sweep.mjs --quotes _digested/delegation-and-orchestration   # 540 行命中，0/0/0
node _faq_on_digested/verify.mjs             # 通过（234 md）
```
