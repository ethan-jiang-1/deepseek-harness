# 05 · Review 与 merge：从能运行到能交付

## 三种判断不能互相替代

通用 SDLC 到“测试通过就发布”就结束了；DSH 在终点前还要分清三种判断——**能机械化的部分交给代码，判断含义的部分交给具备上下文的评审者（人或 agent），需要授权的部分交给用户**。前两种适用于每个 PR；第三种只在 Plan、受限操作或交互机制要求用户决定时出现：

| 判断 | 主要回答 | 不能替代 |
|---|---|---|
| automated checks（自动检查） | 类型、格式、测试、构建和平台结果是否满足规则 | 意图和设计是否正确 |
| semantic review（语义评审） | 实现、文档和证据是否真的符合任务意图、适用时的 Issue 与 Agent Note | 实际运行检查或用户决定 |
| explicit user interaction（显式用户交互） | Plan 是否批准、受限操作是否授权、交互问题是否回答 | 代码质量与 CI 结果 |

Semantic review 可以由具备上下文的人或 agent 执行。`.github` 中的 human-review policy 约束的是人类作者 PR 的 metadata 适用范围，不规定 reviewer 必须是人。

## 亲自做一次：对主例的语义 review

假设你是 reviewer，主例（模型 ID 显示，提交 `5124a2a310`）的 PR 摆在面前。沿四类上下文各问一个问题，自己打开文件回答（都在 [01](./01-follow-a-change.md) 的证据地图里）：

1. **任务意图**：README 说“每行显示原始 model ID、悬停看名称”——实现真的做了吗？打开组件源码看 `{candidate.id}` 和 `title` 属性。
2. **当前文档**：双语 README 的改述准确吗？对照组件实际行为读一遍，中英是否表达了同一件事？
3. **行为证据**：测试能在旧表现上红吗？（[04](./04-implementation-and-evidence.md) 有实测：2 红 95 绿。）反过来问：README 声称的行为里，有哪些**没有**测试钉住？（等宽字体和悬停——这就是“绿色门禁仍证明不了什么”的实例：CI 全绿 ≠ 声称的行为全部有证据。）
4. **真实使用路径**：hover 显示名称这件事，在真实浏览器里看得到吗？e2e 改了勾选断言，但没有断言悬停——如果你认为这项行为值得钉住，这就是一条 review finding。

第 3、4 问就是你作为 reviewer 的产出：**finding（评审发现）**，指出缺陷、位置、影响和证据。作者逐条核验：成立就修改并补证据，不成立就用可验证事实解释。

高风险变更还要沿真实 consumer 和 entry path 检查错误、取消、资源释放、并发、安全限制、模型可见内容与发布产物。完整语义维度见 [code review 参考](../../_dsh_plugin_agent_ready_development/sdlc-reference/06-review-and-human-role.md)。

## Review 是一个反馈循环

新的 push 会更新 PR head，也可能使旧的 review 结论或 checks 失效。因此合并前要重新读取**当前** diff、unresolved threads 和 checks，而不是沿用上一次查看的状态。

**证据边界**：PR #5004 当时的 review 讨论、批准与 CI 结果，`git show` 看不到（`需查 GitHub`）。上面这次演练是“用当前 DSH 的 review 标准审视这笔已交付变更”，**现行规范演练 ≠ 当时真实 review 历史**。

## 合并后：知识归位

Merge 后目标分支成为当前交付状态。一个没读过 PR 对话的 fresh agent 要能回答三个问题——每个答案都有可打开的位置：

| 问题 | 到哪里找 | 主例中 |
|---|---|---|
| 现在的行为是什么 | 源码 + 当前文档 | 组件 `candidateId` 渲染；双语 README |
| 为什么这样决定 | owning Agent Note（若有） | 豁免——无 Note，理由在源码与 README |
| 什么固定住这个行为 | tests、snapshots | 组件测试 + e2e |

这就是“合并后知识归位”的具体含义：**归位不是因为 merge 这个动作，而是因为交付组合本身把每类事实放进了它的 owner**（[02](./02-specs-and-decisions.md) 的六类位置）。

Merge 只改变分支和 PR 状态，不会自动改变 Agent Note 的生命周期；归档条件由 [Agent Note 参考](../../_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md) 拥有。**合并非发布**：发布另有资格门槛与演练要求，见 [发布参考](../../_dsh_plugin_agent_ready_development/sdlc-reference/11-release-sequences-and-publish-lanes.md)。

## 完成后的心智模型

五篇读完，回到开篇的三条立场，它们在这最后一页合拢：**agent 是一等参与者**——你刚以一个没参与过 PR #5004 的身份，靠公开入口做完了语义评审和知识定位；**规则是可执行代码**——自动检查、policy、配对 hash 把能机械化的判断全部机械化，语义评审只处理机器管不了的部分；**每类事实有唯一 owner**——合并后 fresh agent 的三个问题都有可打开的答案，这就是“知识归位”。一句话收束：**先用可观察结果说明变更应该成为什么，把实现、当前文档和能在旧行为上失败的证据装进同一个 PR，让自动检查、语义评审和（需要时的）用户决定共同判断能否交付；合并后每类事实都在自己的 owner 里可再次发现。**

需要核对精确 policy、Agent Note 状态、Plan 审批、证据路由、高风险 review、分支改写或依赖式 PR 栈时，从 [SDLC Reference 目录](../../_dsh_plugin_agent_ready_development/sdlc-reference/00-index.md) 按问题进入。
