# 执行手册

按阶段顺序执行，每阶段末有"通过标准"和"停止条件"。命中停止条件就停下、保留输出、走[回滚](#阶段-4-回滚)。全程只改 `~/.dsh/` 与全局 npm 安装，**不碰仓库**。

- 目标：`@deepseek-ai/dsh` 从 `0.2.0-rc.2` 升到 `0.2.1-rc.2`，并升级 5 个插件。
- 预计耗时：预检 5 分钟、本体 2 分钟、插件 5–15 分钟（取决于 pnpm 网络）、验收 10 分钟。
- 全程需要一个**独立终端**，不要在当前 Web 会话里执行（见 [00-index](./00-index.md) 铁律 2）。

---

## 阶段 0 预检（只读）

### 0.1 记录当前状态

```sh
dsh --version
which dsh
node -v
pnpm -v
npm ls -g --depth=0 @deepseek-ai/dsh
```

期望（2026-10-19 快照）：

| 命令 | 期望输出 |
|---|---|
| `dsh --version` | `0.2.0-rc.2` |
| `which dsh` | `/Users/bowhead/.nvm/versions/node/v22.23.1/bin/dsh` |
| `node -v` | `v22.23.1` |
| `pnpm -v` | `11.28.5`（任意 10+ 均可） |
| `npm ls -g --depth=0 @deepseek-ai/dsh` | `@deepseek-ai/dsh@0.2.0-rc.2` |

再记录插件版本：

```sh
node -p "JSON.stringify(require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies,null,2)"
```

期望：

```json
{
  "@arcships/dsh-dim-oauth": "^0.2.1",
  "@cerbur/clutch-dsh-worktree": "0.1.17",
  "@linxin666/dsh-client-ui-skill-explorer": "0.4.4",
  "@quill507/dsh-auto-approval-llm": "0.0.41",
  "dsh-better-sidebar": "0.25.0",
  "dsh-client-auto-continue": "^0.14.2",
  "dshmarket": "1.66.17"
}
```

### 0.2 备份（别省）

```sh
TS=$(date +%Y%m%d-%H%M%S)
B="$HOME/.dsh/backups/pre-upgrade-$TS"
mkdir -p "$B"
cp "$HOME/.dsh/profiles/web/cordis.patch.yml"    "$B"/
cp "$HOME/.dsh/profiles/web/package.json"        "$B"/
cp "$HOME/.dsh/profiles/web/pnpm-lock.yaml"      "$B"/
cp "$HOME/.dsh/profiles/web/pnpm-workspace.yaml" "$B"/
shasum -a 256 "$B"/*
echo "backup dir: $B"
```

期望哈希与 2026-10-19 快照一致：

| 文件 | 字节 | sha256 |
|---|---|---|
| `cordis.patch.yml` | 13,632 | `9ae146720aff735e1ba1eb9124989b440e327b06a6ac0f38dd66e68983859d0d` |
| `package.json` | 762 | `6531f0380d3a273c1c72add94dd171dffabce1ae4fb11eb5cb4cd5e45da6c1eb` |
| `pnpm-lock.yaml` | 51,222 | `9e44bfada1ce5fe785cdf09d3c495ad651419777bfd1838271f2d33f31309b8d` |
| `pnpm-workspace.yaml` | 403 | `5dd3510e271bbdb4380f1f8cf0931ba09e1ce72a3424a877f9b90250f9ef21c2` |

`cordis.patch.yml` 里有 7 个自定义 provider（MICU / OpenRouter / Z.ai / Kimi CN / TeamoRouter / OpenCode Go / Yovole），是本机唯一的配置副本。**这个文件比其它任何东西都重要。**

可选：给会话目录做个快照（体积大，若磁盘紧张可跳过；0.2.1 未改会话格式，正常升级不需要它）。

```sh
tar czf "$B/sessions.tgz" -C "$HOME/.dsh" sessions
```

### 0.3 检查 npm 缓存可写

```sh
npm config get cache
npm view @deepseek-ai/dsh@next version --cache "$HOME/.npm-cache-dsh"
```

- 正常：输出 `0.2.1-rc.2`。
- 如果报 `EPERM` / `Your cache folder contains root-owned files`：**不要 sudo**，后续所有 npm 命令都加 `--cache "$HOME/.npm-cache-dsh"`。该方式已实测可用。
- 如果 `npm view` 超时：网络问题，先解决网络再继续。

### 0.4 停掉正在运行的 `dsh web`

```sh
lsof -ti tcp:3080
```

- 有输出（一个 PID）：先试 `kill <PID>`（普通 TERM），等 3 秒；再 `lsof -ti tcp:3080` 应为空。仍占用再 `kill -9 <PID>`。
- 没有输出：说明没在跑，继续。
- 如果它由别的服务（launchd、pm2、某个终端标签）托管，用管理它的方式停止；不要只杀进程留下托管守护再拉起。

通过标准：`lsof -ti tcp:3080` 无输出，`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3080` 返回 `000`。

**注意**：从这一步起，当前 Web 会话（如果执行者就是那个界面）会断开。这正是要求"独立终端"的原因。

### 0.5 registry 预检（确认目标版本都在，且没被撤包）

```sh
npm view @deepseek-ai/dsh@next version
npm view dsh-better-sidebar@0.28.0 version
npm view @quill507/dsh-auto-approval-llm@0.0.43 version
npm view dshmarket@1.66.42 version
npm view @linxin666/dsh-client-ui-skill-explorer@0.4.7 version
npm view @cerbur/clutch-dsh-worktree@0.1.18 version
```

期望依次：`0.2.1-rc.2`、`0.28.0`、`0.0.43`、`1.66.42`、`0.4.7`、`0.1.18`。

> 若 0.3 判定要用备用缓存，本节与后续所有 npm 命令都加上 `--cache "$HOME/.npm-cache-dsh"`。

### 阶段 0 停止条件

任何一条命中：**停**，不要继续，把输出贴给负责人。

- `dsh --version` 不是 `0.2.0-rc.2`（说明环境已经被动过，先搞清楚现状）。
- 备份哈希与上表不一致（说明 patch 在快照之后被改过，先确认改了什么）。
- 3080 端口停不下来。
- 任一目标版本查不到。

---

## 阶段 1 升级 DSH 本体

### 1.1 安装

```sh
npm i -g @deepseek-ai/dsh@next
```

- 如果 0.3 判定要用备用缓存：`npm i -g @deepseek-ai/dsh@next --cache "$HOME/.npm-cache-dsh"`。
- 不要写 `@latest`（`latest` 仍是 0.2.0-rc.2，等于没升）。

### 1.2 验证

```sh
dsh --version
npm ls -g --depth=0 @deepseek-ai/dsh
```

期望：`0.2.1-rc.2`，且全局树里只有这一个版本。

### 1.3 中间验证（推荐，能提前把问题定位到"宿主"还是"插件"）

此时插件还是旧版，先跑一次纯配置组合（不监听端口、不起 GUI）：

```sh
dsh --profile web --dump-config > /tmp/dsh-web-config-021.yml 2> /tmp/dsh-web-config-021.err
echo "exit=$?"
wc -l /tmp/dsh-web-config-021.yml
cat /tmp/dsh-web-config-021.err
```

通过标准：

- 退出码 `0`，YAML 非空。
- `.err` 里**没有** `startup failed`、`disabling profile plugin`、`incompatible with dsh`。
- `.err` 里**允许**出现 `pending (waiting for service: webRuntime)`（旧版 better-sidebar 的预期现象）；若完全没有这条也正常，取决于该命令是否真的启动插件。
- 配置里能找到 7 个 provider 名：`micu`、`openrouter`、`zai`、`moonshotai-cn`、`teamorouter`、`opencode-go`、`yovole`。

### 阶段 1 停止条件

- `npm i -g` 失败：先看错误类型。网络 → 重试；`EPERM` → 加 `--cache`；`EACCES` → 不要 sudo，改用 `npm i -g --prefix <可写前缀>` 前先问负责人。
- `dsh --version` 仍是 `0.2.0-rc.2`：说明装到了别的 Node 前缀，检查 `which dsh` 是否仍在 nvm 的 v22.23.1 下。
- `--dump-config` 出现 `startup failed` 或 `disabling profile plugin`：**不要升级插件**，直接走回滚，保留 `/tmp/dsh-web-config-021.err`。

---

## 阶段 2 升级插件（严格按顺序）

通用规则：

- `--profile web` 必须写在 pnpm 参数**前面**。
- 一条一条执行，每条执行完立刻验证版本，再执行下一条。
- 命令失败时**不要**紧接着重试别的命令；先判断错误类型（见附录 B）。
- 不要用 `allow-version` 绕过兼容检查。

### 2.1 `dsh-better-sidebar` → 0.28.0（关键项，不升等于侧栏消失）

```sh
dsh plugin --profile web add dsh-better-sidebar@0.28.0
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies['dsh-better-sidebar']"
```

期望：`0.28.0`。

### 2.2 `@quill507/dsh-auto-approval-llm` → 0.0.43

```sh
dsh plugin --profile web add @quill507/dsh-auto-approval-llm@0.0.43
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies['@quill507/dsh-auto-approval-llm']"
```

期望：`0.0.43`。该版本的 `cordis.patch.yml` 里 8 个配置键与你现在 pin 的完全兼容，**不需要改 patch**。

### 2.3 `dshmarket` → 1.66.42

```sh
dsh plugin --profile web add dshmarket@1.66.42
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies.dshmarket"
```

期望：`1.66.42`。低于 1.66.42 的版本在 0.2.1 上"更新官方插件"会报 `already-installed`。

### 2.4 `@linxin666/dsh-client-ui-skill-explorer` → 0.4.7

```sh
dsh plugin --profile web add @linxin666/dsh-client-ui-skill-explorer@0.4.7
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies['@linxin666/dsh-client-ui-skill-explorer']"
```

期望：`0.4.7`。

### 2.5 `@cerbur/clutch-dsh-worktree` → 0.1.18

```sh
dsh plugin --profile web add @cerbur/clutch-dsh-worktree@0.1.18
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies['@cerbur/clutch-dsh-worktree']"
```

期望：`0.1.18`。

### 2.6 明确不动的两个

| 包 | 原因 | 万一需要处理的迹象 |
|---|---|---|
| `@arcships/dsh-dim-oauth@0.2.1` | 已是 npm 最新，没有面向 0.2.1 的新版本；声明范围通过 | DimAgent 登录报错或模型组消失 → 在 patch 里禁用 `dimagent-oauth` 那一行即可，不影响其它 7 个 provider |
| `dsh-client-auto-continue@0.14.2` | 同上 | 不再自动继续 → 同样可临时禁用，不影响主流程 |

### 2.7 收尾检查

```sh
node -p "JSON.stringify(require(process.env.HOME+'/.dsh/profiles/web/package.json'),null,2)"
```

`dsh.profile.bundles` 应仍是这 9 项（顺序可能与你看到的略有不同，CLI 一般保留既有顺序；只要 9 项都在即可）：

```
@deepseek-ai/dsh-base
@deepseek-ai/dsh-web-app
dshmarket
dsh-better-sidebar
@quill507/dsh-auto-approval-llm
dsh-client-auto-continue
@arcships/dsh-dim-oauth
@cerbur/clutch-dsh-worktree
@linxin666/dsh-client-ui-skill-explorer
```

如果 bundles 里少了某个包，说明 reconcile 把它当成"已移除"，补一条 `dsh plugin --profile web add <pkg>@<ver>` 重新加回。

### 阶段 2 停止条件

- 任一 `add` 返回非 0：停，读 stderr，按附录 B 处理；处理不了就回滚。
- 任一条出现 `incompatible-version` / "requires" 字样：说明版本判断错了，**不要用 `allow-version`**，停并回滚。
- 出现 `already-installed`：改为先 `remove` 再 `add`（见附录 B），成功则继续，失败则停。
- pnpm 报错提到 `minimumReleaseAge`（目标版本"发布太新"）：在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 里加上**精确版本**（例如 `dsh-better-sidebar@0.28.0`），再重跑该条。当前环境该项未启用（`pnpm config get minimumReleaseAge` 返回 `undefined`），正常不会遇到。

---

## 阶段 3 启动与验收

```sh
dsh web --no-open
```

或按平时的方式启动（不加 `--host 0.0.0.0` —— 0.2.1 已拒绝绑定通配地址）。等日志出现 `dsh web: http://127.0.0.1:3080/?token=...` 后，按 [验收清单](./02-acceptance.md) 逐项检查。

通过标准（摘要，详见验收清单）：

- 日志没有 `startup failed`、`disabling profile plugin`、`Plugins waiting for services`。
- 浏览器能打开、侧栏在、7 个 provider 组在。
- `cordis.patch.yml` 的 sha256 与备份一致。

---

## 阶段 4 回滚

### 触发条件（任一）

- 阶段 1 的 `--dump-config` 失败。
- 插件升级过程中任一步失败且附录 B 处理不了。
- 启动日志出现 `startup failed` 或必需插件失败。
- 验收清单里"阻断级"项失败。

### 步骤

```sh
# 1. 停掉 web（macOS 的 xargs 没有 -r，用 shell 判空）
PIDS=$(lsof -ti tcp:3080); [ -n "$PIDS" ] && kill $PIDS
sleep 3

# 2. 回退本体
npm i -g @deepseek-ai/dsh@0.2.0-rc.2

# 3. 恢复 profile 元数据（用阶段 0 的备份目录）
B="$HOME/.dsh/backups/pre-upgrade-<TS>"
cp "$B/cordis.patch.yml"    "$HOME/.dsh/profiles/web/cordis.patch.yml"
cp "$B/package.json"        "$HOME/.dsh/profiles/web/package.json"
cp "$B/pnpm-lock.yaml"      "$HOME/.dsh/profiles/web/pnpm-lock.yaml"
cp "$B/pnpm-workspace.yaml" "$HOME/.dsh/profiles/web/pnpm-workspace.yaml"

# 4. 按锁文件重装插件依赖
cd "$HOME/.dsh/profiles/web" && pnpm install --frozen-lockfile

# 5. 验证
dsh --version                                   # 0.2.0-rc.2
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies"
dsh web --no-open
```

- 第 4 步若因 pnpm 版本差异失败：改用逐条降级 `dsh plugin --profile web add <包>@<旧版本>`（版本见阶段 0.1）。
- 第 5 步启动后确认侧栏和 7 个 provider 都在，再回浏览器。

### 回滚代价（必须让负责人知情）

- 升级期间新产生的会话由 0.2.1 写入。虽然会话格式仍是 v4，但新版本可能写入旧版本不认识的事件；项目规则不承诺降级支持。**回滚后不要把这几天的会话当成可靠历史继续加工。** 阶段 0.2 的 `sessions.tgz` 是唯一保险。
- 若 patch 已被 `sanitizeProfile` 改名（文件名变成 `cordis.patch.yml.bak-<13位时间戳>`），从备份目录拷回即可；不要手写重建。

---

## 附录 A 命令速查（按执行顺序）

```sh
# 0 预检
dsh --version && which dsh && node -v && pnpm -v
npm ls -g --depth=0 @deepseek-ai/dsh
node -p "JSON.stringify(require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies,null,2)"

# 0 备份
TS=$(date +%Y%m%d-%H%M%S); B="$HOME/.dsh/backups/pre-upgrade-$TS"; mkdir -p "$B"
cp "$HOME/.dsh/profiles/web/"{cordis.patch.yml,package.json,pnpm-lock.yaml,pnpm-workspace.yaml} "$B"/
shasum -a 256 "$B"/*

# 0 停 web
PIDS=$(lsof -ti tcp:3080); [ -n "$PIDS" ] && kill $PIDS; sleep 3; lsof -ti tcp:3080 || echo "port free"

# 1 升本体
npm i -g @deepseek-ai/dsh@next
dsh --version
dsh --profile web --dump-config > /tmp/dsh-web-config-021.yml 2> /tmp/dsh-web-config-021.err

# 2 升插件（逐条，每条后验证版本）
dsh plugin --profile web add dsh-better-sidebar@0.28.0
dsh plugin --profile web add @quill507/dsh-auto-approval-llm@0.0.43
dsh plugin --profile web add dshmarket@1.66.42
dsh plugin --profile web add @linxin666/dsh-client-ui-skill-explorer@0.4.7
dsh plugin --profile web add @cerbur/clutch-dsh-worktree@0.1.18

# 3 启动
dsh web --no-open
```

## 附录 B 报错对照

| 现象 | 含义 | 处理 |
|---|---|---|
| `dsh: plugin command failed; diagnostics: <路径>` | pnpm 非 0 退出 | 打开该日志看第一条真实错误；网络类可原样重跑一次 |
| `already-installed` | 用"安装 API"覆盖已装包被拒（HMR 场景） | `dsh plugin --profile web remove <包>` 然后重新 `add <包>@<版本>` |
| `incompatible-version` / `requirements {...}` | 目标版本不满足当前 DSH | **停**。确认 `dsh --version` 是 0.2.1-rc.2；不要 `allow-version` |
| `dsh: pnpm was not found` | pnpm 不在 PATH | 先修 PATH 再重跑 |
| 报错提到 `minimumReleaseAge`（版本太新） | 目标版本被 pnpm 的发版冷却拦住 | 在 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 加精确版本 |
| `pending (waiting for service: webRuntime)` | 旧版 better-sidebar 未升级 | 升到 0.28.0 后应消失；升完仍有 → 停 |
| `Plugins waiting for services` 里出现 `webRuntime` 以外的东西 | 新宿主与插件对不上 | 停，回滚，保留日志 |
| `startup failed` | 必需插件未激活 | 停，回滚 |
| `disabling profile plugin <id>: Plugin ... incompatible` | 兼容检查把该行禁用 | 停，回滚；并把该行对应的包版本报上去 |
| `npm error code EPERM ... _cacache` | npm 缓存目录有 root 属主文件 | 所有 npm 命令加 `--cache "$HOME/.npm-cache-dsh"`；不要 sudo |

## 附录 C 禁止事项

1. 不在当前 Web 会话里执行升级（会把自己杀掉）。
2. 不用仓库做安装来源：不 `pnpm dsh`、不 `link:`、不 `--patch` 指仓库、不 `pnpm build`。
3. 不用 `npm i -g @deepseek-ai/dsh`（不带 tag，等于没升）。
4. 不用 `dsh plugin ... allow-version` 强行放行。
5. 不同时启用官方 `auto-review` 与 `@quill507`（会双重审查、双倍花销）。
6. 不手工编辑 `dsh.profile.bundles`；要加/减包走 `dsh plugin`。
7. 不 `rm -rf ~/.dsh/profiles/web/node_modules`（会触发全量重装，风险远高于收益）。
8. 不在升级过程中改 `cordis.patch.yml` 的内容（只允许从备份还原）。
