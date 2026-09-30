# profile 创建与保留名

## 一句话

profile 目录不是手写的：五个 shipped 名首次使用自动建，自定义名走 `--from-default-profile <模板>`（复制模板的 bundle 列表，独占抢占目录，不记继承）或 `dsh plugin --profile <name> add <pkg>`（初始化成 base-backed 再装包）。`desktop` 是第三种身份——被保留、由 Electron 独占，CLI 一律拒绝。

## 三条创建路径

| 路径 | 谁触发 | 初始 bundles |
|------|--------|--------------|
| 自动初始化 | 任何 `loadProfile` 首次打开 shipped 名 | `PROFILE_TEMPLATES[name].bundles` |
| `--from-default-profile <模板>` | launcher 父选项（boot 与 dump 都认） | 复制 `<模板>` 的 bundles |
| `dsh plugin --profile <name> …` | 缺 `package.json` 时先初始化 | shipped 名取模板，否则 `DEFAULT_PROFILE_BUNDLES`（只 `@deepseek-ai/dsh-base`） |

三条路径最终都落到 `initProfile`（`packages/boot/app-boot/src/profile.ts:244-263`）：写 `package.json`（`dsh.profile.bundles`、空 `dependencies`）、空 `cordis.patch.yml`（内容就是模板注释加 `[]`）、hoisted 的 `pnpm-workspace.yaml`。已有文件一律不覆盖。（~~旧表里的 `patchReload` 列~~——0.1.7 线该字段连同 `DEFAULT_PROFILE_PATCH_RELOAD` 一起删除：manifest 只剩 bundle 列表，patch 重载改由 `hmr` 插件按 `profileContext` 门控承担，见 [`03-user-patch-hmr.md`](./03-user-patch-hmr.md)。）

`PROFILE_TEMPLATES` 仍是那五个、内容仍是 bundle-only（`packages/boot/app-boot/src/profile.ts:179-195`）：`acp`、`web`、`headless`、`sdk`、`sdk-minimal`。rc.1 没有增删改名，新增的是从模板**派生**自定义 profile 的选项；另有 `OPTIONAL_BUNDLES`（`:213-218`，voice-input-bundle、agent-team-profile、auto-review、schedule-bundle 四个 shipped-optional 包；后两个为 0009 收编，见 experimental 专题）。

## `--from-default-profile`：复制一次，然后独立

声明在 launcher 父选项上（`apps/cli/src/args.ts:169`），实现在 `initializeProfileFromDefault`（`apps/cli/src/profile-boot.ts:100-155`）：

```sh
dsh --profile rescue --from-default-profile web     # 用 web 模板建 rescue，再 boot 它
dsh --profile rescue --from-default-profile web --dump-config
```

- **模板名必须在 `PROFILE_TEMPLATES` 里**，否则报错并列出全部合法模板（`profile-boot.ts:106-114`）。
- **目标名不能是 shipped 名**（`:115-121`）——想要 shipped 组合就直接用它，不必派生。
- **目录独占抢占**：先 `mkdirSync(dirname(dir), { recursive: true })`，再 `mkdirSync(dir)`；对 `EEXIST` 分两种诊断——目录里已有 `package.json` 报「profile 已存在」，否则报「目录残留，换个名字」（`:122-139`）。两种都不修改现场。
- **只复制 bundles**，然后调 `initProfile(dir, template.bundles)` 写出空依赖与空用户 patch（`:139`）。不读同名 shipped profile 的本地状态，也不写任何继承字段；模板列表之后再变也不会回写已建 profile。
- **失败回滚**：`initProfile` 抛错时 `rmSync` 掉刚建的目录（`:142-152`）；若回滚本身也失败，抛 `AggregateError` 说明目录没删干净。
- **初始化先于 bundle 解析与 boot 提交**：所以后续 boot 失败时 profile 留在盘上，重试时省掉该选项。

挂接点：`prepareProfile(name, userLayer, fromDefaultProfile)`（`apps/cli/src/profile-boot.ts:167`）在两处调用——boot 经 `composeProfile` 路径（`:203`，选项从 `runProfile` 的 `fromDefaultProfile` 透传），dump 经 `runDumpConfig(... fromDefaultProfile)`（`apps/cli/src/dump-config.ts:38`，先建 profile 再按同一层列表打印）。它只改变「哪个 profile 被创建」，不改变层列表，所以 [`02-dump-与boot-保真.md`](./02-dump-与boot-保真.md) 的保真结论不动。

## 与 `dsh plugin` 初始化路径的分工

`dsh plugin --profile <name> <pnpm args>` 是另一条路（`apps/cli/src/plugin.ts`）：缺 `package.json` 时先用 shipped 模板或 `DEFAULT_PROFILE_BUNDLES` 初始化，然后 `pnpm` 在 profile 目录里跑，最后把 `dsh.profile.bundles` 按**已安装状态**（不是依赖 diff）对账——新出现的 `dsh.bundle` 声明加入层栈，消失的移出。

两者的分工是「谁负责内容」：

- `--from-default-profile` 复制的是一份**完整组合的起点**（例如 web 的 base + web-app 两行 bundle），但不装任何插件包；适合「我要一个像 web 的自定义 profile，然后往上叠 `--patch`」。
- `dsh plugin` 初始化的是**空壳**（非 shipped 名只有 base 一行），内容全靠 `pnpm add` 装上来的插件贡献自己的 patch 层；适合「我要往 profile 里装第三方 bundle」。

只有 `--from-default-profile` 拒绝 shipped 目标名（`initializeProfileFromDefault` 在 `apps/cli/src/profile-boot.ts:115-121` 抛错）。`dsh plugin` 不拒绝：对 shipped 名它用同名模板初始化，对其它名字用 `DEFAULT_PROFILE_BUNDLES`。

## `desktop` 保留名

`desktop` **不是** `PROFILE_TEMPLATES` 成员，也不是能被 CLI 启动的 launcher profile。它是一个被保留的 profile 目录名，由 Electron 应用独占（`apps/desktop/src/paths.ts` 的 `paths.profile`，`$DSH_HOME/profiles/desktop`）。

`rejectElectronProfile`（`apps/cli/src/args.ts:83-87`）大小写不敏感地把任何 `desktop` 变体判为 Electron 专属并 `program.error`，两个调用点覆盖 CLI 的全部入口：

- 根命令 action（`apps/cli/src/args.ts:183`）——同时覆盖 boot 与 `--dump-config` / `--dump-default-config` / `--dump-config-schema`。
- `plugin` 子命令（`apps/cli/src/args.ts:194`）——CLI 不能 `pnpm add` 进这个 profile。

装载路径也不一样：desktop 不走 `loadProfile` 的 Harness home 发现与 shipped 归一化，而是走 `loadProfileDirectory` + 共享的 `runProfile`（[`../runtime-profiles/06-desktop.md`](../runtime-profiles/06-desktop.md)；0.1.7 线起 desktop-host 经 `runProfile` 起完整 web 应用）。`--from-default-profile` 与它无关——它只认五个 shipped 模板名；`initializeProfileFromDefault` 对 `desktop` 目标名报「shipped and cannot be a custom profile target」同款错误语义，CLI 入口则更早被 `rejectElectronProfile` 拦下。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES`、`initProfile`、`loadProfile`、`loadProfileDirectory`、`normalizeShippedProfile`、`OPTIONAL_BUNDLES` |
| `apps/cli/src/profile-boot.ts` | `initializeProfileFromDefault`、`prepareProfile`、`composeProfile`、`runProfile` |
| `apps/cli/src/args.ts` | `--from-default-profile` 声明、`rejectElectronProfile`、positional 直通 |
| `apps/cli/src/plugin.ts` | `dsh plugin` 的初始化与 `dsh.profile.bundles` 对账 |
| `apps/cli/src/dump-config.ts` | dump 路径上的同一 `fromDefaultProfile` |
| `apps/cli/reference/README.md` | 命令级合同（profile 模式、`--from-default-profile`、`plugin` 模式各一段） |

依据 note（均在 `implemented/`）：[`2026-08-05-profile-plugin-bundles`](../../.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.md)、[`2026-08-22-single-dsh-application-launcher`](../../.agents/notes/implemented/architecture/2026-08-22-single-dsh-application-launcher.md)、[`2026-08-25-electron-desktop-packaging-and-updates`](../../.agents/notes/implemented/architecture/2026-08-25-electron-desktop-packaging-and-updates.md)。

## launcher 的父选项归属

launcher 参数在 0.1.7 线改为 **positional 直通**：解析器把首个非 flag、非 `plugin` 的 positional 展开成 `['--profile', ...argv]`（`apps/cli/src/args.ts:201-206`），旧 `rejectParentOptions` / `allowUnknownOption` 机制已不存在。因此 `dsh web --from-default-profile x` 现在被**接受**为 launcher 选项（与直通前 `apps/cli/tests/args.spec.ts` 钉过的 pass-through 语义相反方向），而 `dsh --from-default-profile x web` 在解析期报 `--profile <name> is required`（flag 出现在 positional 展开之前、没有显式 `--profile` 可绑定）。两种拼写的效果差异以 `parseDshArgs` 的实际展开为准，写脚本时显式用 `--profile <name> --from-default-profile <模板>` 最稳。
