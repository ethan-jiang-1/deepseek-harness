# Agent Note: 已提供的 index 不可缓存

Status: implemented

[English](2026-09-13-served-index-must-not-be-cached.md) | 中文

## Problem

浏览器一旦复用缓存的 index，Web 应用就无法启动，且刷新不能恢复。

index 记录了渲染它的那一次激活的客户端 bundle revision。[client/modules](../../../../packages/client/modules/src/index.ts) 以每次激活随机的 nonce 生成这些 revision，以 `public, max-age=31536000, immutable` 提供 bundle，并对任何其他 revision 返回 404，而不是用更新的字节作答。这条契约只在浏览器每次加载都重读 index 时成立，而此前没有任何机制保证这一点：index 只带 `content-type`，没有 `Cache-Control`、`ETag` 或 `Last-Modified`，于是启发式缓存把浏览器钉在了下一个进程不再作答的 revision 上。所有动态模块随之加载失败，页面停在加载态且不报错。

## Decision

`serveStatic` 为渲染出的 index 响应标记 `cache-control: no-store`，覆盖两个 index 入口路径——dist 根目录与配置的 `distIndex`。静态文件保持原有响应头；它们的文件名或 revision 已经随字节变化。

## Alternatives considered

**`no-cache` 加 `ETag`。** 重新校验能为一份几十 KB、走 loopback 的文档保留 304 路径。代价是每次渲染都要算一个校验值，省下的却是一次本就本地的往返；而 `no-store` 才说明了真正的义务：index 是每次激活的产物，不是可缓存的表示。

**由 bundle 字节推导 revision，使其跨重启稳定。** revision 会因此稳定，但重启后重读已变更的 bundle 时，服务端就可能提供缓存 index 并未描述的字节——这正是"revision 不匹配即 404"这条规则要防的事。

**对过期 revision 返回当前字节而不是 404。** revision 命名的是确切的字节；用不同字节作答会使客户端已持有的不可变缓存失效。

## Consequences

每次页面加载都会重新渲染并重新获取 index；它是一份小文档，而鉴权与 index tap 本来就按请求执行。在此变更之前缓存过 index 的浏览器需要手动清一次缓存并刷新。[包测试](../../../../packages/host/frontend-static/tests/frontend-static.spec.ts) 钉住每个 index 入口路径上的 `no-store`，以及它不出现在静态资源、404 响应和 webserver 自身错误体上。
