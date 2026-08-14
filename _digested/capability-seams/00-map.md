# Capability seams 地图

## 一句话定位

一条 **seam** 是可替换的完整能力，必须有三个角色：

1. **Service Definition** — 声明 `ctx.<key>` 和词汇类型（Cordis `Service`，不是 TypeScript `interface`）
2. **Service Provider** — 实现它
3. **Consumer** — 使用它，常见是面向模型的 tool

单独一个角色不是 seam。扩展插件依赖 Service Definition，绝不依赖具体 Provider。

## 这一层回答什么

- 三角色何时分包装、何时可以合在一个包里（`dsh-llm` 同时拥有 Definition 与 Consumer）。
- 为什么 fs 与 subprocess 的 provider 要共享一个执行世界：指向远程 sandbox 时，Bash / PTY / LSP 一起走，而不各自 fork 一份 provider。
- 加一条能力时，三角色分别注册在哪。
- 典型 seam 家族：shell、fs、llm、web、lsp、subagent、sandbox。

## 源码入口

| 路径 | 角色 |
|------|------|
| [`docs/glossary.md`](../../docs/glossary.md) `capability-seam` | 术语合同 |
| [`docs/capability-seams.md`](../../docs/capability-seams.md) | 生成的 seam 图（包 / `ctx` key / 实现 / 消费者） |
| [`docs/architecture.md`](../../docs/architecture.md) Capability seams | 产品地图上的这一层 |
| `packages/shell/` | 教科书例子：`dsh-shell` + local/pwsh providers + `dsh-tool-bash` |
| `packages/fs/` | filesystem seam + policy + file tools |
| `packages/subprocess/` | 进程树 seam；local shell 经它 spawn |
| `packages/sandbox/` | 进程限制后端 |
| `packages/llm/` | LLM 注册表；Definition 与 Consumer 可同包 |
| `packages/subagent/` | 子代理 seam：从进程内 child 到委托给另一个产品 |
| `.agents/notes/implemented/architecture/2026-06-13-capability-seams.md` | 设计决策（为什么这样切） |

组级 README 拥有「这个组有哪些包、对应哪个 `ctx` key」。消化某一条 seam 时从该组 README 进，不要在本专题复制完整包表。

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-三角色切包.md` | 何时分包装；Consumer 不得把 tool-schema 细节倒灌进 Definition |
| `02-执行世界.md` | fs / subprocess / sandbox / terminal / lsp 如何绑在同一后端世界上 |
| `03-shell-作为范本.md` | 顺着 `packages/shell/` 走完一条完整 seam |
| `04-换-provider-的半径.md` | 换 E2B 或远程 sandbox 时，哪些 Consumer 不改代码 |

## 消化时的判断

看到一个新 `ctx.<key>`，先问：它是 spine 服务、一条 seam、还是 bundle 组合点？只有三角色齐全时才叫 seam。
