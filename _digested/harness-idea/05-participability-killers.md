# 什么会杀死可参与性（participability）：反面清单

本页是 [`02`](./02-legibility.md) 与 [`03`](./03-paved-road.md) 的镜像：每一条「杀死可参与性」的设计，dsh 都有一个反制。用这张表检验任何 harness：规则住在哪层、正确与错误路径的摩擦差多少、错误何时被发现。

| 杀死可参与性的设计 | 表现 | dsh 的反制 |
|--------------------|------|-----------|
| 隐藏默认值 | `?? default` 埋在 `run()` 里 | `resolve(request): Spec` 显式步骤；参数都是 `Config` 字段 |
| 部落知识 | 正确写法只在 review 口头传递 | `AGENTS.md` 字面规则；cookbook 范本；门禁强制执行 |
| 文档漂移 | 手抄 catalog、文档与源码各说各话 | 目录从源码生成 + freshness gate |
| 特殊案例 | 每加一个功能都要改 loop | 扩展表：一切新行为走扩展点 |
| 歧义 | 两个词指一个东西、两条路都能做 | glossary 一词一义；closed union；`assertNever` |
| 失败沉默 | 误配置静默跳过、错误离源头远 | fail loud at load；required-on-read；错误消息指明规则 |
| 反馈缺失 | 写错直到人类 review 才发现 | `verify-*`、per-file 100% 覆盖率、snapshot、运行时 invariant |
| 变迁史散文 | 文档讲「以前 / 现在 / 以后」 | 当前状态散文；历史归 Agent Notes |
| 无范本 | 正确写法只存在于某个 300 行文件里 | `defineTool` 最小 shape；shell 三包生产级范本 |
| 判断二选一 | 正式注册与临时挂载是两种写法 | 注册即效果，只有一种写法 |

## 用三个问题检验一个 harness

1. **规则在哪层？** 人脑（部落知识 · tribal knowledge）→ 文档（可读不可执行）→ 系统（类型、表、门禁、运行时检查）。dsh 的答案：尽可能第三层。
2. **正确路径与错误路径的摩擦差多少？** 差越大，读者越容易做对。dsh 的答案：形状上只有一条路。
3. **错误何时被发现？** 当场（编译期 / load / 运行时检查）→ 提交前（门禁）→ review（以天计）→ 生产。dsh 的答案：当场。

把这三个问题用在任何「对 agent 不友好」的系统上，答案几乎总是：规则在文档与人脑之间、正确路径与错误路径摩擦相等、错误在生产才暴露。这不是玄学，是知识外置程度的三个读数。

## 反面的反面：外置不是全部

外置过头也会伤可参与性：规则多到读不完、门禁严到修不动、词汇细到记不住。dsh 的节制体现在：

- 规则有层级：`AGENTS.md` 只放 standing orders，细节链接到 home（[`docs/AGENTS.md`](../../docs/AGENTS.md)）；
- 门禁有窄化原则：只跑覆盖当前 diff 的最小检查（[`dsh-pre-push-checks`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)）；
- 文档有字数预算：`verify-doc-budgets` 把每份文档钉在预算内。

可参与性（participability）= 外置程度 ÷ 外置成本。本专题讲的都是分子，这一节是分母。

## 证据入口

- [`../../AGENTS.md`](../../AGENTS.md)（不变量陈述与门禁清单）
- [`docs/AGENTS.md`](../../docs/AGENTS.md)（tier taxonomy：一个事实一个家；字数预算）
- [`../cordis-runtime/02-waterfall-与事件合同.md`](../cordis-runtime/02-waterfall-与事件合同.md)（waterfall 合同被违反时的行为）
- [`../composition/01-boot-时序.md`](../composition/01-boot-时序.md)（fail loud 的两段失败标签）
