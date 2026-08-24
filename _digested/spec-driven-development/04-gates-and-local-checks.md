# 04 · 门禁与本地检查：证据选择先于穷举

## 一句话

DSH 的质量门禁不是“全量检查跑一遍”的仪式，而是：**每个可机械检查的 AGENTS.md 承诺对应一个非零退出命令；本地 push 前只跑覆盖当前 diff 的最小证据集；CI 拥有穷举矩阵**。`dsh-pre-push-checks` 是对这个策略的操作化 skill。

## 1. 为什么门禁优先于 prose

`2026-06-11-quality-gates` 的第一句是：

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions, and "a lot of work" is not a cost argument when agents do the labor.

来源：`.agents/notes/implemented/process/2026-06-11-quality-gates.md:11`

结论是：机器能检查的规则都要写成命令，CI 跑完整集合，本地 hooks 只保留低成本缺陷检查。

## 2. root AGENTS.md 的 standing orders

根 `AGENTS.md` 要求：

- Run checks before pushes via `dsh-pre-push-checks`; report only commands run.
- Match evidence to the surface: focused tests, snapshots, doc-sync, build/hygiene, real-API e2e.
- Never default to the full suite or repeat a passing check for commit or push.
- CI owns exhaustive coverage and the platform matrix.
- 非平凡 change MUST include Agent Note in same PR.
- 把所有机械可检查 invariant 接入一个 executed top-level gate，并证明 changed acceptance path 会拒绝 invalid case。

来源：`AGENTS.md:87-93,123,139`

## 3. dsh-pre-push-checks 的决策模型

skill 的核心是“先确定 outgoing diff，再选相关证据，不重复已通过的检查”：

1. 确认分支，fetch 并通过 `pnpm --silent run change-scope --base <verified-base-ref>` 取得真实 scope。
2. 按改动面选择最小证据：
   - package/script 行为 → 对应 vitest 文件或 focused test；
   - docs/Agent Notes/catalogs/doc-linked comments → `pnpm run doc-sync`；
   - model/editor/CLI/terminal 可见输出 → owner keyless snapshot；
   - manifest/public exports/build/worker/bin → build + hygiene + built-artifact smoke；
   - real provider/agent → 有 key 的 e2e target。
3. 不重复 typecheck 只为了 push；pre-push hook 自己会跑 incremental typecheck。
4. 全量本地 rehearsal 只在用户明确要求、诊断 CI 或仓库级大改时做。

来源：`.agents/skills/dsh-pre-push-checks/SKILL.md`

## 4. 覆盖的门禁不是“跑一下 test”

quality gates 背后是一整套门禁拓扑：

- `doc-sync`：Agent Note format/classification、Markdown links、translation pairing、type-equivalence、doc budgets、catalogs freshness 等。
- 文件级 100% coverage 是 CI coverage gate；`test:coverage` 才是门禁，`test` 不是。
- 每个 package 还要有 `./invariant`：不造无意义的空 invariant；没有可观察关系就显式写空并说明原因。
- TypeScript strict、oxlint、knip、publint、workspace constraints、built package consumer typecheck 等都属于 CI 聚合。

来源：`AGENTS.md:90-93`、`packages/AGENTS.md:18`、`scripts/run-gates.ts`、[`2026-07-06-parallel-pre-push-gates`](../../.agents/notes/implemented/process/2026-07-06-parallel-pre-push-gates.md)、[`2026-07-22-fast-local-git-hooks`](../../.agents/notes/implemented/process/2026-07-22-fast-local-git-hooks.md)

## 5. 文档与行为证据

- `docs/testing.md` 要求 product-visible plugins 走 REAL-composition test，不只手搭 `ctx.plugin(...)`。
- 每个非平凡 model/protocol/human-visible 变化要在同一 PR 更新 keyless scenario。
- “Verify the world, not the self-report”：e2e 要重跑命令/重读文件，而不是只信 agent 自述。
- “Real entry path”：package bin 要跑 built `lib/bin.js` 等发布形态，不能只跑 tsx。

来源：`docs/testing.md:27-49`

## 证据入口

- [根 `AGENTS.md`](../../AGENTS.md)
- [`.agents/skills/dsh-pre-push-checks/SKILL.md`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)
- [`.agents/notes/implemented/process/2026-06-11-quality-gates.md`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)
- [`.agents/notes/implemented/process/2026-07-22-fast-local-git-hooks.md`](../../.agents/notes/implemented/process/2026-07-22-fast-local-git-hooks.md)
- [`docs/testing.md`](../../docs/testing.md)
- [`scripts/run-gates.ts`](../../scripts/run-gates.ts)
