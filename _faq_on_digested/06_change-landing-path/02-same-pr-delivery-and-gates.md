# 02 · 同一个 PR 交付什么，本地与远端门禁怎么接力把关？

进入编码和交付阶段后，DSH 的核心纪律只有一句话：**不搞“今天先合代码、明天补测试、下周再改文档”的分期付款，所有受影响的表面必须在同一个 PR 里一次性对齐。**

---

## 一、本地同一个 PR 里必须同步配齐什么？

1. **源码与当前合同同步落盘**
   改了包的行为或公开类型，必须在同一笔变更里更新该包的 `README.md` / `README.zh.md`（并用 `pnpm run verify-translation-pairing --write <file>` 重录双语分段哈希）、导出项的 JSDoc，以及对应的 [`docs/subsystems/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/subsystems) 页面。写法上严守“只写改完后的现行机制”，绝不在正式文档里留“以前是 X，本次改成了 Y”的施工痕迹。
2. **自动生成目录一律跑脚本刷新**
   像 [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)、[`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)、[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md) 等穷举清单全部从源码自动生成。改完代码跑生成器刷新，门禁会检查生成物与源码零差异。
3. **分层行为证据与“真红灯”核验**
   按照 [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 的分层要求：产品可见插件要测真实的 Loader 组装（不能只测手搭的最小 mock）；凡是影响模型提示词、协议或人类界面可见输出的非琐碎改动，必须同步新增或更新无密钥录制会话快照（`snapshots/`）。
   更重要的是**测试必须真能抓回归**：验证测试有效性的标准动作是**“保留新写的测试、只临时回滚实现代码，亲眼看着测试跑红，再恢复实现”**。（如果直接对整笔提交跑 `git revert`，源码和新测试会被一起撤回，跑出来的全绿其实是假象。）
4. **`proposed/` 到 `implemented/` 的同提交改写**
   如果这笔工作之前立过 `proposed/` Agent Note，在功能落地的同一个 PR 里，必须把文件移进 `implemented/`，把 `Status:` 改为 `implemented`，并且**把未来式的 `## Proposal` 改写成现在式的 `## Decision`，把验收标准与风险折入 `## Consequences`，删掉施工计划只留实际交付的事实**。原封不动把提案拷过去会被 `verify-agent-note-format` 门禁直接拦下。后续如果重命名了包或改了默认配置，也必须在同一变更里维护这篇 Note；等哪天该决定已彻底常识化、不再有参考价值时，再按 [`dsh-archive-agent-notes`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md) 冻结进 `archived/`。

---

## 二、本地窄检查 vs 远端 GitHub Flow 接力

Push 是本地个人验证与远端团队协作的分水岭——两边跑的东西刻意不一样：

- **Push 之前（本地选最小匹配证据）**：按 [`dsh-pre-push-checks`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md)，作者只针对当前 `git diff` 触达的面挑选最窄、最快的验证命令（外加 `lefthook.yml` 自动跑的 staged 格式检查和 `pre-push` 的 `typecheck`），几秒到一分钟内拿到反馈。
- **Push 之后（`.github/` 代码化接管协作）**：
  - **PR 模板强制把意图和证据摆在台面上**：打开 [`.github/pull_request_template.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/pull_request_template.md)，固定分三节——`Motivation`（一句话讲清问题并关联同仓 Issue）、`Changes`（分开写命令/配置/API/协议变化与外部可观察行为变化，没有就写 `None`）、`Testing`（每跑一种验证列一条，把命令输出、截图或日志塞进对应的 `<details><summary>Proof</summary>` 折叠块里，没跑的项如实标明）。
  - **CI Workflow 跑全量覆盖率与跨平台矩阵**：打开 [`.github/workflows/ci.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/workflows/ci.yml)，PR 触发 10 个并行任务，其中 **9 个必过任务**（`node-24`、`node-24-coverage`、`node-24-bench`、`node-24-consumers`、`node-compat`、`python-sdk`、`python-runtime`、`windows-build`、`windows-native-tests`，外加 1 个不阻塞聚合的 `windows-coverage`）全部汇聚到最后的守门任务 **`all-checks-passed`**。真正的门禁逻辑都写在仓库自己的 [`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts) 里，GitHub Actions 只管调度、新 push 自动取消旧队列和最终汇总。
  - **元数据与审批策略也是代码**：标签分类（`kind/*`、`area/*`）、原生 Issue Type、关联 Issue 与审批要求分别由 `.github/issue-management/` 和 `approval-policy.json` 脚本自动核验，违规直接在面板报红，不靠口头提醒。

---

## 三、合入前缺一不可的三种判断

走到最终 Merge 之前，DSH 把质量把关拆成了三件谁也替代不了谁的事：

| 把关维度 | 回答什么问题 | 谁来做 / 局限在哪 |
|---|---|---|
| **1. 自动化门禁（Automated Checks）** | 类型、单文件 100% 覆盖率、构建产物、双语配对、跨平台测试过没过？ | 本地定向命令 + 远端 `all-checks-passed`；**但它看不出设计歪没歪、需求理解对不对** |
| **2. 语义评审（Semantic Review）** | 实现、文档与测试证据真的对齐任务初衷吗？并发清理、日志可重建性、正反例够不够硬？有没有文档吹了牛但测试没断言的漏网之鱼？ | 掌握上下文的人类维护者或运行 [`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md) 的 Agent（每次新 push 后必须对着最新 head 重看） |
| **3. 显式人类拍板（Explicit Authority）** | 计划批不批、高危操作放不放行、PR 最终允不允许合入主干？ | 人类拥有者（审批卡、PR Approve 与 Merge 按钮） |

当 `all-checks-passed` 变绿、Review 问题全部解决（或有理有据在技术上回应清楚）、PR 退出 Draft 状态并满足审批要求后，合入主干的就不再是一段孤零零的代码，而是一份**“后来人即使不翻聊天记录，光读源码、README、Note 和测试就能完全看懂来龙去脉”**的完整切片。
