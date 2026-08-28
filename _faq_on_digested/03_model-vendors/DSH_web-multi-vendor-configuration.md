# DSH Web · 多 vendor 纯配置与安全回退

> **2026-08-27 勘误**：对 `web` profile，`llm-pi-ai` 实际生效的是补丁层 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml`（`--dump-config` 证实组合结果不含 settings.yaml 独有的 openrouter），本文所述 settings.yaml 仅是镜像；zai 模型也已裁剪为 glm-5.3 与 glm-5.3-flash。机制、最终条目与恢复步骤见 [GLM_change-log-zai-two-models-20260827.md](./GLM_change-log-zai-two-models-20260827.md)。
>
> **2026-08-28 增补**：openrouter route 已进入补丁层，现含 3 个模型（deepseek-v4-pro / deepseek-v4-flash / deepseek-v4-flash-vision-exp，当日加过 8 个后剔除 5 个）；下表不含该 route。现状与流程见 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md)，实测证据见 [OPENROUTER_research.md](./OPENROUTER_research.md)。

## 已应用的配置

本记录对应独立安装的 `npx @deepseek-ai/dsh web`，其默认 `DSH_HOME` 为 `/Users/bowhead/.dsh`，实际设置文件为 `/Users/bowhead/.dsh/settings.yaml`。本次只补充 `llm-pi-ai.providers`，不安装插件、不修改 DSH 代码、不改变已有 MICU route。默认模型可由 Web 随时改写；本记录不把它当作 vendor 配置的一部分。

| route | 用途 | endpoint / 协议来源 | 凭据引用 | Web 中保留的模型 |
|---|---|---|---|---|
| `micu` | GPT-5.6 MICU 中转 | 手工 `openai-responses` route | `CODEX_API_KEY_MICU` | `gpt-5.6-sol`、`gpt-5.6-terra` |
| `zai` | Z.ai Coding API | 内置 `zai` catalog，`https://api.z.ai/api/coding/paas/v4` | `ZAI_API_KEY` | `glm-5.1`、`glm-5.2`、`glm-5.3`、`glm-5-turbo` |
| `moonshotai-cn` | Kimi 中国 Open Platform | 内置 OpenAI Chat Completions catalog，`https://api.moonshot.cn/v1` | `KIMI_CN_API_KEY` | `kimi-k3`、`kimi-k2.7-code`、`kimi-k2.7-code-highspeed`、`kimi-k2.6` |

每一条 `apiKeyEnv` 都只是环境变量名，settings 文件不含 API key 或 `Authorization` header。新 route 在没有对应环境变量时会在网络请求前失败为 `MISSING_CREDENTIAL`，不会自动取用另一家 vendor 的 key。当前配置解析已通过 `dsh web --dump-config`。

MICU 的 `gpt-5.6-sol` 与 `gpt-5.6-terra` 均提供相同的 effort：`off`、`low`、`medium`、`high`、`xhigh`、`max`；`off` 发送 `none`，其余档位原样发送。`minimal` 不在本机 OpenAI Responses catalog 的 GPT-5.6 映射中。写入此对称目录前的 settings 快照为 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-181435-before-micu-efforts`，权限为 `0600`。

标准 API 的手工 `glm-zai` route 已移除：本机 key 在该 endpoint 的最小请求返回 `429`、代码 `1113`，保留它会和 Coding endpoint 的同名模型混淆。相同 key 对 `zai / glm-5.3` Coding endpoint 的最小非流式文本请求已返回 `stop` 与非空内容。`glm-5.3` 是对当前 `pi-ai` catalog 的显式补充，DSH 会复用内置 `zai` provider 的 Coding base URL 与 Z.ai 兼容设置；仍未通过 DSH 完成工具调用或 replay 测试。Kimi 中国 Open Platform key 对 `/models` 和 `kimi-k3` 最小非流式文本请求已成功；国际与 Coding route 已移除，避免同名模型和不同协议干扰。模型出现在 Web 选择器中不等于工具调用或 replay 已实测通过。

MICU 的运行中 Web 进程不继承启动它的 shell 环境时，无法解析 `CODEX_API_KEY_MICU`，即使另一个终端中该变量存在。已将现有 MICU key 写入 DSH 管理的 `/Users/bowhead/.dsh/.credentials.yaml`，权限为 `0600`；该文件由 credentials 服务热加载，`settings.yaml` 仍只保留引用。写入前的凭据快照是 `/Users/bowhead/.dsh/.credentials.yaml.bak-20260817-180643-before-micu`，同样为 `0600`。不要在 shell 启动脚本或 settings 中再复制该 key。

Kimi 中国 Open Platform key 同时位于 `~/.zshenv` 的 `KIMI_CN_API_KEY` 与 DSH 管理的 `/Users/bowhead/.dsh/.credentials.yaml`，后者让已经运行的 Web 进程无需重启即可解析凭据。写入前的三份 `0600` 快照为 `/Users/bowhead/.zshenv.bak-20260817-193000-before-kimi-cn-only`、`/Users/bowhead/.dsh/settings.yaml.bak-20260817-193000-before-kimi-cn-only`、`/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260817-193000-before-kimi-cn-only`；受管凭据的写入前快照为 `/Users/bowhead/.dsh/.credentials.yaml.bak-20260817-193200-before-kimi-cn`。

各 vendor 的协议、模型和 effort 依据见 [GPT_research.md](./GPT_research.md)、[GLM_research.md](./GLM_research.md) 与 [KIMI_research.md](./KIMI_research.md)。

曾为排查 Standard API 错路创建过 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-191500-before-glm-coding-default`，权限为 `0600`。恢复它也会恢复当时的默认模型；下方“回退快照”则恢复所有 vendor route 写入前的状态。

移除 `glm-zai` 前的两个可恢复快照为 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-192500-before-remove-glm-zai` 与 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260817-192500-before-remove-glm-zai`，权限均为 `0600`。

## 回退快照

写入前已创建 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-180154-before-vendor-routes`，权限为 `0600`。它是写入前 settings 的逐字节备份，SHA-256 为 `3af2f577de6ade7826d99bd4b4e54c6ee61cbff621b037f897f135ccda831193`。

以下回退会先保存当前版本，再以临时文件、逐字节校验和原子改名恢复该快照；若同一秒已有快照，脚本会拒绝覆盖它。

```sh
set -eu
dsh_settings_file='/Users/bowhead/.dsh/settings.yaml'
dsh_vendor_backup_file='/Users/bowhead/.dsh/settings.yaml.bak-20260817-180154-before-vendor-routes'
dsh_rollback_stamp="$(date +%Y%m%d-%H%M%S)"
dsh_rollback_snapshot="${dsh_settings_file}.bak-${dsh_rollback_stamp}-before-vendor-routes-rollback"
[ -f "$dsh_settings_file" ] || { echo 'settings file is missing' >&2; exit 1; }
[ -f "$dsh_vendor_backup_file" ] || { echo 'vendor-routes backup is missing' >&2; exit 1; }
[ ! -e "$dsh_rollback_snapshot" ] || { echo "refusing to overwrite $dsh_rollback_snapshot" >&2; exit 1; }
dsh_restore_file="$(mktemp "${dsh_settings_file}.restore-XXXXXX")"
cp -p "$dsh_settings_file" "$dsh_rollback_snapshot"
cp -p "$dsh_vendor_backup_file" "$dsh_restore_file"
cmp -s "$dsh_restore_file" "$dsh_vendor_backup_file" || { echo 'restore copy verification failed' >&2; exit 1; }
mv "$dsh_restore_file" "$dsh_settings_file"
cmp -s "$dsh_settings_file" "$dsh_vendor_backup_file" || { echo 'restore verification failed' >&2; exit 1; }
echo 'vendor routes rolled back'
```

运行中的 `dsh web` 会热加载 settings；若 Web 没有刷新，重启该服务即可。若从设置 `DSH_HOME` 的终端启动 DSH，先将命令中的 settings 和 backup 路径换成那个目录，避免回退错文件。

恢复上述 settings 快照只撤销 vendor route，不会删除 MICU 凭据。若需要独立撤销该凭据，先备份当前 `/Users/bowhead/.dsh/.credentials.yaml`，再以同目录临时文件逐字节校验后原子替换为 `/Users/bowhead/.dsh/.credentials.yaml.bak-20260817-180643-before-micu`；保持两个文件均为 `0600`。
