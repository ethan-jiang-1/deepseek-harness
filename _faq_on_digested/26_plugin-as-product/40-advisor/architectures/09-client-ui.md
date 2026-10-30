# 9 · 客户端 UI 状态

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：布局、快捷键、面板宽度、折叠、最近选择、输入历史。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | 浏览器/设备 |
| 作用域 | origin / device |
| 寿命 | 清站点/换设备 |
| 读写者 | 用户/浏览器；Host 看不到 |
| 介质 | localStorage / userData |
| 秘密 | 不放 |

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A localStorage | 键带版本/会话 | 换端口/浏览器丢；无迁移 | 纯 UI |
| B 服务端 host 文件 | 跨源稳定 | 要 RPC/同步/清理 | 主题/输入历史 |
| C 混合 | localStorage 为主 + host 迁移 | 双写冲突 | 迁移期 |

**硬规则**：session-derived facts（标题/模型/preset）走 projection，不要复制到 localStorage；键要带版本；卸载/清站点要能清；不要把身份/秘密放这里。

**测试**：两个端口/浏览器、清站点、多 tab、版本迁移、卸载残留。

**DSH 映射**：无统一服务；`localStorage`/`userData`；projection 负责 session facts。

## 10. 同步 / 备份
