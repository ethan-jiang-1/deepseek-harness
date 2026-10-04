# 10 — 插件作者检查单：一个插件 PR 的最小证据集

> 本篇把 [01](./01-doctrine.md) 的政策、[08](./08-plugin-testing.md) 的台阶模型、[09](./09-plugin-testing-playbook.md) 的实战组合收拢成可执行的时间线：**计划时 → 写测试时 → 提 PR 前**，以及"你的 PR 会被哪些车道跑到"。命令选取的完整决策流程见 `dsh-pre-push-checks`（[03](./03-rules-ownership.md)）。

## 计划时（写代码之前）

1. **先查货架**（[`plugin-inventory/00`](../plugin-inventory/00-map.md)）：能力是否已有现货；九形态 × 四 role 里你的插件属于哪一形态。
2. **点名 tier**（root `AGENTS.md`："Plan unit, e2e, and snapshot coverage for capability seams, lifecycle paths, and transcript output"）：这个插件会动 model-visible 面吗（新工具/新 prompt 注入/新投影事件）？会发布 `bin` 或 built 消费入口吗？——每个"会"都对应 [08](./08-plugin-testing.md) 的一个台阶，在 PR 描述里写清。
3. **缺快照基建要同 PR 补**：若你的插件需要现有 harness 不支持的录制/回放能力（新平台变体、新 sidecar 类型），snapshot-harness 支持与功能同一 PR 交付。

## 写测试时（五个台阶逐一对表）

| 台阶 | 最小要求 | 样板 |
|---|---|---|
| 导出形态守卫 | `expect('default' in mod).toBe(false)` + `unwrapExports` round-trip + name/inject 断言 | `packages/lsp/tool-lsp/tests/load-path.spec.ts:14` |
| 行为 spec | 真依赖服务 + 只 stand-in 最外层包装；从注册后入口（`ctx.tools.execute` 等）调 | `packages/todo/tool-todo/tests/tool-todo.spec.ts` |
| HMR-safety | dispose 贡献 fiber → 断言贡献消失、服务自身不受影响 | `tool-todo/tests/projection.spec.ts` |
| REAL composition | 进程内真 Loader boot `cordis.yml`（Config 两脸跟随）+ 可选：`runLoaderSmoke` 子进程 e2e（发布形态、可选性） | `tool-todo/tests/loader-composition.spec.ts`；`subagent-codex/tests/loader-composition.e2e.ts` |
| 组装转录 | model-visible 改动 → 同 PR 一个录制场景（patch 里 `disabled` 真实 provider + 场景 config） | `snapshots/session/agent-instructions/` |

按插件类型增补：provider 插件加 capabilities JSON 断言；toolview 加 assembly-surfaces 与 locale 断言；guard 插件写"不触发"负例矩阵；LLM-backed 加 scripted adapter 超时/取消路径与 with-key e2e 成对（[09](./09-plugin-testing-playbook.md)）。

## 提 PR 前（同 PR 交付清单）

- **快照**：model/protocol/human-visible 改动同 PR 加/更新场景；`test:snapshot:refresh` 刷新期望、`record` 重录转录，**每个 diff 人工过目**（[04](./04-snapshot-machinery.md)）。
- **README 已知限制**：插件 README 带具体（指名机制）的限制节——`verify-package-readme-limitations` 门会查。
- **cordis.yml 若动**：shipped 配置里的 bare 插件必须出现在 resolver manifest `dependencies`——`verify-cordis-config` 门会查；`!!js` 只允许在 plugin `config` 与 entry `disabled`。
- **破坏性面**：CLI/profile/cordis.yml 键/持久化数据/SDK wire 面破了，同 PR 写 `docs/upgrade-guide/v<版本>/<条目>/guide.md`（`dsh-create-upgrade-guide` 技能）。
- **本地选最小证据**（`dsh-pre-push-checks`）：owning vitest 文件或聚焦名 + 若动 manifest/公共导出再 `build` + owning built smoke；**不默认全量**，全套彩排仅三种情况（[03](./03-rules-ownership.md)）。

## 你的 PR 在 CI 里会经过什么（[05](./05-ci-gates.md) 的插件视角）

| 车道 | 对插件的含义 |
|---|---|
| unit + coverage | 你的 `tests/**/*.spec` 全跑；**你的 `src/` 每文件 100%**（未覆盖行要么补测要么删除） |
| typecheck | 你的测试文件被 host 或 client face program 类型检查（`.tsx`/`.client.*` 归 client，[02](./02-tiers.md)） |
| REAL-composition 相关 e2e | `loader-composition.e2e.ts` 若进了 built-bin-smoke 16 文件清单，CI 以 built `lib/` 再跑一遍 |
| snapshot replay | 你的场景在 210 个录制场景里被无 key 回放比对 |
| 静态门 | `verify-cordis-config`（若动配置）、`verify-client-ui-i18n`（若动 client 文案）、`verify-package-invariants`（若发布 `./invariant`）、`verify-package-readme-limitations`、doc 门 |

## 反例清单（每一类都被政策明文拒绝）

1. **hand-built `ctx.plugin(...)` 充当组装证据**——"Hand-built `ctx.plugin(...)` suites are insufficient"（[01](./01-doctrine.md) 教义 6）。
2. **对 agent 自报的关键词探测**——"a keyword probe on the agent's own output lets a cheating agent pass"；断言文件系统/session log 等外部事实。
3. **把 tunable 写成常量再用单测钉死**——`DEFAULT_*` 常量不是可配置性；用真 Loader boot 验 Config 两脸跟随（[08](./08-plugin-testing.md) 台阶四）。
4. **import 另一个 `*.e2e.ts` 复用 fixture**——会重复注册 `describe`、重复真实 API 调用；共享 fixture 放普通 `tests/harness.ts`。
5. **只有 skip 分支没有用例内守卫**——`describe.skipIf` 之外，关键前置（如 key、built 产物）在用例内再 throw 一次（样板 `runtime.e2e.ts:184`）。
6. **为凑绿改 normalizer / 弱化断言 / 加 sleep**——`dsh-ci-test-reliability` 的"拒绝的掩盖修法"清单（[06](./06-reliability.md)）。

## 最小例证

1. **台阶可对表**：写完插件后对着本页表格逐行问"样板在哪、我的对应文件在哪"——答不上来的行就是缺口。
2. **CI 行为可查证**：`grep -n "builtBinSmokeGate" scripts/run-gates.ts` 看 16 文件清单里有没有你；`pnpm exec vitest run --config vitest.e2e.config.ts <你的文件>` 本地复现 e2e 车道。
3. **反例可检索**：政策原文里每个反例都有出处——`grep -n "insufficient" docs/testing.md`。
