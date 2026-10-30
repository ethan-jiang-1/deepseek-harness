# 操作手册：怎么用这个插件

面向长期使用。这里只写**怎么做**，不重复排查过程（那是 [`01-diagnosis.md`](./01-diagnosis.md)）。

插件：`@arcships/dsh-dim-oauth@0.2.1`
配置文件：`~/.dsh/profiles/web/cordis.patch.yml`
凭据文件：`~/.dsh/dimagent-oauth.json`

## 一、界面上有什么

在 DSH 设置里，侧栏出现 **DimAgent** 一项。它能做的事：

| 界面元素 | 中文文案 | 作用 |
|---|---|---|
| 连接状态 | 已连接 / 尚未连接 / 正在检查连接… | 当前是否持有有效凭据 |
| 已连接行 | 已连接 · 可用模型 {count} 个 | 模型数量，异常时一眼看出 |
| 登录 | 登录 DimAgent | 发起 OAuth，打开浏览器 |
| 登录链接 | 登录链接 / 打开 | 浏览器没自动弹出时手动打开 |
| 刷新 | 刷新 | 重新拉取模型目录 |
| 重试 | 重试 | 连接失败后重来 |
| 退出登录 | 退出登录 | 清除凭据 |
| 额度 | 额度用量 / 已使用 {count}% | 套餐余量 |
| 推广 | 推广链接 / 复制链接 | 邀请码 |

**日常操作基本只有两个：`刷新`（模型没出现时）和 `退出登录`（换账号时）。**

## 二、常用操作（命令行）

以下命令服务于"界面用不了 / 需要脚本化"的场景。
`{token}` 指本地会话令牌，从启动日志拿：

```sh
grep -oE 'http://127\.0\.0\.1:3080/\?token=[A-Za-z0-9_-]+' "$(cat /tmp/current-dsh-log).out" | head -1
```

### 查连接状态

```sh
curl -s -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/status
```

返回 `{"ok":true,"connected":true|false}`。

### 查额度

```sh
curl -s -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/usage
```

### 查推广

```sh
curl -s -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/referral
```

### 退出登录（清除凭据）

```sh
curl -s -X POST -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/logout
```

### 发起登录

```sh
curl -s -X POST -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/connect/start
# -> {"ok":true,"authorizationUrl":"https://dimagent.cn/oauth/authorize?..."}
```

浏览器没自动打开时，复制 `authorizationUrl` 手动访问。

### 完成登录

```sh
curl -s -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/connect/finish
```

> 登录是**两段式**：`start` 给 URL，用户在浏览器授权后回调到
> `http://localhost:63211/auth/callback`，再调 `finish` 取模型。
> 界面上的"登录 DimAgent"一次性走完这两步。

### 这几个路由的访问限制

代码里 `O()` 函数的检查（`lib/index.js`）：

- 来源必须是 `127.0.0.1` / `::1` / `::ffff:127.0.0.1`
- **必须带请求头 `x-dimagent-oauth: 1`**
- `Host` 必须是 `localhost` / `127.0.0.1` / `[::1]`
- 若带 `Origin`，其 host 必须与 `Host` 一致

少了 `x-dimagent-oauth: 1` 一律返回：

```json
{"ok":false,"error":"DimAgent sign-in is available only from the local Harness UI"}
```

## 三、启用 / 禁用

### 禁用（怀疑它在捣乱时）

在 `~/.dsh/profiles/web/cordis.patch.yml` 找到：

```yaml
- id: dimagent-oauth
  disabled: false
```

改成 `disabled: true`，然后**重启 `dsh web`**。

> 配置文件的实时监听不生效，**必须重启**。

### 启用

反向改回 `disabled: false`，重启。

### 为什么值得启用而不是删掉

`buildModelCatalog()` 对每个 provider 的失败是隔离的：DimAgent 挂了只会变成一条
`ModelCatalogFailure`，模型选择器里显示 `Catalog failed to load: ...`，
**不影响其它 provider**。所以留着的风险很低。

## 四、重启服务

```sh
PID=$(lsof -nP -iTCP:3080 -sTCP:LISTEN -t)
kill -TERM $PID
# 等端口释放（通常 2 秒）
LOG=/tmp/dsh-$(date +%H%M%S)
nohup ~/.nvm/versions/node/v22.23.1/bin/node \
      ~/.nvm/versions/node/v22.23.1/bin/dsh web --no-open \
      > "$LOG.out" 2> "$LOG.err" &
echo "$LOG" > /tmp/current-dsh-log
```

几秒后从 `$LOG.out` 里取新 token。

## 五、验证是否正常

### 最快：看模型目录

在浏览器会话里（或用 curl 打 `/api/session/modelCatalog`）确认：

- `routableProviders` 包含 `dimagent-oauth`
- `groups` 里 `DimAgent OAuth` 有 **14 个模型**
- `failures` 为空

### 直接验中继

```sh
TOK=$(python3 -c "import json;print(json.load(open('$HOME/.dsh/dimagent-oauth.json'))['access'])")
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOK" \
  -A 'deepseek-harness/0.2.1-rc.3 (+https://github.com/deepseek-ai/deepseek-harness)' \
  'https://dimagent.cn/v1/models?type=dim'
```

`200` = 通；`403` = 白名单问题，见 [`02-ua-allowlist.md`](./02-ua-allowlist.md)。

## 六、换账号

```sh
# 1. 退出
curl -s -X POST -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/logout
# 2. 重新登录
curl -s -X POST -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/connect/start
#    浏览器授权后：
curl -s -H "x-dimagent-oauth: 1" http://127.0.0.1:3080/api/dimagent-oauth/connect/finish
```

或直接在界面点 `退出登录` 再 `登录 DimAgent`。

## 七、强制重登（凭据异常时）

删掉凭据文件强制走全新 OAuth：

```sh
cp ~/.dsh/dimagent-oauth.json ~/.dsh/dimagent-oauth.json.bak-$(date +%Y%m%d-%H%M%S)
rm ~/.dsh/dimagent-oauth.json
# 重启 dsh web，然后在界面点「登录 DimAgent」
```

> **注意**：如果问题是 **403 白名单**，重登完全无用。先跑
> [`02-ua-allowlist.md`](./02-ua-allowlist.md) 的对照实验再决定要不要重登。

## 八、故障速查

| 现象 | 先查什么 |
|---|---|
| 模型选择器没有 DimAgent | `disabled` 是否被设成 `true`；改完是否**重启** |
| `Catalog failed to load: ... 403` | UA 白名单，见 `02-ua-allowlist.md` |
| `pi-ai stream idle timeout after 300000ms` | 中继无响应，等它恢复；本地无解 |
| 界面显示"尚未连接" | 凭据文件是否还在；`/status` 返回什么 |
| 点登录浏览器没反应 | 用 `/connect/start` 拿 `authorizationUrl` 手动开 |
| 回调页打不开 | 端口 `63211` 是否被占用 |
| 额度一直转圈 | `/usage` 直连中继，中继慢就会慢 |

## 九、长期维护提醒

- **白名单会变。** 403 第一时间跑 UA 对照实验，别急着重登或禁用。
- **模型列表会变。** 当前 14 个只是 2026-10-30 的快照，见 [`04-models.md`](./04-models.md)。
- **插件版本会变。** 当前 0.2.1。升级前先看上游有无针对白名单或 UA 的改动。
- **别在配置里写死 token。** 凭据在 `~/.dsh/dimagent-oauth.json`，由插件自己轮换刷新。
