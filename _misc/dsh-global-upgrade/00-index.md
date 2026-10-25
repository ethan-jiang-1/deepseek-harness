# DSH 全局安装升级执行包（0.2.1-rc.2 → 0.2.1-rc.3）

**状态**：计划已就绪，**尚未执行**。快照时间 2026-10-25；环境 macOS、Node v22.23.1、pnpm 11.28.5（PATH 上）。

**读者**：负责执行升级的另一个 Agent，或直接操作的人。动手前必须读完本文件与 [执行手册](./01-runbook.md)；验收按 [验收清单](./02-acceptance.md)；判断依据在 [证据附录](./03-evidence.md)。

> 上一版（10-19）覆盖的是 `0.2.0-rc.2 → 0.2.1-rc.2`，那一步已经跑完，备份留在 `~/.dsh/backups/pre-upgrade-20261019-113258`。本版覆盖 `0.2.1-rc.2 → 0.2.1-rc.3`，是同一支线上的一次小步：宿主只多 4 个内容提交，插件侧一个都不必换（除 `dshmarket` 建议顺手升级）。

## 怎么用

下面是文档；想直接跑就用同目录的 [`rc3-upgrade.sh`](./rc3-upgrade.sh)，它把阶段 0–3 串成一个带守卫的脚本：

```sh
cd /Users/bowhead/deepseek-harness/_misc/dsh-global-upgrade
./rc3-upgrade.sh --dry-run        # 只读预检，确认版本与哈希
./rc3-upgrade.sh                  # 真升，破坏性步骤前逐个确认
./rc3-upgrade.sh --rollback ~/.dsh/backups/pre-rc3-<时间戳>
```

脚本在**独立终端**里跑（铁律 2 由它自己检查：若当前 shell 是被升级的那个 `dsh web` 的后代进程，直接拒绝执行）。文档仍然保留，因为脚本只盖住你说的这两步；扩展到下一个版本时，改文档与脚本要同步。

## 这个目录是什么

一份"照着敲就能完成"的升级执行包，把 2026-10-25 的调研结论固化下来：升什么、什么顺序、每一步怎么验证、失败怎么退。它不是设计文档，执行时不需要再读仓库源码。

## 两条铁律（先记这两条，其它都可以慢慢看）

### 1. 升级只走"老方法"：npm 全局安装 + `dsh plugin`

DSH 是命令行全局安装的，**升级也只用命令行那一套**：

- 升级本体：`npm i -g @deepseek-ai/dsh@next`
- 升级插件：`dsh plugin --profile web add <包>@<版本>`

**不得**借助本仓库（`/Users/bowhead/deepseek-harness`）完成升级：

- 不跑 `pnpm dsh ...`（那是源码路径，不是安装路径）
- 不跑 `pnpm install` / `pnpm build` / `pnpm dev:web`
- 不用 `dsh plugin ... add link:<repo>/...` 或任何指向仓库的路径安装
- 不用 `--patch` 指向仓库里的文件
- 不把仓库当成"已经有 0.2.1-rc.3，所以可以直接用"的来源（仓库恰好是这个版本，但它是开发源码，不是安装产物）

本目录里的 Markdown 只是文档；仓库代码只用于调研时理解行为，升级过程一律不读不跑。

### 2. 执行者不能是"正在被升级的那个进程"

当前的 Web GUI（`http://127.0.0.1:3080`）就跑在全局安装的 `dsh web` 上，同一个包目录就是 `npm i -g` 要替换的那个目录。因此：

- **不要在当前这个 Web 会话里执行升级**：停 `dsh web` 会终止会话，替换全局包会让正在运行的进程与磁盘文件不一致。
- 正确做法：在一个**独立终端**里操作（先停 `dsh web`，再升级，再启动，最后回浏览器刷新）。

## 本次升级的字面目标

| 项 | 现值（2026-10-25 快照） | 目标 |
| --- | --- | --- |
| `@deepseek-ai/dsh` | `0.2.1-rc.2` | **`0.2.1-rc.3`**（npm dist-tag `next`） |
| `dshmarket` | `1.66.42` | **`1.70.2`**（npm `latest`，10-24 发布） |
| 其余 6 个插件 | 见 [执行手册 0.1](./01-runbook.md#01-记录当前状态) | **不动** |

`npm` dist-tags 现状：`latest` = `0.2.1-rc.2`，`next` = `0.2.1-rc.3`，`alpha` = `0.2.1-alpha.5`。所以命令必须写 `@next` 或精确 `@0.2.1-rc.3`，写成不带 tag 的 `npm i -g @deepseek-ai/dsh` 等于是原地不动。

## 为什么这次是小步

rc.3 相对 rc.2 只有 6 个提交（4 个内容提交 + release + merge），且**宿主判定插件的代码一行没动**：`packages/boot/` 与 `packages/boot/app-boot/src/` 的 diff 只有 `package.json` 版本位。`ctx` 服务仍 99 个、`SESSION_FORMAT_VERSION` 仍 4，会话格式与配置组合方式都没变。逐插件的兼容证据见 [证据附录](./03-evidence.md)。

风险面不在宿主，而在两个与宿主同重量级的 UI 依赖：

- `dsh-better-sidebar@0.28.0` 会接管整个侧栏，而 rc.3 恰好改了官方侧栏、`ui-primitives` 的 `Tooltip` 落位与 `Menu` 参数。已核对符号与 slot 均未删除，但**必须实机点一遍**（见验收清单 E 段）。
- `dshmarket` 是"装/升插件"的那个组件，1.66.42 落后 12 个版本，且 rc.3 之后官方市场行为有变化——所以本次把它一并升到 `1.70.2`，否则你在 rc.3 上用它更新插件还得靠 remove → add 兜底。

## 预判的坑（本次特有，执行前先读）

1. **`minimumReleaseAgeExclude` 会把 pnpm 拦下来**。`~/.dsh/profiles/web/pnpm-workspace.yaml` 里有一个 `minimumReleaseAgeExclude` 列表，里面的写法是**版本选择器（selectors）**而不是精确版本，例如 `dshmarket@1.65.1 || 1.66.5 || 1.66.6 || 1.66.17 || 1.66.42`。按 pnpm 的解析规则，这一条会让 `1.65.1`、`1.66.5`、`1.66.6`、`1.66.17`、`1.66.42` 全部满足排除条件——**新加的版本必须整份重写成含 `1.70.2` 的选择器**，不能只追加一行 `dshmarket@1.70.2`（追加的那行也会被解析成一条独立选择器，把这一包的所有版本都排除掉）。详见 [执行手册 2.1](./01-runbook.md#21-dshmarket--1702目标-1702)。
2. **锁文件版本与 pnpm 版本不一致**：`pnpm-lock.yaml` 写的是 `lockfileVersion: '9.0'`，`node_modules/.modules.yaml` 记录 `pnpm@12.5.1`，而 PATH 上的 pnpm 是 `11.28.5`。`dsh plugin` 用的就是 PATH 上的那个。11.x 读得懂 9.0 锁文件，正常情况下无事；若 pnpm 报格式相关错误，**不要**手工改锁文件，停下来报告。
3. **`cordis.patch.yml` 已不是 10-19 的样子**：现在是 13,641 字节、sha256 `0584e3be…`，唯一一处内容差异是 `agent-default-model` 从 `yovole/DeepSeek-V4-Flash` 改成了 `dimagent-oauth/deepseek-v4.1-flash`。验收以**本次阶段 0 的备份**为准，不要拿 10-19 的旧哈希比。
4. **不要点 dshmarket 的"更新官方插件"**：升级后的第一轮验收把市场里的写操作全部跳过（见验收清单 E7），只核版本号。

## 手里有哪几条路

| 场景 | 做法 |
| --- | --- |
| 只升宿主，插件完全不动 | 阶段 1 完成后直接阶段 3。6 个旧插件在 rc.3 上兼容性已验（见证据附录 §3） |
| 宿主 + dshmarket（**推荐**） | 阶段 1 → 2.1 → 阶段 3 |
| 想顺便把 auto-continue / skill-explorer 也升 | 额外 2.2、2.3。两者都只是可选升级，不是必需 |
| 出问题 | 阶段 4 回滚。会话格式仍是 v4，回滚代价比上次小得多 |

当前、经核验的 DSH 机制解读在 [`../../_digested/00-index.md`](../../_digested/00-index.md)；跨材料二次研究在 [`../../_faq_on_digested/00-index.md`](../../_faq_on_digested/00-index.md)。
