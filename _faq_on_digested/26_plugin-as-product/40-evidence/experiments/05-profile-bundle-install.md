# 实验 05 · Web template 与本地 bundle 追加

**状态**：已执行。等级 **T**；范围仅限 profile composition。

## Fixture

[profile-bundle](../fixtures/profile-bundle/package.json) 是一个本地 bundle package。它声明 `dsh.bundle.patch` 并插入已有的 `@deepseek-ai/dsh-time-context` row；不包含产品 runtime code。

## 命令

在仓库根执行：

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
  grep -n -E "@deepseek-ai/dsh-web-app|faq26-proof-row|@example/faq26-product-bundle"
```

## Observed result

The isolated profile initialized from `web` and listed bundles in this order:

```json
["@deepseek-ai/dsh-base","@deepseek-ai/dsh-web-app","@example/faq26-product-bundle"]
```

The composed dump contained `@deepseek-ai/dsh-web-app` rows and `faq26-proof-row`. pnpm reported the fixture package installed successfully. The CLI returned package-manager success; it did not return `ChangeResult.application`.

## What this proves

The probe checks shipped Web template initialization, CLI installation of a package that declares `dsh.bundle.patch`, append order, and config-dump composition. Before building Client artifacts, source launch stopped because `dsh-client-ui-entry-customization/lib/client.js` was missing. After `pnpm run build`, an isolated source launch printed a tokenized `dsh web:` URL; the URL returned HTTP 303, and following its redirect with the response cookie returned HTTP 200 `text/html`. This smoke test does not validate browser rendering, product UI, or Kanban business behavior. CLI bundle membership updates the profile on disk; an already-running profile must be restarted to use the new composition.
