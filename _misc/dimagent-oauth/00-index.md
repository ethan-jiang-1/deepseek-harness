# DimAgent OAuth · 为什么这个子目录存在

**这是一份长期维护的 vendor 参考，不是一次故障的事后报告。**

这个目录存在，是因为 DimAgent 有两个会反复咬人的性质，而每次重新发现它们都代价高昂。

## 意图：这个目录要回答什么

| 你的处境 | 该翻哪一份 |
|---|---|
| "DimAgent 的模型怎么没了" | [`03-operations.md`](./03-operations.md#八故障速查) 故障速查表 |
| "又 403 了，是不是要重登" | [`02-ua-allowlist.md`](./02-ua-allowlist.md) —— **先跑对照实验，别重登** |
| "怎么换账号 / 查额度 / 重登" | [`03-operations.md`](./03-operations.md#二常用操作命令行) |
| "它现在提供哪些模型" | [`04-models.md`](./04-models.md) |
| "端点和请求头是什么" | [`05-facts.md`](./05-facts.md) |
| "当初为什么禁用过" | [`01-diagnosis.md`](./01-diagnosis.md) |

## 为什么要单独开目录

### 1. 它的失败模式会重复，而且每次表现一样

中继 `dimagent.cn` 用 **`User-Agent` 白名单**决定放不放行，**不看凭据本身**。
DSH 发送的 `deepseek-harness/<version> (+url)` 恰好在名单内，所以插件**原样安装即可工作**。

问题在于：**白名单是服务端状态，随时可能变。** 一旦它变了，症状永远是同一个
`403 该凭证仅限官方客户端使用 (unsupported client)`，而**正确反应是"跑 UA 对照实验"，
不是"重新登录"**。2026-10-27 就是因为判断成"凭据被拒"而白白禁用了三天——
详见 [`02-ua-allowlist.md`](./02-ua-allowlist.md#一个必须记下的修正)。

把这条写下来，是为了下次不用再花三天。

### 2. 模型覆盖面在别处拿不到

对比全局 DSH 其它 provider：

- **图像生成**：`seedream-5.0`、`qwen-image-3.0` —— 独有
- **小米 MiMo 系**：`mimo-v2.6-pro` / `mimo-v2.6-flash` —— 独有
- 同时聚合 GLM / Qwen / Kimi / Seed / DeepSeek 五家

这是刚需，不是可有可无的备胎路由。

### 3. 它是插件，操作路径不在 DSH 主流程里

它的开关、登录、额度查询都是**独立于 DSH 主体的一套**：自己的 OAuth 流程、自己的 6 个本地路由、
自己在设置页的面板。不熟悉这套的人会去找 DSH 的模型配置，然后找不到。

## 目录内容

| 文件 | 问题 | 性质 |
|---|---|---|
| [`01-diagnosis.md`](./01-diagnosis.md) | 当初发生了什么，为什么判断错了 | 历史，防止重蹈 |
| [`02-ua-allowlist.md`](./02-ua-allowlist.md) | 为什么 403，怎么 30 秒验证 | **机制，最常翻** |
| [`03-operations.md`](./03-operations.md) | 怎么登录 / 换号 / 启用 / 排查 | **手册，日常主入口** |
| [`04-models.md`](./04-models.md) | 有什么模型，独有在哪 | 快照 |
| [`05-facts.md`](./05-facts.md) | 端点、凭据、请求头、源码位置 | 速查 |

## 边界：只碰这一个插件

本目录的所有操作**只作用于 `@arcships/dsh-dim-oauth` 这个插件**，不涉及 DSH 本体：

- 改的只有 `~/.dsh/profiles/web/cordis.patch.yml` 里 `dimagent-oauth` 那一行
- 不动 DSH 源码（`packages/`、`apps/`）
- 不动全局安装的 `@deepseek-ai/dsh`
- 不动其它插件

这与 [`dsh-global-upgrade/`](../dsh-global-upgrade/00-index.md) 的铁律一致：升级只走全局 npm 与
`dsh plugin`，不借助本仓库、不把仓库当安装源。**本目录只记录怎么操作这一个插件。**

## 当前状态（2026-10-30 核验）

```
profile : web
插件    : @arcships/dsh-dim-oauth@0.2.1
配置    : ~/.dsh/profiles/web/cordis.patch.yml  →  disabled: false
模型数  : 14，failures: []
服务    : :3080 正常，启动日志 0 warning/error
```

## 维护提示

- **白名单会变**：403 先跑 [`02-ua-allowlist.md`](./02-ua-allowlist.md) 的对照实验
- **模型列表会变**：`04-models.md` 只是快照，用「刷新」或直打端点确认当前值
- **插件版本会变**：当前 0.2.1，升级前看上游有无针对白名单或 UA 的改动
- **别写死 token**：凭据由插件自己轮换刷新，位置见 [`05-facts.md`](./05-facts.md#凭据文件)

## 验证

修改本目录后，在仓库根运行：

```sh
node _misc/verify.mjs
```
