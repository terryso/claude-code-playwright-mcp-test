# Claude Test Framework - Demo Project

## Overview

This is a **live demonstration project** for the **[claude-test CLI framework](https://github.com/terryso/claude-test)**. While this project contains working examples and comprehensive documentation, **the framework code and CLI commands are now maintained in the official `claude-test` npm package**.

This YAML-based Playwright testing framework supports multi-environment configuration, reusable step libraries, and natural language test descriptions.

## Prerequisites

### For New Projects (Recommended)
1. **Install claude-test CLI globally**: `npm install -g claude-test`
2. **Initialize framework in your project**: `claude-test init`
3. **Install Playwright MCP**: `claude mcp add playwright -- npx -y @playwright/mcp@latest`

### For This Demo Project
- Install Playwright MCP: `claude mcp add playwright -- npx -y @playwright/mcp@latest`
- Project URL: https://github.com/microsoft/playwright-mcp

## Available Commands

**Note**: These commands are maintained by the **[claude-test CLI framework](https://github.com/terryso/claude-test)**. For new projects, use `claude-test init` to get these commands automatically.

### 🚀 Test Execution
- **run-yaml-test**: Execute YAML test cases with tag filtering and report generation
  - Parameters: `file`(optional), `env`(optional), `tags`(optional)
  - 📊 **Report Generation**: Automatically generates test reports based on `GENERATE_REPORT` environment variable

- **run-test-suite**: Execute YAML test suites with multiple organized test cases
  - Parameters: `suite`(optional), `env`(optional), `tags`(optional)
  - 🗂️ **Suite Features**: Suite-level configuration, pre/post actions, consolidated reporting

### ✅ Test Validation  
- **validate-yaml-test**: Validate test case syntax and completeness
  - Parameters: `file`(required), `env`(optional)

- **validate-test-suite**: Validate test suite configuration and test case references
  - Parameters: `suite`(required), `env`(optional)

### 📊 Report Management
- **view-reports-index**: View comprehensive test report index with environment switching
  - Parameters: None (auto-scans all environments)
  - 🌐 **Features**: Local HTTP server, auto browser opening, responsive design

## Quick Start

### For New Projects (Recommended)
1. Install claude-test CLI: `npm install -g claude-test`
2. Initialize framework: `claude-test init`
3. Install Playwright MCP
4. Configure environment variables in `.env.*` files
5. Run tests: `/run-yaml-test file:test-cases/example.yml env:dev`

### For This Demo Project
1. Install Playwright MCP
2. Install Node.js dependencies: `npm install`
3. Configure environment variables in `.env.*` files
4. Run tests: `/run-yaml-test file:test-cases/example.yml env:dev`
5. Check documentation: @docs/README.md
6. Run test suites: `/run-test-suite suite:test-suites/smoke-tests.yml env:dev`

## Documentation

### 📚 Complete Documentation
- **[📖 Documentation Index](docs/README.md)** - Central documentation hub with language selection
- **[📘 Main README (English)](README.md)** - Project overview, core concepts, and quick start
- **[📘 主要说明文档 (中文)](README.cn.md)** - 项目概览、核心概念和快速开始

### 🇺🇸 English Documentation
- **[📖 Installation Guide](docs/en/installation.md)** - Complete setup instructions
- **[🏗️ Project Structure](docs/en/project-structure.md)** - Framework architecture
- **[⚡ Commands Reference](docs/en/commands.md)** - All available commands
- **[📝 YAML Format Guide](docs/en/yaml-format.md)** - Writing tests and step libraries
- **[🔧 Environment Configuration](docs/en/environment-config.md)** - Multi-environment setup
- **[✨ Best Practices](docs/en/best-practices.md)** - Testing strategies and tips

### 🇨🇳 中文文档
- **[📖 安装指南](docs/cn/installation.md)** - 完整的安装说明
- **[🏗️ 项目结构](docs/cn/project-structure.md)** - 框架架构
- **[⚡ 命令详解](docs/cn/commands.md)** - 所有可用命令
- **[📝 YAML格式说明](docs/cn/yaml-format.md)** - 编写测试和步骤库
- **[🔧 环境配置](docs/cn/environment-config.md)** - 多环境设置
- **[✨ 最佳实践](docs/cn/best-practices.md)** - 测试策略和技巧

## Key Features

- 🌍 **Multi-Environment Support**: Support for dev/test/prod environments with automatic configuration loading
- 📚 **Reusable Step Libraries**: Reusable step libraries with parameterization support
- 🗣️ **Natural Language**: Direct use of natural language for test step descriptions
- 🔧 **Environment Variables**: Automatic configuration loading from .env files
- 📊 **Smart Reporting**: Template-based test report generation with embedded data (overview/detailed styles)
- 📝 **Input Prompts**: Parameter prompts and descriptions for every command
- ⚡ **Automated Processing**: YAML test processor script for efficient test case analysis and execution
- 🚀 **Session Persistence**: Revolutionary cross-command session persistence with automatic state restoration
- 🔄 **Performance Enhanced**: 80-95% faster execution with persistent sessions after first login
- 🗂️ **Test Suites**: Organize and execute multiple test cases with suite-level configuration and reporting

## Environment Variable Support

Supported environment variables:
- `BASE_URL`: Base URL for testing
- `TEST_USERNAME/TEST_PASSWORD`: Test account credentials
- `USER_USERNAME/USER_PASSWORD`: Regular user account credentials
- `BROWSER_TIMEOUT`: Browser timeout duration
- `SCREENSHOT_PATH/REPORT_PATH`: File path configurations
- `GENERATE_REPORT`: Whether to generate test reports (true/false)
- `REPORT_FORMAT`: Report format (html/json/xml)

## Session Persistence Configuration

**NEW**: Playwright MCP is configured with persistent session support:
- **Storage State**: `~/.cache/claude-playwright/auth-state.json`
- **User Data**: `~/.cache/claude-playwright/`
- **Auto-save**: Login sessions automatically saved
- **Auto-restore**: Sessions automatically restored across commands
- **Clear session**: Delete auth-state.json to reset login

## Report Generation Mandate

**CRITICAL**: Always use the two-step report generation process:
1. **Step 1**: Use `.claude/scripts/create-report-data.js` to create JSON data files
2. **Step 2**: Use `node .claude/scripts/gen-report.js --data=filename.json` to generate reports

**DO NOT** use the deprecated `test-case-report-generator.js` script for any report generation.

## Related Projects

- **📦 [claude-test CLI](https://github.com/terryso/claude-test)** - Official CLI tool for framework management
- **🎬 [Demo Video](https://www.youtube.com/watch?v=tx3xExU_Xhc)** - Live demonstration of YAML testing
- **📖 [Medium Article](https://medium.com/@oxtiger/stop-writing-brittle-playwright-tests-why-yaml-based-testing-is-the-future-5cc90a81bfa2)** - In-depth framework explanation

---

*This demo project showcases the power of the [claude-test CLI framework](https://github.com/terryso/claude-test). For new projects, install the CLI globally and use `claude-test init` to get started.*