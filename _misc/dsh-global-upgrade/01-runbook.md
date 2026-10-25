# 执行手册

按阶段顺序执行，每阶段末有"通过标准"和"停止条件"。命中停止条件就停下、保留输出、走[阶段 4 回滚](#阶段-4-回滚)。全程只改 `~/.dsh/` 与全局 npm 安装，**不碰仓库**。

- 目标：`@deepseek-ai/dsh` 从 `0.2.1-rc.2` 升到 `0.2.1-rc.3`，并把 `dshmarket` 升到 `1.70.2`；其余 6 个插件不动。
- 预计耗时：预检 5 分钟、本体 2 分钟、`dshmarket` 2–5 分钟、验收 10 分钟。
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

期望（2026-10-25 快照）：

| 命令 | 期望输出 |
| --- | --- |
| `dsh --version` | `0.2.1-rc.2` |
| `which dsh` | `/Users/bowhead/.nvm/versions/node/v22.23.1/bin/dsh` |
| `node -v` | `v22.23.1` |
| `pnpm -v` | `11.28.5`（PATH 上的；任意 10+ 均可） |
| `npm ls -g --depth=0 @deepseek-ai/dsh` | `@deepseek-ai/dsh@0.2.1-rc.2` |

再记录插件版本：

```sh
node -p "JSON.stringify(require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies,null,2)"
```

期望：

```json
{
  "@arcships/dsh-dim-oauth": "^0.2.1",
  "@cerbur/clutch-dsh-worktree": "0.1.18",
  "@linxin666/dsh-client-ui-skill-explorer": "0.4.7",
  "@quill507/dsh-auto-approval-llm": "0.0.43",
  "dsh-better-sidebar": "0.28.0",
  "dsh-client-auto-continue": "^0.15.0",
  "dshmarket": "1.66.42"
}
```

并确认实际装到磁盘的版本与清单一致（`^` 范围可能已飘）：

```sh
for p in dsh-better-sidebar @quill507/dsh-auto-approval-llm dshmarket \
         @linxin666/dsh-client-ui-skill-explorer @cerbur/clutch-dsh-worktree \
         @arcships/dsh-dim-oauth dsh-client-auto-continue; do
  printf "%-46s %s\n" "$p" "$(node -p "require('$HOME/.dsh/profiles/web/node_modules/$p/package.json').version" 2>/dev/null)"
done
```

期望依次：`0.28.0`、`0.0.43`、`1.66.42`、`0.4.7`、`0.1.18`、`0.2.1`、`0.15.0`。

### 0.2 备份（别省）

```sh
TS=$(date +%Y%m%d-%H%M%S)
B="$HOME/.dsh/backups/pre-rc3-$TS"
mkdir -p "$B"
cp "$HOME/.dsh/profiles/web/cordis.patch.yml"    "$B"/
cp "$HOME/.dsh/profiles/web/package.json"        "$B"/
cp "$HOME/.dsh/profiles/web/pnpm-lock.yaml"      "$B"/
cp "$HOME/.dsh/profiles/web/pnpm-workspace.yaml" "$B"/
shasum -a 256 "$B"/*
echo "backup dir: $B"
```

期望哈希与 2026-10-25 快照一致（**这是 rc.2 上的现状，与 10-19 那份备份不同**）：

| 文件 | 字节 | sha256 |
| --- | --- | --- |
| `cordis.patch.yml` | 13,641 | `0584e3be8b8eaaeed7e697f53ec930cae554935612bcaef7db5320e8eaa5e27c` |
| `package.json` | 762 | `f450fc264c782ae27e467b085427e15952dc25513e1804900e37d10fa13831f2` |
| `pnpm-lock.yaml` | 51,332 | `1a4938015e13f0ed989bfcfc7600d3b14d51add3c7614ed26222688a846628a7` |
| `pnpm-workspace.yaml` | 424 | `3731ceb4387711887c8ce161ebedb04edea6e3235a5d9dcb0bdbee19592c1d4f` |

`cordis.patch.yml` 里有 7 个自定义 provider（MICU / OpenRouter / Z.ai / Kimi CN / TeamoRouter / OpenCode Go / Yovole）加一条 `dimagent-oauth` 默认模型行，是本机唯一的配置副本。**这个文件比其它任何东西都重要。**

若哈希不符，先 `diff` 备份与现值：只是你之后改过配置（例如换了默认模型）就把新哈希记下来、以现值为基线继续；被替换成空壳或被改名则停下来查。

可选：给会话目录做个快照。rc.3 未改会话格式（`SESSION_FORMAT_VERSION` 仍 4），正常升级不需要它；但**回滚方向**仍不承诺支持，需要保险就做：

```sh
tar czf "$B/sessions.tgz" -C "$HOME/.dsh" sessions
```

### 0.3 检查 npm 缓存可写

```sh
npm config get cache
npm view @deepseek-ai/dsh@next version
```

- 正常：缓存路径是 `~/.npm`，输出 `0.2.1-rc.3`。
- 如果报 `EPERM` / `Your cache folder contains root-owned files`：**不要 sudo**，后续所有 npm 命令都加 `--cache "$HOME/.npm-cache-dsh"`。该方式已实测可用。
- 如果 `npm view` 超时：网络问题，先解决网络再继续。

### 0.4 停掉正在运行的 `dsh web`

先确认是谁占着端口：

```sh
lsof -ti tcp:3080
ps -o pid,etime,command -p $(lsof -ti tcp:3080 | tr '\n' ',' | sed 's/,$//')
```

- 期望看到 `node /Users/bowhead/.nvm/versions/node/v22.23.1/bin/dsh web --no-open`。这是要停的那个。
- **只停这一个 PID**。同一个端口列表里可能混进 macOS 的 WebKit 辅助进程或别的 dsh 源码实例（`--import tsx/esm ... vendor/dsh/apps/cli/src/bin.ts`），那些不是本次目标，误杀会连带影响别的工作区。

停止：

```sh
PIDS=$(lsof -ti tcp:3080); [ -n "$PIDS" ] && kill $PIDS; sleep 3; lsof -ti tcp:3080 || echo "port free"
```

仍占用再 `kill -9 <PID>`。若它由别的服务（launchd、pm2、某个终端标签）托管，用管理它的方式停止；不要只杀进程留下托管守护再拉起。

端口不一定是 3080（历史上也用过 3081）：以启动日志里打印的 `dsh web: http://127.0.0.1:<端口>` 为准。

通过标准：`lsof -ti tcp:3080` 无输出，`curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3080` 返回 `000`。

**注意**：从这一步起，当前 Web 会话（如果执行者就是那个界面）会断开。这正是要求"独立终端"的原因。

### 0.5 registry 预检（确认目标版本都在，且没被撤包）

```sh
npm view @deepseek-ai/dsh dist-tags --json
npm view @deepseek-ai/dsh@0.2.1-rc.3 deprecated dist.tarball
npm view dshmarket@1.70.2 version peerDependencies --json
```

期望：

- `dist-tags` 里 `next` 是 `0.2.1-rc.3`，`latest` 仍是 `0.2.1-rc.2`。
- `deprecated` 字段不存在（没有输出值）、`dist.tarball` 指向 `.../dsh-0.2.1-rc.3.tgz`。
- `dshmarket@1.70.2` 存在，peer 里 `@deepseek-ai/dsh-settings` 的范围含 `^0.2.1-rc.1`。

> 若 0.3 判定要用备用缓存，本节与后续所有 npm 命令都加上 `--cache "$HOME/.npm-cache-dsh"`。

### 阶段 0 停止条件

任何一条命中：**停**，不要继续，把输出贴给负责人。

- `dsh --version` 不是 `0.2.1-rc.2`（说明环境已经被动过，先搞清楚现状）。
- 备份哈希与上表不一致且无法解释（见 0.2 的处理规则）。
- 3080 端口停不下来，或占用者不是 `bin/dsh web`。
- 任一目标版本查不到，或 `0.2.1-rc.3` 被标记 deprecated。

---

## 阶段 1 升级 DSH 本体

### 1.1 安装

```sh
npm i -g @deepseek-ai/dsh@next
```

- 如果 0.3 判定要用备用缓存：`npm i -g @deepseek-ai/dsh@next --cache "$HOME/.npm-cache-dsh"`。
- 不要写 `@latest`（`latest` 仍是 `0.2.1-rc.2`，等于没升）。

### 1.2 验证

```sh
dsh --version
npm ls -g --depth=0 @deepseek-ai/dsh
```

期望：`0.2.1-rc.3`，且全局树里只有这一个版本。

### 1.3 中间验证（推荐，能提前把问题定位到"宿主"还是"插件"）

分两步，别指望 `--dump-config` 能代替真实启动——它只做配置组合，**不挂载插件**，因此不会产生 `pending` / `disabling` 这类启动诊断。

**1.3a 组合检查（不起进程）**

```sh
dsh --profile web --dump-config > /tmp/dsh-web-config-021rc3.yml 2> /tmp/dsh-web-config-021rc3.err
echo "exit=$?"
wc -l /tmp/dsh-web-config-021rc3.yml
cat /tmp/dsh-web-config-021rc3.err
```

通过标准：

- 退出码 `0`，YAML 非空。
- `.err` 里没有解析类错误（这个命令不启动插件，出现 `failed to load` / `cannot` 之类才算问题）。
- YAML 里能找到 7 个 provider 名：`micu`、`openrouter`、`zai`、`moonshotai-cn`、`teamorouter`、`opencode-go`、`yovole`，以及 `dimagent-oauth` 默认模型行。

**1.3b 真实启动冒烟（推荐）**

```sh
dsh web --no-open
```

- 等到日志出现 `dsh web: http://127.0.0.1:<端口>/?token=...`，说明宿主能带着旧插件起来。
- 日志里**不应**出现 `startup failed`、`disabling profile plugin`、`Plugins waiting for services`。
- rc.2 时代那条 `pending (waiting for service: webRuntime)` 在 `dsh-better-sidebar@0.28.0` 上早已消失；**若这次又出现，说明侧栏插件被降级过**，停下来查阶段 0.1 的磁盘版本。
- 看到 URL 后按 `Ctrl-C` 停掉，继续阶段 2。

### 阶段 1 停止条件

- `npm i -g` 失败：先看错误类型。网络 → 重试；`EPERM` → 加 `--cache`；`EACCES` → 不要 sudo，先问负责人。
- `dsh --version` 仍是 `0.2.1-rc.2`：说明装到了别的 Node 前缀，检查 `which dsh` 是否仍在 nvm 的 v22.23.1 下。
- `--dump-config` 非 0 退出或 YAML 为空：**不要动插件**，停下来查 `/tmp/dsh-web-config-021rc3.err`，处理不了就回滚。
- 1.3b 启动时出现 `startup failed` / `disabling profile plugin` / `incompatible with dsh`：**不要动插件**，直接走回滚，保留启动日志。

---

## 阶段 2 升级插件

本次只有 `dshmarket` 属于"建议必升"；2.2、2.3 是可选项，不做也能用。**6 个非市场插件在 rc.3 上的兼容性已按宿主口径验过（证据见 [03-evidence](./03-evidence.md)），不需要为了 rc.3 去升它们。**

通用规则：

- `--profile web` 必须写在 pnpm 参数**前面**。
- 每条命令末尾都带 `--save-exact`：`dsh plugin` 会把未知参数原样转给 pnpm，这个参数让 `package.json` 写入精确版本（与现有风格一致）。漏掉它会写成 `^1.70.2` 这类范围——功能一样，但版本不再锁死，验收时按实际值记录，不必因此回滚。
- 一条一条执行，每条执行完立刻验证版本，再执行下一条。
- 命令失败时**不要**紧接着重试别的命令；先判断错误类型（见附录 B）。
- 不要用 `allow-version` 绕过兼容检查。

### 2.1 `dshmarket` → 1.70.2（目标 1.70.2）

**先处理 `minimumReleaseAgeExclude`，否则这一条很可能失败或被解析成"全都不排除"。**

`~/.dsh/profiles/web/pnpm-workspace.yaml` 现在是这样（节选）：

```yaml
minimumReleaseAgeExclude:
  - '@quill507/dsh-auto-approval-llm@0.0.36 || 0.0.38 || 0.0.41'
  - dshmarket@1.65.1 || 1.66.5 || 1.66.6 || 1.66.17 || 1.66.42
  - dsh-better-sidebar@0.21.1
  - '@linxin666/dsh-client-ui-skill-explorer@0.4.1'
  - dsh-client-auto-continue@0.11.8 || 0.12.1 || 0.15.0
  - '@nanmicoder/dsh-agent-teams@0.1.22'
```

这些条目是**版本选择器**：`name@v1 || v2 || v3` 里的 `v2`、`v3` 会被当成同一个包名下的其他版本。改的时候要**在下标 0 的位置补上包名**，不是追加一行裸版本号：

```yaml
  - dshmarket@1.65.1 || 1.66.5 || 1.66.6 || 1.66.17 || 1.66.42 || 1.70.2
```

即：把原来那行里的 `1.70.2` 走到选择器列表末尾，保持"一行一个包"的写法。**不要**写成两行（`- dshmarket@...` 和 `- dshmarket@1.70.2`）——虽然 pnpm 会合并同名选择器，但两行的先后与去重行为不如一行直观，且与文件其它行的风格不一致。

> 备查：`pnpm config get minimumReleaseAge` 当前返回 `undefined`，说明冷却期本身没开；这里的 `minimumReleaseAgeExclude` 是历史遗留。因此**也可以选择完全不动这个列表直接 `add`**，失败再改。改文件属于"预防性"动作，不是必需前置。

执行：

```sh
dsh plugin --profile web add dshmarket@1.70.2 --save-exact
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies.dshmarket"
```

期望：`1.70.2`。1.66.42 之后官方补了 `already-installed` 与宿主启动失败后的 patch 恢复处理，版本号本身不声明额外 DSH 要求（peer 只约束 `@deepseek-ai/dsh-settings`，rc.3 仍在范围内）。

### 2.2 `@linxin666/dsh-client-ui-skill-explorer` → 0.4.8（可选）

```sh
dsh plugin --profile web add @linxin666/dsh-client-ui-skill-explorer@0.4.8 --save-exact
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies['@linxin666/dsh-client-ui-skill-explorer']"
```

期望：`0.4.8`。装的是客户端组件，它声明的 `engines.dsh` 是 `>=0.2.1-rc.2`（0.4.7 与 0.4.8 相同），rc.3 满足。不升也不会坏。

### 2.3 `dsh-client-auto-continue` → 0.17.0（可选）

```sh
dsh plugin --profile web add dsh-client-auto-continue@0.17.0 --save-exact
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies['dsh-client-auto-continue']"
```

期望：`0.17.0`。peer 与 0.15.0 逐字相同（只约束 `@deepseek-ai/dsh-settings` 的 `^0.2.0-rc.1` 等），rc.3 满足。当前清单写的是 `^0.15.0`，升完会变成精确值——这是预期。

> 若 worktree 里那条 `minimumReleaseAgeExclude` 的 `dsh-client-auto-continue@... || 0.15.0` 用到 `0.17.0`，按 2.1 的规则同样把版本补进选择器列表。

### 2.4 明确不动的四个

| 包 | 原因 | 万一需要处理的迹象 |
| --- | --- | --- |
| `dsh-better-sidebar@0.28.0` | **已是 npm 最新**（10-17 发布，`latest` 与 `alpha` 都是 0.28 线），没有更新的版本可升；peer 范围含 `^0.2.1-rc.1`，rc.3 满足 | 侧栏不出现 → 先看日志有没有 `pending (waiting for service: webRuntime)`；有就停下回滚 |
| `@quill507/dsh-auto-approval-llm@0.0.43` | 已是 npm 最新；peer `>=0.2.1-rc.2 <2` 通过 | 审批链路失效 → 在 patch 里禁用该行，不影响主流程 |
| `@cerbur/clutch-dsh-worktree@0.1.18` | 已是 npm 最新；peer `>=0.2.0-rc.1` 通过 | worktree 入口报错 → 同样可临时禁用 |
| `@arcships/dsh-dim-oauth@0.2.1` | 已是 npm 最新；默认模型行正指着它 | DimAgent 登录报错或模型组消失 → 在 patch 里禁用 `dimagent-oauth` 那一行 |

### 2.5 收尾检查

```sh
node -p "JSON.stringify(require(process.env.HOME+'/.dsh/profiles/web/package.json'),null,2)"
```

`dsh.profile.bundles` 应仍是这 9 项（顺序通常保持不变；只要 9 项都在即可）：

```text
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

如果 bundles 里少了某个包，**不要只补一条 `add`**：包还在依赖里时，reconcile 只处理"新增依赖"，不会把它写回清单。正确做法是先 `dsh plugin --profile web remove <包>`，再 `add <包>@<版本> --save-exact`。

### 阶段 2 停止条件

- 任一 `add` 返回非 0：停，读 stderr，按附录 B 处理；处理不了就回滚。
- 任一条出现 `incompatible-version` / `requires` 字样：说明版本判断错了，**不要用 `allow-version`**，停并回滚。
- 出现 `already-installed`：改为先 `remove` 再 `add`（见附录 B），成功则继续，失败则停。
- pnpm 报错提到 `minimumReleaseAge`（目标版本"发布太新"）：按 2.1 的规则把精确版本补进 `minimumReleaseAgeExclude` 的对应选择器，再重跑该条。
- pnpm 报锁文件格式错误（`lockfileVersion` / 版本不匹配）：**不要手工改锁文件**，停并报告。

---

## 阶段 3 启动与验收

```sh
dsh web --no-open
```

或按平时的方式启动（不加 `--host 0.0.0.0` —— 0.2.1 线已拒绝绑定通配地址）。等日志出现 `dsh web: http://127.0.0.1:3080/?token=...` 后，按 [验收清单](./02-acceptance.md) 逐项检查。

通过标准（摘要，详见验收清单）：

- 日志没有 `startup failed`、`disabling profile plugin`、`Plugins waiting for services`。
- 浏览器能打开、侧栏在、7 个自定义 provider 组加内置 DeepSeek 都在。
- `cordis.patch.yml` 的 sha256 与阶段 0 备份一致。

---

## 阶段 4 回滚

### 触发条件（任一）

- 阶段 1 的 `--dump-config` 失败，或启动冒烟出现 `startup failed` / `disabling profile plugin`。
- 阶段 2 任一步失败且附录 B 处理不了。
- 启动日志出现 `startup failed` 或必需插件失败。
- 验收清单里"阻断级"项失败。

### 步骤

```sh
# 1. 停掉 web（不用 xargs：macOS 版不支持 -r）
PIDS=$(lsof -ti tcp:3080); [ -n "$PIDS" ] && kill $PIDS
sleep 3

# 2. 回退本体
npm i -g @deepseek-ai/dsh@0.2.1-rc.2

# 3. 恢复 profile 元数据（用阶段 0 的备份目录）
B="$HOME/.dsh/backups/pre-rc3-<TS>"
cp "$B/cordis.patch.yml"    "$HOME/.dsh/profiles/web/cordis.patch.yml"
cp "$B/package.json"        "$HOME/.dsh/profiles/web/package.json"
cp "$B/pnpm-lock.yaml"      "$HOME/.dsh/profiles/web/pnpm-lock.yaml"
cp "$B/pnpm-workspace.yaml" "$HOME/.dsh/profiles/web/pnpm-workspace.yaml"

# 4. 按锁文件重装插件依赖
cd "$HOME/.dsh/profiles/web" && pnpm install --frozen-lockfile

# 5. 验证
dsh --version                                   # 0.2.1-rc.2
node -p "require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies"
dsh web --no-open
```

- 第 2 步若 npm 报 `EPERM`：同样加 `--cache "$HOME/.npm-cache-dsh"`。
- 第 4 步若因 pnpm 版本差异失败：改用逐条降级 `dsh plugin --profile web add <包>@<旧版本> --save-exact`（版本见阶段 0.1）。
- 第 5 步启动后确认侧栏和 7 个 provider 都在，再回浏览器。

### 回滚代价（必须让负责人知情）

- rc.2 → rc.3 **不改会话格式**（`SESSION_FORMAT_VERSION` 仍 4），所以回滚后旧会话照常可读。
- 但项目规则不承诺降级支持：rc.3 期间写入的会话可能含 rc.2 不认识的新事件（rc.3 新增了导航入口自定义与折叠类 UI 状态）。**回滚后不要把这几天的会话当成可靠历史继续加工。** 阶段 0.2 的 `sessions.tgz` 是唯一保险。
- 若 patch 已被 `sanitizeProfile` 改名（文件名变成 `cordis.patch.yml.bak-<13位时间戳>`），从备份目录拷回即可；不要手写重建。

---

## 附录 A 命令速查（按执行顺序）

```sh
# 0 预检
dsh --version && which dsh && node -v && pnpm -v
npm ls -g --depth=0 @deepseek-ai/dsh
node -p "JSON.stringify(require(process.env.HOME+'/.dsh/profiles/web/package.json').dependencies,null,2)"

# 0 备份
TS=$(date +%Y%m%d-%H%M%S); B="$HOME/.dsh/backups/pre-rc3-$TS"; mkdir -p "$B"
cp "$HOME/.dsh/profiles/web/"{cordis.patch.yml,package.json,pnpm-lock.yaml,pnpm-workspace.yaml} "$B"/
shasum -a 256 "$B"/*

# 0 确认占用者，再停 web
ps -o pid,etime,command -p $(lsof -ti tcp:3080 | tr '\n' ',' | sed 's/,$//')
PIDS=$(lsof -ti tcp:3080); [ -n "$PIDS" ] && kill $PIDS; sleep 3; lsof -ti tcp:3080 || echo "port free"

# 1 升本体
npm i -g @deepseek-ai/dsh@next
dsh --version
dsh --profile web --dump-config > /tmp/dsh-web-config-021rc3.yml 2> /tmp/dsh-web-config-021rc3.err
dsh web --no-open        # 启动冒烟：看到 URL 且无 disabling/startup failed 后 Ctrl-C

# 2 升插件（逐条，每条后验证版本）
dsh plugin --profile web add dshmarket@1.70.2 --save-exact
dsh plugin --profile web add @linxin666/dsh-client-ui-skill-explorer@0.4.8 --save-exact   # 可选
dsh plugin --profile web add dsh-client-auto-continue@0.17.0 --save-exact                # 可选

# 3 启动
dsh web --no-open
```

## 附录 B 报错对照

| 现象 | 含义 | 处理 |
| --- | --- | --- |
| `dsh: plugin command failed; diagnostics: <路径>` | pnpm 非 0 退出 | 打开该日志看第一条真实错误；网络类可原样重跑一次 |
| `already-installed` | 用"安装 API"覆盖已装包被拒（HMR 场景） | `dsh plugin --profile web remove <包>` 然后重新 `add <包>@<版本>` |
| `incompatible-version` / `requirements {...}` | 目标版本不满足当前 DSH | **停**。确认 `dsh --version` 是 `0.2.1-rc.3`；不要 `allow-version` |
| `dsh: to accept the risk, run: dsh plugin ... allow-version ...` | 兼容检查拒绝，宿主给出了"强行放行"的提示 | **不要照做**。这条说明版本判断错了，停下来查版本与宿主 |
| `dsh: pnpm was not found` | pnpm 不在 PATH | 先修 PATH 再重跑 |
| 报错提到 `minimumReleaseAge`（版本太新） | 目标版本被 pnpm 的发版冷却拦住 | 把精确版本补进 `pnpm-workspace.yaml` 的对应选择器（见 2.1），再重跑 |
| 报错提到 `lockfileVersion` / 锁文件不可解析 | PATH 上 pnpm 11.28.5 与锁文件记录的 pnpm 12.5.1 有差异 | **不要手工改锁文件**，停并报告 |
| `pending (waiting for service: webRuntime)` | 装回来的是 rc.2 时代的旧侧栏插件（0.26/0.27） | 确认磁盘上是 `dsh-better-sidebar@0.28.0`；是就别动，不是就升回 0.28.0 |
| `Plugins waiting for services` 里出现 `webRuntime` 以外的东西 | 新宿主与插件对不上 | 停，回滚，保留日志 |
| `startup failed` | 必需插件未激活 | 停，回滚 |
| `disabling profile plugin <id>: Plugin ... incompatible` | 兼容检查把该行禁用 | 停，回滚；并把该行对应的包版本报上去 |
| `npm error code EPERM ... _cacache` | npm 缓存目录有 root 属主文件 | 所有 npm 命令加 `--cache "$HOME/.npm-cache-dsh"`；不要 sudo |

## 附录 C 禁止事项

1. 不在当前 Web 会话里执行升级（会把自己杀掉）。
2. 不用仓库做安装来源：不 `pnpm dsh`、不 `link:`、不 `--patch` 指仓库、不 `pnpm build`。
3. 不用 `npm i -g @deepseek-ai/dsh`（不带 tag 且 `latest` 仍是 rc.2，等于没升）。
4. 不用 `dsh plugin ... allow-version` 强行放行。
5. 不同时启用官方 `auto-review` 与 `@quill507`（会双重审查、双倍花销）。
6. 不手工编辑 `dsh.profile.bundles`；要加/减包走 `dsh plugin`。
7. 不 `rm -rf ~/.dsh/profiles/web/node_modules`（会触发全量重装，风险远高于收益）。
8. 不在升级过程中改 `cordis.patch.yml` 的内容（只允许从备份还原）。
9. 不手工改 `pnpm-lock.yaml`。`pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 允许按 2.1 的规则补版本，其余键不动。
