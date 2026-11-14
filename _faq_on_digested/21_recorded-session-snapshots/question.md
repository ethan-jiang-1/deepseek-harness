# 录制会话快照（`snapshots/`）：主仓为什么离不开它，插件仓到底需不需要它？

## 问题是怎么冒出来的

我最初的判断是：**「快照是 DSH 主仓的内政，插件仓不需要这个。」** 理由是 `snapshots/` 归主仓语料所有、`pnpm run test:snapshot` 是根脚本、那套 `snapshot.yml` 守卫服务的是 250 个场景的语料治理。

这个判断被质疑了：**「你确认开发插件完全不需要这个东西吗？这个不是可以做成一个 trajectory 呀，还是 bug reproduce 什么东西的吗？」**

要检验这个质疑，需要把三件事分开：主仓的顶层语料治理、录制回放机制本身、以及插件仓能用到哪一层。前者是否搬得走，不等于后者是否可用。于是这组页面要回答六个层层递进的问题：

1. **主仓为什么非要它？** 不给会怎样？他们试过哪些替代方案、为什么不够？
2. **一个 `session.jsonl` 到底是什么？** 它算不算 trajectory？一份录制里到底有什么、缺什么？
3. **插件仓能不能用？** 能用到哪一层？最小可用配置长什么样？
4. **它对插件开发到底值多少？** 买到什么、付什么代价、上限在哪？
5. **什么搬不出去、该怎么组织？** 默认做还是按需做？目录怎么摆？
6. **这些证据该不该 check in 进 git？** 会不会没完没了地增长、占用失控？

## 范围与边界

- 本文回答的是「这套机制是什么、为什么存在、能不能移植、值多少、插件仓该怎么摆」，**不重写**产品树已有的机制整理：快照层的分层与车道见 [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)，快照所有权与规范化见 [`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)，插件测试的台阶与检查单由本文 05 给出。本文补的是外部仓的实践校准、组织方案与价值判断。
核验状态见 [核验基线登记](../00-baseline.md)。
- **npm 版本**：`@deepseek-ai/dsh-llm-replay` 与 `@deepseek-ai/dsh-session-snapshot` 的 `next` dist-tag 上轮实测为 `0.2.0-rc.2`；**本轮 registry 不可达、未复测**，只可按本基线 `package.json` 版本 `0.2.1-rc.2` 推定，需下次联网时实测复核。`latest` 通道停在更早的 `0.0.1-rc.1` / `0.1.2-alpha.2`（同为上轮读数）。装包时用 `@next`（或与你所用 CLI 相同的版本），不要用 `latest`。
- 本仓库的 git 克隆是**浅克隆**（`.git/shallow` 里有 158 个边界提交，边界落在 2026-07-30 到 8 月下旬之间），边界之外的历史无法核对；早期决策只能引用 Agent Note 与文档，这一点在 [reference.md](./reference.md) 的「证据薄弱处」单独列出。
- 六张图（`figures/*.svg`）是本文的解释件，不是新证据：图里的每个事实都能在正文或 [reference.md](./reference.md) 找到出处。

## 入口

导航表只在 [`answer.md`](./answer.md) 一处维护。
