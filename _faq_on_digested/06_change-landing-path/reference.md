# Reference 06 · 权威文件入口与历史提交核验命令

本页集中列出本篇引用的 DSH 仓库规则文件、门禁脚本以及真实历史案例的本地复核命令。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、仓库内规则与机制入口

- **意图与远端协作模板**
  - Feature / Bug / Task Issue 模板：[`.github/ISSUE_TEMPLATE/feature.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/ISSUE_TEMPLATE/feature.md)、[`bug.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/ISSUE_TEMPLATE/bug.md)、[`task.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/ISSUE_TEMPLATE/task.md)
  - PR 模板：[`.github/pull_request_template.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/pull_request_template.md)
  - 人类 PR 关联 Issue 与元数据校验规则：[`.github/issue-management/rules.mjs`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/issue-management/rules.mjs)（`requiresPullRequestPolicy` 与 `validatePullRequest`）
  - CI 工作流与聚合门禁：[`.github/workflows/ci.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/workflows/ci.yml)（`all-checks-passed`）、[`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)
  - 外部贡献说明：[`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/CONTRIBUTING.md)
- **决策记录（Agent Note）与计划模式（Plan Mode）**
  - Agent Note 生命周期、现行写入门槛与时态改写规则：[`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md)
  - Note 格式门禁与归档技能：[`scripts/verify-agent-note-format.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-agent-note-format.ts)、[`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md)
  - Plan Mode 子系统说明与预设提示词：[`docs/subsystems/plan.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/plan.md)、[`packages/plan/plan-mode/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/README.md)、[`packages/bundle/web-app/presets/ptc.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/ptc.patch.yml)
- **当前合同、测试证据与工程纪律**
  - 根工作指令与包级约定：[`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)、[`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md)
  - 文档当前状态原则（`Document current state`）：[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)
  - 分层测试政策、红灯要求与录制快照规则：[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)
  - 推送前最小检查与语义评审技能：[`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md)、[`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md)

---

## 二、历史提交复核命令（本地 `git show` 可直接查验）

```sh
# 1. Agent Note 写入门槛从“非平凡必写”收窄为“持久理由才写”
git show 730bcc7c85 -- .agents/notes/README.md

# 2. 案例一：模型选择器显示原始 ID（7 文件小切片，局部 UI 豁免 Note）
git show --stat 5124a2a310

# 3. 对照案例：pnpm 子进程锁占用修复（包含持久取舍与五条被否方案，附带 Note）
git show --stat ccaa0dc11c

# 4. 案例二：Web capability seam 从提案到同提交落地，再到统一现在式格式与重命名
# （注：早期 docs/rfc/ 目录已迁至 .agents/notes/，旧路径需在对应历史 commit 上查看）
git show a4091daa3d -- docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md
git show --stat d01f5f73b7
git show e6fad266a6 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
git show e8eddc7ef8 --name-status
```
