# 04 · 最小可发布插件实战骨架、真实验收与检查单

本篇给出一套可以直接照抄起步的单包 Bundle 骨架（同时包含共享 Host 服务、随包只读技能、专属智能体 Preset 与可选前端卡片），附上发布前必跑的干净环境 `.tgz` 验收脚本、旧写法迁移对照和四张核对清单。

---

## 一、推荐包粒度与目录骨架

起步原则很简单：**一个独立能力打成一个 Bundle 包**，只有在提供方与消费方演进节奏真正分开时再拆多包（仓库组织详见 [FAQ 13](../13_expert-plugin-repo-organization/answer.md)）。

```text
acme-dsh-expert-pack/
├── package.json
├── cordis.patch.yml            # Host 根行：共享服务 + 随包技能注册 + 前端包挂载点
├── presets/
│   └── expert.patch.yml        # Preset 行：面向会话的可选专家智能体定义
├── src/
│   ├── index.ts                # Host 根插件入口（具名导出 apply / Config）
│   ├── tool.ts                 # 仅挂在 preset 子树下的专属模型工具
│   ├── skill.ts                # 用 import.meta.url 注册包内 bundled 技能
│   └── client.tsx              # 可选：Web 前端扩展入口
├── assets/
│   └── skills/
│       └── acme-checklist/
│           ├── SKILL.md
│           └── references/
│               └── rules.md
├── locale/
│   ├── en.json                 # { "meta": { "title": "...", "description": "..." } }
│   └── zh.json
├── icon.svg                    # ≤ 256 KiB，留在包目录内
├── README.md
└── LICENSE
```

### 1. `package.json`（完整可发布模板）

```json
{
  "name": "@acme/dsh-expert-pack",
  "version": "1.0.0",
  "description": "Contributes the Acme review preset, checklist skill, and review summary card.",
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "exports": {
    ".": { "types": "./lib/index.d.ts", "default": "./lib/index.js" },
    "./tool": { "types": "./lib/tool.d.ts", "default": "./lib/tool.js" },
    "./skill": { "types": "./lib/skill.d.ts", "default": "./lib/skill.js" },
    "./client": { "types": "./lib/client.d.ts", "default": "./lib/client.js" },
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./presets/expert.patch.yml": "./presets/expert.patch.yml",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
    "./package.json": "./package.json"
  },
  "files": [
    "lib",
    "cordis.patch.yml",
    "presets/expert.patch.yml",
    "assets/skills",
    "locale",
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
  "engines": {
    "dsh": ">=0.2.0 <0.3.0",
    "node": ">=22.19"
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^0.2.0",
    "@deepseek-ai/dsh-agent-preset": "^0.2.0",
    "@deepseek-ai/dsh-persona": "^0.2.0",
    "@deepseek-ai/dsh-skill": "^0.2.0",
    "@deepseek-ai/dsh-skill-filesystem": "^0.2.0",
    "@deepseek-ai/dsh-tool-fs": "^0.2.0",
    "@deepseek-ai/dsh-tool-skill": "^0.2.0",
    "@deepseek-ai/dsh-tools": "^0.2.0"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "^0.2.0",
    "@deepseek-ai/dsh-agent-preset": "^0.2.0",
    "@deepseek-ai/dsh-persona": "^0.2.0",
    "@deepseek-ai/dsh-skill": "^0.2.0",
    "@deepseek-ai/dsh-skill-filesystem": "^0.2.0",
    "@deepseek-ai/dsh-tool-fs": "^0.2.0",
    "@deepseek-ai/dsh-tool-skill": "^0.2.0",
    "@deepseek-ai/dsh-tools": "^0.2.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acme/dsh-expert-pack.git"
  },
  "license": "MIT",
  "publishConfig": { "access": "public" }
}
```

> **依赖声明细节**：如果你的 patch 里还引用了某个目标 Profile 未必自带的第三方或可选包，需要把它放进 Bundle 的 `dependencies` 以便从 Bundle 安装位置解析；而需要与宿主共享单例/类型的核心与服务定义包，则保持 `peerDependencies` + `devDependencies` 双写。

### 2. 两份 Patch 文件（Host 共享行 + Preset 智能体行分离）

```yaml
# cordis.patch.yml —— 挂在 Host 根上，提供共享能力并让前端扫描器识别 dsh.client
- insert:
    - id: acme-expert-host
      name: '@acme/dsh-expert-pack'
    - id: acme-expert-skill
      name: '@acme/dsh-expert-pack/skill'
```

```yaml
# presets/expert.patch.yml —— 插入完整 preset 行，专属工具只对选中它的会话可见
- insert:
    - id: preset-acme-expert
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: acme-expert
        name: Acme Expert Reviewer
        description: Reviews workspace changes against the bundled Acme checklist.
        order: 20
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config:
              prefix: You are an Acme code reviewer. Load the acme-checklist skill before auditing files.
          - id: tool-fs
            name: '@deepseek-ai/dsh-tool-fs'
          - id: skill-filesystem
            name: '@deepseek-ai/dsh-skill-filesystem'
          - id: tool-skill
            name: '@deepseek-ai/dsh-tool-skill'
          - id: acme-review-tool
            name: '@acme/dsh-expert-pack/tool'
```

### 3. `src/skill.ts`（可移植的随包技能注册模板）

```ts
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import { BUNDLED_SKILL_RANK, type SkillCandidate, type SkillProvider } from '@deepseek-ai/dsh-skill'

const locator = new URL('../assets/skills/acme-checklist/SKILL.md', import.meta.url)
const resourceBase = {
  kind: 'directory',
  path: fileURLToPath(new URL('../assets/skills/acme-checklist/', import.meta.url)),
} as const

const candidate: SkillCandidate = {
  name: 'acme-checklist',
  description: 'Structured review checklist for Acme repositories.',
  provider: 'acme-expert-pack',
  source: 'bundled',
  rank: BUNDLED_SKILL_RANK,
  locator,
  resourceBase,
  invocation: { modelInvocable: true, userInvocable: true },
}

export const name = 'acme-expert-skill'
export const inject = ['skills']

export function apply(ctx: Context): void {
  const provider: SkillProvider = {
    name: 'acme-expert-pack',
    list: async () => [candidate],
    get: async () => ({ ...candidate, content: await readFile(locator, 'utf8') }),
  }
  ctx.skills.registerProvider(() => provider)
}
```

---

## 二、发版前必跑：干净 `DSH_HOME` 下的真实 `.tgz` 验收

不要只靠源码树或 `link:` 测试就点 `npm publish`。花两分钟跑完下面四步，能提前抓出 90% 的 `files` 漏项、子路径导出缺失和 patch 拼写错误：

```sh
# 1. 构建并打出真实 tarball，肉眼核对包内文件清单
pnpm run build && pnpm pack
tar -tf acme-dsh-expert-pack-1.0.0.tgz

# 2. 创建一次性干净 DSH_HOME，零污染模拟真实用户安装
VERIFY_HOME="$(mktemp -d)"
DSH_HOME="$VERIFY_HOME" dsh plugin --profile web add ./acme-dsh-expert-pack-1.0.0.tgz

# 3. 导出合成后的 Loader 配置，确认 Host 行与 preset 行均已进入配置树且无 skippedBundles
DSH_HOME="$VERIFY_HOME" dsh --profile web --dump-config | grep -E "acme-expert|preset-acme-expert"

# 4. 真正拉起服务，新建一个选中 acme-expert 的会话，验证工具调用、技能读取与前端卡片
DSH_HOME="$VERIFY_HOME" dsh web --no-open
```

若在 Creator 会话里通过 `plugin_manager` 的 `install_bundle` 验证，请同时检查返回结构里的两项：
- `application` 状态（区分 `applied`、`restart-required`、`overridden` 与 `failed`，不是非黑即白）；
- `warnings` 数组是否带有元数据回退、兼容豁免或行级激活告警。

---

## 三、旧写法与常见外部误传迁移表

如果你手头维护着早期原型或参考过外部社区仓库，遇到下表左侧写法请直接替换为右侧现行方案：

| 已失效或不推荐的写法 | 当前真实状态 | 正确替代方案 |
|---|---|---|
| `$DSH_HOME/.agent-presets/<id>/agent.cordis.yml` + `preset.yml` | **无任何读取方**（自 0.1.7 线起已迁出） | 改为 Bundle patch 里插入 `@deepseek-ai/dsh-agent-preset` 行，`plugins` 填原插件数组 |
| `package.json` 里的 `dsh.compatibility` | **非 DSH 字段，源码不读** | 改为顶层 `"engines": { "dsh": ">=0.2.0 <0.3.0" }` |
| Preset 里的 `modeSelectionEnabled` | **Registry 不声明也不读取** | 直接删除；默认预设由 `agent-preset-registry` 的 `default` 与用户 `selectedDefault` 决定 |
| 手工编辑 `$DSH_HOME/profiles/web/package.json` | 易破坏 `bundles` 顺序锁与依赖一致性 | 统一走 `dsh plugin --profile <name> add/remove` 或 `plugin_manager` |
| `engines.dsh` 写死单个 RC 号（如 `=0.2.1-rc.1`） | 上游每发一个 RC 用户就装不上 | 使用覆盖当前 minor 的区间（如 `>=0.2.0 <0.3.0`），只在真发生破坏性接口变更时收窄 |
| 把 DSH 源码 vendored 进插件发布包 | 破坏 Cordis 服务单例、沙箱策略与 peer 解析 | 本地读码可用 git submodule（不进 `files`），发布包始终通过 `peerDependencies` 对接宿主 |

---

## 四、发布前四维核对清单

### 1. 清单与打包自包含
- [ ] `package.json` 含 `"type": "module"`，且 `dsh.bundle.patch` 指向的所有文件真实存在、YAML 可解析。
- [ ] `files` 完整包含构建产物 `lib/`、所有 patch 文件、`assets/skills/**`、`locale/*.json` 与图标，`pnpm pack` 解包核对无遗漏。
- [ ] `exports` 覆盖主入口、子插件入口（如 `./tool`、`./skill`）、`./client`（若声明了 `dsh.client`）、`./locale/*.json` 与 `./icon`。
- [ ] `engines.dsh` 范围合理且不含 `workspace:`；与宿主共享实例的包均已写进 `peerDependencies` + `devDependencies`。
- [ ] 若走 Git 源码分发，`prepare` 脚本能在干净环境独立完成构建，并在文档提示用户需批准 `allowBuilds`。

### 2. 插件行与生命周期
- [ ] 每个插件入口只用单一导出风格（具名 `apply` **或** `export default class`，绝不混用）。
- [ ] 所有工具、命令、事件监听和 `SkillProvider` 注册都绑定在 `ctx.effect()` / `ctx.on()` 上，停用或重载后无残留副作用。
- [ ] 所有部署可调参数均声明在 `Config` schema 中，插件行 `id` 与 preset `id` 保持跨小版本稳定。
- [ ] 若包含 `dsh.client`，已确认至少有一条 Host 根插件行挂载了该包（而非仅出现在 preset 子树中）。

### 3. 数据与安全边界
- [ ] 没有任何代码往包目录（`import.meta.url` 邻近路径）回写运行期状态或缓存。
- [ ] 会话内模型可见输入均满足 `model-visible ⟺ logged`，未私自新增 `SessionEventMap` 持久事件名。
- [ ] 跨会话状态使用 `ctx.storageDomain`（记录键符合 `[a-zA-Z0-9_-]+`），API 密钥使用 `ctx.credentials` 且每次调用动态 `resolve()`。
- [ ] 工作区文件全部通过 `ctx.workingDirectory` + `ctx.fs` 读写，未用裸 `node:fs` 绕过沙箱，也未硬编码 `~/.dsh` 或 `process.cwd()`。

### 4. 元数据与用户说明
- [ ] `locale/en.json` 与 `locale/zh.json` 提供真实的 `meta.title` / `meta.description`；图标 ≤ 256 KiB。
- [ ] `README.md` 清楚写明六件事：**安装命令、贡献了哪些 Host 行 / Preset / UI、可配置项、读写了哪些数据（归属工作区还是 `$DSH_HOME`）、兼容的 DSH 版本范围、卸载后哪些数据会保留**。
