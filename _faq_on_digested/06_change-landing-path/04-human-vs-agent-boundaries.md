# 04 · 人干什么，Coding Agent 干什么？用“权限边界”反向画出的分工表

翻遍整个 DSH 仓库，你找不到一张叫“人类职责 vs Agent 职责”的行政分工表；但把 `AGENTS.md`、各类技能和 `.github/` 策略脚本合在一起看，分工其实切得一清二楚——**DSH 是用“哪里必须请求授权”来反向定义人类角色的：凡是不跨权限边界的生产工作全归 Coding Agent，凡是涉及目标拍板、越权放行和最终背书的边界全归人。**

---

## 一、Coding Agent 承担绝大部分生产闭环

仓库早期立门禁时就写得很直白：代码库主要由 Coding Agent 编写，而“改动工作量大”在 Agent 干体力活的前提下不再是偷懒的理由。日常一条变更链上，Agent 负责跑通以下全部环节：

- **自己找路与起草方案**：顺着根 `AGENTS.md` → `packages/README.md` → 包 `README` 和源码定位修改点；需要写提案时起草带备选方案对比的 Agent Note；开启 Plan Mode 时先只读勘察，把实施计划写到“无需二次设计决定”的完整度，再调 `exit_plan_mode` 交审。
- **把代码、当前合同与测试一次性配齐**：改代码的同时更新包 `README`、JSDoc、`docs/` 子系统页和生成目录，写好单测、真实组装测试与录制快照。
- **按范围跑最小本地验证并诚实汇报**：Push 前用 `dsh-pre-push-checks` 挑最窄的相关检查跑通，在 PR 里只列真正执行过的命令；如果在 `gh stack sync` 后重写了分支，立刻重新验证。
- **收到 Review 意见后做技术核实**：[`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md) 明确要求收到评审意见时先对着代码核实，确认是问题就修，确认评审看错了就拿技术事实反驳，不搞表面迎合（`"without performative agreement"`）。

---

## 二、人类守住五个不可让渡的边界

1. **定义外部问题与业务取舍**
   决定“到底要不要解决这个痛点、预期外部行为是什么”（对应 Issue 与需求输入；另据 [`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/CONTRIBUTING.md)，目前主仓暂不直接合并外部社区 PR，外部用户主要通过 GitHub Discussions 反馈问题与交流生态插件）。
2. **审批实施计划（Plan Mode 出口）**
   在 Plan Mode 下，Agent 只能把计划递到 `exit_plan_mode` 门口，绝不能自己批自己；只有人点下批准，才会进入编码阶段，点退回则把修改意见塞回给 Agent 重改。
3. **放行沙箱外的宿主机权限（Host Escalation）**
   当 `gh`、`pnpm`、网络请求或嵌套沙箱测试被运行环境沙箱拦住时，[`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md) 要求在确认属于沙箱限制（而非测试真挂了）的前提下申请最窄的宿主机提权，由人确认放行，严禁绕过产品自身的安全检查。
4. **触发受控专用工作流**
   比如全量文档双语翻译技能 `dsh-translate-docs`，在 `AGENTS.md` 里明令禁止 Agent 自作主张顺手调用，只有人类显式下令时才允许跑。
5. **最终语义背书与合入主干**
   虽然语义级 Code Review 本身既可以由人做、也可以先让 Review Agent 帮着挑刺，但针对人类作者 PR 的治理策略（Issue 关联、审批配置 `approval-policy.json`）以及最终按下 Merge 让分支进入 `master`，责任人始终是人类维护者。

---

## 三、给外部插件与业务团队的一句提醒

看懂了这套分工，往自己的项目里借鉴时就不会生搬硬套：

- **别在小插件仓里硬套主仓的全部仪式**：DSH 主仓有几百个包、双语官网门禁和严苛的 SDK 兼容面，所以需要全套生成目录和双语哈希锁；你自己的独立插件仓完全可以只借最核心的三条——**“代码+文档+会报红的测试同提交交付”“持久设计取舍留简短决策记录”“可机械判定的底线写成脚本”**（具体裁剪清单见 [FAQ 07](../07_borrowing-dsh-harness-idea/answer.md)）。
- **任务队列与 DSH 闭环并不冲突**：DSH 的 Agent Note 只管记录“为什么这么定”，不管“下周先做哪五个需求”。如果你的团队习惯用 `ROADMAP.md`、看板或者外部规格工具管理排期，完全可以用它们管上游任务列表，再让 DSH 里的 Agent 按窄切片闭环一笔一笔把交付落稳。
