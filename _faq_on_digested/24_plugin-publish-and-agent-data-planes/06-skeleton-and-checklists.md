# 06 · 骨架、检查表与旧写法迁移

## 一句话

一个专家插件的 repo 不需要很复杂：一个包、一份 patch、一组只读资产、一份 README。复杂的是**边界**——哪些行放 Host，哪些行放 preset，哪些东西根本不该进包。这一篇给一个可直接照抄的骨架，和四张发布前检查表。

## 1. 包粒度：先一个包，别先拆

“合理”的插件包不是越大越完整，而是边界清楚：

- **一个能力一个包。** 一个工具、一个 provider、一个专家 pack 各自成包；不要把无关能力塞进同一个 patch。
- **bundle 只是发布容器，不必与代码包一一对应。** 配置型 bundle（MCP、preset-only、skill-provider）可以没有 `main`、没有 `./` export，只靠 patch 行引用别的包。
- **只在角色独立演化时拆包。** 第二个消费者出现、需要独立版本节奏、Host 与 Client 生命周期不同——这些才是拆的理由；否则单包起步。
- **不要新造可执行入口。** 插件挂在现有 profile 上；Desktop / CLI / Web 才是应用发布物（FAQ 23）。
- **不要把数据或用户配置打进包。** 包只发代码与只读资产；数据在 workspace / home / session。

## 2. 参考骨架

```text
acme-dsh-expert/
├── package.json
├── cordis.patch.yml            # Host 行 + preset 声明
├── presets/
│   └── expert.patch.yml        # 可选：把 preset 声明拆成单独一层
├── src/
│   ├── index.ts                # Host 行：共享服务 / 策略
│   ├── tool.ts                 # 预设行挂载的模型工具
│   ├── skill.ts                # 可选：注册包内 bundled skill
│   └── client.tsx              # 可选：Web UI
├── assets/
│   └── skills/
│       └── acme-expert/
│           ├── SKILL.md
│           └── references/
│               └── checklist.md
├── locale/
│   ├── en.json                 # meta.title / meta.description
│   └── zh.json
├── icon.svg
├── README.md
├── LICENSE
└── tests/
    └── composition.spec.ts     # 真实 bundle 安装形状的测试
```

不必要的东西：`agent.cordis.yml`、`$DSH_HOME/.agent-presets/`、手写的 profile manifest（用 `dsh plugin` 维护 `package.json` 的 `dsh.profile`）、`dsh.compatibility` 矩阵、`vendor/dsh`（除非你要在 repo 内探索 DSH 源码，见 FAQ 13）。

## 3. 一份完整的 `package.json`

```json
{
  "name": "@acme/dsh-expert-pack",
  "version": "1.0.0",
  "description": "An expert review agent: review tools, checklist skill, and a Web card.",
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "exports": {
    ".": { "types": "./lib/index.d.ts", "default": "./lib/index.js" },
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./presets/expert.patch.yml": "./presets/expert.patch.yml",
    "./client": { "types": "./lib/client.d.ts", "default": "./lib/client.js" },
    "./tool": { "types": "./lib/tool.d.ts", "default": "./lib/tool.js" },
    "./skill": { "types": "./lib/skill.d.ts", "default": "./lib/skill.js" },
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
    "./package.json": "./package.json"
  },
  "files": [
    "lib/index.js",
    "lib/index.d.ts",
    "lib/client.js",
    "lib/client.d.ts",
    "lib/tool.js",
    "lib/tool.d.ts",
    "lib/skill.js",
    "lib/skill.d.ts",
    "cordis.patch.yml",
    "presets/expert.patch.yml",
    "assets/skills/**",
    "locale/*.json",
    "icon.svg"
  ],
  "dsh": {
    "manifestVersion": 1,
    "bundle": {
      "patch": ["./cordis.patch.yml", "./presets/expert.patch.yml"]
    },
    "client": {
      "platform": "web",
      "inject": ["@deepseek-ai/dsh-client-ui-conversation"]
    }
  },
  "engines": { "dsh": ">=0.2.0 <0.3.0", "node": ">=22.19" },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^0.2.0",
    "@deepseek-ai/dsh-tools": "^0.2.0",
    "@deepseek-ai/dsh-agent-preset": "^0.2.0",
    "@deepseek-ai/dsh-skill": "^0.2.0"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "^0.2.0",
    "@deepseek-ai/dsh-tools": "^0.2.0",
    "@deepseek-ai/dsh-agent-preset": "^0.2.0",
    "@deepseek-ai/dsh-skill": "^0.2.0"
  },
  "repository": { "type": "git", "url": "git+https://github.com/acme/dsh-expert-pack.git" },
  "license": "MIT",
  "publishConfig": { "access": "public" }
}
```

要点：

- `dsh.bundle.patch` 是数组时按顺序当一层；每个文件里的插件行 `name` 都可以是包名或子路径。
- `dsh.client` 只是声明；真正加载要求 Host 行把包挂上（见下一节 patch）。
- `engines.dsh` 与 peer 二选一优先；两个都写时 `engines.dsh` 决定一切。共享实例的 DSH 包仍要 peer + dev 双写。
- `files` 必须包含 `assets/skills/**`，否则技能不会进 tarball。
- **包内 `assets/skills` 不会自动被发现。** 要么加一个 provider 行（下面的 `./skill`）用 `import.meta.url` 注册，要么给 `skill-filesystem` 配 `bundledSkillDir` 指向已安装包的绝对路径；前者可移植，推荐。

```ts
// src/skill.ts：把包内技能注册成 bundled 候选（省略错误处理）
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import { BUNDLED_SKILL_RANK, type SkillCandidate, type SkillProvider } from '@deepseek-ai/dsh-skill'

const locator = new URL('../assets/skills/acme-expert/SKILL.md', import.meta.url)
const resourceBase = {
  kind: 'directory',
  path: fileURLToPath(new URL('../assets/skills/acme-expert/', import.meta.url)),
} as const
const candidate: SkillCandidate = {
  name: 'acme-expert',
  description: 'Review checklist for the Acme review workflow.',
  provider: 'acme-expert',
  source: 'bundled',
  rank: BUNDLED_SKILL_RANK,
  locator,
  resourceBase,
  invocation: { modelInvocable: true, userInvocable: true },
}

export const inject = ['skills']
const provider: SkillProvider = {
  name: 'acme-expert',
  list: async () => [candidate],
  get: async () => ({ ...candidate, content: await readFile(locator, 'utf8') }),
}
export function apply(ctx: Context): void {
  ctx.skills.registerProvider(() => provider)
}
```

## 4. patch 怎么写

```yaml
# cordis.patch.yml
- insert:
    - id: acme-review
      name: '@acme/dsh-expert-pack'
    - id: acme-skill
      name: '@acme/dsh-expert-pack/skill'
```

根行提供共享服务与 `dsh.client` 声明；`acme-skill` 注册包内 bundled skill；模型可调用的工具放在 `./tool` 子路径，只由 preset 行挂载，所以它只出现在选中该 preset 的会话里。这样同一个包既有 Host 行，又有按 agent 定制的工具行，不重复挂载根插件。

```yaml
# presets/expert.patch.yml
- insert:
    - id: preset-expert
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: expert
        name: Expert Review
        description: Reviews changes with the review tools and checklist skill.
        order: 20
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config:
              prefix: You are a senior reviewer. Review changes against the checklist skill.
          - id: tool-fs
            name: '@deepseek-ai/dsh-tool-fs'
          - id: skill-filesystem
            name: '@deepseek-ai/dsh-skill-filesystem'
          - id: tool-skill
            name: '@deepseek-ai/dsh-tool-skill'
          - id: acme-review-tool
            name: '@acme/dsh-expert-pack/tool'
```

这些 preset 子插件的前提是 Host 层已经挂了 `@deepseek-ai/dsh-skill` 注册表（`dsh-base` 默认有）；preset 只负责“这个 agent 从哪些本地根发现技能、以及是否给它 skill 工具”。还要注意：这个例子按 **web profile** 写，`dsh-web-app` 会禁用 base 的 Host 工具行，所以 preset 再挂这些行不会重复；在非 web 的 base-backed profile 上，先确认 Host 行是否仍激活，否则同一个工具/技能提供者会挂两份。

三条纪律：

1. **行 id 稳定。** 用户会按 id 覆盖；改名等于破坏配置。
2. **覆盖重述完整 config。** 你的 patch 覆盖别层时，要写全想保留的字段；用户覆盖你的 preset 时也一样。
3. **preset 只放按 agent 定制的东西。** 共享服务、持久化、沙箱策略留在 Host 行；需要 `isolate` 的提供者与消费者放同一个 `cordis:group`。

## 5. README 模板

```markdown
# @acme/dsh-expert-pack

One sentence: what capability this bundle contributes.

## Install
dsh plugin --profile web add @acme/dsh-expert-pack@1.0.0

## What it contributes
- Host row `acme-review`: the shared review service and the `dsh.client` declaration.
- Host row `acme-skill`: registers the bundled `acme-expert` skill.
- Preset `expert` + child row `acme-review-tool`: the model-callable review tool.
- Client module: the review card under the composer.

## Configuration
| Field | Default | Meaning |
|---|---|---|
| maxFiles | 50 | ... |

## Data
- Reads: the session working directory through ctx.fs.
- Writes: none outside the workspace.
- Cross-session state: storage domain `acme.review`, version 1.

## Compatibility
- engines.dsh: >=0.2.0 <0.3.0
- Tested against: 0.2.1-rc.3

## Uninstall
Removes the rows and preset. Storage domain data remains under $DSH_HOME/storages.
```

## 6. 发布前检查表

### A · 包与 manifest

- [ ] `dsh.bundle.patch` 指向真实文件，YAML 能解析。
- [ ] 每个 `name` 都能从安装位置解析（包根或子路径）。
- [ ] `exports` 覆盖入口、`./client`、locale、icon；patch 由启动器直接读取，不依赖 `exports`。
- [ ] `files` 覆盖运行所需全部文件（含 `assets/**`）。
- [ ] npm 发布带构建产物；Git 安装有自包含 `prepare`。
- [ ] `engines.dsh` 或全部 DSH peer 范围与目标版本匹配。
- [ ] 共享 DSH 包写进 peer + dev，不只在 dependencies。
- [ ] `pnpm pack` 后检查文件列表；不依赖 link 的宽松行为。

### B · 行与配置

- [ ] 入口只导出一种形式；没有 default + named 混用。
- [ ] 每个注册都有 disposer；卸载后无残留。
- [ ] 可调值全部进 `Config`，没有硬编码常量。
- [ ] 行 id 稳定；覆盖行为写进 README。
- [ ] preset 的 `plugins` 是完整列表；覆盖时重述全部字段。
- [ ] 需要 `isolate` 的服务提供者与消费者同组。

### C · 说明与可发现性

- [ ] `package.json.description` 是一句“贡献什么”。
- [ ] `locale/en.json` 与 `locale/zh.json` 有真实 `meta.title` / `meta.description`。
- [ ] 图标 ≤256 KiB、SVG/PNG/JPEG/WebP、留在包内。
- [ ] README 有 Install / What it contributes / Configuration / Data / Compatibility / Uninstall。
- [ ] `repository`、`license`、`publishConfig.access` 正确。
- [ ] 若进市场：index 的 title/description/icon/homepage/repository 与包一致。

### D · 数据与安全

- [ ] 没有把用户数据写进包目录或 `import.meta.url` 旁边。
- [ ] 没有模块级可变状态；跨会话状态用 storage domain；会话内派生视图用投影。
- [ ] 模型可见的状态能从会话日志重建。
- [ ] 没有新增自定义 session event 类型，也没有依赖 `plugin:` 记录；状态用已有事件/派生投影/`agent.inject()`/storage。
- [ ] 路径用 `resolveDshHome` / `resolveAgentsHome` / `ctx.workingDirectory.get(session)`。
- [ ] 没有把 `$DSH_HOME/plugins/<id>` 当核心数据根；自造目录写清路径、清理、迁移。
- [ ] 附件/spill/导出有保留说明；不把附件库当项目文件库。
- [ ] settings 只对当前 profile 生效；跨 profile 共享的偏好走 home 域。
- [ ] secret 走凭据服务；patch / locale / README 没有明文。
- [ ] 工作区文件访问走 `ctx.fs`，没有用宿主 `node:fs` 绕过沙箱。
- [ ] README 写清读写哪些数据、属于 workspace 还是 home、升级是否保留。

## 7. 安装验收：用“真实安装形状”

源码直跑会掩盖依赖与 `files` 错误。最小验收流程：

```sh
# 1. 打包
pnpm pack

# 2. 用干净 home 起一个临时 web profile（不污染现有数据）
VERIFY_HOME=$(mktemp -d)
DSH_HOME="$VERIFY_HOME" dsh plugin --profile web add ./acme-dsh-expert-pack-1.0.0.tgz

# 3. 看层是否真的进来了
DSH_HOME="$VERIFY_HOME" dsh --profile web --dump-config | grep acme

# 4. 启动并验证能力（新会话，不要复用旧会话）
DSH_HOME="$VERIFY_HOME" dsh web
```

Agent 环境里不要手写 profile 的 `package.json` / `cordis.patch.yml`，也不要在 profile 目录跑 pnpm；用 `plugin_manager` 的 `install_bundle` / `list_bundles` / `list_plugins`，它会处理安装、选择、写入锁与结果解释。注意 `plugin_manager` 在 Creator 模式默认启用、其他 preset 默认关闭，且每个动作需要 `danger-full-access` 或逐次审批；标准 agent 走 CLI 的 `dsh plugin` 路径。`install_bundle` 一次只接受一个目标。

验收时分开看三件事：

- `application` ∈ `applied | restart-required | overridden | failed | cancelled`，不是“成功/失败”二元；
- `warnings` 有没有版本、元数据、激活诊断；
- 新会话里能力是否真的可用（工具能调用、UI 能出现、preset 能被选中）。

## 8. 升级与跟进

DSH 的公开 API 仍是 pre-stable。插件作者的最小跟进纪律：

1. **用范围，不钉死。** `>=0.2.0 <0.3.0` 比 `=0.2.1-rc.3` 更能承受 RC 迭代；只在确实依赖具体行为时收窄。这是作者建议，不是产品规则：官方安装器对官方按需包使用 `saveExact`，那是安装策略。
2. **每次上游升级跑一遍真实安装形状。** 先 `pnpm pack`，再干净 profile 安装，再新会话验证。
3. **把行 id、preset id、Config 字段当 API。** 改名前先想用户覆盖。
4. **破坏性变更升 minor/major，并写迁移说明。** 预稳定期可以快，但不能静默。
5. **不要在包里 vendored 一份 DSH 源码来“稳定 API”。** 那会让你的包与宿主的服务实例、peer 解析、沙箱策略脱节；要探索源码用 pinned submodule，发布仍依赖宿主。

## 9. 旧写法迁移

### 9.1 `agent.cordis.yml` 预设目录

旧写法：`$DSH_HOME/.agent-presets/<id>/` 下放 `preset.yml`（展示字段）与 `agent.cordis.yml`（插件列表）。**现在没有读取方。** 出厂 preset 自 0.1.7 线起迁到 `packages/bundle/web-app/presets/*.patch.yml`；用户自定义 preset 也必须变成 bundle patch。

迁移步骤：

1. 建一个 bundle 目录，`package.json` 声明 `dsh.bundle.patch`；
2. `cordis.patch.yml` 插入一行 `@deepseek-ai/dsh-agent-preset`；
3. `config.id` 取原目录名，`name` / `description` / `order` 取 `preset.yml`，`plugins` 取 `agent.cordis.yml` 的条目列表（原样搬，再逐个核对包名）；
4. 用 `plugin_manager` 安装，确认 `preset-<id>` 行存在且能绑定新会话；
5. 删除旧目录。

容易漏的：旧插件名可能已经改名或删除，搬过来会在激活时报缺模块；`!!js` 只应保留在配置或 `disabled`；资产要从安装包解析，不要从旧预设目录解析。

### 9.2 `dsh.compatibility`

某些第三方插件曾用 `dsh.compatibility` 写版本矩阵。**DSH 不读这个字段。** 安装器与启动器只读 `engines.dsh`，没有它时回退到 `@deepseek-ai/dsh*` peer 范围。把矩阵改成：

```json
{ "engines": { "dsh": ">=0.2.0 <0.3.0" } }
```

如果你确实要表达“多个 DSH 大版本”，用一条范围或发多个包版本，不要发明新字段。

### 9.3 其他已退役写法

| 旧写法 | 现状 | 替代 |
|---|---|---|
| `$DSH_HOME/.agent-presets/` | 不读 | bundle patch 的 preset 行 |
| `agent.cordis.yml` | 不读 | `@deepseek-ai/dsh-agent-preset` 的 `config.plugins` |
| `dsh.compatibility` | 不读 | `engines.dsh` |
| `modeSelectionEnabled` | registry 不声明、不读不写 | 删除；默认 preset 用 registry 的 `default` + 用户 `selectedDefault` |
| 手写 profile manifest | 不推荐 | `dsh plugin` / `plugin_manager` |
| 精确钉死 DSH 版本 | 每次 RC 都逼发版 | 宽 minor、窄 major 的范围 |

## 10. 一页总结

- **发布物**：一个 bundle（包 + patch + 资源）。
- **智能体**：bundle 里的一行 preset + 它引用的子插件与只读资产。
- **数据**：workspace / home / session 三种归属，全部在包外。
- **说明**：`package.json.description` + `locale/*.json` + README 的 Install / What it contributes / Configuration / Data / Compatibility / Uninstall 六节。
- **版本**：`engines.dsh`（或 peer 回退）+ SemVer + 真实安装验收。
- **边界**：包只发代码与只读定义；数据经服务访问；secret 走凭据；沙箱不替模型绕过。

把这张纸贴在 repo 的 `AGENTS.md` 里，下一个接手的人（或 agent）就不需要重新推导一遍。

## 11. 证据与下一步

- 发布与安装：[publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/user/develop/basic/publish.md)
- 作者契约：[host-plugin.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md)、[ui-plugin.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset/skills/cordis-plugin-development/references/ui-plugin.md)、[mcp-bundle.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset/skills/cordis-plugin-development/references/mcp-bundle.md)
- manifest 类型：[package-manifest types.ts](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/util/package-manifest/src/types.ts)
- 管理与兼容：[plugin-manager README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/boot/plugin-manager/README.md)
- 扩展点地图：[extension-cookbook.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/cookbook/extension-cookbook.md)、[adding-a-tool.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/cookbook/adding-a-tool.md)
- 相邻问题：[FAQ 13 的 repo 组织](https://github.com/ethan-jiang-1/deepseek-harness/blob/ethan/_faq_on_digested/13_expert-plugin-repo-organization/answer.md)、[FAQ 17 的找轮子](https://github.com/ethan-jiang-1/deepseek-harness/blob/ethan/_faq_on_digested/17_finding-existing-plugins/answer.md)、[FAQ 23 的安装途径](https://github.com/ethan-jiang-1/deepseek-harness/blob/ethan/_faq_on_digested/23_standalone-vs-web-release-forms/04_plugin-paths.md)
