# 01 · 根入口的读者分流与总地图

## README 与 AGENTS 的分流

DSH 根目录最显眼的设计是：**README 对人，AGENTS 对模型。**

`README.md` 最后一段直接写出分流：

> Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).
>
> For agents, follow [AGENTS.md](AGENTS.md).
>
> —— `README.md:55-57`（基线 `183f08e9c6…`）

这句话把模型从“产品入口”送到“工作入口”，避免模型把 README 当成任务规则来读。`CLAUDE.md` 则是 `AGENTS.md` 的 symlink，因此 Claude Code 自动读取的入口与通用 agent 入口是同一份事实，不会出现两套规则漂移。

## 根 AGENTS.md：常驻上下文的“内核页表”

根 `AGENTS.md` 开头第一段只有一句实质内容，但承担两条路由：

> DeepSeek Harness is an all-plugin Cordis agent harness. Read [docs/architecture.md](docs/architecture.md) before changing `packages/`; follow [docs/AGENTS.md](docs/AGENTS.md) for documentation.
>
> —— `AGENTS.md:3`（基线 `183f08e9c6…`）

这一句里是两个最重要的路由：

- 前半句给出系统总模型：**all-plugin Cordis agent harness**；
- 后半句给出两条工作路径：改 `packages/` 前读 architecture；写文档遵循 docs/AGENTS。

然后是三段常驻内容：

1. **Pre-stable APIs and released Session data**：公共 API 处于 pre-stable，每个消费者要跟着更新；已提交的 session 格式世代只能由版本命名的后继承接，不移动、不覆盖、不删除；`Application launch` 进一步限定只有 `dsh` profile 能启动受支持的 Node 应用。它防止模型把旧经验当兼容承诺。
2. **Repository layout**：每个顶层目录一行职责，例如 `packages/core/` 是 product API spine、`preset/` 是 per-session composition、`.agents/` 是 workflows 和 notes。模型看到的是分区职责，不是完整目录树。
3. **Commands**：以命令动词表的形式给出可执行动作，不解释原理。

之后的 `## Conventions` 是 standing orders：每条 1-3 行，说明规则、链接 home。例如注册规则直接链接到 `docs/glossary.md` 或 `.agents/notes/`，不把完整语义复制进来。

## 为什么这是“地图”而不是“摘要”

摘要回答“这个仓库是什么”，地图回答“我要去哪个文件”。根 `AGENTS.md` 的信息单元几乎都是：

```text
规则 / 区域 / 命令
  + 一句话职责
  + 指向权威文件的相对链接
```

模型不需要记住所有内容，只需要在上下文中保留这张表，然后按任务跳转。

## 与 `docs/architecture.md` 的衔接

architecture 的第一段声明了自己的前提和适用边界：

> Read this before changing anything under `packages/`. It assumes you know Cordis; if you do not, start with the [primer](cordis-primer.md) or the [tutorial](cordis-tutorial/index.md).
>
> —— `docs/architecture.md:5`（基线 `183f08e9c6…`）

这相当于在入口设置了 prerequisite check：不懂 Cordis 时先走 primer/tutorial，而不是硬读 architecture。**披露顺序因此不是靠读者自觉，而是被写进了入口。**

## 根 AGENTS 没有做什么

- 没有教程；
- 没有设计理由的完整复述；
- 没有 package 级细节；
- 没有 change history。

这些都是“该在别处”的内容。根入口的可读性来自它拒绝承载的内容，而不是它写得多么详细。

## 证据入口

- [`README.md`](../../README.md) 第 55-57 行
- [`AGENTS.md`](../../AGENTS.md) 第 3 行、第 5-9 行、第 102 行起（`## Conventions`）
- [`docs/architecture.md`](../../docs/architecture.md) 第 5 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 21 行：Root `AGENTS.md` 的定义
