# Answer · 借鉴 DSH Harness 思路：让 coding agent 不糊涂、不乱发挥

## 一句话结论

DSH 没有去训练「一个足够聪明、不会糊涂、不会乱发挥的 agent」；它做的是把这句话反过来——**让「读对、改对」变成阻力最小的路径，让「读错、改错」在离错误源头最近的地方被机器拒绝。** 要做到这一点，只需要连续回答三个问题，而这三个问题对一个普通项目同样成立：

1. **知识外置了吗？** 规则、结构、改哪里、为什么这样设计、怎么做，是写进了可搜索、可检查的文件，还是只活在资深成员脑子里？
2. **正确入口明确吗？** 一个新参与者能不能从任务目标出发，找到 owner、范本和升级条件，而不是每次都靠猜代码位置？
3. **错误何时被发现？** 是编译/加载/本地测试/运行时/CI/review 就抓住，还是上线之后才爆？

「不糊涂」主要由第 1 个问题回答（可读性与知识归属）；「不乱发挥」由第 2、3 两个问题回答（正确路径 + 可执行反馈）。三者合起来，就是「Development Harness」的完整含义。

## 总览表：困惑类型 → 借用机制 → 在你的项目里怎么落地

| 你的症状 | DSH 的机制 | 不依赖「一切皆插件」的部分 | 落地动作（章节目录） |
|---|---|---|---|
| agent 读完还是抓不住主线 | 分层入口 + 根指令只放 standing orders | 是 | 写一份短 `AGENTS.md`（`CLAUDE.md` 用 symlink 指向它），只放常驻规则 + 布局 + 命令，其余 link 出去（见 09） |
| agent 分不清「现在的事实」和「当初的理由」 | 当前文档 vs Agent Note 分开 | 是 | 决策理由单独进 `docs/adr/` 或 `notes/`，文档只写 now（见 02） |
| agent 反复提出已否定的方案 | 负知识外置（rejected note、Known Limitations） | 是 | 记下「为什么不做 X」，而不是只记「做了什么」（见 02） |
| agent 改错地方 / 造出新接入方式 | 正确路径 + 参与阶梯 + 归属路由 | 部分（阶梯需要扩展点，但「改哪里先问归属」通用） | 写一张「目标 → 机制」归属表，cookbook 给出范本（见 03） |
| agent 做了坏事要等 review 才知道 | 可执行反馈：类型 / load / 测试 / snapshot / invariant / CI | 是（invariant 可选） | 把可机械判断的规则做成 `exit non-zero` 的脚本，并证明负例会失败（见 04） |
| agent 一次读太多上下文、记不住 | 渐进披露 + 按需加载 Skill | 是 | 规则分层，任务命中才加载对应流程文档（见 05、10） |
| agent 每轮看到的上下文爆炸、长任务活不下来 | 按需注入 + 运行时组装 + compaction 回收 | 部分 | 注入给预算/去重；catalog 只给摘要；超预算压缩且保留 tool-call/result 配对（见 10） |
| agent 靠猜源码而不是问实际状态 | `--dump-config`、生成 catalog、inspect 工具 | 部分（catalog/inspect 需要一定工程） | 至少提供一条「查实际配置/注册项」的命令（见 06） |

## 最核心的三件事

1. **一个事实一个 owner，当前状态与决策理由分开。** 这是「不糊涂」的地基：agent 遇到问题知道去哪个权威文件，而不是在过时故事里猜当前 API。
2. **正确路径是分层的、有判定顺序的。** 新行为先问「能不能用配置/现有扩展点表达」，再逐级上升到 seam、core loop。这是「不乱发挥」的前半段。
3. **可机械判断的规则全部落到执行，而不是只写进 prose。** 这是「不乱发挥」的后半段，也是 DSH 最值得抄的一句话：*Agents follow enforced gates far more reliably than prose conventions.*

## 三句话记住它

- **「不糊涂」靠外置，不靠聪明。**
- **「不乱发挥」靠正确路径 + 早失败，不靠自律。**
- **照搬的顺序是：先立规矩的 owner，再铺正确路径，再接可执行反馈，最后才按需加 Skills 和运行时查询。**

## 阅读路径

- **主线**：按 `01 → 08` 读，是一条「拆问题 → 讲机制 → 给落地顺序」的完整叙事；`08` 是落地总纲。
- **两条深化**：`09`（AGENTS.md 入口链）是 `02`「渐进披露」的物理落地，读完 `02` 即可读；`10`（渐进披露管线）是 `02/05/09` 的运行时补全，读完 `09` 再读。它们排在后面只是编号顺序，不是依赖顺序。
- **证据**：`research.md` 是全部 blockquote 的出处总表，写的时候逐条核对过。
- **兜底**：本目录自带 [`verify.mjs`](../verify.mjs)（UTF-8 / 换行 / 链接 / 锚点），基线钉在 `research.md`；防漂移纪律的完整落地清单见 `08` Phase 7——这个 FAQ 讲的机制，自己也在用。

## 继续阅读

- [`01-two-failures-as-missing-info.md`](./01-two-failures-as-missing-info.md)：先拆「糊涂 / 乱发挥」
- [`02-legibility-ownership.md`](./02-legibility-ownership.md)：不糊涂的地基
- [`03-paved-road-and-ladder.md`](./03-paved-road-and-ladder.md)：不乱发挥·改哪里
- [`04-executable-feedback.md`](./04-executable-feedback.md)：不乱发挥·早失败
- [`05-skills-as-procedural-memory.md`](./05-skills-as-procedural-memory.md)：省上下文、稳住判断
- [`06-runtime-inspection.md`](./06-runtime-inspection.md)：不靠猜源码
- [`07-transfer-playbook.md`](./07-transfer-playbook.md)：优先级、三问框架与边界
- [`08-step-by-step-guide.md`](./08-step-by-step-guide.md)：**一步一步怎么做**
- [`09-agents-entry-chain.md`](./09-agents-entry-chain.md)：AGENTS.md 层级骨架（CLAUDE.md symlink → 根 → 少数子树 → README）
- [`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)：渐进披露的完整五层管线（静态 + 按需注入 + 运行时组装 + 溢出回收 + 隔离）
- [`research.md`](./research.md)：证据原文与来源
