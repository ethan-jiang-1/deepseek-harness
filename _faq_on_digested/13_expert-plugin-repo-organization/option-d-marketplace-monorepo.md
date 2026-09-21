# 方案 D · 多专家 marketplace 式 monorepo

## 一句话

终点不是"一个专家"而是"一窝专家"：一个 repo 收多个领域专家包 + 共享骨架 + 一个装载入口（清单/marketplace），每个专家目录形状一致，靠约定发现而不是靠配置枚举。

## 目录树

```text
expert-suite/
├── AGENTS.md                     # + 子树 AGENTS.md 只在 shared/ 与 templates/ 放专属规则
├── pnpm-workspace.yaml           # packages/* + vendor/dsh/packages/*（继承方案 A）
├── registry.json                 # 专家清单：id → 目录/版本/标签（marketplace.json 的等价物）
├── packages/
│   ├── legal-expert/             # 每个专家 = 同一形状：
│   │   ├── src/flows/ …          #   flows + tools + pack
│   │   ├── tests/ + snapshots/   #   专家级证据（第 4/5 阶段）
│   │   ├── notes/                #   专家级决策（proposed/implemented）
│   │   └── pack/                 #   自含的 cordis.patch.yml + preset + compatibility 矩阵
│   ├── finance-expert/…
│   └── shared/                   # 共享骨架：流引擎基座、卡片投影、测试夹具（有自己的 AGENTS.md 与 Note）
├── templates/
│   └── expert-scaffold/          # "新专家 = 填模板"的脚手架（见下"开发过程差异"）
├── scripts/
│   ├── verify.mjs                # 校验 registry.json 与目录/版本/兼容矩阵一致（仿 dsh-market validate-registry）
│   ├── release-smoke.mjs         # 单专家真实安装形状
│   ├── smoke-all.mjs             # shared/ 变更后的全专家冒烟（本方案新增的证据面）
│   └── sync-dsh.mjs              # 继承方案 A 的升级环（vendor/dsh 换 tag + SHA 簿记）
├── dev/                          # 开发 home：repo 外（~/dsh-dev）或继承方案 A 的 dev/harness-home/
├── notes/                        # 仓库级 intents + proposed/implemented；专家级决策放各自 packages/<expert>/notes/
└── vendor/dsh/                   # pinned submodule + scripts/sync-dsh.mjs（继承方案 A）
```

## 取舍

| | 评价 |
|---|---|
| 多专家复用 | ✅ 共享骨架一次投入，每个新专家是"填目录" |
| 一致性 | ✅ 形状约定统一，验证工具可对全部专家跑同一套检查 |
| 插拔 | ✅ 清单 + 目录约定，单专家可单独装/删 |
| 提前量 | ❌ 单专家阶段是纯税：registry、shared/ 的抽象在没有第二个专家时是猜测（DSH 纪律：拆分只在角色独立演化时发生；FAQ 08 的教训——P 与 C 同包 = 还没有市场） |

## 市场背书

- **anthropics/claude-code**：repo 自身即 marketplace（`.claude-plugin/marketplace.json` 列 `{name, source, version, tags}`），每插件目录自包含（缓存安装禁止 `../` 引用，同 marketplace symlink 会被解引用拷贝）——"清单 + 约定目录 + 严格自包含"三件套是它验证过的形状。
- **Cursor plugins**：repo 导入即 marketplace（`.cursor-plugin/marketplace.json`）；并且它同时接受自有格式与 vendor-neutral 的 agent-plugins.org 标准——提示多专家 repo 值得把"每个专家的公共形状"压到最薄、把 DSH 特有扩展（preset、patch）放明确命名的子目录。
- **modelcontextprotocol/servers**：`src/<server>` 一目录一 server、独立发版——证明"同形状多包"的 monorepo 可以长期维持，代价是构建配置在各包间重复。

## 开发过程差异（方案 D）

共享细节见 [dev-loop.md](./dev-loop.md)。本形态的差异：**同一套过程要乘以专家数量**，所以形状约定和检查自动化是生命线。

- 插拔以 registry.json 为入口：一个专家 = 清单一行 + 一个自含目录；`dsh plugin add` 逐专家装。给 registry 配 validate 脚本（id/目录/版本/兼容矩阵一致性），仿 dsh-market 的 `validate-registry`。
- 调试按专家隔离：每个专家一个 preset，`--dump-config` 按 profile/preset 对照；共享骨架（shared/）的变更要跑"全部专家冒烟"——这是本形态新增的证据面。
- 驱动 agent 靠**形状一致性**：每个专家目录同构 + `templates/expert-scaffold/` 脚手架，agent 加新专家就是填模板；vendor/dsh 与升级脚本沿用方案 A。
- snapshot 义务按专家分摊：每专家自带 `tests/ + snapshots/`（第 4/5 阶段证据），shared/ 变更另跑 smoke-all；不设仓库级统一 snapshot。
- CI 用矩阵：专家 × compatibility 里声明的 DSH 版本，逐格冒烟。

## 定位

不是方案 A 的竞争者，是它的**规模化后继**：方案 A 的目录结构原样变成这个树的 `packages/<one-expert>/`。触发条件很客观——第二个领域专家立项、且它要复用第一个的骨架（流引擎、卡片投影）而不是各自重写。
