# 附录 · 全部出处

每条结论对应的仓库路径与行号。所有行号以本工作树 `187ad35dac677485653be1847d0aac808dde42a1`（2026-10-08）为准；产品行为结论以 `_faq_on_digested/00-index.md` 声明的运行时基线 `dsh-v0.2.0-rc.2`（`639ed015397290b3745d163aafe02ffee4aa3f84`）为准。

## 一、主仓为什么需要它（[01](./01-why-dsh-needs-it.md)）

| 结论 | 出处 |
|---|---|
| 起点是 ACP 生产事故（178 单测绿 / 100% 覆盖 / 完全不能用） | `docs/postmortem/0001-acp-default-export-drops-inject.md:13` |
| 两个 bug 的共同根因是「没走真实装载路径与真实调用拓扑」 | 同文件:91 |
| 覆盖率证明「行跑过」，不证明「按发布形态工作」 | 同文件:98 |
| 单测不覆盖完整装配子进程；真 API 测试不确定且需要 key | `.agents/notes/implemented/testing/2026-06-19-acp-snapshot-tests.md:9` |
| 「需要真运行的保真度 + 夹具的确定性」 | 同文件:11 |
| 一份会话世代同时充当回放源与行为期望 | 同文件:21 |
| 否决：手写 `llm.json` | 同文件:76 |
| 否决：HTTP 字节级录放（Polly/nock/MSW） | 同文件:78 |
| 否决：从 `turn/end` 合成 throw/cancel（reason 有损） | 同文件:79 |
| 否决：每个 header 类复制两份 sidecar | 同文件:80 |
| 否决：独立的 `session.expected.jsonl` | `.agents/notes/archived/testing/2026-06-20-remove-redundant-snapshot-log-expected-output.md:10` |
| 否决：live 与 snapshot 两份配置（125 行近乎复制、静默漂移） | `.agents/notes/archived/testing/2026-07-04-single-source-acp-replay-config.md:10,22` |
| 否决：给 session log 瘦身（违反可重建性） | `.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md:28` |
| 否决：浏览器 SSE 拦截 / 在 `DEEPSEEK_BASE_URL` 挂 mock provider | `.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:63,65` |
| 投影：省略 body 包络、回放再合成；否决省略运行时包络 | `.agents/notes/archived/testing/2026-08-18-session-snapshot-envelope-projection.md:10,18,22` |
| 「一份文件两用会一致地复现坏脚本」 | `.agents/notes/implemented/testing/2026-08-24-session-log-snapshot-corpus.md:78` |
| model-visible ⟺ logged 不变量的完整表述 | `.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md:17`；根 `AGENTS.md:138` |
| 快照设计「沿这条不变量比先例更进一步」 | `.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:59` |
| 只有真夹具能钉住组装后的提示词与工具集合 | `.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md:26` |
| 强制条款：model/protocol/human-visible 改动同 PR 加场景 | `docs/testing.md:55` |
| 持久化格式回归的唯一提交在案样本 | `.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:84` |
| 无 key 的默认立场与 e2e 自跳的代价 | `.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md:11`；`docs/testing.md:11,25` |
| record 花真 API 配额 / record 与 refresh 串行 | `vitest.snapshot.config.ts:63` |
| 四零件（manifest / workspace / sidecar / token）的规则 | `snapshots/AGENTS.md:7,11,15` |

## 二、trajectory 解剖（[02](./02-what-a-trajectory-is.md)）

| 结论 | 出处 |
|---|---|
| 夹具两种记法（历史 `assistant/chunk` 行 vs 当前紧凑内嵌） | `docs/testing.md:17`；实测 `snapshots/session/text-turn/session.v1.jsonl`（8 条 `assistant/chunk`）与 `snapshots/session/bash-tool-turn/session.v4.jsonl`（无 chunk 行） |
| 回放会展开紧凑流 | `packages/test-support/llm-replay/README.md` 的 How the fixture works 一节 |
| `system/message` 正文 token 化 | `packages/test-support/session-snapshot/src/normalize.ts:515`（`scrubSystemPrompts`） |
| 请求头工具 schema token 化、保留字段存在性 | 同文件:531（`scrubToolSchemas`） |
| 变换幂等 | 同文件:546（`scrubModelRequestBulk`） |
| 身份 token 是「按类首次出现顺序」 | `packages/test-support/session-snapshot/src/identity.ts:5`（`CANONICAL_TOKEN_RE`）、`:8`（kind 列表）、`:46`（`redactSessionSnapshotIds`） |
| 「不得因为像标识符就脱敏任意用户/工具文本」 | `snapshots/AGENTS.md:11` |
| 缺的三类失败：纯抛出、取消/挂起、注入重试 | `packages/test-support/llm-replay/README.md` 的 Failure modes and overrides 一节；`.agents/notes/implemented/testing/2026-06-19-acp-snapshot-tests.md:79` |
| `SESSION_FORMAT_VERSION` 是唯一手维护的当前写入版本号 | `packages/core/session/src/types.ts:89`；`docs/session-format-status.md:20` |
| V4 已定稿、V3 是已发布格式 | `docs/session-format-status.md:32,46` |
| 回放解析经 catalog 解码并迁移 | `packages/test-support/llm-replay/src/index.ts:200` 起的 `parseSessionLog` |
| 快照面规模（210 场景 / 1271 文件 / 7 符号链接） | `find snapshots -name snapshot.yml \| wc -l` 等实测，见本文「实测口径」 |

## 三、插件仓能复用什么（[03](./03-what-a-plugin-can-reuse.md)）

| 结论 | 出处 |
|---|---|
| `dsh-llm-replay` 是 function 插件形态 | `packages/test-support/llm-replay/src/index.ts:1125`（`name`）、`:1126`（`inject`）、`:1129`（`Config`）、`:1192`（`apply`） |
| `file` 必填，来自 Config 或 `$DSH_SNAPSHOT_FILE` | 同文件:1193–1195 |
| `overrideFile` / `childFiles` / `providers` / `paceMs` | 字段声明 `packages/test-support/llm-replay/src/index.ts:1132–1143`，env 接线 `:1198–1207`；`packages/test-support/llm-replay/README.md` 的挂载表 |
| 夹具可以 complete 或 projected，但**不能混** | `packages/test-support/llm-replay/src/index.ts:200`、`:259–262` |
| `--patch` 是叠加在 profile 层之后的可重复 overlay | `apps/cli/src/args.ts:170`（选项定义）、`:73`（可重复语义） |
| 主仓从夹具推导任务、不另写 `input.json` | `snapshots/AGENTS.md:7` |
| `assertConsumed()` 把静默少跑变成诊断 | `packages/test-support/llm-replay/src/index.ts:1107`；只在 `installLlmReplay` 上暴露，Cordis 插件形态拿不到 |
| 并发子代理会非确定地绑脚本（已知限制） | `packages/test-support/llm-replay/README.md` 的 Known Limitations 一节 |
| `recording: live \| authored` 的区分 | 类型 `packages/test-support/session-snapshot/src/manifest.ts:10`；`authored` 不被 record 覆盖 `packages/test-support/session-snapshot/src/suite.ts:1307` |
| 会话日志默认是 zstd 压缩，回放器读不了 | `packages/session/session-persistence-jsonl/README.md:48`（默认 `'zstd'`）；`packages/test-support/llm-replay/src/index.ts:773`（裸 `readFileSync` + 逐行 JSON） |
| 一个持久化 root 只允许一种编码 | `packages/session/session-persistence-jsonl/README.md:104` |
| 主仓怎么把压缩关掉 | `snapshots/acp/escalation-approved/cordis.yml:29–32` |
| 夹具 header 必须带显式整数 `version` | 回放器的 strict restore（`packages/test-support/llm-replay/src/index.ts:239–245`）；无版本号报 `Session format version must be a non-negative safe integer` |
| 包版本错配在 import 时即失败 | `packages/test-support/llm-replay/src/index.ts:42`（catalog 与 writer 版本一致性断言） |
| 装回放器的官方途径 | `apps/cli/src/args.ts:188` 的 `dsh plugin` 子命令（帮助文本示例：`dsh plugin --profile tui add <package>`） |
| 零配置取明文轨迹 | `packages/session-query/session-log-export/README.md:28`（`/export` / 「Download session log」导出 canonical JSONL 的 zip）；明文由持久化层解码后重新序列化保证，`packages/session-query/session-log-export/src/archive.ts:148`、`:165` |
| overlay 的 `config:` 是整键替换而不是深合并 | `vendor/include/src/index.ts:120–123`；`name:` 在 patch 里可选（`:115–118`） |

## 四、值多少与代价（[04](./04-what-its-worth.md)）

| 结论 | 出处 |
|---|---|
| 顶层树只放会话驱动的测试 | `snapshots/AGENTS.md:3` |
| 进程必须经 `dsh` CLI + shipped profile；不许新入口 | 同文件:5 |
| 四面各自拥有的证据 | `docs/testing.md:14` |
| corpus policy 的配额（基线 3 / 保留角色 ≤11 / V0 覆盖名单 / 多数派） | `scripts/session-snapshot-corpus-policy.ts:24,25,26,40` |
| corpus gate 只在 `test:snapshot` 里跑 | `vitest.snapshot.config.ts:52` |
| `*.snapshot.ts` 后缀保留给指定适配器 | `scripts/session-snapshot-corpus.corpus.ts:101–103` |
| `dsh-session-snapshot` 只能在 vitest run 内使用 | `packages/test-support/session-snapshot/src/index.ts:14`（`src/suite.ts:26` 是那条 `import`） |
| 语义守卫：`UNKNOWN_TOOL` 被拒 | `packages/test-support/session-snapshot/src/suite.ts:1347`（fresh run）与 `:1198`（夹具侧）；`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:41` |
| **快照套件为回归背书** | `docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:19` |
| **「快照框架把任何确定性转录都当成合法行为」** | 同文件:34 |
| **「刷新是生产夹具，不是正确性评审」** | 同文件:46 |
| 四篇 postmortem 的回归面归属 | `docs/postmortem/0001-…md:104`（真 stdio e2e）、`0002:38–41`（静态门 + 语义守卫）、`0003:41–45`（分层真路径 e2e）、`0004:47–48`（原生边界单测 + 快照） |
| 轨迹作为事后取证记录 | `docs/postmortem/0003-web-agent-gui-feedback-loop.md:17` |
| 没有 `dsh session` 子命令（只有 `plugin`） | `apps/cli/src/args.ts:188` |
| 轨迹的读取面：Web `/export`、`session_search` 等工具、`ctx.sessionQuery` | `packages/session-query/session-log-export/README.md:28,55`；`packages/session-query/tool-session-query/src/index.ts:66,76,86,96,109`；`packages/session-query/session-query/README.md:28,35` |
| 快照收集需要 `compression: 'none'` | `packages/test-support/session-snapshot/README.md` 的 What can go wrong 一节 |

## 五、组织推荐（[05](./05-plugin-repo-organization.md)）

| 结论 | 出处 |
|---|---|
| 台阶 L0–L3 的定义与样板 | `_digested/test-strategy/08-plugin-testing.md` 的五台阶与 09 的五套组合解剖 |
| 插件 PR 的最小证据集 | `_digested/test-strategy/10-plugin-testing-checklist.md` |
| 主仓里插件通过 patch 进入快照场景 | `_digested/test-strategy/09-plugin-testing-playbook.md` 的「快照场景怎么带上一个插件」一节；样板 `snapshots/session/agent-instructions/cordis.snapshot.yml` |
| 独立插件仓的组织、DSH 源码引入、spec 流程 | `_faq_on_digested/13_expert-plugin-repo-organization/answer.md` 与四个 option 分篇 |
| 独立插件仓的开发 Harness 语料 | `_dsh_plugin_agent_ready_development/README.md` |
| 独立 oracle 样板（独立于转录的外部事实） | `snapshots/session/background-confinement-failure/workspace.expected/confinement-audit.json` |

## 六、bug 复现（[06](./06-bug-reproduction-playbook.md)）

| 结论 | 出处 |
|---|---|
| `ReplayEntry` / `ReplayOverrideDoc` 类型 | `packages/test-support/llm-replay/src/index.ts:64–71` |
| 解析器与封闭字段检查 | 同文件:691（`readReplayEntry`）、`:695`（`hasExactKeys`）、`:737`（`readOverrideDoc`）、`:777`（`resolveReplayScript`） |
| 零 chunk 抛默认 pre-2xx；post-2xx 需 `accepted: true` | `packages/test-support/llm-replay/README.md` 的 Failure modes and overrides 一节 |
| `hang` 的 `readyFile` 语义 | 同处 |
| `{patches:[{at, entry}]}` 语义 | 同处 |
| 失败诊断：`script exhausted` / `fixture not fully consumed` | `packages/test-support/llm-replay/src/index.ts:1078`、`:1119` |
| 真实样例：pre-2xx 抛（HTTP 401） | `snapshots/session/error-finish/replay.override.json`；对应夹具 `snapshots/session/error-finish/session.jsonl:14` |
| 真实样例：挂起 + 外部取消 | `snapshots/acp/cancel/replay.override.json`、`snapshots/acp/cancel/input.json` |
| 真实样例：`{patches:[…]}` 形态 | `snapshots/web/{file-upload-round,goal-multi-turn-actions,lifecycle-chrome}/replay.override.json`（都只打 `chunks` 补丁） |
| 只有单元测试、没有提交在案的样例：post-2xx 抛（`accepted: true`）与「注入瞬时失败再重试」 | `packages/test-support/llm-replay/tests/llm-replay.spec.ts:1559`；`:1239`、`:1247` |
| 真实样例：整脚本替换 + 独立 workspace oracle | `snapshots/session/background-confinement-failure/replay.override.json`、`workspace.expected/confinement-audit.json` |
| 真实样例：取消时排队中的兄弟调用不得派发 | `snapshots/acp/cancel-tool-calls/`（`workspace.expected/` 里**没有** `skipped.txt` 就是断言） |
| 案例走查：畸形历史工具参数仍须发出第二轮请求 | `snapshots/session/deepseek-messages-invalid-tool-history/session.v3.jsonl`；修复提交 `1f030b3c1c5aa7164a42f483075c80fe29559f41` |
| 同类 commit / 场景配对 | `82c6a5e4f485d7570161e15b4de377e4d49eece9`、`b79a227cec941405c9b368524446145298e9d48d`、`61c548e200ab00e6eceaf81bce3a819c195f393c`、`73e38e1758fe5ebdc914f6d6d002142a1eb5ce21` |
| `authored` 场景不被 record 覆盖 | `packages/test-support/session-snapshot/src/suite.ts:1307` |

## 七、现实校准：两个独立插件仓（仓外路径，仅参考）

本篇 03/04/05 的接线与组织建议在两个真实插件仓里校准过。它们在仓外，本目录的 verifier 只对其作警告、不校验；引用按原样给出。

| 结论 | 出处（绝对路径） |
|---|---|
| 回放接线用发布包：整脚本 override 形态 + providers 命名对齐 base 的默认模型行 | `/Users/bowhead/ai_dsh_assitant/dev/probes/session/preset-runner-replay.patch.yml` |
| 静默失效一：行 id 写错不报错（只有 `--dump-config` 一行 `patch: entry "…" not found`），真实 adapter 照常接流——2026-09-30 实测，凭据来自 home 的 `.credentials.yaml` | 同上文件头注释 |
| 静默失效二：裸 `ReplayEntry[]` 塞进 `file` 报 `session snapshot line 1 …` 并使整行不 activate；裸脚本实放 `overrideFile` | 同上；`/Users/bowhead/ai_dsh_assitant/dev/fixtures/llm-replay-fixture.json` |
| 探针的证据位在**请求侧**：canned 回复 + 真实组装的 system/tools 进日志（keyless 产出 model-visible 证据） | 同上 patch 文件头注释 |
| 判据集由消费者固定、声明不可削减；注入种类**双向**自守（基线外新增 / 比对面未覆盖都报红）；录制身份逐 case 校验（40 位 commit 或 `unknown-historical`） | `/Users/bowhead/ai_dsh_deep_research/snapshots/README.md`、`scripts/lib/replay-scene.mjs`、`notes/implemented/2026-10-09-snapshots-adoption.md` |
| title LLM 也消耗回放脚本位（实测 title 拿走第 2 个 settlement，3 次搜索只回放 2 次） | `/Users/bowhead/ai_dsh_deep_research/notes/implemented/2026-09-24-keyless-snapshot-lane.md` |
| 顶层 `snapshots/` 选型理由与输掉方案清单（含「路径型义务门禁假阳率高被否决」） | `notes/implemented/2026-10-09-snapshots-adoption.md` |
| 渲染期望作为会话回放的姊妹形态：DOM 证据比对 + 自有 harness + 实测成本台账 + prove-it-red 记录 | `/Users/bowhead/ai_dsh_assitant/snapshots/web-face/blank-first-open/README.md` |
| 两仓均为方案 A（pinned submodule）：`vendor/dsh` 钉在上游 | 两仓 `.gitmodules`（url = deepseek-ai/deepseek-harness） |

## npm 实测口径

2026-10-08 用 `npm view <pkg> version dist-tags`（备用 cache 目录）实测：

```text
@deepseek-ai/dsh-llm-replay      latest: 0.0.1-rc.1   next: 0.2.0-rc.2   alpha: 0.2.1-alpha.2
@deepseek-ai/dsh-session-snapshot latest: 0.1.2-alpha.2 next: 0.2.0-rc.2  alpha: 0.2.1-alpha.2
@deepseek-ai/dsh                 latest: 0.2.0-rc.2   next: 0.2.0-rc.2   alpha: 0.2.1-alpha.2
```

两个包的 `package.json` 都带 `publishConfig.access: public`，且**没有** `private: true`（`packages/test-support/llm-replay/package.json`、`packages/test-support/session-snapshot/package.json`）。**装包时跟随你的 CLI 版本通道**：本基线对应 `next`。

## 实测口径（数字怎么数的）

```sh
cd snapshots
find . -name snapshot.yml | wc -l          # 210 个场景
find . -type f | wc -l                     # 1271 个常规文件（另有 7 个符号链接）
find . -name '*.jsonl' | wc -l             # 444
find . -name 'replay.override.json' | wc -l # 32（session 24 / sdk 3 / web 3 / acp 2）
find . -name 'system-prompt.expected.md' | wc -l   # 56
find . -name 'tool-schemas.expected.json' | wc -l  # 55
for d in session sdk acp web; do find $d -name snapshot.yml | wc -l; done  # 122 / 24 / 9 / 55
```

事件类型普查用 Node 逐行 `JSON.parse` 后按 `type` 计数（`snapshots/session/{bash-tool-turn,agent-instructions,subagent-multi,text-turn}/`）。

## 证据薄弱处

- **浅克隆。** 本仓库是浅克隆（`git rev-parse --is-shallow-repository` 为 true），`.git/shallow` 里有 158 个边界提交，边界落在 2026-07-30 到 8 月下旬之间。边界之外的历史无法核对，早期决策只能引用 Agent Note 与文档。**推论**：任何「某提交创建了某个目录」的说法在这个克隆里都不可判定——`git show --stat` 会把边界提交与空树相比，显示出几百个「新增」文件。
- **成本是设计约束而非实测。** 全仓只有一句「record spends real API quota per scenario」（`vitest.snapshot.config.ts:63`），没有录制耗时或花费的量化数据；`docs/testing.md:25` 还明确说自跳「不是成本信号」。
- **「真模型测试不确定」这句话本身没有被量化。** 它是断言（`.agents/notes/implemented/testing/2026-06-19-acp-snapshot-tests.md:11`，以及 Web 车道引用 open-webui 删掉整套套件的先例），本仓库没有对应的 flake 统计或失败率数据。
- **`snapshots/web/` 大多不在 `test:snapshot` 车道里。** 它们由 `test:web` 的 `apps/web/tests/*.e2e.ts` 驱动，只有四个 `.snapshot.ts` 适配器进快照车道（`vitest.snapshot.config.ts:55`）。本文引用 `snapshots/web/` 的场景时指的是语料形态，不是「它跑在 `test:snapshot` 里」。
- **`fresh-round-trip` 有个未解释的不一致**：驱动硬编码 `session.v3.jsonl`，而其他场景借用它的 `session.v4.jsonl`。文件本身没有注释解释，本文不做推断。
- **`bash-startup-timeout` 等场景「bug 回来会怎样」是推断**，来自提交标题与提交在案的期望文本，没有真的把修复回滚去观察。
- 本文所有关于**行为**的结论都来自读源码、读夹具与读文档；**没有运行** `pnpm run test:snapshot`（只读研究，不产生写入与 API 调用）。
