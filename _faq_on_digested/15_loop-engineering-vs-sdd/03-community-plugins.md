# 03 · 社区插件作者：默认是给个目标就开跑，把控力做在门禁、审批点与净化发布面里

## 结论先行

15 仓抽样（样本与逐仓证据见 [research.md](./research.md) C 路）：**目标开跑 ≈10、目标开跑 + 自建计划/审批门禁 ≈3、自建 spec 体系 1、无公开过程痕迹 1**。主流工作方式是 owner 体感里的那种「给个目标就开跑」；仓库里没有人把它命名为 loop engineering，spec-first（spec-kit / OpenSpec 形态）在插件层**零采用**。spec-kit 2026-09-02 的 DSH integration 是把 `/speckit-*` 装进 `.dsh/skills/`（见 [02 篇](./02-external-trend-verdict.md)），不是这些仓库改用了 Spec Kit。社区对把控力的应对与 owner 四仓**同构不同形**：同样是管线层自建，但社区更常用「计划/评审写进 agent 指令 + 净化公开面 + 授权不变量」，而不是 owner 的队列文件 + 立卡 + 生命周期门禁。

## 第一节 生态有多大、把关怎么运作

上游 236,281★；发现机制 = `dsh-plugin` topic + awesome 榜单（本地 3,552 条目：ui 590 / tools 474 / dev 268 / session 224…）+ dshplugin.app（2,653 indexed）+ npm（头部月下载 112.4k）。生态自己的把关哲学值得抄进本 FAQ：awesome 榜单收录标准明说「**A green CI run is the precondition, not the decision. A maintainer reads the target repository before merging.**」「Overstating is the one thing that gets an otherwise-good plugin sent back」——**机械门 + 人工读码双轨**，与 02 篇的收敛结论在生态治理层再出现一次。

## 第二节 三个社区级发现

1. **垂直切片是默认提交形状**：issue→修复→测试→版本号→CHANGELOG，commit body 收尾报「Checks: … npm test 64/64 pass」；没有两段式 proposal→implement 提交史（唯一例外 open-design 的自建 spec 体系，spec 与实现同库共存）。这是 FAQ 11「每笔交付是一个完整垂直切片」在社区的自然重现——没人教，形状自己收敛出来了。
2. **验证门禁是通用底座，进阶者自建门禁类**：check-peer-range、verify-bundle、plugin-doctor、docs-drift、mutation-checked tests、打包后装进官方 DSH Web 的集成门。上游 quality-gates Note 的信条（「Agents follow enforced gates far more reliably than prose conventions」）在社区是被默认实践、而非被引用的。
3. **开发 harness 是混用的**：同一个仓库的提交者身份含 Antigravity / Cursor / OpenCode / DSH 四种 agent；有人用 Claude Code+Serena 开发 DSH 插件（dsh-cc），有人明文 Codex=executor（ruflo）。这**弱化了「插件作者天然继承 DSH 流程」的假设**：他们继承的是通用 agent 开发常识（AGENTS.md + 验证门禁），DSH 特有的 Note 制度只有个别项目搬用（oh-story-dsh 的 `.agents/notes/implemented/process/`）。

## 第三节 与 owner 四仓对照：同构不同形，且暴露一个规模边界

同构：把控力都做在管线层，都不外挂 SDD。差异有三，其中第三条最重要：

1. **形态**：owner 用队列文件 + 立卡 + 生命周期门禁（过程文件化）；社区主流是「计划/评审写进 agent 指令」+「净化公开树」（过程私有化——context-lens 干脆把内部 AGENTS.md/docs/plans/ 从公开树 purge 掉）+「审批点写进模板」（exoticknight 模板：文档改动需批准、npm publish 先问）。
2. **DSH 流程惯例的扩散度**：notes 制度在社区罕见——B3 路引用的「AGENTS.md / Notes / gates 是可迁移的原则，不是继承义务」（FAQ 13）在社区数据上成立。
3. **规模边界**：15 仓里**没有任何一个**有 ROADMAP 式队列文件（C 路明说搜过没找到）。社区插件多为小工具（一轮循环可交付），owner 跑的是多 feature、长周期、多角色专家插件——**管线层的需求与项目规模/周期正相关**。owner 觉得「把控力不够」而社区作者不喊失控，很可能不是体会深浅之别，而是项目形态之别；「失控第一人称叙事未找到」因此有两种读法（个人工作模式特有 vs 社区项目还没长到会失控的规模），现有证据无法区分——这是本篇最诚实的边界。

## 第四节 Bridge 已铺、无人过桥

spec-kit v1.0.4 的 #4336 说明 Spec Kit 愿意把 DSH 当成又一个可装技能的 harness；15 仓没有因此出现 `.specify/`。两个解释并存：集成太新（三周半）；插件作者以 solo 快迭代为主、无此需求。可跟踪的预言仍是：若半年后插件仓开始出现 `.specify/`，说明 SDD 流程开始被这些作者使用；若仍为零，说明插件层的默认跑法没有接上这套产物链。

## 最接近的一句话

**社区的默认是给个目标就开跑，把把控力做进门禁与审批点；小项目连管线层都不放进仓库。这和 owner「有点像 loop」的体感同向，但社区文本没有把这件事叫成 loop engineering，官方也没有。他的 ROADMAP 是多 feature、长周期项目自己长出来的进度盘。**
