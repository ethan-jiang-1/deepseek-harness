# 7 · 渠道 / 账号集成

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：Feishu/DingTalk/WeCom/iMessage、账号级默认 workspace、去重/路由状态。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | profile 配置 + credentials + 外部平台 |
| 作用域 | profile / home / external |
| 寿命 | 跟 profile/账号 |
| 读写者 | 用户配置；插件用；模型经消息 |
| 介质 | `cordis.patch.yml`、`.credentials.yaml`、外部 DB |
| 秘密 | 必须走 `CredentialRef`/`CredentialKey` |

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A profile config + credentials | 默认 workspace、开关、凭据引用 | 一个默认值套所有项目 | 单账号/简单 |
| B 外部账号 DB（E2，仅参考） | 多租户/多账号；行锁/加密 | 运维/迁移/隐私 | 仅当多租户且原生 profile 不够 |
| C 每账号 profile | 多 profile 隔离 | 切换成本 | 强隔离 |

**失败模式**：凭据泄漏、去重状态丢失、默认 workspace 错、平台重试、卸载留 token。

**测试**：凭据引用、轮换、去重、默认 workspace、失败重试、卸载清理。

**DSH 映射**：`Config.volatile()` + `credentials`；不要明文 key。

## 8. 每项目运行时
