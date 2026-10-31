# 93 · Kanban 文件走查：JSON、YAML 与 Session 请求

## 本例范围

Kanban Studio 是假想产品。这里只展示 profile manifest、bundle manifest、preset patch 和 Session request 怎样连接；本仓库没有 Kanban package、board format、tool 或 UI。

## Profile 的 `package.json`

新 profile 从随附的 Web template 开始，再安装产品 bundle。`--from-default-profile` 会替换同名 custom profile 的 dependencies 与用户 patch；必须用新名字或先备份已有 profile。以下 `dsh` 是已安装的 CLI；从源码检出目录运行时按 [90](./00-index.md) 改用 `pnpm dsh`。

```sh
dsh --profile kanban --from-default-profile web --dump-default-config
dsh plugin --profile kanban add <kanban-bundle-spec>
dsh --profile kanban --dump-config
```

Profile manifest 关键结构：

```json
{
  "name": "dsh-profile-kanban",
  "private": true,
  "dependencies": {
    "@acme/kanban-bundle": "<link-or-version-spec>"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@acme/kanban-bundle"
      ]
    }
  }
}
```

这段展示 manifest 字段，不是已发布的 Kanban package。CLI add 会写入真实 package spec 并更新 bundle list；`dependencies` 表示代码可安装/解析，`dsh.profile.bundles` 表示该 bundle 的 patch layer 进入组合。这里的 `base` 和 `web-app` 可由运行中的 DSH 安装提供，不必作为 profile 的直接 dependency；产品 bundle 则在此示例中安装于 profile。

## Bundle 的 `package.json`

```json
{
  "name": "@acme/kanban-bundle",
  "version": "1.0.0",
  "dependencies": {
    "@acme/kanban-tools": "1.0.0",
    "@deepseek-ai/dsh-agent-preset": "<compatible-dsh-version>",
    "@deepseek-ai/dsh-tool-present": "<compatible-dsh-version>"
  },
  "dsh": {
    "bundle": {
      "patch": "./presets/kanban.patch.yml"
    }
  }
}
```

`@acme/kanban-tools` 提供产品工具，`@deepseek-ai/dsh-agent-preset` 提供 preset row 的实现，`@deepseek-ai/dsh-tool-present` 提供下面示例用到的交付工具；发布时应填入与目标 DSH 版本兼容的真实版本。`dsh.bundle.patch` 指向贡献 preset row 的 patch 文件。若还需 Host service，可在有序 `patch` 列表中加入 Host patch 文件。

## `presets/kanban.patch.yml`

```yaml
- insert:
    - id: preset-kanban
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: kanban
        name: Kanban
        order: 10
        plugins:
          - id: tool-kanban
            name: '@acme/kanban-tools'
          - id: present
            name: '@deepseek-ai/dsh-tool-present'
```

这是插入 Loader root 的一条完整 preset row。Agent preset plugin 将 `config.plugins` 交给 Preset Registry；Registry 为该 preset 版本挂载子插件树，并让选择它的 Agent 绑定到该树。

**这是最小工具集**：它只列出产品工具和 `present`，不会继承 [standard 的子插件列表](../../../packages/bundle/web-app/presets/standard.patch.yml)，也不会自动包含通用文件、shell、skills 等工具。需要其他能力时，应明确加入所需 rows 和依赖，并审查权限。不要写成对 `preset-standard.config.plugins` 的局部追加：preset row 的 `config` 是普通对象，不是可递归索引的 Loader group；普通 row 的 `config` 被整体替换。

Web bundle 已提供 `agent-preset-registry` 和默认 `standard` preset。Kanban Session 可显式传 `agentPreset: 'kanban'`；若产品要将 Kanban 设为整体 registry default，需单独覆盖 root registry row。这样的覆盖同样替换整个 `config`；当前 registry config 除 `default` 外没有其他非 volatile 字段，用户的 `selectedDefault` volatile setting 仍优先。

## 创建 Session

有 DSH Workspace registration 时，Session request 可传：

```json
{ "workspaceId": "<registered-workspace-id>", "agentPreset": "kanban" }
```

已有项目目录但不需要 DSH Workspace grouping 时，可改传：

```json
{ "cwd": "/absolute/path/to/board", "agentPreset": "kanban" }
```

Client API `ctx.sessions.create(opts)` 接受这两种位置字段。`workspaceId` 和 `cwd` 互斥：前者让 Host 从 Workspace registration 取得路径并关联 Session；后者只指定初始目录。两者都不能授权模型或产品工具任意读写。

Host 可能已创建 Session，但关联 Workspace 失败；此时返回 `session/workspace-attach-failed`，错误数据包含已创建的 `sessionId` 和目标 `workspaceId`。产品应保留该 Session ID 并决定如何恢复关联或继续使用，而不是假设没有创建 Session、直接盲目重试。

## 看板文件

本例让 Kanban tool 以调用 Session 的不可变 `header.cwd` 作为项目根。直接调用 `ctx.fs.resolve()` 时，相对路径按传入的 `cwd` 解析；省略时使用 provider 默认目录。内置文件工具则会显式使用 Session 当前 `working_directory`。产品应传入 `cwd: projectRoot`，再用同一 provider 的 `contains()` 检查目标是否在项目内：

```text
projectRoot = 调用方 Session 的 header.cwd
root = await ctx.fs.resolve(projectRoot, { signal })
target = await ctx.fs.resolve(boardRelativePath, { cwd: projectRoot, signal })
如果 ctx.fs.contains(root, target) 为 false：拒绝请求
否则：按产品权限和写入 policy 读写 target
```

这段是路径检查示意，不是可运行的完整 Kanban tool；项目根缺失时产品应拒绝请求。产品还要处理格式校验、并发修改、符号链接变化和错误结果。直接调用 `ctx.fs` 不会自动获得内置文件工具的逐 Session 写入 policy 或 read-before-write 观察流程；使用 sandbox provider 时，还需正确传入逐次 policy，并处理拒绝。具体操作见[文件系统工具说明](../../../packages/fs/tool-fs/README.md)。

Board files 是初版的业务 authority。若增加派生索引，Source 为 board files、Authority 为无（derived）、key 为产品项目 ID，产品负责重建与清理。Workspace registration 不拥有 board directory；Workspace deletion 不删 board files 或 Session history。

若用 `present` 交付文件，需要 Agent Session、已打开的 turn、可用工作目录和 Session filesystem 可访问的普通文件；它记录绝对路径而不复制文件。Session 不必登记到 DSH Workspace。

## 验证范围

本仓库已执行的 profile 初始化、bundle 安装、preset row 组合和 Web listener smoke 见[实验 05](../40-evidence/experiments/05-profile-bundle-install.md)。它不验证 Kanban 示例代码、工具权限或看板行为。安装组合见 [90 主线](./00-index.md)，数据卡见 [91](./91-checklist.md)，升级与卸载见 [18](../10-foundations/18-install-upgrade.md)。
