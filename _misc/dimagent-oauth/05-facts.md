# 速查事实

一眼能查完的硬事实。改配置前先对这里。

## 身份

| 项 | 值 |
|---|---|
| 插件包 | `@arcships/dsh-dim-oauth` |
| 版本 | `0.2.1` |
| 插件 id | `dimagent-oauth` |
| 依赖 | 无（`dependencies: null`） |
| 注入 | `["llm"]` |

## 端点

| 项 | 值 |
|---|---|
| ISSUER | `https://dimagent.cn` |
| CLIENT_ID | `4183be708e6b40a1b25c614e932976d0` |
| CALLBACK_URL | `http://localhost:63211/auth/callback` |
| 中继基址 | `https://dimagent.cn/v1` |
| 模型列表 | `GET /v1/models?type=dim` |
| 推理 | `POST /v1/chat/completions` |
| 额度 | `GET /api/me/usage`（经 issuer） |
| scope | `email openid profile` |

以上常量来自 `lib/oauth.js` 的导出（`ISSUER` / `CLIENT_ID` / `CALLBACK_URL`），实测读取。

## 凭据文件

路径：`~/.dsh/dimagent-oauth.json`

```json
{
  "access":         "<JWT, 723 字符>",
  "refresh":        "<64 字符>",
  "expires":        1793927660256,
  "issuer":         "https://dimagent.cn",
  "tokenEndpoint":  "https://dimagent.cn/oauth/token",
  "relayBaseUrl":   "https://dimagent.cn/v1",
  "scope":          "email openid profile"
}
```

`expires` 是**毫秒**时间戳。插件在 `expires > Date.now() + 1000` 时直接复用，否则自动刷新；
刷新失败且是 `OAuthRefreshRejectedError` 时会自动走完整 OAuth 登录。

## 请求头

插件发给中继的头（`lib/oauth.js` 的 `p()` + `lib/index.js` 的 `installProfile()`）：

```
Authorization: Bearer <access>
User-Agent:    deepseek-harness/<version> (+https://github.com/deepseek-ai/deepseek-harness)
X-Title:       DeepSeek Harness
HTTP-Referer:  https://dimagent.cn/
```

**放行决定因素是 `User-Agent`**，另外两个与放行无关（对照实验见
[`02-ua-allowlist.md`](./02-ua-allowlist.md)）。

## 模型目录自检的两个值

`installProfile()` 里写死的媒体预算：

| 常量 | 值 |
|---|---|
| `streamIdleTimeoutMs` | `300000`（5 分钟） |
| `requestImagePixelBudget` | `2048*2048` |
| `requestImageMaxBytes` | `1024*1024` |
| `maxRequestImageBytes` | `20*1024*1024` |

重试策略：`maxRetries: 5`，`initialDelayMs: 1000`，`maxDelayMs: 15000`，`jitterRatio: 0.1`。

## 插件自身路由

前缀 `/api/dimagent-oauth`，全部要求 `x-dimagent-oauth: 1` 头 + 本地来源：

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/status` | `{ok, connected}` |
| POST | `/connect/start` | 返回 `authorizationUrl` |
| GET | `/connect/finish` | 返回 `{ok, models}` |
| GET | `/usage` | 额度 |
| GET | `/referral` | 推广 |
| POST | `/logout` | 清除凭据 |

## 配置文件位置

```
~/.dsh/profiles/web/cordis.patch.yml   →  - id: dimagent-oauth / disabled: false
~/.dsh/profiles/web/package.json       →  dsh.profile.bundles 里含 @arcships/dsh-dim-oauth
~/.dsh/profiles/web/node_modules/@arcships/dsh-dim-oauth/
```

## 源码位置（本仓库）

| 事实 | 位置 |
|---|---|
| UA 生成 | `packages/llm/llm/src/attribution.ts` → `attributionHeaders()` |
| UA 形态 | `deepseek-harness/<version> (+https://github.com/deepseek-ai/deepseek-harness)` |
| 版本来源 | 该包的 `package.json`，运行时 `createRequire` 读，不手抄 |
| provider 失败隔离 | `packages/api/session-controller/src/catalog.ts` → `buildModelCatalog()` |

## 环境

| 项 | 值 |
|---|---|
| DSH 全局版本 | `@deepseek-ai/dsh@0.2.1-rc.3` |
| Node | `v22.23.1`（nvm） |
| 服务 | `dsh web --no-open`，`:3080` |
| DSH_HOME | `~/.dsh` |
