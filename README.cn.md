# Playwright YAML 测试框架

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Playwright MCP](https://img.shields.io/badge/Playwright-MCP-green.svg)](https://github.com/microsoft/playwright-mcp)

> **中文文档** | **[English Documentation](README.md)**

一个基于YAML配置的Playwright自动化测试框架，专为Claude Code设计，支持多环境配置、步骤库复用和自然语言测试描述。

## 🎬 演示视频

观看YAML-based Playwright测试的实际演示：

[![YAML Playwright Testing Demo](https://img.youtube.com/vi/tx3xExU_Xhc/maxresdefault.jpg)](https://www.youtube.com/watch?v=tx3xExU_Xhc)

**📺 [观看演示视频](https://www.youtube.com/watch?v=tx3xExU_Xhc)** - 了解如何使用Claude Code和Playwright MCP通过自然语言编写和执行测试。

## 📊 最新测试结果

查看最近的测试执行报告：

**📈 [最新测试报告](reports/test/latest-test-report.html)** - 每次测试运行后自动生成，显示详细的执行结果、截图和性能指标。

### 测试报告示例

以下是典型测试执行报告的展示：

![YAML测试报告示例](https://github.com/terryso/claude-code-playwright-mcp-test/blob/develop/assets/test-report-sample.png)

**报告特性：**
- 📊 **综合统计**: 总用例数、通过/失败计数、步骤执行详情
- 📋 **配置详情**: 环境设置、报告生成设置、文件路径
- 🎯 **成功指标**: 清晰的测试结果和成功率可视化
- 🔧 **环境信息**: 自动检测和显示测试环境配置

## 🌟 主要特性

- **🌍 多环境支持**: 支持dev/test/prod环境，自动加载对应配置
- **📚 步骤库复用**: 可复用的参数化步骤库，提高测试效率
- **🗣️ 自然语言**: 直接使用自然语言描述测试步骤，易读易写
- **🔧 环境变量**: 从.env文件自动加载配置，安全管理敏感信息
- **📊 智能报告**: 可配置的测试报告生成，支持HTML/JSON格式
- **📝 智能提示**: Claude Code项目命令支持参数提示
- **🚀 快速上手**: 完整的项目模板和示例

## 🔧 前置要求

### 安装 Playwright MCP

本项目依赖 Playwright MCP 来执行浏览器自动化。请先安装：

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

更多安装信息请参考：[Playwright MCP 官方仓库](https://github.com/microsoft/playwright-mcp)

## 📁 项目结构

```
├── .claude/                    # Claude Code 项目命令
│   └── commands/              # 命令目录
│       ├── run-yaml-test.md   # 执行测试命令
│       └── validate-yaml-test.md # 验证测试命令
├── .env.example               # 环境变量模板
├── .env.dev                   # 开发环境配置
├── .env.test                  # 测试环境配置
├── .env.prod                  # 生产环境配置
├── steps/                     # 可复用步骤库
│   ├── login.yml              # 登录步骤库
│   └── cleanup.yml            # 清理步骤库
├── test-cases/                # 测试用例
│   └── order.yml              # 订单测试用例
├── screenshots/               # 测试截图（按环境分类）
├── reports/                   # 测试报告（按环境分类）
├── CLAUDE.md                  # 项目说明和命令索引
└── README.md                  # 本文档
```

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

## 📋 命令详解

### 🚀 执行测试

#### `/run-yaml-test`
执行YAML测试用例，支持多环境配置、标签过滤和报告生成。

**参数：**
- `file` (可选): 测试用例文件路径，不传则执行test-cases目录下所有用例
- `env` (可选): 环境名称 (dev/test/prod)，默认为 dev
- `tags` (可选): 标签过滤，支持单个或多个标签组合

**标签过滤语法：**
- 单个标签: `smoke`
- 多个标签AND: `smoke,login` (必须同时包含)
- 多个标签OR: `smoke|login` (包含任一)
- 混合条件: `smoke,login|critical`

**报告生成：**
- 根据环境变量 `GENERATE_REPORT` 自动生成测试报告
- 支持 HTML/JSON 格式（由 `REPORT_FORMAT` 配置）
- 报告保存到 `REPORT_PATH` 指定目录

**示例：**
```bash
# 执行指定文件
/run-yaml-test file:test-cases/order.yml env:dev

# 执行所有smoke标签的测试
/run-yaml-test tags:smoke env:prod

# 执行包含smoke且包含order的测试
/run-yaml-test tags:smoke,order env:test

# 执行包含order或checkout标签的测试
/run-yaml-test tags:order|checkout env:dev

# 执行所有测试用例
/run-yaml-test env:dev
```

### ✅ 验证测试

#### `/validate-yaml-test`
验证YAML测试用例的语法和引用完整性。

**参数：**
- `file` (必需): 要验证的测试用例文件路径
- `env` (可选): 环境名称，用于验证环境变量

**示例：**
```bash
/validate-yaml-test file:test-cases/complex-test.yml env:test
```

## 📝 YAML格式说明

### 步骤库格式

步骤库使用简洁的自然语言描述：

```yaml
# steps/login.yml
# 支持的环境变量: BASE_URL, TEST_USERNAME, TEST_PASSWORD
steps:
  - "Open {{BASE_URL}} page"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Verify page displays Swag Labs"
```

### 测试用例格式

测试用例包含标签和步骤，可以引用步骤库或直接定义步骤：

```yaml
# test-cases/order.yml
# 环境变量将从 .env.{environment} 文件自动加载
tags:
  - smoke
  - order  
  - checkout
steps:
  - include: "login"                           # 引用登录步骤库
  - "Click Add to Cart button for first product"      # 直接定义步骤
  - "Click Add to Cart button for second product"
  - "Click shopping cart icon in top right"
  - "Enter First Name"
  - "Enter Last Name"
  - "Enter Postal Code"
  - "Click Continue button"
  - "Click Finish button"
  - "Verify page displays Thank you for your order!"
  - include: "cleanup"                         # 引用清理步骤库
```

## 🔧 环境配置

### 环境变量说明

支持的环境变量类型：

```bash
# .env.dev 示例
# 基础配置
BASE_URL=https://dev.myapp.com

# 测试账号
TEST_USERNAME=dev_admin
TEST_PASSWORD=dev123

# 普通用户账号
USER_USERNAME=dev_user@example.com
USER_PASSWORD=devpass123

# 浏览器配置
BROWSER_TIMEOUT=30000

# 文件路径
SCREENSHOT_PATH=screenshots/dev
REPORT_PATH=reports/dev

# 报告配置
GENERATE_REPORT=true
REPORT_FORMAT=html
```

### 多环境切换

```bash
# 开发环境
/run-yaml-test file:test-cases/order.yml env:dev

# 测试环境
/run-yaml-test file:test-cases/order.yml env:test

# 生产环境
/run-yaml-test file:test-cases/order.yml env:prod
```

## 📚 最佳实践

### 1. 步骤库设计

- **单一职责**: 每个步骤库专注一个功能领域
- **参数化**: 使用环境变量而非硬编码值
- **可复用**: 设计通用的步骤，多个测试用例可复用

```yaml
# ✅ 好的步骤库设计
# steps/form-validation.yml
steps:
  - "Fill {{FIELD_NAME}} field with {{INVALID_VALUE}}"
  - "Click submit button"
  - "Verify page displays error message: {{ERROR_MESSAGE}}"
```

### 2. 测试用例组织

- **标签分类**: 使用合理的标签对测试用例分类
- **逻辑分组**: 按功能模块组织测试用例  
- **环境适配**: 考虑不同环境的差异
- **清理机制**: 每个测试后进行适当清理

```yaml
# ✅ 好的测试用例结构
tags:
  - smoke        # 冒烟测试
  - login        # 登录功能
  - critical     # 关键功能
steps:
  - include: "setup"           # 测试准备
  - include: "login"           # 登录
  - "Execute core test steps"  # 主要测试逻辑
  - include: "cleanup"         # 清理环境
```

### 3. 标签策略

- **功能标签**: 按功能模块分类，如login、user、api
- **优先级标签**: 如critical、high、medium、low
- **类型标签**: 如smoke、regression、integration
- **环境标签**: 如dev-only、prod-safe

### 4. 环境配置

- **敏感信息**: 所有密码、API密钥使用环境变量
- **环境隔离**: 不同环境使用独立的配置文件
- **文档化**: 在.env.example中说明所有必需变量

## 🗺️ 产品路线图

我们正在积极开发激动人心的新功能，让基于YAML的测试变得更加强大：

### 🔄 即将推出的功能

#### 1. **测试套件支持**
- **🗂️ 套件组织**: 将相关测试用例组织成逻辑套件
- **📦 批量执行**: 使用单个命令运行整个测试套件
- **🏷️ 套件级配置**: 每个套件的环境变量和设置
- **📋 套件报告**: 跨多个测试用例的聚合报告

```yaml
# 示例: test-suites/e-commerce.yml
name: "电商测试套件"
description: "完整的电商工作流程测试"
environment: "test"
test-cases:
  - "test-cases/login.yml"
  - "test-cases/product-search.yml"
  - "test-cases/cart-operations.yml"
  - "test-cases/checkout.yml"
```

#### 2. **Cursor IDE 支持**
- **🎨 语法高亮**: 丰富的测试文件YAML语法高亮
- **🔍 智能提示**: 步骤库和环境变量的自动完成
- **🛠️ 测试运行器集成**: 直接在Cursor IDE中执行测试
- **🐛 调试支持**: 断点和逐步调试功能
- **📖 悬停文档**: 测试步骤的内联文档

### 📅 发布时间表

| 功能 | 状态 | 预计发布 |
|------|------|----------|
| 测试套件支持 | 🚧 开发中 | 2025年Q2 |
| Cursor IDE MDC 支持 | 📋 计划中 | 2025年Q2 |

### 💡 功能建议

有新功能的想法？我们很乐意听到你的建议！
- 在我们的仓库中开启一个带有 `enhancement` 标签的 [Issue](https://github.com/terryso/claude-code-playwright-mcp-test/issues)
- 参与社区讨论
- 为路线图规划贡献力量

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📺 相关资源

- **🎬 [演示视频](https://www.youtube.com/watch?v=tx3xExU_Xhc)** - 框架实际演示
- **📈 [最新测试报告](reports/test/latest-test-report.html)** - 最近的测试执行结果
- **📖 [Medium文章](https://medium.com/@oxtiger/stop-writing-brittle-playwright-tests-why-yaml-based-testing-is-the-future-5cc90a81bfa2)** - 详细解释和优势
- **🛠️ [Claude Code](https://claude.ai/code)** - AI驱动的开发环境
- **🎭 [Playwright MCP](https://github.com/microsoft/playwright-mcp)** - 浏览器自动化集成

## 🆘 支持

如果你遇到问题或有建议：

1. 观看[演示视频](https://www.youtube.com/watch?v=tx3xExU_Xhc)获取视觉指导
2. 查看本README文档
3. 检查 [Issues](https://github.com/terryso/claude-code-playwright-mcp-test/issues) 
4. 创建新的Issue描述问题
5. 在Claude Code中使用 `/help` 获取更多帮助

---

**Happy Testing! 🚀**