# 04 · 证据路由：本地相关检查与远端矩阵

## 一句话

DSH 把机械可检查的 invariant 接到会失败的顶层命令；push 前按 outgoing diff 选择最小可信证据，pull request CI 再运行远端矩阵。Focused evidence 与 exhaustive CI 是先后两层，不是二选一。

![从 outgoing diff 到本地证据、PR CI 与语义 review](./figures/evidence-routing.svg)

## 1. 检查逻辑与执行环境分属两边

| owner | 责任 |
|---|---|
| `package.json`、`scripts/run-gates.ts`、各 verifier/test | 定义检查逻辑、依赖、失败退出和聚合命令 |
| `dsh-pre-push-checks` | 根据真实 outgoing scope 选择 push 前相关证据 |
| `.github/workflows/ci.yml` | 定义 PR 触发、runner、权限、并发、缓存、job 依赖与结果聚合 |
| Git hooks | pre-commit 修 staged lint 并查 whitespace/vendor metadata；pre-push 只跑 incremental typecheck |
| reviewer | 判断意图、设计、prose 和测试场景是否真的匹配；绿色检查不建立这些语义属性 |

`.github/` 因而是流程的一部分，但不是检查清单的唯一 owner。Workflow 调用 `check:ci:*`，具体 gate inventory 继续由仓库脚本维护。

## 2. 先解析 outgoing scope

`dsh-pre-push-checks` 先确认 checkout 和 branch，再验证 live PR base 或 stack parent，并运行：

```sh
pnpm --silent run change-scope --base <verified-base-ref>
```

报告区分 merge-base 以来的 committed paths 与当前 staged、unstaged、untracked paths。Base retarget 或 merge 后要重新解析 scope，因为组合后的 diff 可能触及新的行为；命令不会猜测或 fetch base。

## 3. 每种改动选择会抓住其 regression 的证据

| 改动面 | 本地相关证据 |
|---|---|
| package 或 script 行为 | owning Vitest file/test name；shared contract 再扩到相邻 package |
| docs、Agent Notes、catalog、doc-linked comments | `pnpm run doc-sync`；文档 workflow 要求时加 full lint |
| model、editor、CLI、terminal 可见输出 | owning keyless snapshot 或真实 runnable-example scenario |
| manifest、public export、build config、worker/bin、built runtime | build、相关 hygiene 与 built-artifact smoke |
| real provider 或 agent behavior | 有 credentials 时运行对应 e2e target，绝不输出 secrets |

测试选择和 coverage 选择是两件事。Focused coverage 要同时指定 owning tests 与受影响 source include，并在该 source 范围继续满足 per-file 100%；不能用 `--passWithNoTests`、降低 threshold 或人为缩小 include 掩盖缺口。

本地不因“准备 commit/push”重复一个已经通过且未被新改动失效的检查，也不专门重跑 typecheck 去复制 pre-push hook。全库 rehearsal 只用于用户明确要求、CI 诊断或无法可信拆分的仓库级变更。

## 4. PR CI 承担穷举与平台信号

`ci.yml` 在每个 pull request 上运行，并在同一 ref 出现新 head 时取消旧 run。当前 job 拆分覆盖：

- Node 24 static gates；
- exhaustive per-file coverage；
- build-backed snapshots、文档类型检查和 artifact consumers；
- supported Node compatibility；
- Python SDK 与 release-shaped runtime；
- blocking Wine Windows signal 和独立 native Windows complete signal。

`all checks passed` 聚合 required job 结果；`.github/AGENTS.md` 明确 native Windows 独立报告，不属于该聚合。精确 job 和命令以 [`ci.yml`](../../.github/workflows/ci.yml) 与 [`run-gates.ts`](../../scripts/run-gates.ts) 为准，专题不复制完整 gate inventory。

Secret-backed e2e 在独立 workflow 里运行；无 key 时的本地命令 self-skip，不应被描述为真实 provider 已验证。产品可见 GUI 变更还需要从 PR 的真实 server/model flow 录制 GIF，这份证据不由普通 unit test 或 mock fixture 替代。

## 5. 负例把规则接到真实接受路径

新增可机械检查的规则不止需要 verifier。顶层执行命令必须实际包含它，并且 changed acceptance path 至少有一个 invalid case 通过真实 runner 被拒绝。否则“存在一个脚本”和“CI 会阻止错误”之间没有证据链。

同一原则适用于测试：断言要在目标 regression 上失败；e2e 重跑命令或重读外部状态，而不是只信 agent 自述；published bin、Loader、worker、ACP bridge 和 subprocess 使用各自真实入口。

## 6. 失败后的状态

普通 push 前的相关检查失败就停止并修复，不能把 CI 当作试运行。环境特异性需要记录 exact command、failing test 和平台差异后才能成立。

`gh stack sync` 是唯一顺序例外：它把 fetch、cascade rebase 和 push 合成一步，无法在 publication 前插入验证。Sync 后立即对每个 rewritten layer 重算 scope、运行相关证据，并在全部通过前保持 PR unmerged；失败时保留 lease-protected heads，修复、验证再发布 correction。

## 证据入口

- [根 `AGENTS.md`](../../AGENTS.md)
- [`dsh-pre-push-checks`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)
- [PR CI workflow](../../.github/workflows/ci.yml)
- [`.github/AGENTS.md`](../../.github/AGENTS.md)
- [Gate scheduler](../../scripts/run-gates.ts)
- [测试策略](../../docs/testing.md)
- [Quality gates 决定](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)
