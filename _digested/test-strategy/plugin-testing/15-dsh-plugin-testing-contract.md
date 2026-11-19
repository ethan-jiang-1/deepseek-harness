# 15 — 插件项目测试契约：从 DSH 的五级台阶到你的仓

> 本页面向**写 DSH 插件的人**（无论插件在 DSH 仓内还是你自己的仓）。它把 DSH 的测试纪律压缩成一份可复制的契约：五级台阶、三种采用等级、十条条款、一份 PR 账本、一套最小编排。台阶在 DSH 仓里的原始形态见 [13](./13-plugin-testing.md)，真实插件解剖见 [14](./14-plugin-testing-playbook.md)，通用决策程序见 [05](./05-decision-procedure.md)。

## 先对齐四个名词（本页自足）

- **function 插件**：具名导出 `name` / `inject` / `Config` / `apply`，**没有 default export**。
- **REAL composition**：用真 Loader 读一份 test-only `cordis.yml` 启动插件，而不是在测试里手写 `ctx.plugin(...)` 拼装。
- **组装转录**：一次完整运行留下的、可回放的模型请求/响应/工具调用/持久化结果；在 DSH 里由录制会话快照承载。
- **负控**：故意引入目标回归，确认测试变红，再恢复；用来证明"这条断言真的会失败"。

## 五级台阶（硬事实，来自 DSH 政策与包规则）

| 台阶 | 抓什么失败 | 最小形态 | 成本 | 反例 |
|---|---|---|---|---|
| 1. 导出形态守卫 | Loader 丢弃命名空间、default export 混用、`inject` 丢失 | `expect('default' in mod).toBe(false)` + `unwrapExports` round-trip + `name`/`inject` 断言 | 毫秒级 | 只测 `apply` 的行为 |
| 2. 行为 spec | 逻辑、边界、错误路径、事件顺序 | 挂真依赖服务，只 stand-in 最外层（模型 adapter / 网络 / 时钟）；从注册后的入口调用 | 进程内毫秒级 | mock 掉全部依赖，只证明"桥能过字节" |
| 3. 注册生命周期 | dispose 后贡献残留、服务 built-in 被误删 | 注册 → 断言存在 → `await fiber.dispose()` → 断言移除、built-in 不受影响 | 毫秒级 | 只测 register，不测 dispose |
| 4. REAL composition | 插件在真实 Loader/组合下不工作 | test-only `cordis.yml` 经 Loader + app/process 启动；断言模型可见/持久/用户可见结果 | 秒级 | 手搭 `ctx.plugin(...)` 当作组装证据 |
| 5. 组装转录 | 模型可见 schema/prompt/工具结果漂移 | 同 PR 加/更新一条录制场景或等价金样；diff 人工过目 | 录制一次性、回放常驻 | 用单测断言字符串常量；refresh 不看 diff |

**台阶不是新的测试层**：1–3 落在 unit 车道，4 落在 REAL composition / built 冒烟，5 落在 snapshot 车道。一个 `*.spec.ts` 可以同时覆盖前三阶。

## 按插件类型组合

| 插件类型 | 必选台阶 | 增补 |
|---|---|---|
| 工具插件（tool） | 1 + 2 + 3 + 4 + 5 | 工具 schema 拒绝路径；e2e 验外部世界（文件/日志） |
| 服务 / registry 插件 | 1 + 2 + 3 | 贡献可撤销；服务多实现时加 cap 矩阵 |
| guard 插件 | 1 + 2 + 3 + 4 | "不触发"负例矩阵（透传/恢复/保留） |
| provider / adapter | 1 + 2 + 4 | mock server 故障注入 + with-key e2e 成对 |
| client UI 插件 | 1 + 2 + 3 | 组件 spec（jsdom）+ web snapshot + i18n 静态门 |
| bundle / 组合层 | 1 + 4 | 真实 profile boot；`verify-cordis-config` 类静态门 |

## 三种采用等级（给不同成熟度的插件仓）

| 等级 | 适用 | 最小资产 | CI |
|---|---|---|---|
| **L0 内部插件** | 只在自己的 profile 用、且不进入模型可见面（service / registry / 本地命令） | 台阶 1–4；`src` 覆盖率下限；一条负控 | 一个 required job：`test` + coverage |
| **L1 产品可见** | 用户/模型能看见行为 | L0 + 台阶 5（金样/快照）+ 负控记录 + README 已知限制 | 两个 required：`test`、`snapshot`（或 web）；静态门 |
| **L2 发布型** | 公开发布 / 有 bin / provider | L1 + built smoke + with-key e2e（自跳过 + preflight）+ 版本/升级说明 | required 再加 `build` + built smoke；e2e 独立 workflow |

**怎么选级**：会进入模型请求或用户可见面 → 至少 L1；有独立 `bin`、对外发布或作为 provider → L2；只在自己的 profile 里装配、且不进入模型可见面 → L0。

等级不是永久身份：插件一旦进入模型可见面或发布面，就应该升级；反过来，诊断型 `.perf` / `.stress` 永远不进 required。

## 可复制的十条契约

把下面这段放进你插件仓的 `AGENTS.md` / `CONTRIBUTING.md`，再按等级删减：

1. 一个插件一个包；测试放包级 `tests/`，**不写进 `src/`**。
2. 三条互斥车道：`*.spec.ts`（unit）、`*.e2e.ts`（真实进程/模型）、`snapshots/`（录制回放）；每份配置只认领自己的模式。
3. `src/**` **每文件** 100% statements/branches/functions/lines；确实不可达的行逐条登记豁免（文件或包）、写理由与 `TODO(owner)` 移除条件。
4. function 插件具名导出 `name`/`inject`/`Config`/`apply`，**无 default export**；有一条导出守卫测试。
5. 每个注册表贡献必须有 dispose 测试：dispose 贡献 fiber → 断言移除，且服务 built-in 不受影响。
6. product-visible 插件至少一条 REAL composition：真 Loader 启动，mock 只限外部服务与非确定输入。
7. 模型 / 协议 / 人可见输出必须有一条**同 PR** 的录制场景或金样；刷新后的每个 diff 人工过目。
8. 每条验收规则必须有负控记录：临时构造违规，确认红，再恢复。
9. 测试级跳过必须打印原因并出现在 CI 汇总里；必需 job 的 skip 视为失败；缺凭据的必需 workflow 用 preflight **硬失败**。
10. 手动 lane（perf/stress/headful）不进 required；任何未覆盖都在 PR 账本里显式登记。

## 同 PR 交付清单（DSH 仓内）

- **缺什么基建就同 PR 补什么**：插件需要的录制/回放能力（新平台变体、新 sidecar 类型）由功能 PR 一起交付，不能留给"以后"。
- **README 已知限制**：插件 README 必须带 `## Known Limitations and Deferred Work` 节——`verify-package-readme-limitations` 查的是这一节的结构，内容是否具体到机制靠评审；它也是"这个 mock/替身证明不了什么"的自白。
- **若动 `cordis.yml`**：shipped 配置里的 bare 插件必须出现在 resolver manifest 的 `dependencies`；`!!js` 只允许出现在 plugin `config` 与 entry `disabled`——`verify-cordis-config` 会查（postmortem 0002 的直接产物）。
- **若破发布面**：CLI / profile / `cordis.yml` 键 / 持久化数据 / SDK wire / 公开入口的破坏性变化，同 PR 写 `docs/upgrade-guide/v<版本>/<条目>/guide.md`。
- **本地选最小证据**：按 [`dsh-pre-push-checks`](../../.agents/skills/dsh-pre-push-checks/SKILL.md) 选 owning 测试，不默认全量；全套彩排仅三种情况（用户显式要求、诊断 CI、改动遍及全仓）。
- **先查货架**：能力是否已有现成插件、你的插件属于哪一形态，先看 [`plugin-system/inventory/`](../plugin-system/inventory/00-map.md)，避免重复造。

## 插件 PR 的证据账本（模板）

> 通用版见 [05](./05-decision-procedure.md)；这一份把台阶编号写进账本，便于逐级对表。

```md
## 插件测试账本

- 插件：<name>（类型：tool / service / guard / provider / UI / bundle）
- 采用等级：L0 / L1 / L2

| 台阶 | 证据文件 / 命令 | 覆盖的失败类 | 负控（见过红） |
|---|---|---|---|
| 1 导出形态 | `tests/exports.spec.ts` | default export 丢弃 inject | 是 |
| 2 行为 | `tests/<behavior>.spec.ts` | 拒绝路径 / 边界 | 是 |
| 3 生命周期 | `tests/disposal.spec.ts` | dispose 后贡献残留 | 是 |
| 4 REAL composition | `tests/loader-composition.spec.ts` | Loader 下不工作 | 是 |
| 5 组装转录 | `snapshots/<scenario>/` | 模型可见漂移 | diff 已过目 |

- 显式未覆盖：<哪一阶、为什么、TODO/issue>
```

## 最小编排（按等级）

```text
L0:  test + coverage            ← 必需（一次运行，两个产出）
L1:  test + coverage
     snapshot 或 web            ← 必需（模型/用户可见时）
     static verify              ← 必需（导出形态 / i18n / cordis 配置）
L2:  以上全部
     build + built smoke        ← 必需（有 bin 或发布入口时）
     e2e（独立 workflow）        ← trusted PR / 主干 / 夜间；fork 不跑；缺 key 硬失败
```

原则与 DSH 相同：**昂贵、需要凭据、平台受限的证据单独成 workflow；必需性由"这类失败会不会进产品"决定，而不是由测试好不好写决定。**

## 分布自检（五问）

1. 绝大多数用例在 unit 吗？如果昂贵层占了一半，先问"这些失败类 unit 真的看不见吗"。
2. 每条 e2e / 浏览器 / 快照用例都能用一句话说出"unit 为什么看不见它"吗？说不出就降层。
3. 每个模型可见面（工具、prompt 注入、投影事件）都有金样或快照吗？没有就是组装证据缺位。
4. 覆盖率豁免是否逐条写清理由、影响面与移除条件？无理由、无移除条件的豁免就是隐性空洞。
5. 手动 lane 不在 required 里吗？每个 skip 都可见吗？

## 给 agent 的指令块（可直接粘进 `AGENTS.md`）

```text
规划任何变更之前，先回答并写进 PR 账本：
1. 失败类：这次改动可能破坏什么？（schema / prompt / loader / persistence / browser / perf / …）
2. 选层：最低能看见该失败类的是哪层？为什么不是更低一层？
3. 负控：引入目标回归时，哪条断言会红？记录"见过红"。
4. 组装：模型/协议/人可见输出变了吗？变了就同 PR 加金样或快照。
5. 可见：跳过时打印原因；必需 job 的 skip 视为失败。

提交前附"测试账本 + 显式未覆盖"。禁止：
- hand-mount 充当唯一组装证据；
- 为凑绿加 retry / 加 sleep / 改 normalizer / 弱化断言；
- refresh 后不看 diff；
- 把手动 lane 放进 required。
```

## 评审时的五个追问

1. 账本里每条证据的负控记录在哪？说"应该会红"不算。
2. 最贵的那条证据，为什么不能降一层？答不上来就是分布错了。
3. 有没有一条模型可见变更没有金样或快照？
4. 新增的覆盖率豁免有没有理由与移除条件？
5. CI 里有没有"跳过即通过"的路径？

## 缩编对照表：DSH 机制 → 小仓等价物

| DSH 的机制 | 小仓可承受的等价物 | 保留的判据 |
|---|---|---|
| 宽底 unit 层（规模见 [03](./03-asset-census.md)） | 每包 5–15 个 spec，覆盖行为枚举与错误路径 | 廉价层承载行为空间 |
| per-file 100% 覆盖率（全仓 `src`） | 对 `src` 开 per-file 阈值；不可达处逐条豁免 | 未执行代码必须可见 |
| 录制会话场景语料 + 自研 harness | 一个 JSON 转录金样 + 一个最小 replay/比较 helper | 组装证据不可由单测替代 |
| 多个必需 CI job + 平台矩阵 | 1–2 个必需 job + 可选 OS 矩阵 | 必需性按失败类，不按仓库大小 |
| 4 篇 postmortem 驱动的守卫 | `docs/incidents/` 一条记录 + 一条永久回归测试 | 同类漏不复发 |
| `verify-cordis-config` / 导出守卫 | 一个 10 行的导出形态 spec + 配置 schema 校验 | 入口形态是契约 |
| `dsh-pre-push-checks` 选证据 | PR 模板里的"测试账本"一节 | 选最窄证据，写清理由 |

## 三种真实事故 → 你的最小守卫

| 事故 | 最小守卫（你也能写） |
|---|---|
| postmortem 0001：`export default` 让 Loader 丢弃 `inject`，178 个绿测试没抓到 | 一条导出形态 spec：`expect('default' in mod).toBe(false)` + `unwrapExports` round-trip + 一条真 Loader boot |
| postmortem 0002：快照 refresh 接受了 `UNKNOWN_TOOL` | 金样 diff 人工 review + 语义断言（工具必须存在、结果必须是成功路径），而不是只比对文本相等 |
| postmortem 0003：把 HTTP 200 当成 GUI 可用的证据 | 断言"世界"：当前 URL/进程/`window.__DSH_BOOT__` 都在，而不是只看端口有响应 |

## 命令速查（DSH 仓内）

```sh
pnpm exec vitest run packages/<group>/<pkg>/tests                 # 本包全部 unit
pnpm exec vitest run <file> -t '<聚焦名>'                          # 单文件聚焦
pnpm exec vitest run <owning tests> --coverage \
  --coverage.include='packages/<group>/<pkg>/src/**'              # 聚焦覆盖率（按门标准）
pnpm run test:snapshot:refresh                                    # 期望输出生成（无 key）
pnpm run test:snapshot:record                                     # 重新录制转录（要 key）
pnpm exec vitest run --config vitest.e2e.config.ts <file>         # e2e 车道单文件（无 key 自跳）
```

## 最小例证

1. **台阶可对表**：写完插件后逐行问"样板在哪、我的对应文件在哪"——答不上来的行就是缺口；L0 至少要有 1–4。
2. **负控可执行**：临时删掉 `apply` 里的注册，台阶 2/4 应变红；恢复后变绿。没有这一步，前面所有"绿"都不算证据。
3. **分布可判**：如果你的 e2e 用例数接近功能数，说明在用贵层测逻辑；如果快照只增不减且从不看 diff，说明组装证据已经退化成"刷新即通过"。
