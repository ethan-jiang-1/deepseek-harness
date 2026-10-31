# 实验 05 · Web 模板与本地 bundle 安装

**状态：** 已执行。证据等级 **T**；范围仅包括 profile composition 和 Web listener HTTP smoke。

## Fixture

[profile-bundle](../fixtures/profile-bundle/package.json) 是本地 bundle package。它的 `dsh.bundle.patch` 插入一个已有的 `@deepseek-ai/dsh-time-context` row，以及一条空工具列表的完整 preset row；fixture 不包含产品 runtime code。

## 命令

在仓库根目录执行：

```sh
home=$(mktemp -d /tmp/faq26-profile-test.XXXXXX)

DSH_HOME="$home" node --import tsx/esm apps/cli/src/bin.ts \
  --profile verify-kanban-web --from-default-profile web --dump-default-config

DSH_HOME="$home" node --import tsx/esm apps/cli/src/bin.ts plugin \
  --profile verify-kanban-web add \
  "$PWD/_faq_on_digested/26_plugin-as-product/40-evidence/fixtures/profile-bundle"

DSH_HOME="$home" node -e "const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync(process.env.DSH_HOME+'/profiles/verify-kanban-web/package.json','utf8')); console.log(JSON.stringify(p.dsh.profile.bundles))"

DSH_HOME="$home" node --import tsx/esm apps/cli/src/bin.ts \
  --profile verify-kanban-web --dump-config | \
  grep -n -A 7 -E "^# == @example/faq26-product-bundle|- id: faq26-proof-row|- id: preset-faq26-fixture"
```

## 实测结果

隔离的 profile 从 `web` 模板初始化，bundle 顺序为：

```json
["@deepseek-ai/dsh-base","@deepseek-ai/dsh-web-app","@example/faq26-product-bundle"]
```

配置 dump 显示 Web rows、`faq26-proof-row`，以及包含 `config.plugins: []` 的完整 `preset-faq26-fixture` row。这证明 bundle patch 可以插入完整 Agent preset declaration；本实验没有测试向已有 preset 做局部 patch。pnpm 报告 fixture package 安装成功；CLI 返回 package-manager 结果，不返回 `ChangeResult.application`。

## 适用范围

该实验验证 Web 模板初始化、安装声明了 `dsh.bundle.patch` 的 package、bundle append 顺序和 config dump。未构建 Client artifacts 时，source launch 因缺少 `dsh-client-ui-entry-customization/lib/client.js` 停止。执行 `pnpm run build` 后，隔离 profile 启动并输出 tokenized `dsh web:` URL；请求该 URL 返回 HTTP 303，附带响应 cookie 跟随重定向后返回 HTTP 200 `text/html`。

HTTP smoke 只证明 listener 和重定向响应，不证明浏览器渲染、Kanban UI 或业务行为。CLI 更新磁盘上的 bundle membership；已经运行的 profile 需重启后才能使用新 composition。
