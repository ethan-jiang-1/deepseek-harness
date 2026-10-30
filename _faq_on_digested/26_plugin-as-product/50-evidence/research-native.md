# Research Native v2 · DSH 原生证据表

## 0. 方法与边界

- 基线：`dsh-v0.2.1-rc.3`（`1f81c047`）；本仓库是**浅克隆**（`git rev-parse --is-shallow-repository` = true），2026-06 之前的 git 历史不可用。
- DSH 侧：343 个包、约 1,265 篇英文 Agent Note（298 implemented / 42 proposed / 925 archived）、67 篇 subsystem、49 篇 persistence-change、43 篇 upgrade guide、4 篇 postmortem、6 篇 defensive-pattern；本机 `$DSH_HOME` 只看结构（4.0 GB / 28,443 文件）。
- 外部市场：97 个候选、15 个深读，单独放在 [research-external](./research-external.md)；本表只保留 DSH 原生证据。
- 没有安装、没有运行第三方插件；C/H/P/U 用于 DSH 原生证据。
- 星数、目录计数、下载量不作质量证据；同名克隆/镜像排除并记录。

## 1. DSH 数据落点（33）

| id | 家 | 位置 | 权威 | 作用域 | 寿命 | 证据 |
|---|---|---|---|---|---|---|
| SESS-LOG | 会话日志 | `$DSH_HOME/sessions/--<cwd>--/<id>/session.v<N>.jsonl[.zstd]` | 会话 | session | 永久，无删除 API | C |
| SESS-GEN | 旧格式世代 | 同目录 | 只读历史 | session | 永久 | C |
| SESS-LOCK | 写租约 | `<sessionDir>/session.lock` | 并发裁决 | session | 写句柄生命周期 | C |
| SESS-TMP | 迁移临时件 | 同目录 `*.tmp` | 草稿 | session | 迁移期 | C |
| PROJCACHE | 投影缓存 | `$DSH_HOME/storages/session_projcache/sessions/<id>.json` | 派生 | session | 随日志 | C |
| PROJCACHE-LEGACY | 旧单文件 | `$DSH_HOME/storages/session_projcache.json` | 派生/已弃 | 全局 | 遗留 | C+H |
| WORKSPACE | 工作区注册表 | `$DSH_HOME/storages/workspace.json` | 权威 | home/跨项目 | 永久 | C |
| KV-SQLITE | 通用 KV | 配置 root；默认未挂 | 取决于 domain | home | 永久 | C |
| ATT-OBJ | 图片对象 | `$DSH_HOME/attachments/v1/objects/...` | 内容寻址 | session 引用 | 永久，无 GC | C |
| ATT-REQ | 请求图派生 | `attachments/v1/request-images/...` | 派生 | 请求级 | 随缓存 | C |
| ATT-FILEOBJ | 通用文件对象 | `attachments/v1/file-objects/...` | 内容寻址 | session | 永久 | C |
| ATT-FILES | 文件投影硬链 | `attachments/v1/files/...` | 派生 | session | 随对象 | C |
| ATT-TMP | 上传暂存 | `attachments/v1/tmp/` | 草稿 | 单次上传 | 秒级 | C |
| ATT-CACHE | 附件缓存 | `$DSH_HOME/cache/attachments/...` | 派生 | 机器 | 可清 | C |
| SPILL | 溢出文本 | OS temp `dsh-spill-*` | 模型引用 | session | 进程 + 启动 sweep | C |
| QIDX | 全文索引 | 配置 path；shipped `:memory:` | 派生 | 语料 | 可重建 | C |
| CREDS | 凭据文档 | `$DSH_HOME/.credentials.yaml` | secret | home | 永久 | C |
| CREDS-BAK | 凭据备份 | `.credentials.yaml.bak-*` | 历史 | home | 永久 | C |
| ENV-USER | 用户环境 | `$DSH_HOME/.env`、`<cwd>/.env` | 用户 | 机器/项目 | 永久 | C |
| ANON-ID | 匿名身份 | `$DSH_HOME/.anonymous-user-id` | 安装 | installation | 永久 | C |
| PROFILES | profile + patch | `$DSH_HOME/profiles/<name>/` | 权威 | profile | 永久 | C |
| PROFILE-NM | 依赖树 | `profiles/node_modules` | 派生 | profile | 随安装 | C |
| SETTINGS-LEGACY | 旧全局设置 | `settings.yaml.imported` | 已废 | 全局 | 冻结 | C+H |
| LOGS | 启动日志 | `$DSH_HOME/logs/` | 诊断 | 机器 | 无轮转 | C |
| PM-LOG | 插件管理日志 | `.plugin-manager/logs/` | 诊断 | profile | 无轮转 | C |
| PLUGIN-DATA | 第三方插件数据 | `$DSH_HOME/plugins/<id>/` | 插件自述 | 插件 | 插件自述 | C+U |
| LLM-INDEX | 上传索引 | `$DSH_HOME/llm-deepseek/files-v3.json` | 派生 | provider | 可重建 | C |
| DELIV | 交付声明 | 事件 + Host 内存 | 日志 | session/turn | 会话内快照 | C |
| SCHED | 定时提醒 | `ctx.storageDomain` 域 | 权威 | home | 跨会话 | C+U |
| CLIENT-LS | 浏览器状态 | `localStorage` | 客户端 | origin | 清站点 | C |
| TELEMETRY | 遥测 | 出站 HTTP | 远端 | 用户/会话 | 远端 | C |
| AGENTS-HOME | 共享 agent 根 | `$DSH_AGENTS_HOME` / `~/.agents` | 用户 | 跨工具 | 永久 | C |
| WORKTREE | worktree | `.agents/worktrees` | git 派生 | 仓库 | 可删 | C |

## 2. DSH 时间线（压缩）

完整 44 事件见本文件 §5“附录：44 事件清单”。关键节点：2026-06-14 session persistence → 2026-07-02 per-session cwd → 2026-07-08 spill → 2026-07-19 zstd → 2026-07-22 durable attachments → 2026-07-24 project session dirs / single home / domain KV proposal → 2026-07-28 settings seam + storage root proposal → 2026-08-13 credential records → 2026-08-19 per-record projcache → 2026-08-27 handle persistence → 2026-08-30 ignorable events → 2026-08-31 released format migrations → 2026-09-08 present paths → 2026-09-16 V4 → 2026-09-19 profile-owned config → 2026-10-09 stored credential precedence.

## 3. DSH 关键决定与证据

| 结论 | 证据 | 等级 |
|---|---|---|
| 一个 home，不拆 XDG；`~/.agents` 在外 | `2026-07-24-single-harness-home-resolver` | H/C |
| settings 并入 profile patch；`settings.yaml` 一次性 import | `2026-09-19-profile-owned-live-configuration` | H/C |
| 凭据 ref + record；不 hoist；模型同 uid 可读 | `2026-07-30`、`2026-08-13` | H/C |
| handle-based session persistence；无 delete | `2026-08-27`；`SessionPersistence` 5 方法 | H/C |
| 已发布格式不可覆盖/删除；流式 stage | `2026-08-31` | H/C |
| domain KV 明确 out-of-scope：scope/migration/cross-process | `2026-07-24-domain-kv-storage-and-workspace` | P |
| per-record projcache；键 path-safe | `2026-08-19-projection-cache-per-session-files` | H/C |
| 附件无 GC 是刻意（引用感知 GC blocker） | `2026-07-22-web-multimodal...` | H/C |
| present 只记路径；不复制 | `2026-09-08-present-workspace-source-files` | H/C |
| plugin records 只限 experimental；ignorable 保留 | `2026-08-30-retain-ignorable...` | H/C |

## 4. 外部证据入口

外部插件的候选、深读与来源见 [research-external](./research-external.md)；本篇只保留 DSH 原生证据。


## 5. 附录：44 事件清单

状态：I=implemented、A=archived、P=proposed、R=rejected、C=current contract。A 是历史，不是现状。

| 日期 | Note | 状态 | 影响的家 | 一句话 |
|---|---|---|---|---|
| 2026-06-14 | session-persistence | A | SESS-LOG | 持久化抽成 `SessionPersistence` 抽象服务，实体化 `SessionEvent`，不引入平行事件类型 |
| 2026-06-15 | turn-enclosure-invariant | A | SESS-LOG | 每个事件必须落在某个 turn 内，日志可安全截断到 turn 边界 |
| 2026-06-19 | workspace-context | A | AGENTS-HOME | 工作区上下文指令文件进入 prompt 链 |
| 2026-06-24 | acp-snapshot-tests | A | SESS-LOG | 会话日志成为回归快照的比对物 |
| 2026-07-05 | skill-system | A | AGENTS-HOME | 技能渐进披露，用户/项目技能目录分级 |
| 2026-07-08 | tool-output-spill-files | I | SPILL | 溢出文本落本地文件，模型拿 locator 而非整段 |
| 2026-07-10 | agent-session-identity-and-log-location | A | SESS-LOG | 会话身份经 `ctx.shellEnv` 下发，禁止进程全局猜测 |
| 2026-07-10 | session-query-service / sqlite-provider | A | QIDX | 统一查询服务 + SQLite FTS5 作为可弃派生索引 |
| 2026-07-17 | local-spill-startup-cleanup | A | SPILL | 启动期一次性清扫旧 spill 根 |
| 2026-07-22 | web-multimodal-image-and-durable-attachments | A | ATT-OBJ | 图片成为持久内容寻址对象，日志只存引用 |
| 2026-07-24 | project-session-directories | A | SESS-LOG | 每会话一个目录（为 metadata/attachment/spill 留位），替代桶内平铺 |
| 2026-07-24 | single-harness-home-resolver | I | 全部 home | 唯一解析 `explicit > $DSH_HOME > ~/.dsh`，不拆 XDG；空 `$DSH_HOME` 视为未设 |
| 2026-07-24 | domain-kv-storage-and-workspace | **P** | WORKSPACE / KV | 提出 `packages/storage` 三层 + workspace 实体；确认"非会话数据无处可放" |
| 2026-07-25 | workspace-ui-product-flow | A | WORKSPACE | Workspace 从 cwd 派生分组升级为真实对象 |
| 2026-07-27 | session-projection-and-command-log | P | PROJCACHE / 事件 | 投影注册表 + 命令生命周期入日志（三个前端各自造的轮子归一） |
| 2026-07-28 | user-settings-seam | A | SETTINGS-LEGACY | `ctx.settings` 三包边界 + 分层解析，替代 cwd 的 profile json |
| 2026-07-28 | storage-root-and-derived-medium-recovery | P | PROJCACHE-LEGACY / WORKSPACE | 根目录错位已修（`storages` 锚 `$DSH_HOME`），相对根 resolve-once 仍开放；派生介质不可 brick 启动 |
| 2026-07-28 | cross-workspace-resume | A | SESS-LOG | 跨工作区恢复会话（目录按项目，但恢复不受限） |
| 2026-07-29 | request-level-llm-config-credentials | A | CREDS | 一个请求一份解析快照 |
| 2026-07-30 | settings-write-path-integrity | A | SETTINGS-LEGACY | 单写链 + 读-改-写 + `wx` 兄弟锁，修"破坏未观测状态" |
| 2026-07-30 | credential-boundaries-and-atomic-registration | I | CREDS | 凭据文档只属 provider，**不 hoist 进 `process.env`**；明示"模型无边界" |
| 2026-08-04 | credentials-yaml-and-user-environment-layer | A | CREDS / ENV-USER | `.env` 一拆二：`.credentials.yaml`（store）+ `.env`（普通环境层） |
| 2026-08-04 | configuration-source-ownership | I | 全配置 | 非秘密值单一排序；禁止被发现文件决定 endpoint |
| 2026-08-10 | web-session-log-export | A | SESS-LOG | 日志导出走 host 流式 ZIP，非 RPC |
| 2026-08-13 | credential-records-and-authorization-flows | I | CREDS | 引入 `CredentialKey`（`<scope>/<id>`）与 grant 记录，OAuth 可落盘 |
| 2026-08-18 | sqlite-physical-chunk-row-compression | A | （已删包） | 物理行打包压缩；后随 SQLite 持久化整体移除 |
| 2026-08-19 | projection-cache-per-session-files | A | PROJCACHE | 单文件 → per-record，每会话一档，消除全量重写放大 |
| 2026-08-22 | single-dsh-application-launcher | I | PROFILES | 一切应用经 `dsh --profile`，profile 成为数据边界 |
| 2026-08-24 | browser-token-authentication | I | CREDS | 浏览器 token 经凭据 seam |
| 2026-08-25 | persistence-latency-and-page-size | A | SESS-LOG | 压缩级别/写入放大的实测决策（501 会话、20 亿字节语料） |
| 2026-08-26 | generic-file-upload | I | ATT-FILEOBJ / ATT-FILES | 任意文件字节冻结在 `DSH_HOME`，内容寻址 + 硬链，**拒绝放工作区** |
| 2026-08-27 | handle-based-session-persistence | I | SESS-LOG | seam 收窄为 5 方法返回 handle；崩溃修复移出 persistence |
| 2026-08-30 | jsonl-only-session-persistence | I | SESS-LOG | 删除 SQLite Session 持久化，JSONL 为唯一一方实现；旧库不迁移 |
| 2026-08-31 | released-session-format-migrations | I | SESS-GEN | 迁移改为有状态流式 stage；不可覆盖/删除已提交世代 |
| 2026-09-02 | projcache-cross-version-read-compat | A | PROJCACHE | v3 单文件升级可 brick 启动；v4 丢标题 → 读兼容与备份跳过 |
| 2026-09-10 | session-data-compatibility | **P** | SESS-LOG | 用户只关心"旧会话还能不能打开"；失败时保留整代 + 错误文本 |
| 2026-09-13 | session-working-directory | I | SESS-LOG | 工作目录成为持久会话事实 |
| 2026-09-16 | session-format-v4（persistence-change） | C | SESS-LOG / SESS-GEN | Header.version 3→4；tool-role 结果、producer-owned source、forked turn/end |
| 2026-09-19 | profile-owned-live-configuration | I | PROFILES / SETTINGS-LEGACY | 设置并入活跃 profile 的 `cordis.patch.yml`；`$DSH_HOME/settings.yaml` 一次性 import 后改名 |
| 2026-09-22 | fatal-diagnostics-and-crash-reports | I | LOGS / SPILL | 崩溃不可恢复即 fail-loud 并落诊断；spill 目录消失导致的 ENOENT 事故 |
| 2026-09-28 | session-corpus-performance | I | SESS-LOG / QIDX | 大语料列表/搜索基线 |
| 2026-10-05 | shared-agents-root-instructions | I | AGENTS-HOME | `~/.agents`（`$DSH_AGENTS_HOME`）进入用户级指令链，仍在 home 之外 |
| 2026-10-09 | stored-credential-precedence | I | CREDS | 存储凭据 > 继承环境 > cwd `.env` > `$DSH_HOME/.env`；`describe` 恒 `writable` |
| 2026-10-12 | headless-environment-auth | I | CREDS | headless profile **不挂** credential store，per-run 覆盖策略变化 |
