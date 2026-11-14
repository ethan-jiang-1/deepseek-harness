# Reference 25 · 源码入口、设计记录与只读排查脚本

本页集中列出本篇引用的 DSH 子系统文档、前后端核心源码路径、架构决策记录（Agent Notes）以及本地 `$DSH_HOME` 只读体检脚本。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、官方子系统文档与包说明书

- **工作区实体与注册表**
  - 子系统权威契约与生成的 Cordis API：[`docs/subsystems/workspace.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/workspace.md)
  - 注册表用法、生命周期与已知边界：[`packages/workspace/workspace/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/README.md)
  - 远程控制面与首次启动默认工作区策略：[`packages/api/workspace-controller/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-controller/README.md)
- **会话工作目录、沙箱边界与持久化布局**
  - 会话有效工作目录子系统（`ctx.workingDirectory`）：[`docs/subsystems/working-directory.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/working-directory.md)
  - 工作目录服务与模型切换工具：[`packages/session/working-directory/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/working-directory/README.md)、[`packages/session/tool-working-directory/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/tool-working-directory/README.md)
  - 文件沙箱策略与 `workspaceRoot` 解析优先级：[`docs/subsystems/sandbox.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md)、[`packages/sandbox/sandbox-policy/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/sandbox-policy/README.md)
  - 会话头（`SessionHeader`）、存储域与对话视图装配：[`docs/subsystems/persistence.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/persistence.md)、[`packages/session/session-persistence-jsonl/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-persistence-jsonl/README.md)、[`docs/subsystems/storage.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/storage.md)、[`docs/subsystems/conversation.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/conversation.md)

---

## 二、核心源码对照索引

| 机制环节 | 对应源码路径 |
|---|---|
| `Workspace` 公开接口与 `WorkspaceId` 品牌类型 | [`packages/workspace/workspace/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/src/types.ts) |
| `workspace` 存储域 Schema（v2）与全局状态定义 | [`packages/workspace/workspace/src/spec.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/src/spec.ts) |
| `attachSession` 五步校验、成员过滤与 `ENOENT` 保留逻辑 | [`packages/workspace/workspace/src/entity.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/src/entity.ts)、[`packages/workspace/workspace/src/paths.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/src/paths.ts) |
| 启动恢复标记、完整性校验、一次性历史 `bootstrap` 与归档准入事件 | [`packages/workspace/workspace/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/src/index.ts) |
| `workspace/follow` 流推送、重命名同名拦截与 `default-workspace` 路径解析 | [`packages/api/workspace-controller/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-controller/src/index.ts)、[`commands.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-controller/src/commands.ts)、[`default-directory.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-controller/src/default-directory.ts) |
| 会话创建时 `workspaceId` / `cwd` / `process.cwd()` 优先级、Fork 归属继承与冷列表过滤 | [`packages/api/session-controller/src/commands.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/commands.ts)、[`index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/index.ts)、[`list.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/list.ts) |
| 外部宿主扩展显式建组并挂接会话的参考写法 | [`packages/experimental/webhook/src/session.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/webhook/src/session.ts) |
| 会话中途切换有效工作目录与缺失目录回退原项目 | [`packages/session/working-directory/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/working-directory/src/index.ts) |
| 沙箱可写边界锚定 `SessionHeader.cwd` 及 `base` / `web-app` 组装配置 | [`packages/sandbox/sandbox-policy/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/sandbox-policy/src/index.ts)、[`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml)、[`packages/bundle/web-app/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml) |
| 客户端 `deriveGroups` 差集推导、`UNGROUPED_KEY` 与可见性过滤 | [`packages/client/ui-workspace/src/client/tree.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/tree.ts)、[`navigation.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/navigation.ts)、[`locales.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/locales.ts) |
| 窗口本地视图存储（`dsh.workspace.view.v5`）、拖拽行为与 `Ungrouped` 行渲染 | [`packages/client/ui-workspace/src/client/stores.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/stores.ts)、[`rows/WorkspaceBrowser.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/rows/WorkspaceBrowser.tsx)、[`rows/Rows.tsx`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/rows/Rows.tsx) |

---

## 三、关键历史决策记录（Agent Notes）与延伸 FAQ

- 为什么把侧栏从早期“按 `cwd` 推导的纯视觉分组”改为独立的存储域实体：[`.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md)
- 首次启动历史扫描（`bootstrap`）与 GUI 排序产品流（历史归档记录）：[`.agents/notes/archived/feature/2026-07-25-workspace-ui-product-flow.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-07-25-workspace-ui-product-flow.md)
- 为什么删除工作区必须是非破坏性的，且启动时不静默清理未引用记录（历史归档记录）：[`.agents/notes/archived/feature/2026-07-27-workspace-registration-deletion.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-07-27-workspace-registration-deletion.md)
- 首次使用自动初始化 `default-workspace` 的生命周期边界（历史归档记录）：[`.agents/notes/archived/feature/2026-09-20-default-workspace.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-09-20-default-workspace.md)
- 归档会话前检查并可选停止在途活动任务：[`.agents/notes/implemented/feature/2026-09-21-archive-stops-running-session-work.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-09-21-archive-stops-running-session-work.md)
- 延伸阅读：`$DSH_HOME` 目录结构与测试双环境隔离见 [FAQ 23](../23_standalone-vs-web-release-forms/answer.md)；各 capability seam 角色分工见 [FAQ 08](../08_plugin-seam-maturity/answer.md)。

---

## 四、本地只读体检脚本

以下 Node 22+ 单命令脚本**只读不写**，可直接统计当前 `$DSH_HOME`（未设置时默认 `~/.dsh`）下的工作区记录数、主会话数、子会话数以及未挂入任何工作区的会话目录分布：

```sh
node --input-type=module -e '
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { zstdDecompressSync } from "node:zlib"

const dshHome = process.env.DSH_HOME || join(homedir(), ".dsh")
const wsFile = join(dshHome, "storages/workspace.json")
const wsData = existsSync(wsFile) ? JSON.parse(readFileSync(wsFile, "utf8")) : { tables: { workspaces: {} }, global: {} }
const workspaces = Object.values(wsData.tables?.workspaces ?? {})
const accounted = new Set(workspaces.flatMap(w => w.sessionIds ?? []))

const sessionsRoot = join(dshHome, "sessions")
let total = 0, subagent = 0, noCwd = 0, mainAccounted = 0
const ungroupedByCwd = new Map()

if (existsSync(sessionsRoot)) {
  for (const part of readdirSync(sessionsRoot)) {
    const partDir = join(sessionsRoot, part)
    if (!statSync(partDir).isDirectory()) continue
    for (const sid of readdirSync(partDir)) {
      const dir = join(partDir, sid)
      if (!statSync(dir).isDirectory()) continue
      total++
      const log = readdirSync(dir).filter(n => n.endsWith(".jsonl.zstd")).sort().at(-1)
      if (!log) continue
      const firstLine = zstdDecompressSync(readFileSync(join(dir, log))).toString("utf8").split("\n").find(Boolean)
      const h = (JSON.parse(firstLine).header ?? JSON.parse(firstLine))
      if (h.origin === "subagent" || h.parentSession) { subagent++; continue }
      if (!h.cwd) { noCwd++; continue }
      if (accounted.has(h.id)) mainAccounted++
      else ungroupedByCwd.set(h.cwd, (ungroupedByCwd.get(h.cwd) ?? 0) + 1)
    }
  }
}

console.log({
  dshHome,
  workspaces: workspaces.length,
  accountedIds: accounted.size,
  archived: (wsData.global?.archivedSessionIds ?? []).length,
  totalSessionDirs: total,
  subagentSessions: subagent,
  noCwdColdSessions: noCwd,
  mainAccounted,
  mainUngrouped: total - subagent - noCwd - mainAccounted,
  ungroupedByCwd: Object.fromEntries([...ungroupedByCwd.entries()].sort((a, b) => b[1] - a[1])),
})
'
```
