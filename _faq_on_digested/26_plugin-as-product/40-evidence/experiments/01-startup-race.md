# 实验 01 · 产品 Client onboarding 与 DSH 默认 Workspace 的时序

**状态**：未执行，等级 **U**。本实验描述一个产品自建 UI 与 DSH Web Workspace UI 同时存在的风险，不是 DSH 的默认目录策略。

## 问题

DSH Web Client 只在 Workspace registry 和 Session history 都为空时调用 `workspace.initializeDefault()`。产品若在另一 Client plugin 中运行自建 onboarding，并试图先注册 Workspace 或 Session，实际启动是否会先发生产品操作，必须在目标 Client composition 中验证。

DSH Loader 不保证两个 Client plugin 的 apply 顺序构成可等待的业务屏障；因此，不要仅靠 bundle row 顺序、placeholder registration 或“产品插件排在前面”宣称 DSH Documents default flow 一定被抑制。

## 判定所需的测试

在隔离 `$DSH_HOME` 下运行真实 Web profile 与产品 Client plugin：

1. 让产品 onboarding 在收到 Client ready 后执行其实际 Remote 操作。
2. 同时记录 `workspace.initializeDefault`、产品 `workspace.create` 和 Session create 的完成顺序。
3. 覆盖空 home、已有 Session、已有 Workspace、取消、picker 失败与慢 Host filesystem。
4. 检查最终 Workspace registry、Session `header.cwd` 和 UI 恢复状态。

不能只在 hand-built context 中模拟 apply 顺序；测试要经过 Loader 与目标 Client composition。

## 结论与边界

实验尚未执行，不能断言产品 onboarding 与 DSH default initialization 是否竞争或最终显示什么 UI。建议复用 DSH Workspace picker/default flow；若产品替换该流程，应在目标 composition 中端到端验证。
