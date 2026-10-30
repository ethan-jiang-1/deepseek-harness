# 实验 01 · 启动竞态：占位登记 vs 客户端首连

**状态**：设计完成，**未执行**（有阻塞，见末段）。

## 假设

如果插件的 `apply` 在登记占位工作区之前有足够长的 I/O，客户端可能在占位登记完成前连上，并触发 `<Documents>/deepseek-harness/default-workspace` 的自动创建。

## 命令（设计）

```sh
# 1. 造一个只做延迟的测试插件（apply 里 await 5s 再 registry.create）
# 2. 用隔离 home 启动，关掉自动打开浏览器
export DSH_HOME=$(mktemp -d)
dsh --profile race-test web --no-open --port 0
# 3. 拿到 URL 后立刻用浏览器打开一次（Playwright 或手动）
# 4. 检查默认工作区是否被创建
node -e 'const d=require(process.env.DSH_HOME+"/storages/workspace.json"); console.log(d.global.workspaceIds)'
```

## 预期

- 无延迟：`workspaceIds` 里只有占位或产品工作区，没有 `<Documents>` 默认。
- 延迟 5s：客户端先连上，`initialized` 后出现 Documents 默认工作区；占位登记随后到达，registry 里两者并存。

## 实际

未执行。阻塞原因：需要一个合成的测试插件（`apply` 内可控延迟），这超出"文档级证据"的成本；且浏览器首连需要 Playwright 驱动，属于测试工程而不是文档整理。

## 结论

维持 **U**。现有缓解（插件行排在 web 行之前、`apply` 只做 `mkdir`+`create`）是提高概率，不是保证；[16](../../10-foundations/16-startup-resolution.md) 的措辞保持"未保证"。

## 改了哪篇

无（[16](../../10-foundations/16-startup-resolution.md) 的 U 保持，并链到本记录）。
