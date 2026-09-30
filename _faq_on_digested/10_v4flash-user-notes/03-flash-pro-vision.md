# 03 · "别用 V4 Pro，多用 vision"：模型路由的机制事实

## 第一节 默认 catalog 里两个模型各自是什么

`llm-deepseek` 省略 `models` 配置时公布的默认 catalog（`packages/llm/llm-deepseek/src/models.ts:8-24`、`README.md:52`；0009 按 `dsh-v0.2.0-rc.2` 实测重写为两条，其中一条声明图像能力；0.1.5 时的四条目版本——含 `deepseek-v4-flash-vision-exp` 与 `deepseek-v4-flash`——已随上游同步移除）：

| 模型 | 输入模态 | 定位 |
|---|---|---|
| `deepseek-flash`（name DeepSeek-V41-Flash） | `[text, image]` | 默认主力；体感里"快"的来源，也是默认 catalog 唯一的 image-capable 条目，另声明 `systemPromptUpdate: 'in-history'` 与 `toolUpdate: 'addition-only'` |
| `deepseek-v4-pro` | text | 同 catalog 的重档位；harness 未做任何限制 |

三个关键机制事实：

1. **vision 是模型条目的属性，不是开关**。catalog 条目的 `inputModalities` 字段声明图片能力（类型见 `packages/llm/llm-deepseek/src/types.ts:21`；默认 catalog 唯一的 image-capable 条目见 `README.md:52`）；路由是否收图由"确切模型能力"决定，而非会话配置。catalog 是 advisory：未列出的模型 id 原样透传、按纯文本路由——所以"用 vision"必须真的把路由切到 image-capable 条目，不是开个设置。
2. **`read_image` 工具的存在本身依赖两道门**：`ctx.attachments` 持久附件服务挂载（没挂则工具根本不注册，`packages/fs/tool-fs/src/index.ts:70` 条件注入）；执行时 `assertImageCapableRoute` 解析会话最新 `request/header` 的路由并要求 `inputModalities` 显式含 `'image'`，否则拒——"model … does not declare image input"（`tool-fs/src/read-image.ts:119-131`）。
3. **切换路由有缓存代价**：`request/header` 记录 provider/model/effort 为会话级状态；模型路由一变，装配前缀的 DeepSeek cache 从第一个变更 token 起失效（`README.md:180`）。"干活用 Flash、关键验证切 vision"在长会话里每次都是一次前缀清零，值得按节而不是按请求切换。

## 第二节 为什么 vision 是"验证手段"而不只是"看得见图"

DSH 对 UI/前端类工作的验证有一个结构性事实：**模型没有"指向 URL 看一眼"的能力**。`ctx.web` 只有 `web_search` + `web_fetch` 两个文本操作，fetch 返回 `html | text`，无页面渲染、无截图、无浏览器引擎（`packages/web/README.md`）；产品里也没有内置自动化浏览器——模型"看世界"的视觉入口**只有文件路径这一条**（`read_image` / 附件上传）。官方自己的实践印证了这条回路的地位：`record-browser-gif` skill 的纪律是每个 GUI PR 必须附"来自该 PR 真实服务器与真实模型轮次"的 GIF——截图落盘 → `read_image` 读回，是 DSH 里像素证据进入审计链的唯一通道。

这解释了"多用 vision"为什么在机制上成立：**视觉证据和文本证据走同一条日志制度**（`read_image` 的结果经 `ctx.attachments.saveImage` 内容寻址持久化，"在 `tool/result` 事件追加时图像块引用的对象必须已持久提交"，`tool-fs/src/read-image.ts:270-275`），它是 harness 内最便宜的"以最终渲染结果为准"的验证回路。工具层的降采样还专门为"看图指坐标"设计了补偿：输出信封给出 `originalDimensions` 与逐轴倍率提示（如 "multiply x coordinates by 2.50 and y coordinates by 2.00"，`read-image.ts:173-178`）。

但要把"多用 vision"落对姿势，注意两点：

- **截图要先落盘**：`read_image` 只吃 PNG/JPEG/WebP/GIF 文件路径（按扩展名路由，magic-byte 校验在附件服务）；没有"打开这个网页看一眼"的工具。浏览器侧素材要靠宿主浏览器控制或 Playwright 这类外部手段先产出文件。
- **用户侧已有对称渲染**：模型收到的工具结果图像，GUI 从 0.1.5 起由 `ui-tool` 的 image 卡渲染（`tool.call.images` slot，见 [02 第二节](./02-self-built-previews.md)；原先"工具卡不渲染"的缺口已闭合）；用户上传的图另有完整待遇（粘贴/拖放 → `imageLimits` 投影预检 → 画廊/lightbox，`packages/client/ui-attachment/README.md:28`、`:34-36`）。

## 第三节 read_image 的预算全链：一张图要过几道压缩

"多用 vision"的成本控制不是一句 maxTokens，是一条五级预算链，每级独立配置：

| 级 | 位置 | 默认预算 | 超限行为 |
|---|---|---|---|
| 准入 | `attachment-local` 每源 | ≤20MiB、≤64,000,000 px、单边 ≤8192px；每消息 ≤20 张 / 200MiB | 拒绝进入 |
| 规范化 | 附件存储 | 长边 2048px、4MiB 安全帽；EXIF 方向应用、转 8-bit sRGB | 按 `Math.min(1, sqrt(maxPixels / (width×height)))` 向内取整缩放（`packages/attachment/attachment/src/request-projection.ts:18`） |
| 路由请求版本 | catalog 条目 | 默认走官方 vision token 网格（14px patch、3:1 降采样、单图 1024-token 帽，正方形最高 1302×1302、16:9 以 1708×961 发送）；条目可设 `imagePixelBudget` 总像素预算或 `'low'`（512×512）；单边 4096px 帽；编码目标默认 2MiB | 确定性缩放，不强制方形 |
| 请求总量 | 适配器 | 文件引用 128MiB / 600 张；内联回退 20MiB | **最老图优先 offload**，替换为固定占位文本 |
| 单文件 | Files API | 32MiB 硬限、默认 7 天过期 | 失效即重传一次，二次失败不再试 |

（依据：`packages/attachment/attachment-local/README.md:41-45`、`packages/llm/llm-deepseek/README.md:94`（token 网格与 `'low'` 预设）、`:63-65`、`packages/llm/llm-deepseek/src/request-pricing.ts:20-31`、`src/file-store.ts:12`、`src/config.ts:48` 与 `src/defaults.ts:18`。0009 按 `dsh-v0.2.0-rc.2` 实测重钉：旧 640,000 总像素 / 1MiB 编码默认已被官方 token 网格 + 2MiB 编码目标取代，Files API 过期默认仍由 `llm-deepseek/src/config.ts` 承载、未随凭据拆分外移。）

第五级的 offload 占位文本值得读一遍：`[image omitted to fit request image limits; attachment sha256:…. …]`（`packages/llm/llm/src/content.ts:112`）——**旧图先出局**，且高水位投影让前缀不因每张新图改写。这就是长会话反复看截图的机制告诫：`read_image` 是"看一眼"，不是"存档"；同一张图要反复引用时，靠的是重新读文件，而不是指望历史里的图永远在场。

## 第四节 V4 Pro 的真实位置："别用"是经济学，不是机制

harness 层面没有任何东西阻止 `deepseek-v4-pro`：它在默认 catalog 里、`agent/request` waterfall 允许逐步换路由、模型选择本来就是 per-session/per-step 决策。所以第 3 条体感的正确读法是**路由经济学**：

- Flash 与 Pro 同为 1M 窗口；重构类任务的瓶颈通常在上下文组织与并行度（[01](./01-fast-is-good.md) 第一、四节），Flash + `max` effort 已覆盖思考深度，Pro 的增量买不到结构性的东西；
- 反过来，**真该花钱的地方是 vision**：UI 工作的验收标准在像素里，文本回路再强也推不出渲染结果；
- 唯一像"机制成本"的是缓存：切换路由清前缀缓存（第一节第 3 条），所以"别用 Pro"的机制版表述是——**别在会话中途往返切路由**，而不是"别用 Pro"。

最后校一点体感里的措辞：0009 复测（`dsh-v0.2.0-rc.2`）的默认 catalog 只剩两条目，image-capable 的只有默认主力 `deepseek-flash`（本身也收图），实验性的 `deepseek-v4-flash-vision-exp` 已被移除——"多用 vision"与"V4 Flash 足够优秀"依然在同一条路由族上自洽，且更纯粹了：视觉能力就是 Flash 本体；上游再动条目名时，本篇的条目名随之过期（见 [answer.md 诚实边界](./answer.md) 第 4 条）。
