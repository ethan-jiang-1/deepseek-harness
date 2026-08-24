# 06 · Code review 与人的边界

## 一句话

DSH 的 review 分为两层：机器门禁证明“可判定结构没坏”，`dsh-code-review` 负责机器查不到的语义判断。仓库没有一张“人 vs agent”分工总表，但 Issue policy 明确存在 **human-review policy**——非 Draft、非 Bot/App、已请求或已有 review 的人类 PR 必须满足更强约束。

## 1. dsh-code-review 的 sources of truth

skill 要求 reviewer 先验证 live base/head，运行 `change-scope`，然后对照：

- `AGENTS.md` 与 `packages/AGENTS.md`
- `docs/defensive-patterns.md`
- `docs/AGENTS.md`
- `dsh-prose-standard`
- `docs/testing.md` 与 quality-gates note
- Agent Notes：与 Note 冲突是 design discussion，不自动否决

来源：`.agents/skills/dsh-code-review/SKILL.md:8-17`

## 2. Blocking requirements

1. **New prose receives semantic review.** automated checks do not establish those properties.
2. **Docs match the code.** config/defaults/errors/wire fields/events/public behavior 更新 README 和 JSDoc 在同一 diff。
3. **Core type docs match.** spine/seam vocabulary 更新 subsystems 和 type-equiv。
4. **Registrations clean up.** registry contribution 要过 disposal tests。
5. **Invariant companions are semantic.** 不为了消除空而发明检查。
6. **Required evidence exists.** 作者跑了相关本地检查，CI 覆盖穷举矩阵。

来源：`.agents/skills/dsh-code-review/SKILL.md:20-27`

## 3. Manual checks 核心清单

- Intent and interface：实现是否匹配 PR 和 Agent Note，包括 error/cancellation/ownership/disposal。
- Lifecycle/concurrency：races、cancellation、cleanup、quiescent disposal。
- Capability/consumer fit：consumer-specific behavior 不能泄漏进通用接口。
- Scope/ownership/necessity：每个抽象都要映射到 current contract / production consumer / owner。
- Model perspective：模型实际看到的 prompts/tool schemas/results/diagnostics。
- Enforcement：直接与替代调用路径都要测试 denial。
- Borrowed/derived state：通知、cache、prompt、UI echo 都从权威 success point 派生。
- Real entry path：shipped Loader、bin、worker、ACP bridge 或 subprocess。
- Test strength：断言必须在预期 regression 上失败，不能 restate implementation。
- Implemented Agent Notes match shipped reality：实现 proposed note 的 PR 必须在同 diff 移动并改写为 present-tense。
- Transcript changes：editor/model-visible 变化要更新 snapshot 或解释为什么不需要。

来源：`.agents/skills/dsh-code-review/SKILL.md:29-45`

## 4. 人类 PR review 边界

`.github/issue-management/policy.mjs` 定义：

```js
const automated = authorType === 'Bot' || authorType === 'App'
return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)
```

- 只有返回 true 时，PR 才必须引用 Issue、满足 kind/area/priority 等约束。
- 这称为 “human-review policy”。
- `dsh-code-review` 本身没有明文写执行者必须是人；因此更准确的说法是：**进入 review 的人类 PR 被 policy 单独约束，语义 review 不能由自动化替代**。

来源：`.github/issue-management/policy.mjs:158-170`、`.github/pull_request_template.md:2`

## 5. 收到 review 后

skill 对“被 review 的一方”也有明确指令：

> When receiving review, verify each claim and fix or rebut it on technical grounds without performative agreement.

来源：`.agents/skills/dsh-code-review/SKILL.md:49`

也就是说，agent 不是无脑接受 comment；要逐条验证、修复或用技术理由反驳。

## 证据入口

- [`.agents/skills/dsh-code-review/SKILL.md`](../../.agents/skills/dsh-code-review/SKILL.md)
- [`.github/issue-management/policy.mjs`](../../.github/issue-management/policy.mjs)
- [`.github/pull_request_template.md`](../../.github/pull_request_template.md)
- [`.agents/notes/implemented/process/2026-06-11-quality-gates.md`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)
