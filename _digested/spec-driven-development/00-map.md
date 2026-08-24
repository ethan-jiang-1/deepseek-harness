# Spec-driven development · DSH 的开发流程与 Agent Note 决策层

## 一句话

DSH 没有一份名为 `SDD.md` 的官方方法论文档，但 `.agents/` 和 `.github/` 把“如何修改系统”拆成了可执行的流程面：**Agent Note 保存决策与放弃方案，Plan Mode 把计划变成可审批对象，门禁与 pre-push 把“相关证据”变成本地义务，code review 与人类 PR policy 兜住机器查不到的语义**。它的主路径是：

```text
Issue / 任务意图
  → proposed Agent Note（重大未来工作）
  → Plan Mode（可选，decision-complete 计划 + 用户批准）
  → 实现 + docs/README/JSDoc/tests/snapshots + implemented Agent Note（同一变更）
  → review / 门禁 / CI
  → 低未来价值时 archive
```

这不是每次修改都走完的强制流水线：**每个非平凡变更**必须带 Agent Note，其余阶段按适用条件出现。

## 为什么需要这个专题

1. `_digested/` 其它专题回答“运行时机制是什么”；本专题回答“**这个仓库如何被修改**”，证据主要来自 `.agents/notes/`、`.agents/skills/`、`.github/` 和根 `AGENTS.md`。
2. DSH 明确自称以 coding agent 为主要开发者；开发流程因此不是“人写文档 → 人执行”，而是把决策、格式、门禁、review 都设计成 agent 可遵循、机器可检查的路径。
3. `.agents/` 的细节足够单独成章：Agent Note 有生命周期和文件格式门禁；Issue 有人类 PR policy；Plan Mode 有软引导边界；pre-push 有证据选择算法；stacked PR 有官方 merge 流程。
4. 本专题与 `_faq_on_digested/05_spec-change-path/` 不同：FAQ 是“一个问题的综合答案”，这里按 `_digested/` 的机制参考风格，把流程的 home、约束和源码/文件入口逐一展开。

## 主链路的 home

| 阶段 | home | 关键约束 |
|---|---|---|
| 意图 / 验收 | `.github/ISSUE_TEMPLATE/` | 模板固定外部结果；人类 PR 进入 review 后由 issue policy 强制引用 Issue |
| 决策 | `.agents/notes/proposed/`、`implemented/` | 非平凡变更同一 PR 必须有 Agent Note；proposed 用未来式，implemented 用现在式 |
| 计划 | Plan Mode（`packages/plan/plan-mode`） | 可选、软引导；`exit_plan_mode` 需要用户批准 |
| 实现 | `packages/`、`apps/`、`scripts/` 等 | 与 docs、README、JSDoc、tests/snapshots、Agent Note 同一变更 |
| 验证 | `dsh-pre-push-checks`、CI、`doc-sync` | 只跑覆盖 outgoing diff 的相关证据；CI 拥有穷举矩阵 |
| 语义兜底 | `dsh-code-review`、`dsh-prose-standard` | 自动化不建立语义属性；人类 PR 进入 review 后受 policy 约束 |
| 收敛 | `.agents/notes/archived/` | 低未来价值的 implemented note 才冻结归档 |

## 章节

| 文件 | 回答的问题 |
|------|-----------|
| [`01-agent-note-lifecycle.md`](./01-agent-note-lifecycle.md) | Agent Note 是什么、生命周期、分类、文件格式、何时必须写、如何移动/归档/合并 |
| [`02-issue-pr-lifecycle.md`](./02-issue-pr-lifecycle.md) | Issue/PR 模板、issue policy、人类 PR review 边界、标签与状态流转 |
| [`03-plan-and-sandbox.md`](./03-plan-and-sandbox.md) | Plan Mode 的产品行为、decision-complete 计划、审批、软引导边界 |
| [`04-gates-and-local-checks.md`](./04-gates-and-local-checks.md) | 质量门禁、pre-push 证据选择、doc-sync、hooks、CI 与覆盖策略 |
| [`05-prose-doc-standards.md`](./05-prose-doc-standards.md) | 文档标准、prose 标准、CoT 泄漏清理、翻译与文档站同步 |
| [`06-review-and-human-role.md`](./06-review-and-human-role.md) | code review 要查什么、人类 PR policy、review 后 agent 怎么回应 |
| [`07-push-merge-stacked-prs.md`](./07-push-merge-stacked-prs.md) | push 前保护、改写历史、官方 GitHub stack 的 merge 流程 |
| [`08-example-web-seam.md`](./08-example-web-seam.md) | 一个真实改动的 git 生命周期：proposed → implemented → 统一格式 → Agent Note 迁移 |

推荐顺序即上述编号顺序。先读 `01` 建立 Agent Note 心智模型，再沿 `02`→`07` 走外部协作与门禁，最后用 `08` 把所有阶段串起来。

## 边界

| 本专题回答 | 本专题不回答 |
|------------|--------------|
| DSH 的修改流程：谁写 Note、谁审批计划、谁跑什么检查、PR 怎么合并 | 运行时具体机制（由 `_digested/` 其它专题回答） |
| Agent Note 的生命周期和格式门禁 | 每个 Agent Note 的具体技术决策内容 |
| 门禁、CI、review 如何共同约束一次变更 | 用某个功能的具体实现细节 |
| 文档/翻译/文档站的工作流 | 产品使用指南 |

## 我的判断

- **判断一：Agent Note 不是“额外文档”，而是流程的决策主键。** 它把“为什么/放弃了什么”从代码和 docs 中分离出来，并且用格式门禁强制 implemented 记录是现在式、带 Alternatives。
- **判断二：DSH 的“规格”是分布式的。** 意图在 Issue 模板，决策在 Agent Note，计划在 Plan Mode，当前合同在 docs/types/README/JSDoc，行为证据在 tests/snapshots/invariants；没有单一 spec 文件。
- **判断三：门禁的粒度刻意“先相关后穷举”。** pre-push 要求按 diff 选最小证据，CI 才拥有完整矩阵；这是对 coding agent 工作方式的适配，不是偷懒。
- **判断四：人类与 agent 的分工不是一张表，而是由权限边界定义。** 可自动化处交给 gate，需要审批/语义判断/主机升级的地方才留给用户或 human-review policy。

## 证据入口

- [`.agents/notes/README.md`](../../.agents/notes/README.md)
- `.agents/notes/implemented/`、`.agents/notes/archived/`、`.agents/notes/proposed/`、`.agents/notes/rejected/`
- `.agents/skills/*/SKILL.md`
- [根 `AGENTS.md`](../../AGENTS.md)
- [`.github/issue-management/policy.mjs`](../../.github/issue-management/policy.mjs)
- `.github/ISSUE_TEMPLATE/`、`.github/pull_request_template.md`
- [`docs/subsystems/plan.md`](../../docs/subsystems/plan.md)
