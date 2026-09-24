# Answer 12 · 卡住的不是并发，是陈旧缓存的 index；修复 = 给 index 加 `no-store`

来源标注：根因与修复以本仓库 `ethan` 分支为源（基线 commit `5529a8e647`，修复 commit `38017c3f61`，见文末清单）；实测在全局安装 `@deepseek-ai/dsh` `v0.1.5-rc.2` 的 live 服务器（127.0.0.1:3080）与源码实例上完成，日期 2026-09-13/14。

## 一句话结论

不是并发限制、不是浏览器连接池、跟 token/session 也无关：修复前 [`frontend-static`](../../packages/host/frontend-static/src/index.ts) 服务 index.html 时不带任何 `Cache-Control`/`ETag`/`Last-Modified`，浏览器按启发式缓存复用旧 index；而 client 插件 bundle 的 rev 每次**进程启动都会轮换**，旧 index 指名的动态模块全部 404，于是新窗口"出了壳但永远起不来"。修复只有一条语义：index 响应加 `cache-control: no-store`（资产/bundle 保持原 `immutable` 缓存不动）。

## 症状与它造成的假象

- 前 1–3 个窗口正常，再多开就卡：页面框架渲染出来、应用停在加载态、无任何错误提示；关掉卡住的窗口后恢复；三大浏览器全部复现 → 直觉指向"启动并发上限"或"浏览器每 origin 连接数限制"，两者都是错的。
- 真正的边界不是窗口数量，而是**这个窗口有没有跨过一次 rev 轮换**：轮换（重启 `dsh web`、dshmarket 一键重启、插件更新）之前开的窗口早已把模块加载进内存，继续正常；轮换之后新开的窗口若命中缓存的旧 index，就按死 rev 请求模块、全 404、卡住。哪一扇窗口是"第 4 个"纯属偶然，取决于哪扇第一次拿到陈旧 index。
- 控制台其实有线索：一串动态模块的 404。页面不弹错是因为壳层 HTML 本身是 200 且完整。

## 机制（源码确认）

1. [`packages/client/modules/src/index.ts`](../../packages/client/modules/src/index.ts)：每次进程启动为每个 client 插件 bundle 铸造随机 `rev`。
2. bundle 以 `public, max-age=31536000, immutable` 服务；rev 不匹配一律 404——这是刻意的不可变资源契约，本身正确。
3. index.html 是唯一携带"当前这一轮 rev 清单"的载体；修复前它没有任何缓存头，浏览器（无验证器时）按启发式新鲜度直接复用缓存副本。
4. 复用到旧 index → 按旧 rev 请求全部动态模块 → 404 → 应用停在自身 loading 态。
5. 修复：index 响应 `cache-control: no-store`。它让浏览器每次都取当前 index，rev 轮换即刻生效；资产的 `immutable` 契约不受影响。该修复曾落地为本地 note `2026-09-13-served-index-must-not-be-cached`，**0.1.7-rc.1 同步（0008）起按「产品源码整树照搬上游」口径退役**——上游截至 `dsh-v0.1.7-rc.1` 没有这个修复，`packages/host/frontend-static/src/index.ts` 仍不带 index 缓存头；已在 0008 登记为上游候选缺口。

## 为什么敢排除并发（实测证据）

- 5 个标签页 × chromium + webkit 两种引擎、headless 与 headed 两种模式，分别打 live 3080 与源码实例，全部完整可用（测的是功能：WS 帧到达、长连接保持、正文渲染，不是壳层 onload）；node 侧并发挂 58+ socket 无压力、无拒绝。
- 每个标签页实测长期连接约 6 条：3 条 WebSocket（`/api/remote.mux` + better-sidebar 的两条 `/sidebar/ws/*`）+ 3 条 HTTP（web bundle 无条件的 HMR SSE `/plugins/events`、`@quill507/dsh-auto-approval-llm` 的 20 秒 long-poll `/session-review-status`、`/api/auto-continue-bridge`）——全部被服务端正常接受，代码里也不存在任何连接数上限。
- 现代引擎对这个本地页面场景没有 enforce 老的"每 origin 6 连接"限制。

## 手动补丁 runbook（每次 `npm i -g @deepseek-ai/dsh` 升级后按此重打）

升级会整包替换 `node_modules`，手补丁随之丢失。以下命令可直接粘贴。两处前提：`dsh` 来自当前激活的 nvm node（换 node 大版本后 `npm root -g` 解析结果会变，所以永远用命令解析、不写死路径；2026-09-14 时它解析到 `/Users/bowhead/.nvm/versions/node/v22.23.1/lib/node_modules`）；3080 是本机 web 端口。

**第 0 步 · 先判断还要不要打：**

```sh
FS="$(npm root -g)/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-host-frontend-static/lib/index.js"
grep -c 'no-store' "$FS"
```

输出非 0 → 官方版本已带修复（或上次补丁还在），到此为止。输出 0 → 继续。

**第 1 步 · 备份**（沿用 `.bak-日期-原因` 命名惯例）：

```sh
cp "$FS" "$FS.bak-$(date +%Y%m%d-%H%M)-before-no-store"
```

**第 2 步 · 三处编辑**，都在编译产物 `lib/index.js` 的 `serveStatic` 函数里。三个锚点在 v0.1.5-rc.2 的产物中各只出现一次；未来版本若结构对不上，按语义定位（变量声明区、index 分支、writeHead 调用），语义以 [仓库源码的修复版](../../packages/host/frontend-static/src/index.ts) 为准：

2a — 声明缓存头变量：

```js
	let body;
	let type;
	let cacheControl;
```

（在原 `let body;` / `let type;` 之后新增第三行。）

2b — index 分支置值：

```js
			body = await renderIndex();
			type = HTML_MIME;
			cacheControl = "no-store";
```

（在原 `type = HTML_MIME;` 之后新增第三行；注意在 `if (target === distRoot || target === distIndex)` 分支内。）

2c — 响应头按需携带：

```js
	res.writeHead(200, cacheControl === undefined ? { "content-type": type } : { "content-type": type, "cache-control": cacheControl });
```

（整行替换原来的 `res.writeHead(200, { "content-type": type });`。）

**第 3 步 · 重启 3080**，二选一：

- dshmarket 界面里的一键重启（它内部就是停旧进程再拉起，日志落在 `/private/var/folders/…/dsh-market-restart-*.out.log`）。
- 手动（保持与原进程相同的工作目录启动最稳，虽然 dsh web 的配置实际都在 `~/.dsh/profiles/web`，cwd 影响很小）：

```sh
PID=$(lsof -nP -iTCP:3080 -sTCP:LISTEN -t) && kill "$PID"
cd "$(dirname "$(command -v dsh)")"
LOG="/tmp/dsh-web-restart-$(date +%Y%m%d-%H%M%S).out.log"
nohup dsh web >"$LOG" 2>&1 & disown
grep -m1 'token=' "$LOG"    # 新的入口 URL；dsh web 还会自动弹一个默认浏览器窗口
```

**第 4 步 · 验证**（token → cookie → 看头）：

```sh
TOKEN=$(grep -m1 -o 'token=[^[:space:]]*' "$LOG" | cut -d= -f2)
rm -f /tmp/dsh-jar
curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:3080/?token=$TOKEN" -c /tmp/dsh-jar   # 期望 303
curl -s -D - -o /dev/null http://127.0.0.1:3080/ -b /tmp/dsh-jar | grep -i cache-control        # 期望 cache-control: no-store
curl -s -D - -o /dev/null http://127.0.0.1:3080/favicon.svg -b /tmp/dsh-jar | grep -i cache-control || echo 'OK: 资产无 cache 头'
```

**第 5 步 · 回滚**（如需）：

```sh
cp "$FS".bak-*-before-no-store "$FS"
```

然后重启一次。

## 重启后旧窗口的善后（只此一轮）

- 之前**卡住**的窗口：做最后一次 Cmd+Shift+R（清掉启发式缓存里的旧 index）；此后不再需要。
- 之前**正常**的窗口：连接断开会自动重连；这次重启又轮换了一轮 rev，旧窗口内存里的模块地址过期属正常一次性现象，发现空白/卡住时普通刷新一次即可。
- 登录态不受重启影响：`?token=` 首跳换来的签名 cookie 有效期 30 天，签名密钥持久在 `~/.dsh`，所以旧窗口不用重新输 token；只有拿**新 token URL** 开新窗口这一件事需要从启动日志/弹出窗口取新地址。

## 什么时候可以永远停手

第 0 步的 grep 变为非 0（官方版本已带修复）。仓库里的正式修复 2026-09-14 已提交到 `ethan` 分支（`38017c3f61`），发布后 `@next` 装上即带，手补丁退役：

- `packages/host/frontend-static/src/index.ts` — `no-store` 语义本体
- `packages/host/frontend-static/tests/frontend-static.spec.ts` — 行为测试
- `packages/host/frontend-static/README.md` / `README.zh.md` / `README.i18n.yaml` — 契约文档
- `.agents/notes/implemented/bug-fix/2026-09-13-served-index-must-not-be-cached.md`（+ `.zh.md` / `.i18n.yaml`）— 决策记录

## 2026-09-14 现场（本 runbook 的第一次执行）

- 全局安装 `v0.1.5-rc.2` 已打补丁；live 3080 已用补丁重启（启动日志 `/tmp/dsh-web-restart-2026-09-14-075014.out.log`，进程 62459），验证三行全过：`/` 303→200 + `cache-control: no-store`，favicon 无 cache 头。
- 备份留在原地：`…/dsh-host-frontend-static/lib/index.js.bak-20260914-0000-before-no-store`。
- 临时验证实例（13099 端口）用后即弃；dshmarket 此前那次重启的日志在 `/private/var/folders/0_/42sp51652_79fdjkf6s2xj3w0000gp/T/dsh-market-restart-2026-09-13T23-20-15.out.log`。

## 附带发现（另一件事，未解决）

`~/.dsh/profiles/web/cordis.patch.yml` 里 `better-sidebar` 与 `ui-skill-explorer` 的 `disabled: true` **不生效**：host 侧路由仍在、client 仍在 roster（live 与源码实例均如此）；而 `agent-teams`、`auto-continue` 的禁用行为在两个实例间还不一致。原因未查，属独立问题。

## 引用

- 源码：[`packages/host/frontend-static/src/index.ts`](../../packages/host/frontend-static/src/index.ts)（诊断机制仍在；「修复版语义」随 0008 退役，仅存于本页与 0008 记录）、[`packages/client/modules/src/index.ts`](../../packages/client/modules/src/index.ts)（rev 铸造）
- 决策记录：`2026-09-13-served-index-must-not-be-cached`（已随 0008 整树照搬退役，原文见 git 历史 `476c72fc2a` 之前版本）
- 排除并发时读过的服务侧代码（均无连接上限）：`packages/host/webserver/src/index.ts`、`packages/api/gateway/src/stream-server.ts`、`packages/client/connection/src/browser-auth.ts`
