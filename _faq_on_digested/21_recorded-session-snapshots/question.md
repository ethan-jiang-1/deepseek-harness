# 录制会话快照（`snapshots/`）：主仓为什么离不开它，插件仓到底需不需要它？

先读 [`answer.md`](./answer.md) 的一分钟版。那一页有阅读顺序和术语表；下面是这组页面要回答的问题。

## 问题是怎么冒出来的

我最初的判断是：**「快照是 DSH 主仓的内政，插件仓不需要这个。」** 理由是 `snapshots/` 归主仓语料所有、`pnpm run test:snapshot` 是根脚本、那套 `snapshot.yml` 守卫服务的是 210 个场景的语料治理。

这个判断被质疑了：**「你确认开发插件完全不需要这个东西吗？这个不是可以做成一个 trajectory 呀，还是 bug reproduce 什么东西的吗？」**

重挖之后，**这个质疑是对的，我原来的判断错了一半**。错的不是「插件仓不该复刻主仓那套语料治理」——那部分仍然成立；错的是把「主仓的顶层语料树」和「录制回放这套机制」当成了一件事。前者搬不走，后者是**两个已发布的 npm 包**，插件仓可以直接装、直接用。

于是这组页面要回答四个层层递进的问题：

1. **主仓为什么非要它？** 不给会怎样？他们试过哪些替代方案、为什么不够？
2. **一个 `session.jsonl` 到底是什么？** 它算不算 trajectory？一份录制里到底有什么、缺什么？
3. **插件仓能不能用？** 能用到哪一层？最小可用配置长什么样？bug 复现怎么做？
4. **什么搬不出去？** 边界在哪？插件仓应该怎么组织这件事——默认做、还是按需做？

## 结论先说

- **主仓需要它，是因为它买到了一样别处买不到的东西**：完整装配后的真实转录——模型实际收到什么、说了什么、落了什么盘——并且能在无 key 的 CI 里逐字节比对。这不是单测、e2e 或覆盖率能替代的（有一个 178 个单测全绿、100% 行覆盖、生产完全不能用的插件作为起点）。
- **插件仓能用它，而且正是用在 trajectory 与 bug 复现上**。`@deepseek-ai/dsh-llm-replay` 的 `next` 通道发布版本就是本基线 `0.2.0-rc.2`；它接受**未做投影的原始运行日志**（只要每行要么都带 `seq`/`time`、要么都不带），所以「跑一次真会话 → 把日志提交进仓 → 以后无 key 重放」这条路是通的。
- **搬不出去的是语料治理，不是机制**。顶层 `snapshots/` 的所有权、四面分工、corpus policy、格式世代候选名单、`session-snapshot` 的语料级守卫，都服务「一个仓库集中维护几百个场景」这个规模；插件仓照抄只会得到一套没人维护的制度。
- **所以推荐不是「用」或「不用」，而是一条阶梯**：前四阶（导出守卫 → 行为 spec → HMR → REAL composition）默认全做，第五阶「trajectory 夹具」按触发条件启用——判据见 [05](./05-plugin-repo-organization.md)。

## 范围与边界

- 本文回答的是「这套机制是什么、为什么存在、能不能移植、插件仓该怎么摆」，**不重写** `_digested/test-strategy/` 已有的机制整理：快照层的分层与车道见 [04-snapshot-machinery](../../_digested/test-strategy/04-snapshot-machinery.md)，插件测试的五个台阶见 [08-plugin-testing](../../_digested/test-strategy/08-plugin-testing.md)，真实插件的测试组合解剖见 [09-plugin-testing-playbook](../../_digested/test-strategy/09-plugin-testing-playbook.md)，插件 PR 的最小证据集见 [10-plugin-testing-checklist](../../_digested/test-strategy/10-plugin-testing-checklist.md)。本文补的是那四篇没有回答的部分：**外部插件仓视角下的可复用性与组织方案**。
- **源码核验基线**：本仓库工作树 `187ad35dac677485653be1847d0aac808dde42a1`（2026-10-08）。所有行号以该工作树为准；`_faq_on_digested/00-index.md` 声明的运行时基线 `dsh-v0.2.0-rc.2`（`639ed01539`）在本篇用于行为结论，两者在本轮未观察到冲突。
- **npm 版本**：`@deepseek-ai/dsh-llm-replay` 与 `@deepseek-ai/dsh-session-snapshot` 的 `next` dist-tag 实测为 `0.2.0-rc.2`，与本基线一致；`latest` 通道停在更早的 `0.0.1-rc.1` / `0.1.2-alpha.2`。装包时用 `@next`（或与你所用 CLI 相同的版本），不要用 `latest`。
- 本仓库的 git 克隆是**浅克隆**（最早提交 2026-07-30），因此 2026-07-30 之前的提交无法核对；早期决策只能引用 Agent Note 与文档，这一点在 [reference.md](./reference.md) 的「证据薄弱处」单独列出。

## 入口

导航表只在 [`answer.md`](./answer.md) 一处维护。
