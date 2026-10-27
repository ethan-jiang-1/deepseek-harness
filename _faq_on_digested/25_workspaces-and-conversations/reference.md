# Reference 25 · 出处、口径与不确定处

源码核验基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。行号按该 commit 的树；仓库若前移，以符号名（函数/字段名）为准。

## 一、结论与证据

| # | 结论 | 证据 |
|---|---|---|
| 1 | 工作区是持久记录：id、规范化路径、标题、有序账户 | `packages/workspace/workspace/src/types.ts`（`Workspace` 接口）；`docs/subsystems/workspace.md` 的 Identity 与 The workspace entity 两节 |
| 2 | 路径唯一性用 realpath 字符串相等，符号链接会撞车 | `packages/workspace/workspace/src/paths.ts`（`realpathNormalize`）；`docs/subsystems/workspace.md` 末段 |
| 3 | 账户是成员资格的唯一真相；读取时按 cwd 过滤，目录 ENOENT 保留账户 | `packages/workspace/workspace/src/index.ts:185`（`candidateMatches`）、`:186`；`src/entity.ts` 的 `sessionIds` getter |
| 4 | attach 五步校验，通过后前插 | `packages/workspace/workspace/src/entity.ts:110`、`:149` |
| 5 | 删除只删注册、顺序、账户 | `packages/workspace/workspace/src/index.ts:585`（`deleteKnown`）；`packages/workspace/workspace/README.md` 的 “Hiding and restoring sessions, and removing projects” |
| 6 | 持久形状：workspace 域 version 2，一张表 + 全局状态 | `packages/workspace/workspace/src/spec.ts:57`、`:77`、`:78` |
| 7 | 物理文件 `$DSH_HOME/storages/workspace.json` | `packages/bundle/base/cordis.patch.yml:185`（storage-json root）+ `:187` 起的 `storage-domain` 路由；`packages/storage/storage-json/README.md` 的 `<unit>.json` |
| 8 | 启动顺序：恢复标记 → 校验 → 仅首次 bootstrap → 重建缓存 | `packages/workspace/workspace/src/index.ts:199`；bootstrap 主体 `:650` |
| 9 | bootstrap 只读日志头、按规范 cwd 分组、组间按最新会话倒序 | `packages/workspace/workspace/src/index.ts:650`；`docs/subsystems/workspace.md` 的 bootstrap 段 |
| 10 | 首启默认工作区在 `<Documents>/deepseek-harness/default-workspace` | `packages/api/workspace-controller/src/default-directory.ts:77`；`default-workspace.ts:16`、`:29`；`index.ts:104` |
| 11 | 创建会话：workspaceId 与 cwd 互斥；cwd 取 workspace.path | `packages/api/session-controller/src/commands.ts:111`、`:124`、`:140` |
| 12 | 缺省 cwd 是 `process.cwd()` | `packages/api/session-controller/src/index.ts:163` |
| 13 | fork 继承/沿谱系找工作区 | `packages/api/session-controller/src/commands.ts:227`、`:300`、`:550` |
| 14 | 外部集成的 attach 顺序 | `packages/experimental/webhook/src/session.ts:131`、`:148` |
| 15 | 沙箱边界 = 会话 cwd，配置值只兜底 | `packages/sandbox/sandbox-policy/src/index.ts:164`、`:168`；`packages/sandbox/sandbox-policy/README.md` 的配置表 |
| 16 | 组合里的兜底 `workspaceRoot` 是 `process.cwd()` | `packages/bundle/base/cordis.patch.yml:247` |
| 17 | 会话日志按 cwd 分区，分区名不是分组 | `packages/session/session-persistence-jsonl/src/format.ts:225`；`packages/bundle/base/cordis.patch.yml:141` |
| 18 | workspace 插件只在 web-app 组合，headless 没有 | `packages/bundle/web-app/cordis.patch.yml:91`；headless 组合无该行 |
| 19 | Ungrouped 是 Client 推导的空 key 兜底桶 | `packages/client/ui-workspace/src/client/tree.ts:18`、`:334`、`:367`、`:436` |
| 20 | 可见性：subagent、未选中空白被挡掉 | `packages/client/ui-workspace/src/client/tree.ts:244` 起 |
| 21 | 无 cwd 的冷会话不进列表 | `packages/api/session-controller/src/list.ts:144` |
| 22 | 标签来自字典（未分组 / Ungrouped） | `packages/client/ui-workspace/src/client/locales.ts:12`、`:138` |
| 23 | Ungrouped 无工作区菜单 / 悬浮卡片 | `packages/client/ui-workspace/src/client/rows/Rows.tsx:234`、`:311` |
| 24 | 搜索结果的兜底工作区名 | `packages/client/ui-workspace/src/client/rows/Rows.tsx:516` |
| 25 | 默认“最近更新”；手动模式用浏览器本地顺序，初值取账户顺序 | `packages/client/ui-workspace/src/client/stores.ts:86`、`:94`；`WorkspaceBrowser.tsx:988` 起 |
| 26 | 会话拖拽只写浏览器本地顺序，不调用 `insertSessionBefore` | `WorkspaceBrowser.tsx:418`（`commitSessionDrag` → `setSessionOrder`）、`:1067`；`insertSessionBefore` 仅有 API/服务与测试消费者 |
| 27 | 注册表允许重名；重命名 API 拒绝同名 | `packages/workspace/workspace/src/types.ts` 的 `title` 注释；`packages/api/workspace-controller/src/commands.ts:78` |
| 28 | 在 workspace 实体之前，侧栏分组按 cwd 推导 | `.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md` 的 Problem 段 |
| 29 | 启动时不清理未引用的行（被否决的替代方案） | `.agents/notes/archived/feature/2026-07-27-workspace-registration-deletion.md` 的 Alternatives considered |
| 26 | 置顶领跑、空白占位在前、归档保留槽位 | `packages/client/ui-workspace/src/client/tree.ts` 的 `sectionMembers`；`spec.ts` 的全局状态注释 |
| 27 | 三类分组方式 | `packages/client/ui-workspace/src/client/stores.ts:17`；`WorkspaceBrowser.tsx:157` 起 |
| 28 | follow：baseline + 增量，重连换一代 | `packages/api/workspace-controller/src/index.ts:205`；`src/feed.ts` |
| 29 | 远程访问裁剪后发 `replace` | `packages/api/workspace-controller/src/index.ts:234` 起 |
| 30 | 归档先问活动、可显式停掉 | `docs/subsystems/workspace.md` 的 Archive admission；`packages/workspace/workspace/README.md` 同节 |

## 二、本机读数的口径

时间：2026-10-27。对象：本机 `$DSH_HOME`（默认 `~/.dsh`）。

**工作区侧**：直接解析 `storages/workspace.json`。

- 记录数 = `tables.workspaces` 的键数；
- 已登记 id = 所有记录 `sessionIds` 的并集；
- 归档/置顶 = `global.archivedSessionIds` / `pinnedSessionIds` 长度。

**会话侧**：遍历 `sessions/<partition>/<session-dir>/`，取该目录下版本号最高的 `*.jsonl.zstd`，用 Node 22 的 `zlib.zstdDecompressSync` 解压，逐行找第一个带 `header`（或本身就是头）的 JSON 行，读 `id / cwd / origin / parentSession / createdAt`。

- 总数 = 会话目录数；
- subagent = `origin === 'subagent'` 或有 `parentSession`；
- 主会话 = 总数 − subagent；
- 已登记主会话 = 主会话 ∩ 已登记 id；
- 未登记主会话 = 主会话 − 已登记 id。

**已知误差**：

- “空白”是投影缓存里的字段（`session_projcache`），不在日志头里；本机这 58 条的缓存行缺失，按 `blank ?? false` 计为可见，因此 58 是上限而非精确 UI 行数。
- 已登记 id 里包含 19 个 subagent 子会话（bootstrap 时被一并扫入）。两组数字能对上：3864 = 2890 + 974；935 = 19 + 916。
- 这是单机单次静态快照，不是产品常量；换机器、换 home 都不适用。

## 三、和文档对过的地方

| 文档说法 | 源码现状 | 处理 |
|---|---|---|
| “newest first” 的工作区顺序 | 创建时前插，bootstrap 组间按最新会话倒序 | 一致；注意“新建的在前”，不是“最近使用的在前” |
| “sessionIds in manually owned order” | 账户顺序是手动模式的基础；默认视图按最近更新重排，且当前 GUI 的拖拽只改浏览器本地顺序 | 文档描述账户，不描述视图；本篇把账户、默认排序、本地手动排序三者分开写 |
| “a session can only belong to one project” | 读取端按单账户假设；启动校验拒绝重复登记 | 一致 |
| “removing a project leaves sessions ungrouped” | 删除只动注册/顺序/账户 | 一致 |
| “re-adding a directory starts a fresh project” | 新 uuid、空账户；bootstrap 不重跑 | 一致 |
| README 说 `create(path, title?)` 的 title 无生产调用方 | 源码有 TODO，当前只传 path | 一致，属实现备注 |

## 四、证据薄弱处

1. **没有对 GUI 做像素级验证。** 所有“左侧长什么样”的结论来自 `deriveGroups`、`WorkspaceBrowser`、`Rows` 与字典；没有截图对照。视觉细节（间距、图标、折叠动画）不在本篇范围。
2. **没有实测并发写。** JSON 后端没有文件锁；两个 Host 同时写同一 home 的后果（覆盖、丢更新、校验失败）未做实验，只作为风险提示。
3. **没有实测远程访问裁剪。** `follow` 的 `replace` 逻辑读自源码与 README，未用非 owner 客户端验证。
4. **没有实测历史 bootstrap 的中断恢复。** 结论来自 `initialized` 标记顺序与 `recoverPendingMutation` 的代码路径，未构造崩溃。
5. **Desktop 双进程共享 home** 未复测；FAQ 23 有相关运行时观察，本篇不重复判断。

## 五、复现本机读数的最小步骤

```sh
# 1. 工作区记录
python3 - <<'PY'
import json, os
d = json.load(open(os.path.expanduser('~/.dsh/storages/workspace.json')))
print('workspaces', len(d['tables']['workspaces']))
print('order', len(d['global']['workspaceIds']))
print('archived', len(d['global']['archivedSessionIds']))
PY

# 2. 会话头（Node 22+；需要 zstd）
node --input-type=module -e '
import { readdirSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { zstdDecompressSync } from "node:zlib"
const root = `${homedir()}/.dsh/sessions`
let total = 0, sub = 0, noCwd = 0
for (const part of readdirSync(root)) {
  const p = `${root}/${part}`
  if (!statSync(p).isDirectory()) continue
  for (const sd of readdirSync(p)) {
    const dir = `${p}/${sd}`
    if (!statSync(dir).isDirectory()) continue
    total++
    const f = readdirSync(dir).filter(n => n.endsWith(".jsonl.zstd")).sort().at(-1)
    if (!f) continue
    const line = zstdDecompressSync(readFileSync(`${dir}/${f}`)).toString("utf8").split("\n").find(Boolean)
    const row = JSON.parse(line)
    const h = row.header ?? row
    if (!h.cwd) noCwd++
    if (h.origin === "subagent" || h.parentSession) sub++
  }
}
console.log({ total, sub, noCwd })
'
```

这两段只读，不修改 home。把第二段的 `total/sub/noCwd` 与第一段的账户并集求差，就得到 04 篇的 58。

## 六、相关阅读

- 记录与生命周期：[`docs/subsystems/workspace.md`](../../docs/subsystems/workspace.md)
- 包合同与失败模式：[`packages/workspace/workspace/README.md`](../../packages/workspace/workspace/README.md)
- Host/Client 控制面：[`packages/api/workspace-controller/README.md`](../../packages/api/workspace-controller/README.md)
- 会话日志布局：[`packages/session/session-persistence-jsonl/README.md`](../../packages/session/session-persistence-jsonl/README.md)
- 数据平面归属（workspace / home / session）：[FAQ 24 的 05 篇](../24_plugin-publish-and-agent-data-planes/05-data-planes.md)
- `$DSH_HOME` 与发布形态：[FAQ 23](../23_standalone-vs-web-release-forms/answer.md)
