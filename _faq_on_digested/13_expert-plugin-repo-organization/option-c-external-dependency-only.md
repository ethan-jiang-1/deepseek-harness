# 方案 C · 纯外部依赖，DSH 不进 repo

## 一句话

专家 repo 只把 `@deepseek-ai/dsh-*`、`@deepseek-ai/cordis` 当 npm 依赖安装，repo 内没有任何 DSH 源码；coding agent 需要 DSH 知识时靠 `AGENTS.md` 里的外部指针（如 `DSH_REPO` 环境变量指向本地另一份 checkout）或联网读文档。

## 目录树

```text
my-expert/
├── AGENTS.md                     # 写明：DSH checkout 在 $DSH_REPO；关键文档路径清单
├── package.json                  # devDependencies: @deepseek-ai/dsh-*@^x.y（或 peerDependencies）
├── packages/expert-*/…           # 同方案 A 的包划分（含 expert-pack 的 dsh 字段）
├── dev/harness-home/             # 同方案 A：npm pack 冒烟与 JSONL 调试日志的落点
├── scripts/
│   ├── verify.mjs
│   ├── release-smoke.mjs         # 本方案比 A 更必要：依赖声明错误没有 workspace 兜底
│   └── sync-deps.mjs             # 兼容环脚本（dev-loop 第 6 阶段）：依赖更新 → typecheck → 矩阵加列 → 安装冒烟
│                                 # （与 A 的差别：无 SHA 簿记，升级粒度是 npm 版本范围而非 submodule tag）
├── snapshots/                    # 自建最小 replay（dev-loop 第 5 阶段派给 A/C/D 的义务）
├── docs/
│   ├── …                         # 当前合同
│   └── dsh-notes/                # 知识内化：层级顺序/dump-config/preset 语义/日志税的自持摘录
└── notes/                        # 决策记录：proposed|implemented|rejected/<class>/…（dev-loop 第 2 阶段）
```

相比方案 A 缺的两样（`vendor/dsh` 与 SHA 簿记、workspace 直跑）正是"只作过渡"的机制原因：第 0 阶段的准备与第 6 阶段的兼容环都要靠 `$DSH_REPO` 指针和 npm 解析硬扛。

## 取舍

| | 评价 |
|---|---|
| repo 卫生 | ✅ 最干净：无 submodule、无子 workspace、无同步纪律 |
| coding agent 探索 | ❌ "repo 能看到 DSH 本身"落空：探索是"跳出去"的——typecheck 的 `paths` 不解析到 DSH `src/`，链接检查、跳转、grep 全断；`AGENTS.md` 指针依赖每台机器手工配置 |
| 可复现 | ⚠️ 依赖 npm 解析的版本范围；peer 范围写错要到运行期才炸 |
| 插拔 | ✅ 与方案 A 相同（`dsh plugin add`） |

## 市场背书（反面与折衷）

- **modelcontextprotocol/servers** 是这个形态的范本：每个 server 对 `@modelcontextprotocol/sdk` 用 npm 版本依赖，host SDK 独立发版、绝不 in-repo 链接。它成立的前提是 **SDK 面小且稳定**；DSH 的公开 API 仍是 pre-stable（AGENTS.md 明说"update every consumer"），版本漂移会持续打在这个形态的痛点上。
- **OpenClaw 文档明说的坑**：源码 checkout 直测会掩盖依赖错误，所以即使纯外部依赖也要用 `npm pack` → 真实安装路径测一遍。
- **anthropics/claude-code 的 fallback**：host 源码进不了 repo 时，把框架知识做成版本化 SKILL.md/文档随包走——对应到 DSH，等价物是把 `docs/architecture.md`、`cordis-primer.md` 的关键结论摘成专家 repo 自己的 `docs/dsh-notes/`。这是本方案的唯一可行加强版：**知识内化，源码外置**。

## 开发过程差异（方案 C）

共享细节见 [dev-loop.md](./dev-loop.md)。本形态的差异集中在一处：**agent 探索与证据全是外置的**。

- 插拔与 A 完全相同（`dsh plugin add` + patch 层级），但 workspace 直跑的前提是 npm 依赖能解析——DSH 是 pre-stable，`pnpm update` 一次就可能断 API，typecheck 是你唯一的编译期防线。
- `AGENTS.md` 里的 `DSH_REPO` 指针必须配一个"知识内化"目录（`docs/dsh-notes/`）：把常用合同（层级顺序、dump-config、preset 语义、日志税）摘成自己的短文档，否则 agent 每次都要跳出去且可能查不到。
- 真实安装形状测试（`npm pack` → `dsh plugin add`）在本形态**更加必要**，因为依赖声明错误没有 workspace 兜底。
- 上游跟随成本最高：没有 SHA 簿记、没有源码 diff，版本漂移只能靠测试失败发现——这是"只作过渡"的机制原因。
- snapshot 自建义务照担（dev-loop 第 5 阶段派给 A/C/D）：`snapshots/` 收录制会话与预期，先用 JSONL 日志 diff 顶着，够用再升级。

## 定位

适合：专家很小（一两个工具）、维护者不想背 submodule 纪律、且不需要 agent 深读 DSH 源码——注意这已等于接受"repo 能看到 DSH"落空，是 [answer](./answer.md) 决策 3 升格判据下的降级目标（question 的核心诉求"很好控制的上下文"在 C 里不受影响：preset 照常工作）。对"专家要很好控制上下文、要多流编排"这个目标来说，agent 读不懂 DSH 源码就意味着每个设计决策都要人肉判断，长期成本反而高。**作为起步快、后期必然迁去方案 A 的过渡形态可以；作为终点不推荐。**
