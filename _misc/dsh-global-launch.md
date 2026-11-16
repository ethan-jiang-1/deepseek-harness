# 启动全局 DSH Web：照抄即可

**用途**：在这个仓库里干活时，要起"平时用的那个 DSH"（全局安装版），而不是仓库源码版。给 Agent 看，也给未来的自己看。

**状态**：启动方法与事实均已核验，核验点见 [`00-index.md`](./00-index.md) 的说明。

---

## 一、只有一条命令

```sh
cd ~ && dsh web
```

或者等价地：

```sh
dsh --profile web
```

`web` 是 `--profile web` 的简写。在**任意目录**都能跑，不必在仓库里。

启动后日志末尾会打印一行，**这一行就是你要的 URL**：

```
dsh web: http://127.0.0.1:3080/?token=<每次都不一样>
```

浏览器会自动打开。不想自动开就加 `--no-open`。

---

## 二、最容易犯的错：起成了仓库源码版

下面这几条**都不是**全局版，是这个仓库的开发环：

| 命令 | 实际是什么 | 用不用 |
|---|---|---|
| `pnpm run dev:web` | 仓库开发环：先 build，再起三个 watcher，最后 `dsh web` | **别用**，除非在改前端源码 |
| `pnpm run start:web` | `node --import tsx/esm apps/cli/src/bin.ts web`，直接跑仓库源码 | **别用** |
| `pnpm dsh --profile web` | 同上是源码路径 | **别用** |
| `cd ~ && dsh web` | 全局 npm 安装版，读 `~/.dsh/` | ✅ **就用这个** |

**怎么一眼分辨**（`lsof -nP -iTCP:3080 -sTCP:LISTEN` 拿到 PID 后）：

```sh
ps -o command= -p <PID>
```

- 全局版：`.../lib/node_modules/@deepseek-ai/dsh/lib/bin.js web`
- 源码版：`... --import tsx/esm apps/cli/src/bin.ts web` ← 看到 `tsx/esm` 就说明起错了

源码版和全局版读的是**不同的 profile 组成**：全局版走 `~/.dsh/profiles/web/`（你的 8 个 provider、6 个第三方插件），源码版走仓库里的 bundle。所以起错了会"插件没了、模型少了"，但页面照样能打开——这是它最坑的地方。

---

## 三、token 每次都变，别抄旧的

URL 里那串 `?token=...` 是**进程级 launch token**，每个进程随机生成一次，重启就换。它不是你配置里的任何东西，也没有办法固定。

因此：

- 每次启动都从日志里捞当次的那一行
- **不要**把上一次的 URL 存起来复用，会 401
- 已登录的浏览器有 cookie，刷新页面时一般不用重新带 token

从后台任务里捞 URL：

```sh
grep -o "dsh web: http://[^ ]*" <日志文件> | tail -1
```

---

## 四、默认值

| 项 | 默认 | 怎么改 |
|---|---|---|
| host | `127.0.0.1`（仅本机） | `--host <具体IP>` |
| port | `3080` | `--port <n>`，`--port 0` 让系统随便给 |
| 浏览器 | 自动打开 | `--no-open` |

**通配地址会被拒绝**：`--host 0.0.0.0` 直接报错，这是设计如此（绑定全部网卡等于把 RCE 暴露到网络）。要给局域网用，就绑**某一具体网卡 IP**，例如 `--host 192.168.1.10`。

---

## 五、provider 的 key 在哪（踩过的坑）

**key 不在环境变量里，在 `~/.dsh/.credentials.yaml`。**

这个文件里 `refs:` 下列出的名字，就是 `cordis.patch.yml` 里 `apiKeyEnv:` 引用的东西：

```sh
grep -A 20 "^refs:" ~/.dsh/.credentials.yaml   # 看有哪些名字
```

有 **4 个**同时也在 shell 环境变量里（`OPENROUTER_API_KEY`、`KIMI_CN_API_KEY`、`TEAMOROUTER_API_KEY`、`ZAI_API_KEY`），其余**只**在 credentials store。所以：

> `echo $CODEX_API_KEY_MICU` 输出空，**不代表这个 key 不存在**。

用 `/v1/models` 端点测 key 也要注意：如果从环境变量取，没导出的那些会是空字符串，必然 `401 Invalid token`——那是测试方法的问题，不是配置的问题。要验真实链路，**在 Web 界面里实际发一句话**，或者走 DSH 自己的 provider 栈。

---

## 六、停掉与重启

```sh
lsof -nP -iTCP:3080 -sTCP:LISTEN     # 找到占端口的 PID
kill <PID>
```

端口被占着时新进程起不来，先停再起。源码版和全局版**不要同时跑**（抢 3080，且源码版的 watcher 会反复重写 `lib/` 并把浏览器搞乱）。

---

## 七、启动失败时按这个顺序看

| 现象 | 先查 |
|---|---|
| 端口起不来 | 3080 被占（上一条命令） |
| `startup failed` / `disabling profile plugin` | 插件问题，去看 [`dsh-global-upgrade/01-runbook.md`](./dsh-global-upgrade/01-runbook.md) 的回滚，别乱改插件 |
| 页面能开、发消息才报错 | provider 凭据或上游网络，见第五节 |
| 插件/模型比平时少 | 起成源码版了，见第二节 |
| 401 打不开页面 | token 抄旧了，见第三节 |

---

## 八、和升级包的关系

本页只管**启动**。要**升级**全局安装（换版本、换插件版本、回滚）看 [`dsh-global-upgrade/00-index.md`](./dsh-global-upgrade/00-index.md)，那份执行包里有个带守卫的 `dsh-upgrade.sh`。

两条铁律在那份里，这里只重复一遍**跟启动相关的**：升级命令**不能从这个 Web 会话里跑**——停 `dsh web` 会终止会话。要升级就在独立终端里操作。
