# 04 · DSH 插件仓库的三种标准拓扑、全栈打包与跨端通信工程

## 什么时候该超越“单包 Host 插件”

[`01 · 新建独立 DSH 插件仓`](./01-new-plugin-repository.md) 给出的单包扁平结构足以覆盖 70% 的纯后端扩展场景（新增模型工具、斜杠命令、事件拦截策略或新模型适配器）。但一旦你的插件迈入以下两类需求，继续硬塞在单一 Node `tsconfig.json` 或裸 `tsc` 构建流水线里就会立刻撞墙：

1. **需要向 DSH Web / Desktop 图形界面注入自定义槽位组件、顶栏按钮、对话卡片或交互式面板**——此时同一个包既要给 Node 宿主提供后端能力与远程接口，又要给浏览器第二棵 Cordis 树提供打包为 `window.__ModuleLoader__.load` 格式的 React 视图，两边对 `Context` 的类型声明合并会在单一 TypeScript 编译程序里直接冲突报错；
2. **需要定义一项支持多后端替换的全新基础设施能力**（例如一套统一的向量检索接口，同时提供本地内存版与远端集群版两套实现），消费方绝不能反向耦合某一个重型后端的依赖。

本章给出一张零歧义的 **DSH 插件仓拓扑选型矩阵**，逐一拆解单包 Host、Host + Client 双树全栈包（含外部仓 `tsdown.config.ts` 完整构建配方与 `TypertRemoteService` 五步跨端通信闭环）、Capability Seam 多包 Workspace 三种标准布局，并讲透 DSH 的五层配置叠加、`Volatile<T>` 活设置表单与 `!!js` 动态表达式规则。

![独立 DSH 插件仓的三种标准拓扑与双编译器面边界](./figures/plugin-repo-topologies.svg)

## 一张表选对你的插件仓拓扑

| 拓扑形态 | 适用业务场景 | 交付包数量与编译器面 | 何时绝对不要选它 |
|---|---|---|---|
| **拓扑 A · 单包 Host Bundle** | 纯服务端能力：新增 `defineTool`、斜杠命令、系统提示词片段、事件钩子、LLM 适配器或仅需标准自动设置表单 | 1 个 npm 包；1 个 NodeNext `tsconfig.json` | 需要渲染浏览器 React 槽位或自定义对话节点时 |
| **拓扑 B · Host + Web Client 双树全栈包** | 既有 Node 宿主服务/远程控制器，又向 Web 界面挂载槽位（`ctx.slots`）或自定义详情页 | 仍可保持 **1 个 npm 包**（同时导出 `.`、`./client` 及可选 `./typert`/`./remote`）；拆出 **Host 与 Client 两个独立编译器面** | 只做后端工具、内置通用卡片或自动 `Volatile<T>` 设置表单已够用时 |
| **拓扑 C · Capability Seam 多包 Workspace** | 创造一项新抽象能力（`Service Definition`），并有多个演进节奏或重型依赖彼此独立的 `Provider` | `pnpm-workspace.yaml` 多包仓库（`definition` + `provider-*` + 可选 `bundle`） | 只有唯一一种实现且短期内无替换需求时（拆成空壳三包只会徒增发版与测试摩擦） |

## 1. 拓扑 A：单包 Host Bundle（基准复习与源码导入铁律）

单包 Host Bundle 的完整 `package.json` 与目录树已在 [`01` §1](./01-new-plugin-repository.md) 给出。在此只补充两条编码期必须写入门禁的模块解析细节：

- **全程纯 ESM（`"type": "module"`）且包内相对导入显式写 `.ts` 后缀**：源码中写 `import { helper } from './helper.ts'`，TypeScript 编译产物自动改写运行时 JS 为 `.js` 并保持 `.d.ts` 可被下游 NodeNext 消费方正确解析；跨包引用一律走公开包名，严禁深掏其他包的未导出内部路径。
- **遵循 16 类精确角色后缀命名组件**：管理动态注册与卸载的类叫 `Registry`，管理单数据集快照与订阅的叫 `Store`，只做准入裁决不执行动作的叫 `Policy`，跨进程/网络边界的叫 `Gateway`（完整角色词典见 [卷一第 8 章 §7](../01-general-repo-harness/08-repository-taxonomy.md#7-代码与模块契约防-agent-写腐化的三道防线)）。

## 2. 拓扑 B：Host + Web Client 双树全栈插件包（双编译器面、打包协议与跨端 RPC）

很多开发者误以为“既有后端逻辑又有前端界面，就必须拆成两个 npm 包”。在 DSH 架构下并非如此：**一个全栈功能插件完全可以保持在同一个 npm 包内**——由 `src/index.ts` 编译出 Node 宿主加载的 `lib/index.js`，由 `src/client/index.ts` 打包出浏览器第二棵 Cordis 树加载的 `lib/client.js`，并在 `package.json` 中通过 `dsh.client` 与 `exports["./client"]` 声明客户端面（DSH 主仓的 `@deepseek-ai/dsh-session-log-export` 即采用这一单包双面结构）。

### 2.1 为什么根 `tsconfig.json` 必须做成 `solution-only` 双编译器面隔离

一旦同一个仓库或同一个包里同时出现 Host 代码和 Client 代码，如果用同一份 `tsconfig.json` 把两边一起塞进同一个 `tsc` 编译程序，TypeScript 会立刻报接口合并冲突：

> Host and Client stay two aggregate programs because both sides declaration-merge the cordis `Context` interface under the same keys with different services; one program seeing both merges reports a collision.
>
> — DSH [`docs/development.md` 的 “TypeScript project layout”](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md#typescript-project-layout)

因此，全栈插件仓的标准目录与三份 `tsconfig` 布局如下（根 `tsconfig.json` 保持纯粹的 `files: []` 聚合器，绝不直接包含源码文件）：

```text
dsh-audit-panel-plugin/
├── package.json                 # 同时声明 exports["."], exports["./client"], ./typert, ./remote 与 dsh.client
├── tsconfig.json                # Solution-only 根配置：{ "files": [], "references": [{ "path": "./tsconfig.host.json" }, { "path": "./tsconfig.client.json" }] }
├── tsconfig.host.json           # NodeNext / Host 编译器面（只含 src/index.ts 等服务端文件）
├── tsconfig.client.json         # Browser / JSX / DOM 编译器面（只含 src/client/** 与共享纯类型）
├── tsdown.config.ts             # 独立插件仓自备的 lazy-CJS 浏览器端 lib/client.js 打包脚本
├── cordis.patch.yml             # 宿主挂载根行（注意：必须以裸包名挂载根行才能携带 dsh.client！）
├── locale/
│   ├── en.json
│   └── zh.json
└── src/
    ├── types.ts                 # 两边共享的纯数据结构/错误码声明（无 Node 或 DOM 专属导入）
    ├── index.ts                 # Host 入口：注册 TypertRemoteService、后端工具或网关逻辑
    └── client/
        ├── index.ts             # Client 入口：仅导出 apply / inject（及类型专用的 createXXXStore）
        ├── store.ts             # createAuditPanelStore() 工厂（严禁模块级单例句柄！）
        ├── locales.ts           # 客户端多语言字典（严禁在 JSX 硬编码英文/中文产品文案）
        └── Panel.tsx            # 纯展示 React 组件（严禁触碰 ctx 或手写外部订阅）
```

### 2.2 极易踩空的构建最后一公里：外部仓怎么打出合法的 `lib/client.js`？

这是独立全栈插件作者最容易翻车的盲区：**直接拿 `tsc` 编译出来的 ESM 文件当 `lib/client.js` 是绝对加载不起来的，且不能把 `dsh.client` 寄希望于子路径导出行！** 一手文档明确揭示了这两条硬约束：

> The browser half is served to the page by the client module system, which scans the enabled Loader entries for packages declaring `dsh.client` and serves each one's built `./client` export — but it attaches a package's half to the Loader row whose specifier is the bare package name. A row mounted from a subpath export never carries a half, so a bundle that splits one package into several rows keeps its half on the root row, and every page it registers goes away when that row is switched off.
>
> — DSH [`docs/cookbook/adding-a-settings-card.md` §5 “Where the browser half rides”](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md#5-where-the-browser-half-rides)

> The built `./client` file must be in the client module system's lazy-CJS factory format: one script that registers the package name and a `factory(require)` with the page's module loader, described in the client module system's README. The `clientBundle` tsdown preset that emits it lives in `packages/client/tsdown.client.ts` rather than in a published package, so a package outside this repository reproduces that build itself.
>
> — DSH [`docs/cookbook/adding-a-settings-card.md` §5 “Where the browser half rides”](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md#5-where-the-browser-half-rides)

由于主仓内部的 `packages/client/tsdown.client.ts` 未作为 npm 包发布，独立插件仓应在根目录自备下面这份对齐主仓协议的 `tsdown.config.ts`——它同时完成三件事：① 将 `src/client/index.ts` 编译为包裹在 `window.__ModuleLoader__.load({ id, factory: (require) => { ... } })` 中的浏览器端 lazy-CJS 产物（保留 `clean: false` 以免擦除 `tsc` 生成的 Host `lib/index.js` 与 `lib/types`）；② 只把宿主浏览器种子表（`PLATFORM_MODULES`）加上 `package.json` 的 `dsh.client.external` 保持为外部 `require(...)`，其余纯工具依赖全部内联进包内（因为浏览器模块表无法回答未声明的 `require()`，一旦漏内联必在运行期直接抛错）；③ 固化 `process.env.NODE_ENV` 与 `import.meta.env`，防止内联的状态库在 CJS 闭包里报 `ReferenceError`：

```ts
import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  name: string
  dsh?: { client?: { external?: string[] } }
}

// 对齐 DSH packages/client/web/src/platform.ts 的浏览器冻结共享模块基线表
const PLATFORM_MODULES = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  'zod',
  '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
  ...(pkg.dsh?.client?.external ?? []),
])

const mode = process.env.NODE_ENV ?? 'production'
const isRequested = (specifier: string): boolean => PLATFORM_MODULES.has(specifier)

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,      // 类型由 tsc -b 输出至 lib/types，避免 banner/footer 污染 .d.cts
  clean: false,    // 严禁开启 clean，否则会删掉先一步产出的 lib/index.js 与 lib/types/
  sourcemap: true,
  deps: {
    neverBundle: isRequested,
    alwaysBundle: (specifier: string) => !isRequested(specifier),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env': JSON.stringify({ MODE: mode }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    chunkFileNames: 'client.[name].js',
    banner: (chunk) =>
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(pkg.name)}, ${
        chunk.isEntry ? '' : `chunk: ${JSON.stringify(chunk.fileName)}, `
      }factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
})
```

若客户端组件还引入了 `.module.css` 或本地小图标，可在 `tsdown.config.ts` 的 `plugins` 中补充 `lightningcss` 样式注入插件（按 `packages/client/tsdown.client.ts` 的 `data-plugin` / `data-plugin-css` 标签约定在工厂执行期挂载 `<style>`，以便插件禁用时由 `dsh-client-modules` 自动回收样式）。插件仓 `package.json` 的构建脚本写成 `"build": "tsc -b && tsdown"` 即可先产出 Host 代码与双端 `.d.ts`，再叠加浏览器 `lib/client.js`。

### 2.3 Web 前端怎么跟 Node 宿主插件通信？`TypertRemoteService` 五步标准闭环

在拓扑 B 中，浏览器端 React 面板绝不应该自己硬拼 `fetch('/api/...')` 或手写松散 JSON 路由，而是使用 DSH 官方的 **Typert 类型化跨端调用（`ctx.remote`）**。依据 [`docs/cookbook/adding-a-remote-api.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-remote-api.md)，打通一条前后端 RPC 只需严格走完以下五步：

1. **第 1 步（Host 端声明 `@Remote` 服务）**：在 Node 入口继承 `@deepseek-ai/dsh-typert-protocol` 的 `TypertRemoteService` 绑定服务键与 wire 命名空间，用 `@Remote('methodName')` 标记暴露方法。注意两条签名规约：需要宿主自动按身份解析的查找对象（`Agent`、`Session`）只能放在顶层参数位；支持协作取消的方法把 `signal: AbortSignal` 放在**最后一个参数**。
2. **第 2 步（声明合并结构化错误码 `RemoteErrorDetailsMap`）**：不要建一堆自定义 Error 子类，而是向 `@deepseek-ai/dsh-typert-protocol` 的 `RemoteErrorDetailsMap` 合并 `<domain>/<reason>` 错误码并在业务失败处直接 `throw new RemoteError(code, message, details, { cause })`（未分类的意外异常由网关自动折叠为 `gateway/internal`）：

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

export interface AuditEntry {
  readonly id: string
  readonly summary: string
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'audit/not-found': { readonly entryId: string }
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    auditController: AuditController
  }
}

export class AuditController extends TypertRemoteService {
  constructor(ctx: Context) {
    super(ctx, 'auditController', { namespace: 'audit' })
  }

  @Remote('list')
  async list(agent: Agent, signal: AbortSignal): Promise<AuditEntry[]> {
    signal.throwIfAborted()
    return [{ id: `${agent.id}-1`, summary: 'Checked sandbox boundary' }]
  }

  @Remote('get')
  async get(entryId: string, signal: AbortSignal): Promise<AuditEntry> {
    signal.throwIfAborted()
    throw new RemoteError('audit/not-found', `No audit entry "${entryId}"`, { entryId })
  }
}
```

3. **第 3 步（在 `package.json` 暴露 `./typert` 与 `./remote` 契约入口）**：`@Remote` 必须位于 Loader 直接挂载的入口插件包内，并在 `package.json` 导出供网关与客户端消费的生成产物路径及 `@deepseek-ai/dsh-typert-protocol` 对等依赖（签名、错误码表或命名空间变更后需重新构建生成客户端声明与编解码器）：

```json
{
  "exports": {
    ".": { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
    "./client": { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" },
    "./typert": { "types": "./lib/typert.host.d.ts", "default": "./lib/typert.host.js" },
    "./remote": { "types": "./lib/typert.remote-client.d.ts", "default": "./lib/typert.remote-client.js" },
    "./package.json": "./package.json",
    "./locale/*.json": "./locale/*.json"
  }
}
```

4. **第 4 步（Client 端 Store 注入 `remote.<ns>` 并按 `if (!result.ok)` 分支收窄）**：客户端插件同时声明 `inject = ['remote', 'remote.audit']`；调用 `ctx.remote.audit.get(...)` 永远返回不 reject 的 `RemoteResult<T>`（不要包防御性 `try/catch`，装配错误应当直接暴露崩溃）：

> The result is a `RemoteResult<T>`, so branch on `if (!result.ok)` in place and discriminate by `code` rather than `instanceof` — a code branch narrows `details` on its own. An exception-flow site writes `throw result.error` (it is a real Error); whoever catches it uses `isRemoteFailure` to tell a Remote failure from a local defect and rethrows the defect.
>
> — DSH [`docs/cookbook/adding-a-remote-api.md` §4 “Consume it on the Client”](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-remote-api.md#4-consume-it-on-the-client)

此外，若客户端需要读取宿主主目录或是否为本机回环连接等固定事实，直接同步读取 `ctx.remote.$host`（`home` 与 `isLoopback`），并在断线重连时监听 `ctx.on('connection/reset')` 刷新数据。

5. **第 5 步（双端契约测试）**：Host 端单测捕获异常后用 `remoteErrorOf(failure)` 配合 `toMatchObject` 断言 `code` 与 `details`（绝不用 `instanceof` 或 `toEqual` 全对象深比）；Client 端单测从 `@deepseek-ai/dsh-client-test-runtime` 导入真实替身 `TestRemote` 与 `RemoteError` 注入客户端 `Context` 验证错误分支渲染。

### 2.4 Coding Agent 写 Web Client 插件时绝不能破的五条红线

1. **React 组件（`.tsx`）永远看不见 `ctx`。** `ctx` 只活在 `src/client/index.ts` 的 `apply(ctx)` 闭包与 `inject` 工厂里：

> `ctx` belongs to the apply world only: the plugin body and the inject factories closed over it. Components — every `.tsx` under a feature domain — receive all data and callbacks through the derived props shares; they never call a hook that reaches ctx, never import a service class to poke it, never read a React context (business components see zero contexts — `BindingContext` and its kin are renderer-internal).
>
> — DSH [`packages/client/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)

2. **Store 只能导出 `createXXXStore()` 工厂，严禁模块顶层实例化句柄。** 在 `apply` 内创建实例传给 `slots.register`，测试里可直接调用工厂做零框架纯逻辑验证。
3. **`./client` 入口严禁顺手导出业务组件或工具函数，严禁跨特性插件直接运行时互引。** `./client` 只导出 Cordis 加载所需的 `apply` / `inject`（`Config`）及仅供类型推导的 Store 工厂。
4. **浏览器专属依赖一律进 `devDependencies`。** 只有 Node Host 运行期真正需要的库才进 `dependencies` / `peerDependencies`；`react`、`tsdown` 及 `@deepseek-ai/dsh-client-*` 构建与类型依赖放在 `devDependencies`。
5. **样式走 `--dsw-*` 语义变量与 CSS Modules，界面文案 100% 归属多语言字典。** 严禁硬编码十六进制颜色、引入重型第三方组件库或把英文/中文提示词直接写死在 JSX 标签里。

## 3. 拓扑 C：Capability Seam 多包 Workspace（何时拆包与单向依赖锁）

当你的插件仓库确实在构建一套**有多种独立后端实现的可替换能力**（例如同时维护一套抽象审批网关接口、一套企业飞书实现、一套企业微信实现，以及消费该接口的策略插件）时，才升级为 `pnpm-workspace.yaml` 多包仓库：

```text
dsh-enterprise-approval/
├── pnpm-workspace.yaml              # packages: ['packages/*']，开启严格非提升链接防幽灵依赖
├── tsconfig.base.json               # 纯 compilerOptions 与源码 paths 映射（严禁写 include 或 files！）
├── tsconfig.host.json               # 聚合引用各包的工程引用图
└── packages/
    ├── approval-bridge/             # Role 1 · Service Definition：纯类型、事件声明与基础抽象服务
    ├── approval-bridge-feishu/      # Role 2a · Service Provider A：飞书具体实现（只依赖 approval-bridge）
    ├── approval-bridge-wecom/       # Role 2b · Service Provider B：企微具体实现（只依赖 approval-bridge）
    └── tool-request-signoff/        # Role 3 · Consumer：模型工具消费方（只依赖 approval-bridge，绝不 import 具体 Provider！）
```

维护多包 Seam 仓库时守住三条纪律：① **根 `tsconfig.base.json` 永远不写 `include` 或 `files`**（否则会泄漏进所有继承它的子包）；② 在 `scripts/verify-plugin.mjs` 里加一条依赖断言，确保任何 Consumer 包的 `package.json` 和 `import` 都绝对不出现具体 `*-feishu` / `*-wecom` Provider 包名；③ 提供一个默认开箱即用的组合 Bundle 包，把 Definition、默认 Provider 与 Consumer 串成用户一键 `dsh plugin add` 即可跑通的完整交付物。

## 4. 五层配置叠加、`Volatile<T>` 活设置表单、详情页扩展与 `!!js` 动态求值

很多插件代码本身没写错，却在进入真实用户环境后出现“设置界面里看不见开关”“改了配置被上层静默冲掉”或“想给插件管理页加横幅却找不到字段”。把下面四组配置与管理页规则一次吃透即可彻底免疫：

### 规则一：五层配置优先级与“同 `id` 整块替换 `config`”

DSH 加载插件配置时严格按以下五层从低到高叠加（越往右优先级越高）：**① 插件源码 `Config` Schema 默认值 → ② Bundle 补丁层（`dsh.bundle` 分发的 `cordis.patch.yml`）→ ③ Profile 补丁层（GUI 设置页保存修改的落盘位置）→ ④ Home 全局补丁层（`$DSH_HOME` 级覆盖）→ ⑤ 命令行 `--patch <file>` 覆盖层**。

**极易踩坑的覆盖语义**：当高优先级补丁层按同一个条目 `id` 覆盖已有插件行时，**替换的是该行的整个 `config` 对象，而不是逐字段深合并（deep merge）**！如果你在测试覆盖层里按同 `id` 只写了 `{ timeoutMs: 5000 }`，原本在 Bundle 层配好的其他非默认字段会被一并清掉；排查时永远先跑 `dsh --profile <name> --dump-config` 看清最终合成结果。

### 规则二：活设置表单（`Volatile<T>`）、敏感凭据脱敏与快照读取

需要出现在 DSH 图形设置页并支持免重启热更新的字段，必须在 Schemastery Schema 上显式调用 `.volatile()`，并在 TypeScript 接口中声明为 `@deepseek-ai/cordis` 的 `Volatile<T>` 引用（普通静态字段不会进入设置表单）：

```ts
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export interface Config {
  endpoint: Volatile<string | undefined>
  apiToken: Volatile<string | undefined>
  retries: Volatile<number>
}

export const Config = z.object({
  endpoint: z.string().volatile(),
  apiToken: z.string().role('secret').volatile(), // role('secret') 防止密钥明文出现在表单响应回包中
  retries: z.number().step(1).min(0).default(3).volatile(),
})

export function apply(ctx: Context, config: Config): void {
  ctx.on('loader/volatile-update', () => {
    ctx.logger.info('Updated retry limit: %d', config.retries.get())
  })
}
```

使用 `Volatile<T>` 时守住三条契约（依据 [`docs/cookbook/adding-a-settings-card.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md)）：① 在每次业务操作启动瞬间调用 `config.retries.get()` 抓取一次快照（不要在 `apply` 顶层解构缓存旧值，也不要在单次请求中途反复 `.get()` 导致前后不一致）；② 跨字段联合校验用 `.check()` 挂载（在宿主落盘前执行，不会污染序列化的表单 Schema）；③ 敏感字段加 `.role('secret')` 阻止回显，或优先接入 `@deepseek-ai/dsh-credentials` 凭据引用。

### 规则三：插件详情页扩展槽位 vs 官方内置特性预览图的真实边界

如果你的全栈插件想在“设置 → 插件”详情页上增强展示（例如显示远端连接状态徽标、版本更新提示或自定义操作区），可以在客户端注册 `plugins.detail.actions`（页头操作控件）、`plugins.detail.badge`（标题旁标签）或 `plugins.detail.section`（正文下方扩展区块），根据传入的 `subject`（`{ kind: 'bundle', pkg }`、`{ kind: 'row', pkg, row }` 或 `{ kind: 'item', id }`）精确匹配目标插件，无关对象直接返回 `null`。

但务必注意一条常被外部作者误解的边界：**DSH 官方内置 Bundle 详情页里的 640×300 大尺寸特性插画（`BUNDLE_PREVIEWS`）不对第三方插件开放清单声明接口**：

> Plugin Manager owns optional feature illustrations for built-in bundles. Follow this guide when editing its internal `BUNDLE_PREVIEWS` map. Packages cannot declare illustrations through their manifest or exports; third-party plugins have no preview interface.
>
> — DSH [`docs/cookbook/adding-a-plugin-preview.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-plugin-preview.md)

独立第三方插件仓应专注于提供准确的 `locale/en.json`、`locale/zh.json` 描述文案、`Volatile<T>` 设置表单以及按需挂载的 `plugins.detail.section` 交互区，不要在 `package.json` 里臆造不存在的预览图字段。

### 规则四：`cordis.yml` 动态表达式只能写双感叹号 `!!js`，且仅限 `config` 与 `disabled`

在 YAML 配置或补丁层中读取环境变量或上游服务属性时，严守解析器边界：

> `@deepseek-ai/cordis-plugin-include` parses `!!js` into expression nodes. Loader interpolates an entry's `config` (after declared injections activate, against that plugin context — `ctx.serviceName`) and its `disabled` field (at every mount decision, against the loader context); Include preserves nested row expressions until target activation. Other entry metadata stays literal. Use overlays when the environment selects plugins.
>
> — DSH [`docs/cordis-primer.md` 的 “Loader Configuration”](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md#loader-configuration)

Coding Agent 写 YAML 时有三个高频错误必须用静态门禁直接封死：① 把双感叹号 `!!js` 误写成单感叹号 `!js`；② 试图在 `name` 或 `id` 等静态元数据字段上写 `!!js`（按环境选不同插件包应使用 overlay 补丁文件）；③ 在 YAML 里硬编码明文 API Key 而非通过环境变量或凭据服务传入。

## 证据入口

- DSH [`docs/development.md` 的 “TypeScript project layout”](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md#typescript-project-layout)：Host 与 Client 双编译器面隔离原理、`solution-only` 根 `tsconfig.json` 与 `tsconfig.base.json` 禁写 `include`/`files` 规则。
- DSH [`packages/client/modules/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md)、[`packages/client/tsdown.client.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/tsdown.client.ts) 与 [`packages/client/web/src/platform.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/web/src/platform.ts)：`window.__ModuleLoader__.load` lazy-CJS 工厂格式、`PLATFORM_MODULES` 冻结基线表与裸包名根行挂载机制。
- DSH [`docs/cookbook/adding-a-remote-api.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-remote-api.md)：`TypertRemoteService`、`@Remote`、`RemoteErrorDetailsMap`、`./typert` / `./remote` 导出与 `TestRemote` 双端测试五步规范。
- DSH [`packages/client/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)、[`docs/cookbook/adding-a-settings-card.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md) 与 [`docs/cookbook/adding-a-plugin-preview.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-plugin-preview.md)：客户端组件禁碰 `ctx`、`Volatile<T>` 活配置表单、`plugins.detail.*` 槽位与内置预览图边界。
