# 认证与浏览器宿主

> **为什么单独有这一页**：开发态打开浏览器看到 401，或者接 Electron 桌面版时，常会疑惑「本地运行怎么还要认证？桌面端和 Web 端是不是两套 token 逻辑？」——其实两者走的是完全同一条一次性 process-token 换取 HMAC 签名 cookie 的链路，把任意未持 cookie 的外部网页/本地脚本挡在 `/api` 门外。把这段独立成页，是为了帮你一眼辨清三件事：启动打印的 URL 为什么本身就是凭据、未换到 cookie 前看到 401 是预期防线而非 bug、以及千万别为桌面端分叉写第二套认证。
>
> 核验入口：[`packages/client/connection/src/browser-auth.ts`](../../../../packages/client/connection/src/browser-auth.ts)、[`packages/client/connection/src/rpc-host.ts`](../../../../packages/client/connection/src/rpc-host.ts)、[`packages/bundle/web-app/src/index.ts`](../../../../packages/bundle/web-app/src/index.ts)。

**浏览器认证面**（web 与桌面同一条链）：入口 URL 是一次性 process-token URL——`authenticatedUrl(baseUrl)` 把启动 token 拼进 query（`packages/client/connection/src/browser-auth.ts:244`）；浏览器首个请求用它换取 `dsh-auth-` 前缀的 HMAC 签名 cookie（`:18` 的 `COOKIE_PREFIX`，HMAC secret 持久化在 credentials 体系 `client-connection/browser-session` 记录下，`:14` 的 `AUTH_RECORD_KEY`）；此后未认证请求一律 401（`packages/client/connection/src/rpc-host.ts:123-136` 的 `requestRejection` → `admit`）。web 的 stdout 行只打一条 `dsh web: ${authenticatedUrl}`，不附 LAN 地址（`packages/bundle/web-app/src/index.ts:231`；LAN 快照只服务 `/api` 的 trust fence 与 `ctx.webApp`）。

## 插件作者视角

- **`authenticatedUrl` 是一次性凭据。** 它带着启动 token；写进日志、贴进 issue 或转发给别人，等于把登录能力交出去。
- **401 不是 bug。** 首个请求换到 `dsh-auth-` cookie 之前，未认证请求一律被 `requestRejection` 拒掉（`packages/client/connection/src/rpc-host.ts:123-136`）；排查客户端 401 时先看 cookie 是否换到。
- **桌面不是例外。** 桌面宿主加载的是同一个 web 应用、同一条认证链（`apps/desktop-host/src/index.ts:103-104`）；为桌面单独写一套认证分支一定是错的。
