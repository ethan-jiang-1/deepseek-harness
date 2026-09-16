# FAQ 10 · 一位烧了 10 亿 token 的用户给 DSH 的三条体感，在 harness 机制层面对得上什么？

## 问题

一位重度使用者对 DSH 的感慨原文（转述）：

> 1. 符合之前的设定，快就是好。V4 Flash 足够优秀，思考开在 Max，开箱的 DSH 已经有 goal、plan，用 plan 打造 dynamic workflow，基本上重构都可以在 3 小时内看到效果，这个在 codex 简直是做梦。
> 2. DSH 还是要有很多自己改造的地方。例如上文的 dynamic workflow，多路并行，diff 预览，markdown 预览，word 预览，ppt 预览，codex 右侧边栏产出物等功能自己打造，其实官方已经有了很多实践，不多多试试。
> 3. 别用 V4 Pro，多用 vision。

这不是普通用户反馈：说话人清楚 goal、plan、dynamic workflow、多路并行这些**运行时原语的名字**，也在要求 diff/markdown/word/ppt 预览和 Codex 式侧边栏产出物这种**宿主 UI 能力**。三条分别落在 harness 的不同层面——模型路由、驱动循环、宿主投影。

## 回答目标

逐条追问：这条体感说的是 DSH 的哪个机制？它是**机制使然**（harness 结构必然导出的体验）、**可复述但需校正**（方向对、归因偏）、还是**真缺口**（官方确实没做、要自己造）？具体要回答：

1. "快就是好" 在 DSH 里是哪几层机制共同给出的？`reasoningEffort: max`、Flash 路由、goal 续轮、plan 模式、`workflow` 工具之间的因果链是什么？"3 小时重构" 对应的机制下限和上限在哪？跟 Codex 的差距是模型差距还是 harness 差距？
2. "要自己改造" 的清单里，哪些官方其实已有（diff 预览、markdown 渲染、多路并行、workflow）、哪些是 `model-visible ⟺ logged` 硬税下的真缺口（word/ppt 预览、侧边栏产出物）？自己造的正确路径是什么（新增 `SessionEventMap` 成员 / render intent / Chat node / bundle patch）？
3. "别用 V4 Pro、多用 vision" 的机制依据是什么？默认 catalog 里各模型（0.1.5 为四个条目）的定位是什么？vision 为什么是验证手段而不只是"看得见图"？

答案要求：每条判定挂源码或 `_digested/` 证据，明确基线（消化基线 `dsh-v0.1.2-alpha.3`，commit `dd6322d6…`；写作树 `08b582ea02…`，本次同步复核树 `dsh-v0.1.5-rc.1` / `183f08e9c6`）。
