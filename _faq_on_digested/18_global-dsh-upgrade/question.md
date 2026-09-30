# 全局安装的 DSH CLI 老了,怎样安全地升级到最新的 RC / 正式版?

## 问题

机器上全局安装的 `@deepseek-ai/dsh`(npm 全局,装在 nvm 的 prefix 下)落后于 npm 上的最新发布。想要一条**今后每次升级都能直接复用**的路径,并且每次升级都是安全的:升级前有检查、操作前有确认、升级后有校验、出问题能回滚。

## 背景

- 全局包用 npm 安装(`/Users/bowhead/.nvm/versions/node/v22.23.1/lib/node_modules/@deepseek-ai/dsh`),不是 pnpm/yarn/bun。
- CLI 本身没有自升级命令(`dsh --help` 里没有 update/upgrade),升级只能走包管理器。
- npm 上该包有三个 dist-tag 通道:`latest` / `next` / `alpha`。**我们只升最新的 RC 或正式版**,即 `latest` 通道;alpha 是先行实验通道,永远不碰。
- 实测 `npm view` 一类命令会因 `~/.npm` 缓存目录里有 root 属主残留文件而 EPERM(老版本 npm 的已知 bug 遗留),升级命令大概率也会踩到。
- 升级跨的是预发布版本(如 `0.1.7-rc.2` → `0.2.0-rc.2`),需要核对 `docs/upgrade-guide/` 里有没有对应版本的迁移条目。

## 需要回答的子问题

1. 升级命令到底是什么?为什么是它而不是别的?
2. 怎样保证升级目标永远是「最新 RC 或正式版」而不是 alpha?
3. 升级前后要做哪些检查?回滚怎么做?会不会动到 `~/.dsh` 里的用户数据?
4. 能不能把检查、确认、安装、校验、回滚固化成一个以后每次都直接跑的脚本?
