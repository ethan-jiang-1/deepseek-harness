# 03 · 沙箱对目录的硬要求

这一篇是命门。所有"启动时怎么安排"的方案，最终都要过这一关：**模型能写哪个目录**。DSH 的答案只有一句话——**每个会话只有一个可写根，就是它的 `SessionHeader.cwd`**。

## 一个策略只有两个字段

```ts
interface SandboxExecutionPolicy {
  mode: SandboxMode              // 'read-only' | 'workspace-write' | 'danger-full-access'
  workspaceRoot: string          // workspace-write 下唯一允许写的根
  sessionId?: SessionId
}
```

`SandboxExecutionPolicy` 里**没有"额外可写目录"这个字段**，这是明确的当前限制（[sandbox-policy README](../../packages/sandbox/sandbox-policy/README.md) 的 Known Limitations："One primary workspace root per session — extra writable roots are not part of `SandboxExecutionPolicy`"）。**C**

## 根从哪来

| 调用者 | mode | workspaceRoot |
|---|---|---|
| 普通模型工具（bash / write / edit / terminal） | 会话最后一次 `sandbox/mode`，否则部署默认 | **`SessionHeader.cwd`**（不可变） |
| 无会话的宿主调用（agentless） | 部署默认 `mode` | 部署配置的 `workspaceRoot` 兜底 |
| 被批准的一次性升级调用 | 显式传入的更宽 mode | 同一个根 |

部署默认在 base 里是 `mode: DSH_PERMISSION_MODE ?? 'workspace-write'`、`workspaceRoot: process.cwd()`（[base cordis.patch.yml:243-249](../../packages/bundle/base/cordis.patch.yml)）。

## `workspace-write` 到底放行什么

`writableRoots(policy)` 只返回两个东西：**工作区根 + 后端承诺的临时目录**（`/tmp`、`os.tmpdir()`）。认这两个根的消费者必须一致，否则会漂移：

- bash：Seatbelt profile 是 allow-default + `deny file-write*` + 写入白名单；bwrap 是只读宿主根 + 可写 workspace bind + 临时 `/tmp`。
- 文件工具：`fs-sandbox` 在 `writeText/editText` 前重新 canonicalize，目标必须落在同一个 `writableRoots` 集合下，否则抛 `FS_SANDBOX_DENIED`。
- 读、列目录、metadata、只读 watch **不受这条栅栏限制**（Seatbelt 只 deny 写；fs 栅栏只管两个写操作）。

## 三条容易踩空的规则

**① `cd` 不放宽沙箱。**
`working_directory` 能改会话的"当前目录"，但"Sandbox writable roots and project membership remain anchored to the original project"（[working-directory.md](../../docs/subsystems/working-directory.md)）。在会话里 `cd` 到 `projectsRoot` **不会**让模型获得写权限。

**② 放宽只有"一次性审批"。**
被拒后模型可以请求"这一次用更宽 mode"，走 `ctx.approval`，只对那一次调用生效。产品实例里这会出现成一串审批弹窗。
另一个极端是把默认权限档改成 `danger-full-access`（丢护栏），或者在 `permission-presets` 里把默认值钉死——这是安全姿态问题，不是配置细节。

**③ 插件自己写 ≠ 模型写。**
宿主插件是受信任代码，用 `node:fs` 写盘完全不受沙箱约束（`session-persistence-jsonl`、`storage-json`、`credentials-local` 都这么干）。只有当插件通过 `ctx.fs.writeText` 写、且**不传** `sandboxPolicy` 时，才会落到部署兜底策略上——默认是 `workspace-write` + 配置的 `workspaceRoot`，写到别处一样会被拒。

| 写者 | 通道 | 约束 |
|---|---|---|
| 插件代码 | `node:fs` | 无（信任代码） |
| 插件代码 | `ctx.fs` 不传 policy | 部署兜底：`mode` + `sandbox-policy.workspaceRoot` |
| 模型工具 | `ctx.fs` + 显式 policy | 会话 `header.cwd` |
| 模型 bash | `ctx.sandbox` | 会话 `header.cwd` |

## 两个"根"必须对齐

产品实例里有两个看似相关、实际不同的根：

1. **`sandbox-policy.workspaceRoot`**：只给"没有会话"的调用兜底，以及会话没有 cwd 的极端情况。
2. **会话 `header.cwd`**：真正决定模型能写哪儿。

如果只改第 1 个而不让会话建在 `projectsRoot` 下，模型在会话里写 `projectsRoot` 仍会被拒；如果只让会话建在里面而第 1 个还是 `process.cwd()`，宿主插件通过 `ctx.fs` 写就会时灵时不灵。**两条都要对齐，或者干脆让插件只用 `node:fs` 写自己的账本。**

## 对 `projectsRoot` 的结论

> 让**模型用通用文件工具**写 `projectsRoot` 下的文件，只有一条正路：**会话的 cwd 落在 `projectsRoot/<project>` 里**。插件自己的索引/缓存可以走 `node:fs` 或独立兜底根，不受影响；完全不打算让模型直接写，就选本篇末尾的"工具中介写"。

这带来一个额外的好处：**一个项目一个会话 = 把写权限收敛到单个项目**，兄弟项目彼此隔离。反而不要试图让一个会话拿到整个 `projectsRoot`——那等于拆掉项目边界。

## 产品要做的三件事

1. **保证会话创建时带 `workspaceId`**（GUI 默认如此）；不要依赖 `process.cwd()` 或 `cd`。
2. **兜底根与项目根保持一致**，或明确声明"插件只写自己的目录，模型只写当前项目"。
3. **不要用审批弹窗当常规路径**：如果常见操作会撞栅栏，说明目录安排错了，而不是权限不够。

## 第三条路：工具中介写（现实样本走的就是这条）

插件即产品的场景里，最容易被忽略的一格是：**模型根本不需要直接写项目目录。**

`deck-studio` 的做法是：模型只调 `deck_script_read` / `deck_script_propose_edits` / `deck_revision_confirm` 这类工具，所有落盘由插件的 `node:fs` 完成。这样：

- 项目目录可以在任何地方（包括 `$DSH_HOME/deckline` 里），不需要成为会话 cwd；
- 沙箱完全不用放宽，模型即使想 `write` 也写不到那里；
- 代价是模型失去了通用 `bash`/`write` 的能力（对一个"对话式出 deck"的产品，这往往是想要的）。

对照表：

| 架构 | 项目目录在哪 | 谁写 | 需要 workspace 注册 | 沙箱影响 |
|---|---|---|---|---|
| **插件中介写** | 任意（通常 `dataRoot` 或 `projectsRoot`） | 插件工具 | 不需要 | 无 |
| **DSH workspace 写** | 必须是会话 cwd | 模型工具 + 插件 | 需要 | 决定一切 |
| **混合** | workspace 是入口，插件另存账本 | 两边都有 | 需要 | 模型只能写当前项目 |

**所以先问一句："模型要不要对项目目录用通用文件工具？"** 答"不要"，沙箱这一章就只是背景；答"要"，本篇的全部约束都生效，并且必须让会话 cwd 落在项目里。

## 待核实

- 远端/SSH 会话的 `workspaceRoot` 与本地是否同一口径（`sandbox-ssh` 走同一 policy，但 canonical 化在远端执行）。**U**
- Windows ACL 后端的 `partial` 对 `projectsRoot` 这种"根外根"的实际影响，需要实测。**U**
