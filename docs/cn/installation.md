# 安装指南

## 🔧 前置要求

### 安装 Playwright MCP

本项目依赖 Playwright MCP 来执行浏览器自动化。**重要**：使用以下命令安装以启用会话持久化功能：

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest \
  --user-data-dir ~/.cache/claude-playwright \
  --storage-state ~/.cache/claude-playwright/auth-state.json \
  --save-trace \
  --output-dir ~/CascadeProjects/claude-code-playwright-mcp-test/screenshots
```

**新功能说明**：
- `--storage-state`: 自动保存和恢复登录状态
- `--user-data-dir`: 持久化浏览器数据
- `--save-trace`: 保存调试跟踪文件
- `--output-dir`: 指定截图输出目录

更多安装信息请参考：[Playwright MCP 官方仓库](https://github.com/microsoft/playwright-mcp)

## 🚀 快速开始

### 1. 安装依赖

确保已安装 Playwright MCP（参考上面的前置要求）。

> 💡 **初次使用？** 建议先观看我们的[演示视频](https://www.youtube.com/watch?v=tx3xExU_Xhc)了解框架的实际使用！

### 2. 配置环境变量

编辑对应环境的配置文件：

```bash
# 开发环境
.env.dev

# 测试环境  
.env.test

# 生产环境
.env.prod
```

### 3. 执行测试

```bash
# 在Claude Code中使用项目命令，执行订单测试
/run-yaml-test file:test-cases/order.yml env:dev
```

### 4. 查看测试报告

```bash
# 启动报告索引查看器，浏览所有测试报告
/view-reports-index

# 或使用npm命令
npm run view-reports
```