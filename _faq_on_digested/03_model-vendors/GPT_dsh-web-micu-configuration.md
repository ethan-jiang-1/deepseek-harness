# GPT · DSH Web · MICU GPT-5.6 配置

## 目的与范围

这份记录对应独立安装的 `npx @deepseek-ai/dsh web`，不是当前仓库从源码启动的 DSH。

这次只修改了配置文件，没有新增 vendor 插件、没有修改 DSH 代码、没有修改现有 DeepSeek 默认模型，也没有将 API key 写入任何文件。

启动进程未设置 `DSH_HOME` 时，DSH 使用的文件是 `/Users/bowhead/.dsh/settings.yaml`；本次修改的正是这个文件。

若以后从一个设置了 `DSH_HOME` 的终端启动 DSH，它会改读 `$DSH_HOME/settings.yaml`，而不是这里的文件；先确认启动环境再编辑或回滚。

## 已生效的配置

当前安装版本为 `@deepseek-ai/dsh@0.1.0-rc.6`，其中的通用 `llm-pi-ai` 适配器已经随基础组合包安装并默认休眠。

在 `settings.yaml` 增加下面的 route 即可启用 MICU，不需要开发或安装新的 vendor 插件。

```yaml
llm-pi-ai:
  providers:
    micu:
      displayName: MICU
      apiKeyEnv: CODEX_API_KEY_MICU
      api: openai-responses
      baseURL: https://www.micuapi.ai/v1
      models:
        - id: gpt-5.6-sol
          reasoningEfforts:
            xhigh: xhigh
        - id: gpt-5.6-terra
```

`apiKeyEnv` 是凭据引用的名称，不是把 key 写入配置。默认 Web profile 会先通过 DSH 的 credentials 服务解析它；优先级依次为启动进程的环境变量、`$DSH_HOME/.credentials.yaml`、启动目录的 `.env`、`$DSH_HOME/.env`。

已用这份 `settings.yaml` 做过两次不泄露 key 的验证：挂载与 Web profile 相同的 `settings-file`、`credentials-local` 和 `llm-pi-ai` 后，`CODEX_API_KEY_MICU` 的来源显示为 `env`，`micu / gpt-5.6-sol / xhigh` 的最小真实请求以 `stop` 结束并返回 usage；移除该环境变量后，DSH 在网络请求前返回 `MISSING_CREDENTIAL`，不会改用无关的 key。

这证明当前启动环境中的变量可用；以后从别的终端启动 `npx @deepseek-ai/dsh web` 时，那个启动进程也必须继承该变量，或在 DSH 的凭据服务中配置同名引用。

不要把 key 写成 `apiKey:`，也不要把 `Authorization` 写进 `headers:`；这两种做法会使机密进入普通 settings 文档。

Web 的 Models 页面出现 `MICU` 后，可手动选择 `micu / gpt-5.6-sol` 或 `micu / gpt-5.6-terra`。

当前 `agent-default-model` 保持原值，因此不选 MICU 时仍使用原来的 DeepSeek 默认模型。

## GPT-5.6 的 effort

DSH 的通用 pi-ai adapter 可识别 7 个规范 effort：`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。

本机安装的 `pi-ai` 内置 `openai` catalog 把 `gpt-5.6-luna`、`gpt-5.6-sol`、`gpt-5.6-terra` 都列为 6 个档位：`off`、`low`、`medium`、`high`、`xhigh`、`max`；`minimal` 是 adapter 的通用档位，但不在这些目录记录中。

这是本机依赖的目录数据，不是 OpenAI 官方文档，也不等于 MICU 一定接受相同参数。

当前 MICU 配置对 `gpt-5.6-sol` 与 `gpt-5.6-terra` 对称公开 `off`、`low`、`medium`、`high`、`xhigh`、`max` 六档，并使用 OpenAI Responses 目录中的 wire spelling：`off: none`，其余档位同名透传。`minimal` 不在该目录的映射中，因此不提供。

此前只有 `sol / xhigh` 和未配置 effort 的 `terra`，会导致 Web 选择器显示不对称；现已修正为两模型相同目录。`sol / xhigh` 是唯一已单独完成真实请求验证的档位；其余档位是与本机 OpenAI Responses catalog 一致的可选配置，仍应在 MICU 上按需实际验证。

`gpt-5.6-luna` 曾在两次请求中返回限流；随后一次隔离 route 的最小请求成功。它的稳定性和其他能力仍未完成验证，所以暂不写入日常 route。

只有在同一条 MICU route 上逐档验证成功后，才扩展 `gpt-5.6-sol` 的配置，例如：

```yaml
reasoningEfforts:
  off:
  low: low
  medium: medium
  high: high
  xhigh: xhigh
  max: max
```

`off:` 的空值是有意的：DSH 会把它作为“关闭显式 reasoning 参数”的选择；其余键的值是实际发送给中转站的 wire spelling。

不要仅因模型名或 `pi-ai` 目录存在就添加未验证的档位，否则 Web 会给出一个中转站可能拒绝的选项。

## 检查与使用

在启动 DSH 的同一个终端可用下列命令确认只检查 key 是否存在，不会显示它：

```sh
if [ -n "${CODEX_API_KEY_MICU:-}" ]; then echo 'CODEX_API_KEY_MICU is set'; else echo 'CODEX_API_KEY_MICU is missing'; fi
```

运行 `npx @deepseek-ai/dsh web` 后，settings 文件的外部修改会被 DSH 热加载；若 Web 已运行但未更新，停止后重新启动即可。

模型能力、协议实测与多 vendor 方案的完整结论见 [GPT_research.md](./GPT_research.md) 和 [answer.md](./answer.md)。

## 安全回退

写入前已创建并逐字校验的原始备份：`/Users/bowhead/.dsh/settings.yaml.bak-20260817-113115-before-micu`。

回退前先保存当下版本，再将备份复制到一个同目录临时文件并逐字校验，最后以原子改名替换 settings；两个文件均应保持 `0600` 权限。脚本拒绝覆盖已有回退快照：

```sh
set -eu
dsh_settings_file='/Users/bowhead/.dsh/settings.yaml'
dsh_micu_backup_file='/Users/bowhead/.dsh/settings.yaml.bak-20260817-113115-before-micu'
dsh_rollback_stamp="$(date +%Y%m%d-%H%M%S)"
dsh_rollback_snapshot="${dsh_settings_file}.bak-${dsh_rollback_stamp}-before-micu-rollback"
[ -f "$dsh_settings_file" ] || { echo 'settings file is missing' >&2; exit 1; }
[ -f "$dsh_micu_backup_file" ] || { echo 'original MICU backup is missing' >&2; exit 1; }
[ ! -e "$dsh_rollback_snapshot" ] || { echo "refusing to overwrite $dsh_rollback_snapshot" >&2; exit 1; }
dsh_restore_file="$(mktemp "${dsh_settings_file}.restore-XXXXXX")"
cp -p "$dsh_settings_file" "$dsh_rollback_snapshot"
cp -p "$dsh_micu_backup_file" "$dsh_restore_file"
cmp -s "$dsh_restore_file" "$dsh_micu_backup_file" || { echo 'restore copy verification failed' >&2; exit 1; }
mv "$dsh_restore_file" "$dsh_settings_file"
cmp -s "$dsh_settings_file" "$dsh_micu_backup_file" || { echo 'restore verification failed' >&2; exit 1; }
echo 'MICU configuration rolled back'
```

如果 DSH 正在运行，恢复后的文件会被热加载；需要时重启 Web 服务以排除旧进程状态。

完整 effort 目录写入前还创建了 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-181435-before-micu-efforts`。它保留了当时的默认模型和全部其他 vendor route；恢复它只会撤销本次 MICU effort 扩展。
