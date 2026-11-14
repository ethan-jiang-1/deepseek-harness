# Reference · 录制会话快照源码与文档出处

本页汇总本专题涉及的 DSH 主仓文档、事故复盘、决策记录、测试辅助包源码与真实快照样例入口。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、主仓测试分层、所有权与事故复盘

| 主题 | 仓库权威入口 |
|---|---|
| 测试整体分层（单测 / 100% 覆盖率门禁 / 真模型 e2e / `test:expected` / `test:snapshot` / `test:web`）与强制触发规则 | [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) |
| 顶层 `snapshots/` 目录所有权、进程启动约束、世代命名、确定性占位符脱敏与 `workspace.expected/` 独立终态断言规则 | [`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md) |
| `model-visible ⟺ logged` 根级不变量与请求可重建性设计 | [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md) · [`2026-07-05-reconstructable-requests.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md) |
| **Postmortem 0001**：178 个单测全绿、100% 行覆盖率下 ACP 默认导出吞掉 `inject` 导致生产完全不可用 | [`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md) |
| **Postmortem 0002**：`!!js` 配置缺陷禁用文件系统工具，快照刷新将 7 个场景的 `UNKNOWN_TOOL` 录为新期望输出并全绿放行 | [`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md) |
| **Postmortem 0003**：Web 智能体用裸 Vite 绕过真实入口验收（会话日志在复盘中充当还原现场的取证记录） | [`docs/postmortem/0003-web-agent-gui-feedback-loop.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0003-web-agent-gui-feedback-loop.md) |
| **Postmortem 0004**：Landlock 降级提示行被误判为沙箱失败（使用录制会话快照锁定组装回归的典型样本） | [`docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md) |

---

## 二、快照层架构决策记录（为何采用“一份日志两用”）

| 决策要点 | 决策记录入口 |
|---|---|
| 快照层初创背景、真运行保真度 + 夹具确定性目标，以及否决手写 `llm.json`、否决 HTTP 字节级录放、否决从 `turn/end` 反推异常的理由 | [`2026-06-19-acp-snapshot-tests.md`（历史归档）](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-06-19-acp-snapshot-tests.md) |
| 移除冗余 `session.expected.jsonl`，确立单一会话日志同时充当回放输入与期望输出 | [`2026-06-20-remove-redundant-snapshot-log-expected-output.md`（历史归档）](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-06-20-remove-redundant-snapshot-log-expected-output.md) |
| 用 overlay 补丁取代维护两份近似配置，防止 live 配置与 snapshot 配置静默漂移 | [`2026-07-04-single-source-acp-replay-config.md`（历史归档）](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-07-04-single-source-acp-replay-config.md) |
| 请求头（系统提示词与工具 Schema）按类提取至可读 sidecar，否决哈希瘦身以保护可重建性 | [`2026-07-06-pin-request-header-content-in-one-scenario.md`（历史归档）](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md) |
| Web 浏览器快照车道设计，否决浏览器侧 SSE 拦截与假 `DEEPSEEK_BASE_URL` HTTP 服务 | [`2026-07-24-web-gui-browser-e2e-lane.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md) |
| 提交夹具省略顶层 `seq`/`time` 包络、回放时合成，减少插入事件引发的无意义重编号 diff | [`2026-08-18-session-snapshot-envelope-projection.md`（历史归档）](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-08-18-session-snapshot-envelope-projection.md) |
| 会话快照语料治理，以及“同一份文件两用会一致重现错误模型脚本”的残余风险声明 | [`2026-08-24-session-log-snapshot-corpus.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/testing/2026-08-24-session-log-snapshot-corpus.md) |
| 已发布会话格式的不可变世代与相邻迁移校验 | [`2026-08-31-released-session-format-migrations.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md) · [`docs/session-format-status.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/session-format-status.md) |
| 真模型 e2e 在无密钥 CI 下自动跳过的策略说明 | [`2026-06-19-real-api-e2e-ci.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md) |

---

## 三、`@deepseek-ai/dsh-llm-replay` 与插件接线源码依据

| 机制与配置细节 | 源码与包文档入口 |
|---|---|
| `dsh-llm-replay` 公开包清单（`publishConfig.access: "public"`，与 DSH 主序列同步版本号及 `latest`/`next` 发布通道） | [`packages/test-support/llm-replay/package.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/package.json) · [`2026-08-10-npm-release-sequences.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md) |
| 回放器完整用法、配置项（`file` / `overrideFile` / `childFiles` / `providers` / `paceMs`）、异常覆盖语法与并发子智能体限制说明 | [`packages/test-support/llm-replay/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/README.md) |
| 标准函数插件导出（`name` / `inject` / `apply`）、`parseSessionLog` 兼容 `complete` 与 `projected` 日志、格式目录版本一致性断言、`ReplayEntry` 封闭字段解析与 `assertConsumed()` 诊断 | [`packages/test-support/llm-replay/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/src/index.ts) |
| 会话 JSONL 持久化默认采用 `zstd` 压缩，且单个 `root` 目录内禁止混放压缩与明文编码 | [`packages/session/session-persistence-jsonl/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-persistence-jsonl/README.md) |
| 零配置获取明文会话日志：Web 导出与 `/export` 经持久化层解码后重新序列化为标准明文 JSONL zip | [`packages/session-query/session-log-export/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session-query/session-log-export/README.md) · [`packages/session-query/session-log-export/src/archive.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session-query/session-log-export/src/archive.ts) |
| 基础 bundle 中默认挂载的真实模型适配器行 ID（`llm-deepseek`、`llm-deepseek-account`）与标题生成模型行 ID（`session-title-llm`） | [`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml) |
| CLI `--patch` 叠加语义与 `dsh plugin --profile <p> add` 插件安装入口 | [`apps/cli/src/args.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/args.ts) · [`vendor/include/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/include/src/index.ts) |
| 主仓语料级快照辅助包（强依赖 `vitest` 运行时，内含 `UNKNOWN_TOOL` 语义拒绝守卫、`authored` 免覆盖保护与幂等脱敏逻辑，外部插件仓无需安装） | [`packages/test-support/session-snapshot/src/suite.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/src/suite.ts) · [`packages/test-support/session-snapshot/src/normalize.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/src/normalize.ts) · [`scripts/session-snapshot-corpus-policy.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/session-snapshot-corpus-policy.ts) |

---

## 四、主仓代表性测试与快照夹具样板

| 用途 | 仓库样板路径 |
|---|---|
| 第 1 步 · 导出形态守卫（防 `export default` 吞掉命名空间） | [`packages/lsp/tool-lsp/tests/load-path.spec.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/lsp/tool-lsp/tests/load-path.spec.ts) |
| 第 2 步 · 工具行为单测与投影卸载清理（HMR）测试 | [`packages/todo/tool-todo/tests/tool-todo.spec.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/todo/tool-todo/tests/tool-todo.spec.ts) · [`packages/todo/tool-todo/tests/projection.spec.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/todo/tool-todo/tests/projection.spec.ts) |
| 第 3 步 · 真实 `Loader` 配置装配测试 | [`packages/todo/tool-todo/tests/loader-composition.spec.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/todo/tool-todo/tests/loader-composition.spec.ts) |
| 24 行标准单工具回合轨迹解剖样本 | [`snapshots/session/bash-tool-turn/session.v4.jsonl`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/bash-tool-turn/session.v4.jsonl) |
| 无密钥回放叠加层补丁样板 | [`snapshots/session/compaction-recovery/cordis.snapshot.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/compaction-recovery/cordis.snapshot.yml) · [`snapshots/acp/escalation-approved/cordis.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/acp/escalation-approved/cordis.yml) |
| `replay.override.json` 首包前抛错（HTTP 401）与流挂起取消样板 | [`snapshots/session/error-finish/replay.override.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/error-finish/replay.override.json) · [`snapshots/acp/cancel/replay.override.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/acp/cancel/replay.override.json) |
| 独立于会话转录的外部世界状态断言样板（`workspace.expected/`） | [`snapshots/session/background-confinement-failure/workspace.expected/confinement-audit.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/background-confinement-failure/workspace.expected/confinement-audit.json) |
| 手写最小 `authored` 轨迹锁住历史畸形参数回归案例（含同提交落地记录） | [`snapshots/session/deepseek-messages-invalid-tool-history/session.v3.jsonl`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/deepseek-messages-invalid-tool-history/session.v3.jsonl) · [历史提交 `1f030b3c1c`](https://github.com/deepseek-ai/deepseek-harness/commit/1f030b3c1c5aa7164a42f483075c80fe29559f41) |

---

## 五、常用体积与场景统计复核命令

若需在当前检出树上复核主仓 `snapshots/` 的场景数量与 Git 跟踪字节规模，可直接运行以下只读命令：

```sh
# 统计各入口快照场景数与 JSONL / override / sidecar 数量
find snapshots -name snapshot.yml | wc -l
find snapshots -name '*.jsonl' | wc -l
find snapshots -name 'replay.override*.json' | wc -l

# 按 Git blob 真实字节统计 snapshots/ 占用（避免磁盘 4KB 块对齐虚高）
git ls-tree -r -l HEAD snapshots | awk '{sum += $4} END {printf "%.2f MB (%d files)\n", sum/1024/1024, NR}'
```
