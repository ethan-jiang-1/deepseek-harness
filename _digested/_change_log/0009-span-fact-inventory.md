# 0009 跨度事实清单（源码→语料 反向审计底稿）

基线对：dsh-v0.1.7-rc.1（46a7f68b09）→ dsh-v0.2.0-rc.2（639ed015397290b3745d163aafe02ffee4aa3f84）。本清单由主会话从源码 diff 实测生成，供反向覆盖审计使用。

## 新增包（9，零删除）
- packages/client/product-analytics（ctx.productAnalytics，Desktop 产品分析）
- packages/client/shortcuts + packages/client/ui-shortcuts（快捷键编辑，web「refine shortcut editing and sidebar hints」）
- packages/client/ui-settings-session-log（Session Log 上传偏好设置页）
- packages/experimental/schedule-bundle（Schedule 可选 bundle，进默认 Web composition）
- packages/llm/llm-deepseek-account + packages/llm/llm-deepseek-api-key（llm-deepseek 按凭据类型拆分）
- packages/telemetry/otel（ctx.otel，OTLP 上传）
- packages/util/code-language（代码高亮语言表统一）

## 服务/结构变化
- ctx 服务 89→92：+productAnalytics(service)、+otel(service)、+schedule(core)；零删除、零 role 变更
- OPTIONAL_BUNDLES 2→4（收编 auto-review、schedule-bundle）；Schedule 进默认 Web composition（web 出厂禁用 shipped schedule/time context，由 bundle 带回）
- Remote 转发白名单 23→27 条：新增 deepseek-account/session-expired、deepseek-account/model-sign-in-required、credentials/record-updated、schedule/changed
- ctx.skills Provider 3→4（sandbox-windows-acl 出厂 ACL 诊断技能）
- skills 目录 14→15（新增 dsh-create-upgrade-guide）
- Inspector 从「build 后 --patch 覆盖层」改为可安装 bundle（@deepseek-ai/dsh-experimental-inspector）+ 源码态 demo:inspector
- experimental 20→21 包（+schedule-bundle）

## 机制/行为变化（feat 级）
- llm 动态工具更新：emit dynamic tool updates and project them per route（sdk/session 快照可见中途入列的 snapshot_ping 动态工具）
- user-questions：timed waits + late replies（persistence ack 2026-09-21-user-question-reply）
- Schedule：due reminders 改述为 scheduled user messages（af39300572）；行标题可选（ack 2026-09-18）；plugin-manager 禁止单独切换随 bundle 整体开关的行
- 账号/模型面：account 路由拆分、可用模型跟踪 + account settings、按请求凭据区分欠费提示（#4858）、client metadata 随 Platform 请求
- 遥测：desktop OTel 产品分析；telemetry byte-bounded OTLP 上传 session log 事件
- 桌面：bundled CLI 安装/启动守卫 + 原生菜单管理（plugin 入口 manageDesktopProfile 放行）、quit-inspection IPC + 退出确认、关窗隐藏、Windows 图标解析
- Web：侧栏文件树打开 workspace、模型 picker 模糊搜索/分组/sticky、审批解释本地化（#4793）、开发者模式控制新任务模式选择、鲸尾动画
- voice-input：未就绪麦克风引导插件 setup
- i18n：翻译配对记录按 heading section 键控（#5036）
- terminal-bash 配置 +22 行（shellDialect: pwsh 持久终端等）
- persistence ack 四笔：2026-09-16-host-schedule-storage、2026-09-22-schedule-hard-delete-and-bounded-history、2026-09-18-schedule-optional-title、2026-09-21-user-question-reply

## 不变量（用于一致性核对）
- SESSION_FORMAT_VERSION = 4 不变；known-event-types.ts 零 diff；latestReleasedVersion=3 / evidenceTag 不变
- vendor cordis 4.0.4 零 diff
- seam 层读数不变：33 seam / P≥2=15 / 单 Provider=15 / 零 Provider=3
- run-gates CI mode 17→18（+ci-unit）——注意这是变了的不变量，勿当不变量用

## 待清理
- docs/capability-seams.md.keys：门禁生成的未跟踪产物，非语料
