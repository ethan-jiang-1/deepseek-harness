# 验收清单

前置：已完成 [执行手册](./01-runbook.md) 阶段 1–3，`dsh web` 正在运行。

判定分级：

- **阻断级**：任一项失败 → 停止使用，走回滚。
- **重要**：失败 → 先记录，把对应插件单独处理（降级或临时禁用），不必整体回滚。
- **观察**：记录现象即可。

---

## A. 启动日志（阻断级）

日志来自启动 `dsh web --no-open` 的那个终端，或你平时重定向的输出文件（历史上是 `~/.dsh/dsh-web.log` / `~/.dsh/dsh-web.out`，具体看你的启动方式）。

用下面的关键字逐条核对：

```sh
LOG="$HOME/.dsh/dsh-web.log"   # 换成你的实际日志路径
grep -nE "startup failed|disabling profile plugin|incompatible with dsh|Plugins waiting for services" "$LOG"
```

| 检查 | 期望 |
|---|---|
| `startup failed` | **不出现** |
| `disabling profile plugin` | **不出现** |
| `incompatible with dsh` | **不出现** |
| `Plugins waiting for services` | **不出现**（升级前允许出现 `webRuntime`，升级后不该再出现） |
| `dsh web: http://127.0.0.1:3080/?token=...` | 出现，端口与预期一致 |
| `[dsh-auto-approval-llm]` 开头的行 | 出现（说明插件已加载；`slash commands disabled` 属正常配置结果） |

补充：如果启动时用 `--dump-config` 做过阶段 1.3 的检查，那一份 `.err` 也保留，作为对照。

## B. 进程与端口（阻断级）

```sh
lsof -ti tcp:3080
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3080
```

- 端口由**一个**进程占用。
- HTTP 返回 `200` 或 `302`（带 token 的地址）。

## C. 配置文件完整性（阻断级）

```sh
shasum -a 256 "$HOME/.dsh/profiles/web/cordis.patch.yml"
wc -c "$HOME/.dsh/profiles/web/cordis.patch.yml"
ls "$HOME/.dsh/profiles/web/" | grep -E "cordis.patch.yml(\.bak-[0-9]+)?$"
```

| 检查 | 期望 |
|---|---|
| sha256 | 与备份目录中的 `cordis.patch.yml` 一致（升级不应修改它） |
| 字节数 | `13632` |
| 目录里没有新的 `cordis.patch.yml.bak-<13位数字>` | 没有。出现即为启动失败留下的残骸，从备份恢复后再启动 |

> 如果 sha256 与备份不一致：先 `diff` 看差异；只要内容不是被整体替换成空壳，就按"有人手工改过"处理，不要直接覆盖。

## D. profile 依赖版本（阻断级）

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
  "dsh-client-auto-continue": "^0.14.2",
  "dshmarket": "1.66.42"
}
```

同时确认 `dsh --version` 为 `0.2.1-rc.2`。

## E. 界面功能（按级）

浏览器打开 `http://127.0.0.1:3080/?token=...`，逐项点一遍。

### 阻断级

1. **能新建会话并完成一轮对话**：发送"你好"，收到回复，消息落盘（`~/.dsh/sessions` 下出现新目录）。
2. **侧栏存在且可用**：`dsh-better-sidebar` 的侧栏出现；展开文件树能看到当前工作区文件；终端面板能打开并执行 `echo ok`。
3. **设置 → 插件页能打开**：能看到已安装插件列表（或至少设置窗口能正常打开）。
4. **审批链路可用**：让 Agent 执行一个需要审批的命令（例如写文件或跑一条 bash），确认审批弹窗出现、批准后执行成功、拒绝后不执行。

### 重要

5. **自动审批插件在岗**：`[dsh-auto-approval-llm]` 日志出现；触发一次可自动放行的工具调用，确认没有被卡在人工审批（若你的配置是全人工，则记录"跳过"）。
6. **技能中心**（skill-explorer）：面板能打开、能列出技能、能打开某个 `SKILL.md` 编辑；插件提供的技能显示为"由插件提供 / 无本地文件"属新版本正常行为。
7. **插件市场**（dshmarket）：设置里能打开市场卡片，能看到已安装列表。**先不要点"更新"**（升级后的第一轮验收不测写操作）；确认版本显示 `1.66.42` 后，可在下一轮再测更新。
8. **模型选择器**：7 个自定义 provider 组都在 —— `MICU`、`OpenRouter`、`Z.ai Coding API (working)`、`Kimi China Open Platform (working)`、`TeamoRouter`、`OpenCode Go (working)`、`Yovole (new-api)`。另加内置 `DeepSeek`。
9. **自动继续**（auto-continue）：日志里出现 `[auto-continue] 已启动`；如果方便，制造一次中断看它是否自动续（不确定就只核对日志）。

### 观察

10. **工作树插件**（clutch）：如果平时用它的 worktree 入口，点开一次确认不报错；不用则跳过。
11. **DimAgent 登录**（dim-oauth）：设置里能看到 DimAgent 入口即算加载正常；登录流程不要求本轮验证。

## F. 凭据与模型生效（重要）

0.2.1 起，`.credentials.yaml` 的 `refs` 优先于同名环境变量（0.2.0 相反）。核对方式：

```sh
# 只列键名，不打印值
grep -E "^  [A-Z0-9_]+:" "$HOME/.dsh/.credentials.yaml" | sed -E 's/:.*$//'
```

当前 refs 里有：`OPENROUTER_API_KEY`、`DEEPSEEK_API_KEY`、`CODEX_API_KEY_MICU`、`KIMI_CN_API_KEY`、`TEAMOROUTER_API_KEY`、`OPENCODE_API_KEY`、`AIDER_OPENAI_API_KEY`。

- 如果这些名字**也**在 shell / `.env` 里导出过，升级后用的是文件里那把。
- 验证方式：用其中任意一个 provider 发一条短消息，成功即可；失败时先看是"缺 key"还是"key 无效"，再决定改文件还是改环境变量。

## G. 稳定性（观察，建议 30 分钟）

- 让 Web 挂着，期间正常用几轮。
- 日志里不应反复出现 `pending` / `disabling` / 堆栈。
- `~/.dsh/sessions` 有新会话写入，且旧会话仍能打开。
- 内存/CPU 明显异常时记录 PID 与时间点，但不要立即重启（重启会丢现场）。

---

## 验收结论怎么写

按下面格式留一条记录（放在你自己的工作记录里即可，不必回写本目录）：

```
日期：2026-__-__
DSH：0.2.1-rc.2
插件：better-sidebar 0.28.0 / auto-approval 0.0.43 / dshmarket 1.66.42 /
      skill-explorer 0.4.7 / clutch 0.1.18 / dim-oauth 0.2.1 / auto-continue 0.14.2
A 日志：通过 / 失败（摘录）
B 端口：通过
C 配置：通过（sha256 一致）
D 版本：通过
E 功能：阻断级 4/4；重要 __/5；观察 __
F 凭据：通过（使用的 provider：____）
G 稳定性：30 分钟正常
结论：接受 / 回滚
备注：
```

## 阻断级失败时的动作

1. 立刻停止使用该实例，不要继续点界面（避免把坏状态写进会话）。
2. 保存日志与 `~/.dsh/profiles/web/package.json`。
3. 按 [执行手册 阶段 4](./01-runbook.md#阶段-4-回滚) 回滚。
4. 把失败项、日志摘录、当时的版本号报给负责人。
