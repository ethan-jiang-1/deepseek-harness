# 04 · 实现与证据：DSH 怎样把“证明”做成制度

通用 SDLC 到“写完代码跑测试”就结束了。DSH 在这里的立场更严格：**一项检查只应被描述为它实际证明的内容**——测试全绿不等于变更完整，没被断言钉住的行为，和没做过一样。这一页用主例把这套纪律走一遍。

## 变更面 → 证据：主例的对照

主例（模型 ID 显示，提交 `5124a2a310`）7 个文件的改动面，每一块都有对应证据：

| 变更面 | 证据 | 它证明什么 |
|---|---|---|
| 组件行为：候选行从显示名换成 `{candidate.id}` | 组件测试两个场景的断言反转 | 可访问名从 `Fresh` 变 `fresh`；旧显示名不再出现 |
| 搜索行为：按名称搜索仍可用 | 同一测试文件的搜索场景 | 显示换了，搜索没坏 |
| 真实入口：Web 设置页 | e2e 场景更新 | 真实浏览器里勾选 `gpt-6-astra` 走通 |
| 当前合同：README 双语 | 两语言同步改述 + `README.i18n.yaml` 重录 | 文档与行为一致、中英相等 |
| 等宽字体 + 悬停名称 | **只有 README 声明** | ⚠ 无断言覆盖（见下） |

最后一行是本页最重要的教学点。等宽字体来自 `.candidateId` 样式类上的 `font-family: var(--ds-font-family-code)` 声明（消费设计 token——仓库统一的样式变量），悬停名称是 `title` 属性——这两项行为在组件测试和 e2e 里都没有断言，只有双语 README 声明它们。这不是教程作者偷懒，是这笔真实交付的证据缺口，如实展示。练习：如果要钉住悬停行为，你会在哪个测试文件加一条什么断言？（提示：`title` 属性会进入 DOM；组件测试跑在 jsdom——一个无浏览器的 DOM 实现里，可以直接读取。）

“组件测试”和“e2e”的分工也是 DSH 的刻意设计：组件测试在 jsdom 里渲染组件、喂进 props（组件的输入参数），秒级跑完，钉交互行为；e2e 起真实浏览器、走真实设置页入口，分钟级，钉“用户真的看得到”。两层各证各的，谁也不冒充谁。

## 红灯对照：实测记录

“测试会在旧行为上失败”不能靠文件名承诺，要靠实测。以下是本教程写作时的一次真实对照实验（在钉版基线 `46a7f68b09` 的临时 worktree 上执行）：

1. **回滚实现，保留测试**：`git revert --no-commit 5124a2a310` 后把测试文件、e2e 与三份 README 恢复到交付后状态——只有 `ModelListEditor.tsx` 与 `ModelsSection.module.css` 处于旧行为；
2. **跑聚焦组件测试**：`pnpm vitest run packages/client/ui-settings-models/tests/provider-form.client.spec.tsx`；
3. **结果：2 红 95 绿**。

两处红灯的原文：

```text
FAIL  endpoint interrogation > adopts only the picked candidates...
AssertionError: Unable to find an accessible element with the role "checkbox"
and name "fresh"
  ❯ provider-form.client.spec.tsx:612

FAIL  endpoint interrogation > filters by model id or name...
AssertionError: expected '...alphaBeta Displaygamma...' to contain 'opaque-id'
  ❯ provider-form.client.spec.tsx:753
```

第二条尤其有价值：**报错信息把旧行为直接钉住了**——对话框实际渲染的是 `Beta Display`（显示名），新断言要 `opaque-id`（model ID）。“旧显示名不再出现”不是口头判断，是失败信息里的事实。

一个反直觉的细节：实验第一次跑出了 **97 全绿**——因为 `git revert` 把源码和测试**一起**回滚了，旧测试在旧行为上当然通过。这正是不靠文件名承诺覆盖的活教材：做红灯对照时，必须**保留新测试、只回滚实现**。

e2e 的断言（`checkbox { name: 'gpt-6-astra', exact: true }`）在旧组件上同样会红——旧行为渲染 `GPT-6 Astra`——但 e2e 需要完整浏览器环境，本实验未执行，如实归入“未运行”清单。

## 先选检查，再执行

相关证据（relevant evidence）不是命令数量，而是**目标回归一旦出现就会失败的检查**。DSH 根 URL 的 `AGENTS.md` 把它定为一条 standing order（常驻规则）：“Run relevant checks locally——按改动面选择，而不是默认跑全部”。常见对应：

| 改动 | 常见证据 |
|---|---|
| package 或 script 行为 | 聚焦的单元/集成测试 |
| 用户、CLI、编辑器或模型可见输出 | snapshot（可重放的录制输出）或可运行场景 |
| 文档、Note、目录或链接 | `doc-sync`（仓库的文档结构门禁：链接、双语配对、字数预算） |
| public export、build、worker 或 bin | build、hygiene（发布形态检查）、built smoke（构建产物冒烟） |
| 真实 provider 行为 | 有凭据的 e2e |

主例的交付卡（**示意**，标注各项状态）：

- 意图与验收：教学重建（见 [01](./01-follow-a-change.md)）；
- owning Note：豁免（局部呈现，见 [02](./02-specs-and-decisions.md)）；
- 当前文档：双语 README 已改述，配对 hash 已重录 `已在提交观察`；
- 回归证据：组件测试两个场景 6 条反转断言 `已在提交观察`，红灯对照 `写作时实测`；
- 实际执行：`pnpm vitest run packages/client/ui-settings-models/tests/provider-form.client.spec.tsx` → 交付态 97 绿；旧行为对照 2 红 95 绿；
- 未运行：e2e（需浏览器环境）、`doc-sync`（本语料不改产品源码，正式交付时须由作者执行）、远端 CI（交由 PR）。

**未运行项要如实分开**——它们是“证据还缺什么”的清单，不是可以混进“已验证”里凑数的。没有凭据而自动跳过的 e2e，不能算真实 provider 已验证；mock 测试也不能替代真实入口的证据。

## 本地检查和 PR CI 是两层

本地检查针对当前待推送的 diff 选最小可信证据，push 前抓住相关回归；PR CI 在远端跑完整矩阵（9 个 job，见 [03](./03-github-flow.md)），覆盖共享规则、构建消费者和平台信号。两层不是二选一：本地快、有针对性；CI 统一、覆盖广。精确的检查选择方法见 [证据路由参考](../sdlc-reference/04-gates-and-local-checks.md)。

## Push 前的完成判断

准备 push 时，至少能清楚回答：外部结果和验收条件在哪里；哪个 Agent Note 拥有决定（或者为什么豁免）；当前文档是否描述交付后的行为；哪项证据会在目标回归上失败（实测过，不是推断）；实际运行了哪些命令，哪些证据仍交给 CI。

这一页把**“每类事实有唯一 owner”**推进到了证据层：每一块改动面对应一项会失败的检查，没被钉住的行为如实标记为缺口——绿灯的数目不是目标，证据与声称的对齐才是。“规则是可执行代码”在这里体现为：红灯对照不是文化习惯，是 `AGENTS.md` 里“Run relevant checks locally”的 standing order（常驻规则）加 CI 门禁共同强制的要求。

下一篇进入评审和合并：[Review 与 merge](./05-review-and-merge.md)。
