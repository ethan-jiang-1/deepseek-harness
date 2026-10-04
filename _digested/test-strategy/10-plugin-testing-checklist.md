# 10 — 插件作者检查单：一个插件 PR 的最小证据集

> 本页**自足**：没读过本专题其他页也能照做。一个 DSH 插件 = 一个 npm 包，function 插件具名导出 `name`/`inject`/`Config`/`apply`（无 default export）、经 Loader 按 `cordis.yml` 装配；名词的完整解释在 [08](./08-plugin-testing.md) 的名词表，真实插件的组合样板在 [09](./09-plugin-testing-playbook.md)。本页回答三件事：计划时定什么、写测试时对什么表、CI 会对你的 PR 做什么。

## 计划时（写代码之前）

1. **先查货架**（[`plugin-inventory/00`](../plugin-inventory/00-map.md)）：能力是否已有现货；你的插件属于哪一形态（工具 / 命令 / 服务 / guard / toolview / provider…）。
2. **点名测试面**：这个插件会动 model-visible 面吗（新工具、新 system prompt 注入、新投影事件）？会发布 `bin` 或 built 消费入口吗？——每个"会"都对应下表的一个台阶，在 PR 描述里写清。
3. **缺快照基建要同 PR 补**：若你的插件需要现有 harness 不支持的录制/回放能力（新平台变体、新 sidecar 类型），支持代码与功能同一 PR 交付。

## 写测试时（五个台阶逐一对表）

| 台阶 | 最小要求（括号内是就地解释） | 样板 |
|---|---|---|
| 导出形态守卫 | `expect('default' in mod).toBe(false)` + `unwrapExports` round-trip（真 Loader 的导出解析不丢命名空间）+ name/inject 断言 | `packages/lsp/tool-lsp/tests/load-path.spec.ts:14` |
| 行为 spec | 挂真依赖服务、只 stand-in 最外层包装（parent Agent 用带真 Session 的假体）；从注册后入口（如 `ctx.tools.execute`）调，断言 schema、错误结果、session log 事件 | `packages/todo/tool-todo/tests/tool-todo.spec.ts` |
| HMR-safety | dispose 你的 fiber → 断言你的贡献从注册表消失、服务自身 built-in 不受影响 | `tool-todo/tests/projection.spec.ts` |
| REAL composition | 用真 Loader 读一份临时 `cordis.yml` boot 你的插件，断言 Config 的**两脸**（模型可见 description 与接受行为都跟随配置）——手搭 `ctx.plugin()` 不算数；可选升级：`runLoaderSmoke` 子进程（发布形态、可选依赖缺席不 probe） | `tool-todo/tests/loader-composition.spec.ts`；`subagent-codex/tests/loader-composition.e2e.ts` |
| 组装转录 | model-visible 改动 → 同 PR 一个录制场景（`snapshots/` 下，patch 里 `disabled` 真实 provider + 场景 `config:` 覆盖你的插件） | `snapshots/session/agent-instructions/` |

按插件类型增补：provider 插件加 capabilities 拓扑断言；toolview 加组装验收（真实 host）与 locale 断言；guard 插件写"不触发"负例矩阵；LLM-backed 插件写脚本化 adapter 的超时/取消路径，并与 with-key e2e 成对（[09](./09-plugin-testing-playbook.md)）。

## 提 PR 前（同 PR 交付清单）

- **快照**：model/protocol/human-visible 改动同 PR 加/更新场景；实现变了但转录不该变 → `pnpm run test:snapshot:refresh`；模型转录变了 → `pnpm run test:snapshot:record`（要 key）；**每个 diff 人工过目**。
- **README 已知限制**：插件 README 带具体（指名机制）的限制节——`verify-package-readme-limitations` 门会查。
- **cordis.yml 若动**：shipped 配置里的 bare 插件必须出现在 resolver manifest `dependencies`——`verify-cordis-config` 门会查；`!!js` 表达式只允许在 plugin `config` 与 entry `disabled`。
- **破坏性面**：CLI/profile/cordis.yml 键/持久化数据/SDK wire 面破了，同 PR 写 `docs/upgrade-guide/v<版本>/<条目>/guide.md`（`dsh-create-upgrade-guide` 技能）。
- **本地选最小证据**（`dsh-pre-push-checks`）：跑 owning 测试 + 你改到的面；**不默认全量**，全套彩排仅三种情况（用户显式要求、诊断 CI、改动遍及全仓）。

### 命令速查

```sh
pnpm exec vitest run packages/<group>/<pkg>/tests                 # 本包全部 unit
pnpm exec vitest run <file> -t '<聚焦名>'                          # 单文件聚焦
pnpm exec vitest run <owning tests> --coverage \
  --coverage.include='packages/<group>/<pkg>/src/**'              # 聚焦覆盖率（按门标准）
pnpm run test:snapshot:refresh                                    # 期望输出生成（无 key）
pnpm run test:snapshot:record                                     # 重新录制转录（要 key）
pnpm exec vitest run --config vitest.e2e.config.ts <file>         # e2e 车道单文件（无 key 自跳）
```

## 你的 PR 在 CI 里会经过什么

| 车道 | 对插件的含义 |
|---|---|
| unit + coverage | 你的 `tests/**/*.spec` 全跑；**你的 `src/` 每文件 100%**（未覆盖行要么补测要么删除——它常是死代码） |
| typecheck | 你的测试文件被 host 或 client face program 类型检查（`.tsx`/`.client.*` 归 client program） |
| REAL-composition e2e | 你的 `loader-composition.e2e.ts` 若进了 built-bin-smoke 门（16 文件清单），CI 以 built `lib/` 再跑一遍 |
| snapshot replay | 你的场景在 210 个录制场景里被无 key 回放比对 |
| 静态门 | `verify-cordis-config`（若动配置）、`verify-client-ui-i18n`（若动 client 文案）、`verify-package-invariants`（若发布 `./invariant`）、`verify-package-readme-limitations`、文档门 |

## 反例清单（前四类被政策明文拒绝，后两类是仓库里反复出现的坑）

1. **hand-built `ctx.plugin(...)` 充当组装证据**——"Hand-built `ctx.plugin(...)` suites are insufficient"（真 Loader boot 才算）。
2. **对 agent 自报的关键词探测**——"a keyword probe on the agent's own output lets a cheating agent pass"；断言文件系统/session log 等外部事实。
3. **把 tunable 写成常量再用单测钉死**——`DEFAULT_*` 常量不是可配置性；用真 Loader boot 验 Config 两脸跟随。
4. **import 另一个 `*.e2e.ts` 复用 fixture**——会重复注册 `describe`、重复真实 API 调用；共享 fixture 放普通 `tests/harness.ts`。
5. **只有 skip 分支、没有用例内守卫**（模式而非禁令）：部分套件在 `describe.skipIf` 之外对关键前置（key、built 产物）在用例内再 throw 一次（样板 `runtime.e2e.ts:184`）——可选的双保险，仓库里的既有做法。
6. **为凑绿改 normalizer / 弱化断言 / 加 sleep**——`dsh-ci-test-reliability` 的"拒绝的掩盖修法"清单（[06](./06-reliability.md)）。

## 最小例证

1. **台阶可对表**：写完插件后对着本页表格逐行问"样板在哪、我的对应文件在哪"——答不上来的行就是缺口。
2. **CI 行为可查证**：`grep -n "builtBinSmokeGate" scripts/run-gates.ts` 看 16 文件清单里有没有你；`pnpm exec vitest run --config vitest.e2e.config.ts <你的文件>` 本地复现 e2e 车道。
3. **反例可检索**：政策原文里每个反例都有出处——`grep -n "insufficient" docs/testing.md`。
