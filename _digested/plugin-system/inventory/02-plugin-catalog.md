# 插件货架：逐组图鉴

> [!IMPORTANT]
> harness 包含数百个包，按功能域分组在 `packages/` 下。**不要手动翻 README，优先使用本表定位包及其依赖形态。**

## 新人最高频插件

| 包 | 场景 |
|---|---|
| `tool-bash` / `tool-fs` | 基础执行与 IO |
| `tool-web` | 搜索与抓取 |
| `tool-subagent` | 委派子代理 |
| `compaction-basic` | 历史记录压缩 |

## 目录结构图鉴 (Watchpoints)

*   **core/**: 核心基础设施 (Agents, Session, Typert)。
*   **api/**: Web BFF 控制层。
*   **llm/**: 模型适配与重试机制。
*   **execution/**: Bash/SSH/Sandbox 核心执行力。
*   **subagent/**: 委派编排。
*   **host/**: WebServer 与静态资源服务。
*   **client/**: 浏览器端 UI 与插件。

*   **[Watchpoint] 依赖链**：若某插件未按预期加载，检查是否缺少其所在 `bundle` 的挂载，或 `Config` 配置字段不匹配。

## 组装与可见性说明

*   **到货档位**：
    *   `base`：随 `dsh-base` 出货且默认开启。
    *   `opt`：随 bundle 出货但默认关闭。
    *   `—`：按需手动安装 (`dsh plugin add`)。
*   **形态定义**：
    *   **Def**：服务定义 (`ctx` 接口)。
    *   **Impl**：Seam 实现。
    *   **Tool**：模型可见的工具注册。

## 查找与验证

> [!TIP]
> 每次代码同步后，应通过分组清点验证 `inventory` 的完整性，确保新增包未被遗漏。

| 路径 | 角色 |
|---|---|
| `packages/<group>/<pkg>/package.json` | 事实来源 |
| `docs/tool-catalog.md` | 工具能力映射 |
| `catalog.json` | 覆盖状态清单 |

> [!NOTE]
> 分组定义遵循 `packages/README.md`。若需开发新插件，先检查是否已存在类似的 `Service Definition`。
