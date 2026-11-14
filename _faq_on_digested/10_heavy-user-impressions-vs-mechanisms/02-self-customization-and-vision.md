# 02 · 随手自改造与视觉实测闭环：重度用户的进阶工具箱

重度用户的第二、三条体感其实在讲同一件事：**怎么把 Agent 从一个“只会埋头聊纯文本的黑盒”，调教成“看得见真实界面、缺什么功能就顺手给自己装上”的贴身工作台。**

由于那份用户感慨流传于 DSH 较早期版本，在动手自己造轮子之前，我们先把清单和当前仓库实况对一遍账——很多当年需要自己手搓的预览和侧栏能力，如今官方已经做成开箱标配了。

---

## 一、先对现状账：用户点名的七项能力，现在哪些已经内置？

| 用户点名的能力 | 当前仓库状态 | 官方现成实现住在哪 |
|---|---|---|
| **多路并行** | **开箱内置（三层）** | ① [`workflow`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workflow/workflow/README.md) 脚本内 `parallel()` / `pipeline()` 并发派子代理；② 异步 [`subagent` / `subagent_fork`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/README.md) 后台跑完自动回交通知；③ 单轮内无依赖工具调用按 `maxParallelToolCalls` 池并发执行 |
| **Diff 与代码预览** | **开箱内置** | `write` / `edit` 带 `card: 'diff'` 渲染意图，结果元数据落入 `tool/result.meta` 供确定性回放；轮末还有 [`workspace-changes`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/deliverables/README.md) 记录变更摘要，点开即进并排/统一对比审查页 |
| **Markdown 渲染与文件预览** | **开箱内置** | 对话流支持 CommonMark + GFM + KaTeX 公式 + Shiki 代码高亮；文件预览额外支持解析顶部 YAML frontmatter 与文档内相对路径图片 |
| **右侧边栏产出物面板** | **Web / Desktop 已内置** | [`ui-deliverables`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-deliverables/README.md) 在每轮末尾渲染变更文件卡与显式 `present` 交付卡，模型正文里的行内代码路径也会自动变成可点击链接，一点就在 [`ui-sidebar-right`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/README.md) 右侧停靠栏打开对应标签页（另含文件树、独立终端与可选内嵌浏览器） |
| **Word / PPT / Excel / PDF 预览** | **Web / Desktop 已内置** | [`ui-sidebar-documentpreview`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-documentpreview/README.md) 已统一收口：`.doc/.docx/.ppt/.pptx` 经宿主 [`office-to-pdf`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/document/office-to-pdf/README.md) 本地转 PDF 预览，`.xlsx/.xls/.csv/.tsv` 在浏览器 Worker 内直接渲染多工作表与公式栏；模型侧还配齐了按需加载的 [`skill-office`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-office/README.md) 技能族 |
| **固化可复用的动态工作流** | **原语内置，模板靠技能或插件承载** | `workflow` 引擎按设计只接收当场传入的脚本、不存静态模板文件；想把固定套路固化下来，轻则写一份 `.agents/skills/` 技能，重则仿 [`tool-ralph`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/tool-ralph/README.md) 封成独立工具插件 |
| **特定领域格式直读与专属业务面板** | **留给用户扩展** | `tool-fs` 的 `read` 仍只读 UTF-8 纯文本（不含 PDF/音视频直读模型工具）；团队私有的看板、业务表单或特殊后缀渲染器，正是顺着官方槽位自建的主场 |

---

## 二、为什么重度用户总忍不住“边用边改”？四级零摩擦改造阶梯

在别的封闭 Agent 产品里，觉得某个面板不顺手只能提工单等官方排期；而在 DSH 里，“自己顺手改一下”被拆成了四级由浅入深的公开台阶：

1. **第 1 级（零代码，5 分钟见效）：写一份 `.agents/skills/` 技能**
   比如你想让模型每次批准 `/plan` 后都按你团队的规范写 `workflow` 并行脚本，根本不用写插件——直接在仓库 `.agents/skills/<name>/SKILL.md` 里写清“怎么把方案阶段拆进 `meta.phases`、每个 `agent()` 的验收标准怎么写”。[`tool-skill`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/README.md) 首轮只注入极短摘要，匹配任务时才按需加载正文，改完保存下一轮立刻生效。
2. **第 2 级（纯配置拼装）：`cordis.patch.yml` 与 `--patch` 覆盖**
   很多能力其实已经在仓库里，只是默认没在某个入口打开。比如 Web 端默认关闭了右侧栏内嵌浏览器（Desktop 默认开启），你只要在当前 Profile 的 `cordis.patch.yml` 里加上两行 `id: ui-sidebar-browser` 与 `disabled: false`（见 [`ui-sidebar-browser`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-browser/README.md)），或者启动时挂 `--patch overlay.yml`，马上就能在会话旁边并排预览本地起好的 Web 服务。
3. **第 3 级（封装固定编排策略）：仿 `tool-ralph` 写消费方插件**
   当你发现某套多智能体检查流水线每天都要跑、而且需要跨项目分发给同事时，就照着 [`tool-ralph`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/tool-ralph/README.md) 的路子：不动 `agent-loop`，直接在 `ctx.workflowEngine` 和 `ctx.subagents` 之上包一个普通工具插件，把轮次上限和子代理路由做成带校验的 `Config` 配置项。
4. **第 4 级（用 DSH 改 DSH）：切进 Creator 模式（`cordis` preset）热装插件**
   这是 DSH 最具特色的自举闭环（定义见 [`presets/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/cordis.patch.yml) 与 [`packages/extensions/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/README.md)）：
   - **先只读摸清家底**：模型调用 [`tool-cordis`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/README.md) 提供的 `cordis_inspect_list` 与 `cordis_inspect_query`，当场查清宿主已挂的服务接口、配置 JSON Schema 以及前端页面暴露的全部 UI 槽位（例如整页浮层 `shell.overlay`、右栏标签页 `ctx.sidebarRightTabs`、文档渲染器 `ctx.documentPreviews`）；
   - **按内置开发技能写包，经审批持久安装**：Creator 模式自带插件开发与组装技能（位于 `@deepseek-ai/dsh-agent-preset/skills`），写好 Bundle 后调用受 `danger` 权限审批门控的 [`plugin_manager`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md) 安装到当前 Profile，配合 HMR 直接热生效（注：早期版本里供模型在进程内存里临时跑代码的试验工具 `cordis_define` / `cordis_run` 已退出模型工具面，退回底层的程序化 runner，持久扩展统一收口到 `plugin_manager`）。

### 自建前端预览前必知的一条硬规矩：UI 也要过“日志回放关”

顺着官方槽位加自定义卡片或面板时，千万别踩一个新手坑：**不要绕开会话日志直接在进程内存里塞一份临时 UI 状态。**

DSH 把 `model-visible ⟺ logged` 同步贯彻到了前端投影层（见 [`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)）：展示逻辑必须是纯函数，同时兼容实时流式渲染和历史日志冷回放。新增一种自定义产物展示，只有两条正道：
- **轻路径**：像内置 Diff 卡和代码阅读卡一样，在工具执行结果里通过 `presentationMeta` 把结构化展示数据随 `tool/result.meta` 一起落入日志；
- **重路径**：像工作流面板或交付卡片一样，通过类型声明合并往 `SessionEventMap` 注册新事件并编写投影单元——注意新事件默认是 **读取必认（required-on-read）** 的，除非是丢了也完全不影响会话重建的纯提示信息才标 `ignorable: true`。

---

## 三、“少用 Pro 空想，多用 vision 实测”：整条视觉验证链是怎么跑的？

### 1. 为什么视觉截图是前端与排版任务的“最低成本真相”？

默认挂载的 [`ctx.web`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml) 只有纯文本的 `web_search` 与 `web_fetch`，不会启动浏览器引擎去算 CSS 布局。无论是调网页响应式样式、画 SVG 图表，还是改 Word/PPT 排版（连官方内置的 [`skill-office`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-office/README.md) 都硬性规定：凡涉及填色、对齐等外观改动，必须调 `office-render` 渲染出图自检），让纯文本重模型在思维链里空想一千行，也不如把渲染截图存盘后调一次 [`read_image`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/README.md) 看一眼真像素（如果需要让模型直接点击操控网页或桌面，还可按需挂载实验组的 [`ctx.browserUse`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/browser-use/README.md) 或 [`ctx.computerUse`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/computer-use/README.md) 驱动）。

这条看图回路在工程细节上打磨得很顺手：
- **先核模型能力再入库**：`read_image` 执行前会检查当前会话路由的模型是否声明了 `'image'` 输入模态（默认主力 `deepseek-flash` 原生支持，而纯文本的 `deepseek-v4-pro` 会当场收到清晰报错提示切换模型），防止把图片塞进纯文本路由污染历史；
- **大图缩放自带坐标倍率提示**：图片按内容寻址存入 [`attachment-local`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/attachment/attachment-local/README.md) 后，若因尺寸限制触发了降采样，工具返回文本会自动附上原图分辨率与 `x / y` 坐标换算倍率，方便模型看缩略图也能精准报出原图坐标；
- **人机画面完全对称**：前端通过 `tool.call.images` 槽位把 `read_image` 读入的图片直接渲染在对话卡片里，模型看到了哪张图、有没有截错窗口，人一眼就能核对。

### 2. 一张截图过五关：既防撑爆请求，又防频繁打碎前缀缓存

很多人担心“多用 vision 会不会几张高清大图就把上下文烧穿？”DSH 在后台铺设了五道自动衔接的预算闸门（详见 [`attachment-local`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/attachment/attachment-local/README.md) 与 [`llm-deepseek`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-deepseek/README.md#streaming-with-thinking-and-images)）：

| 关卡 | 谁负责把关 | 默认上限与处理动作 |
|---|---|---|
| **1. 源文件准入** | `attachment-local` | 单图 ≤ 20 MiB、总像素 ≤ 6,400 万、单边 ≤ 8192px；单条消息最多 20 张 / 200 MiB，超限直接拒收 |
| **2. 规范化落盘** | `attachment-local` | 自动应用 EXIF 旋转、统一转为 8-bit sRGB，等比缩放到长边 ≤ 2048px 且体积 ≤ 4 MiB 后按哈希去重存储 |
| **3. 模型视觉网格适配** | `llm-deepseek` | 默认按官方视觉网格缩放（14px patch、3:1 降采样、**单图封顶 1024 视觉 token**，例如 16:9 画面按 `1708×961` 发送；也可配 `'low'` 压到 `512×512`），单边不超 4096px、目标体积 2 MiB |
| **4. Files API 上传复用** | `llm-deepseek` | 优先走 `/v1/files` 传文件引用（单请求上限 128 MiB / 600 张，文件 ID 按端点与凭据缓存复用 7 天）；若文件接口超时失败，整单自动回退为 20 MiB 预算内的内联 base64 |
| **5. 历史旧图分批淘汰** | `compaction-image-offload` | 一旦历史累积图片超出请求上限，触发 `IMAGE_OFFLOAD_REQUIRED`，按固定步长把**最早的一批旧图**替换成带 `sha256` 与尺寸说明的纯文本占位符后自动重试 |

注意第 5 关的两个实战启示：
- **阶梯式批量淘汰是为了保缓存**：它每次按固定步长（例如字节或张数配额块）一次性淘汰一段最老的图片前缀，避免“每新读一张图就改写一次历史头部”导致前缀缓存连环失效；
- **`read_image` 是“凑近看一眼”，不是永久挂墙上**：长会话跑了几十轮之后，早期读过的截图会被自动降级成文本占位符以节省视觉 Token。如果隔了很久还要再对比最初那张图，让模型重新调一次 `read_image` 读原路径即可。

最后回看那句“别用 V4 Pro”：在模型目录里，`deepseek-v4-pro` 不仅完全可用，而且明确定位给高难度纯文本推理；但在绝大多数日常开发与重构里，任务已经被 `plan + workflow` 拆薄了，此时**为了用重模型而放弃原生看图能力、甚至在会话中途来回切换模型路由把好不容易攒热的前缀缓存清零**，是一笔两头亏本的买卖。锁住支持看图的 `deepseek-flash` 一站到底，才是把延迟、视觉反馈与缓存折扣同时吃满的聪明做法。
