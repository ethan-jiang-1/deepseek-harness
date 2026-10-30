# 故障时间线

平台：macOS，全局 DSH 安装在 `~/.dsh`，服务 `dsh web` 监听 `:3080`，profile 为 `web`。

## 2026-10-26 · 中继无响应

**症状**

每条请求都以超时结束：

```
pi-ai stream idle timeout after 300000ms
```

`streamIdleTimeoutMs` 是 300000，来自插件的 profile。

**观察**

- TLS 握手与 HTTP/2 请求**正常完成**
- 服务端**不返回响应体**
- 属于中继侧问题，不是本地网络或凭据问题

**处置**：等待。本地无可修之处。

## 2026-10-27 · 中继恢复，但 403

**症状**

```
GET https://dimagent.cn/v1/models?type=dim   -> 403  (477ms)
{"error":{"message":"该凭证仅限官方客户端使用 (unsupported client)","type":"next_api_error"}}
```

**当时做的排查**

1. 用存储的 token 请求 → 403
2. **重新走完整 OAuth 登录**，拿新 token → 仍然 403
3. 尝试变化 `Origin` / `Referer` / `X-Title` / `User-Agent` → **仍 403**
4. 确认账号本身正常：`/api/me/usage` 返回 200

**当时的结论**（后被推翻）

> 这是服务端的凭据策略，本地无法修复。

**由此做出的动作**

在 `~/.dsh/profiles/web/cordis.patch.yml` 设 `disabled: true`，并写下：

> TO RE-ENABLE once DimAgent issues a usable credential

**这一判断的问题**：第 3 步声称"User-Agent 变化不影响"，但 2026-10-30 的对照实验证明
**UA 是唯一的决定因素**。合理的解释是当时中继的白名单里还没有 `deepseek-harness`，
选项 A（白名单不含）与选项 B（完全不看 UA）在观测上无法区分，而当时选错了那个。

## 2026-10-30 · 复查并恢复

**触发**：用户希望继续使用 DimAgent 的模型，要求重新尝试。

**做法**：不再相信"凭据被拒"的旧结论，直接从插件源码入手读真实请求头。

**关键步骤**

1. 读 `lib/index.js` 的 `installProfile()`，看到请求头为
   `Authorization` + `X-Title` + `HTTP-Referer`（**没看到显式 UA**）
2. 读 `lib/oauth.js` 的 `p()`，发现它合并了 `X()`，而 `X` 是 `attributionHeaders`
3. 追到 `packages/llm/llm/src/attribution.ts`，确认最终 UA 是
   `deepseek-harness/<version> (+url)`
4. **拿存储的 token 直接 curl**，UA 保持 DSH 原样 → **200**，不是 403

第 4 步是转折点：凭据一直是好的。之前失败要么是中继状态不同，要么是复现时用的 UA 不对。

**逐项隔离**（见 [`02-ua-allowlist.md`](./02-ua-allowlist.md)）：确认白名单以
`deepseek-harness/<version>` 为键，无版本号的裸 token 不放行。

**验证递进**

```
GET  /v1/models?type=dim       -> 200，14 个模型
POST /v1/chat/completions      -> 200，正常返回 reasoning_content
启用插件 + 重启 :3080           -> 启动日志 0 warning/error
/api/session/modelCatalog      -> routableProviders 含 dimagent-oauth
                               -> groups 中 DimAgent OAuth 14 个模型，failures: []
```

**最终**：`disabled: false`，恢复使用。

## 教训

1. **"服务端拒绝"这类结论会过期。** 白名单、开关、风控策略都在变，三天前的观测不能当今天的依据。
2. **读源码比猜请求头可靠。** 本次真正解开问题的是追到 `attributionHeaders`，
   而不是反复试探头组合。
3. **区分"变量无效"与"变量指向一个当时不成立的集合"。** 当时能看到的是"换 UA 没用"，
   看不到的是"白名单里没有我们"。
4. **登出重登不能解决白名单问题。** 第 2 步的重新授权是无效动作，
   浪费了一次完整 OAuth 流程。
