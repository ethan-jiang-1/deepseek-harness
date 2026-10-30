# UA 白名单：核心发现

**中继按 `User-Agent` 决定放行与否。同一凭据、同一端点，只换 UA，结论就翻转。**

## 30 秒判断：403 是白名单问题还是别的问题

出现 `Catalog failed to load: ... 403` 时，先跑这条，**不要先重登、不要先禁用**：

```sh
TOK=$(python3 -c "import json;print(json.load(open('$HOME/.dsh/dimagent-oauth.json'))['access'])")
curl -s -o /dev/null -w '带 DSH UA: %{http_code}\n' -H "Authorization: Bearer $TOK" \
  -A 'deepseek-harness/0.2.1-rc.3 (+https://github.com/deepseek-ai/deepseek-harness)' \
  'https://dimagent.cn/v1/models?type=dim'
curl -s -o /dev/null -w '裸 UA:     %{http_code}\n' -H "Authorization: Bearer $TOK" -A 'curl/8.7.1' \
  'https://dimagent.cn/v1/models?type=dim'
```

| 带 DSH UA | 裸 UA | 结论 | 该怎么办 |
|---|---|---|---|
| 200 | 403 | **正常**，白名单生效中 | 若 DSH 里仍 403，问题在本地发出的 UA，查插件版本 |
| 200 | 200 | 白名单**已放开** | 没必要纠结 UA，查别处 |
| 403 | 403 | 白名单**拒绝了 `deepseek-harness`** | 本地无解：等中继恢复放行，或临时禁用插件 |
| 401 | 401 | 凭据过期/失效 | 这次**才**需要重登，见 [`03-operations.md`](./03-operations.md#七强制重登凭据异常时) |

**关键区别**：`403` 是客户端身份问题，`401` 才是凭据问题。先分清这两个，再决定动作。

## 对照实验

全部请求只改 `User-Agent`，`Authorization` 恒定，端点
`GET https://dimagent.cn/v1/models?type=dim`，凭据为 `~/.dsh/dimagent-oauth.json` 里的 access token
（2026-10-30 有效，剩余 166.9 小时）。

| User-Agent | 结果 |
|---|---|
| *（完全不带）* | **403** `该凭证仅限官方客户端使用 (unsupported client)` |
| `curl/8.7.1` | **403** |
| `node` | **403** |
| `Python-urllib/3.11` | **403** |
| `deepseek-harness` | **403**（无版本号不行） |
| `DeepSeek` / `deepseek` / `dimagent` / `DimAgent/1.0` / `dsh/1.0` | **403** |
| `deepseek-harness/1.0` | **200** |
| `deepseek-harness/0.2.1-rc.3 (+https://github.com/deepseek-ai/deepseek-harness)` | **200** |

### 附带说明：`X-Title` / `HTTP-Referer` 不起作用

| 请求头组合 | 结果 |
|---|---|
| 无额外头 | 403 |
| 只 `X-Title: DeepSeek Harness` | 403 |
| 只 `HTTP-Referer: https://dimagent.cn/` | 403 |
| `X-Title` + `HTTP-Referer` | 403 |
| 三个全上（DSH 实际发送） | **200** |

决定性因素是 UA 一个；另外两个头与放行无关。

## 复现命令

```sh
TOK=$(python3 -c "import json;print(json.load(open('$HOME/.dsh/dimagent-oauth.json'))['access'])")
URL='https://dimagent.cn/v1/models?type=dim'

# 应该 403
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOK" -A 'curl/8.7.1' "$URL"

# 应该 200
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOK" \
  -A 'deepseek-harness/0.2.1-rc.3 (+https://github.com/deepseek-ai/deepseek-harness)' "$URL"
```

## 推理端点同样放行

不只是只读的模型列表。`POST /v1/chat/completions` 用同一组请求头返回 200：

```sh
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -A 'deepseek-harness/0.2.1-rc.3 (+https://github.com/deepseek-ai/deepseek-harness)' \
  -d '{"model":"glm-5.3","messages":[{"role":"user","content":"hi"}],"max_tokens":10}' \
  'https://dimagent.cn/v1/chat/completions'
```

实测响应体带正常的 `choices[].message.reasoning_content`，是中继真实转发而非空壳应答。

## DSH 发送的正是白名单形式

`packages/llm/llm/src/attribution.ts`：

```ts
export const APP_IDENTITY: AppIdentity = {
  product: 'deepseek-harness',
  version,                                              // 来自 package.json
  url: 'https://github.com/deepseek-ai/deepseek-harness',
}

export function userAgent(identity = APP_IDENTITY): string {
  return `${identity.product}/${identity.version} (+${identity.url})`
}

export function attributionHeaders(identity = APP_IDENTITY): Record<string, string> {
  return { 'user-agent': userAgent(identity) }
}
```

插件侧 `@arcships/dsh-dim-oauth` 的 `lib/oauth.js` 里，请求头经 `p()` 包装：

```js
function p(t){
  const e = new Headers(t)
  for (const [r, n] of Object.entries(X())) e.has(r) || e.set(r, n)   // X = attributionHeaders
  e.has('X-Title')      || e.set('X-Title', 'DeepSeek Harness')
  e.has('HTTP-Referer') || e.set('HTTP-Referer', 'https://dimagent.cn/')
  return e
}
```

`X()` 是 `@deepseek-ai/dsh-llm` 导出的 `attributionHeaders`。也就是说：
**DSH 的默认 UA 天然满足白名单，插件不需要改。**

## 一个必须记下的修正

2026-10-27 的排查笔记写过：

> The rejection is identical for the stored token and a freshly refreshed one,
> and no User-Agent, Origin, Referer, or X-Title variation changes it, so it is a
> server-side credential policy rather than a network or header problem.

**这句话在当时可能是真的，但在 2026-10-30 已不成立。** 变量不是"凭据"而是"UA 是否在白名单内"，
而白名单本身会变。当时的结论导致插件被禁用三天——这正是本目录存在的理由：
**下次遇到 403，先做 UA 对照实验，不要直接归因为"凭据被拒"。**
