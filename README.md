# Playwright YAML Testing Framework

[![GitHub stars](https://img.shields.io/github/stars/terryso/claude-code-playwright-mcp-test.svg)](https://github.com/terryso/claude-code-playwright-mcp-test/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/terryso/claude-code-playwright-mcp-test/pulls)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Playwright MCP](https://img.shields.io/badge/Playwright-MCP-green.svg)](https://github.com/microsoft/playwright-mcp)
[![DeepWiki](https://img.shields.io/badge/DeepWiki-项目文档-blue)](https://deepwiki.com/terryso/claude-code-playwright-mcp-test)

> **[中文文档](README.cn.md)** | **English Documentation**

A YAML-based Playwright automation testing framework designed for Claude Code, supporting multi-environment configuration, reusable step libraries, and natural language test descriptions.

## 🎬 Demo Video

Watch the live demonstration of YAML-based Playwright testing in action:

[![YAML Playwright Testing Demo](https://img.youtube.com/vi/tx3xExU_Xhc/maxresdefault.jpg)](https://www.youtube.com/watch?v=tx3xExU_Xhc)

**📺 [Watch Demo Video](https://www.youtube.com/watch?v=tx3xExU_Xhc)** - See how to write and execute tests using natural language with Claude Code and Playwright MCP.

## 📊 Latest Test Results

View the most recent test execution report:

**📈 [Latest Test Report](reports/test/latest-test-report.html)** - Automatically generated after each test run, showing detailed execution results, screenshots, and performance metrics.

### Sample Test Report

Here's what a typical test execution report looks like:

![YAML Test Report Sample](https://github.com/terryso/claude-code-playwright-mcp-test/blob/develop/assets/test-report-sample.png)

**Report Features:**
- 📊 **Comprehensive Statistics**: Total cases, passed/failed counts, step execution details
- 📋 **Configuration Details**: Environment settings, report generation settings, file paths
- 🎯 **Success Metrics**: Clear visualization of test results and success rates
- 🔧 **Environment Info**: Automatic detection and display of test environment configuration

## 🌟 Key Features

- **🌍 Multi-Environment Support**: Support for dev/test/prod environments with automatic configuration loading
- **📚 Reusable Step Libraries**: Parameterized reusable step libraries to improve testing efficiency
- **🗣️ Natural Language**: Direct use of natural language for test step descriptions, easy to read and write
- **🔧 Environment Variables**: Automatic configuration loading from .env files, secure management of sensitive information
- **📊 Smart Reporting**: Configurable test report generation supporting HTML/JSON formats
- **📝 Smart Prompts**: Claude Code project commands support parameter prompts
- **🚀 Quick Setup**: Complete project template and examples

## 🔧 Prerequisites

### Install Playwright MCP

This project depends on Playwright MCP to execute browser automation. Please install first:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

For more installation information, please refer to: [Playwright MCP Official Repository](https://github.com/microsoft/playwright-mcp)

## 📁 Project Structure

```
├── .claude/                    # Claude Code project commands
│   └── commands/              # Commands directory
│       ├── run-yaml-test.md   # Execute test command
│       └── validate-yaml-test.md # Validate test command
├── .env.example               # Environment variable template
├── .env.dev                   # Development environment configuration
├── .env.test                  # Test environment configuration
├── .env.prod                  # Production environment configuration
├── steps/                     # Reusable step libraries
│   ├── login.yml              # Login step library
│   └── cleanup.yml            # Cleanup step library
├── test-cases/                # Test cases
│   └── order.yml              # Order test case
├── screenshots/               # Test screenshots (organized by environment)
├── reports/                   # Test reports (organized by environment)
├── CLAUDE.md                  # Project description and command index
└── README.md                  # This document
```

## 🚀 Quick Start

### 1. Install Dependencies

Ensure Playwright MCP is installed (refer to prerequisites above).

> 💡 **New to the project?** Watch our [demo video](https://www.youtube.com/watch?v=tx3xExU_Xhc) first to see the framework in action!

### 2. Configure Environment Variables

Edit the corresponding environment configuration files:

```bash
# Development environment
.env.dev

# Test environment  
.env.test

# Production environment
.env.prod
```

### 3. Execute Tests

```bash
# Use project commands in Claude Code to execute order tests
/run-yaml-test file:test-cases/order.yml env:dev
```

## 📋 Command Reference

### 🚀 Test Execution

#### `/run-yaml-test`
Execute YAML test cases with multi-environment configuration, tag filtering, and report generation support.

**Parameters:**
- `file` (optional): Test case file path, if not provided, executes all cases in test-cases directory
- `env` (optional): Environment name (dev/test/prod), defaults to dev
- `tags` (optional): Tag filtering, supports single or multiple tag combinations

**Tag Filtering Syntax:**
- Single tag: `smoke`
- Multiple tags AND: `smoke,login` (must contain both)
- Multiple tags OR: `smoke|login` (contains either)
- Mixed conditions: `smoke,login|critical`

**Report Generation:**
- Automatically generates test reports based on environment variable `GENERATE_REPORT`
- Supports HTML/JSON formats (configured via `REPORT_FORMAT`)
- Reports saved to directory specified by `REPORT_PATH`

**Examples:**
```bash
# Execute specific file
/run-yaml-test file:test-cases/order.yml env:dev

# Execute all smoke tagged tests
/run-yaml-test tags:smoke env:prod

# Execute tests containing both smoke and order tags
/run-yaml-test tags:smoke,order env:test

# Execute tests containing order or checkout tags
/run-yaml-test tags:order|checkout env:dev

# Execute all test cases
/run-yaml-test env:dev
```

### ✅ Test Validation

#### `/validate-yaml-test`
Validate YAML test case syntax and reference completeness.

**Parameters:**
- `file` (required): Path to test case file to validate
- `env` (optional): Environment name for environment variable validation

**Examples:**
```bash
/validate-yaml-test file:test-cases/complex-test.yml env:test
```

## 📝 YAML Format Guide

### Step Library Format

Step libraries use concise natural language descriptions:

```yaml
# steps/login.yml
# Supported environment variables: BASE_URL, TEST_USERNAME, TEST_PASSWORD
steps:
  - "Open {{BASE_URL}} page"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Verify page displays Swag Labs"
```

### Test Case Format

Test cases contain tags and steps, can reference step libraries or define steps directly:

```yaml
# test-cases/order.yml
# Environment variables are automatically loaded from .env.{environment} files
tags:
  - smoke
  - order  
  - checkout
steps:
  - include: "login"                           # Reference login step library
  - "Click Add to Cart button for first product"      # Direct step definition
  - "Click Add to Cart button for second product"
  - "Click shopping cart icon in top right"
  - "Enter First Name"
  - "Enter Last Name"
  - "Enter Postal Code"
  - "Click Continue button"
  - "Click Finish button"
  - "Verify page displays Thank you for your order!"
  - include: "cleanup"                         # Reference cleanup step library
```

## 🔧 Environment Configuration

### Environment Variable Reference

Supported environment variable types:

```bash
# .env.dev example
# Basic configuration
BASE_URL=https://dev.myapp.com

# Test account
TEST_USERNAME=dev_admin
TEST_PASSWORD=dev123

# Regular user account
USER_USERNAME=dev_user@example.com
USER_PASSWORD=devpass123

# Browser configuration
BROWSER_TIMEOUT=30000

# File paths
SCREENSHOT_PATH=screenshots/dev
REPORT_PATH=reports/dev

# Report configuration
GENERATE_REPORT=true
REPORT_FORMAT=html
```

### Multi-Environment Switching

```bash
# Development environment
/run-yaml-test file:test-cases/order.yml env:dev

# Test environment
/run-yaml-test file:test-cases/order.yml env:test

# Production environment
/run-yaml-test file:test-cases/order.yml env:prod
```

## 📚 Best Practices

### 1. Step Library Design

- **Single Responsibility**: Each step library focuses on one functional area
- **Parameterization**: Use environment variables instead of hardcoded values
- **Reusability**: Design generic steps that can be reused by multiple test cases

```yaml
# ✅ Good step library design
# steps/form-validation.yml
steps:
  - "Fill {{FIELD_NAME}} field with {{INVALID_VALUE}}"
  - "Click submit button"
  - "Verify page displays error message: {{ERROR_MESSAGE}}"
```

### 2. Test Case Organization

- **Tag Classification**: Use reasonable tags to classify test cases
- **Logical Grouping**: Organize test cases by functional modules  
- **Environment Adaptation**: Consider differences between environments
- **Cleanup Mechanism**: Perform appropriate cleanup after each test

```yaml
# ✅ Good test case structure
tags:
  - smoke        # Smoke test
  - login        # Login functionality
  - critical     # Critical functionality
steps:
  - include: "setup"           # Test preparation
  - include: "login"           # Login
  - "Execute core test steps"  # Main test logic
  - include: "cleanup"         # Environment cleanup
```

### 3. Tagging Strategy

- **Functional Tags**: Classify by functional modules, e.g., login, user, api
- **Priority Tags**: e.g., critical, high, medium, low
- **Type Tags**: e.g., smoke, regression, integration
- **Environment Tags**: e.g., dev-only, prod-safe

### 4. Environment Configuration

- **Sensitive Information**: Use environment variables for all passwords and API keys
- **Environment Isolation**: Use independent configuration files for different environments
- **Documentation**: Document all required variables in .env.example

## 🗺️ Roadmap

We're actively working on exciting new features to make YAML-based testing even more powerful:

### 🔄 Upcoming Features

#### 1. **Test Suites Support**
- **🗂️ Suite Organization**: Group related test cases into logical suites
- **📦 Batch Execution**: Run entire test suites with a single command
- **🏷️ Suite-level Configuration**: Environment variables and settings per suite
- **📋 Suite Reporting**: Aggregated reports across multiple test cases

```yaml
# Example: test-suites/e-commerce.yml
name: "E-commerce Test Suite"
description: "Complete e-commerce workflow testing"
environment: "test"
test-cases:
  - "test-cases/login.yml"
  - "test-cases/product-search.yml"
  - "test-cases/cart-operations.yml"
  - "test-cases/checkout.yml"
```

#### 2. **Cursor IDE Support**
- **🎨 Syntax Highlighting**: Rich YAML syntax highlighting for test files
- **🔍 IntelliSense**: Auto-completion for step libraries and environment variables
- **🛠️ Test Runner Integration**: Execute tests directly from Cursor IDE
- **🐛 Debug Support**: Breakpoints and step-by-step debugging
- **📖 Documentation Hover**: Inline documentation for test steps

### 📅 Release Timeline

| Feature | Status | Expected Release |
|---------|--------|------------------|
| Test Suites Support | 🚧 In Development | Q2 2025 |
| Cursor IDE MDC Support | 📋 Planned | Q2 2025 |

### 💡 Feature Requests

Have ideas for new features? We'd love to hear from you!
- Open an [Issue](https://github.com/terryso/claude-code-playwright-mcp-test/issues) with the `enhancement` label
- Join discussions in our community
- Contribute to the roadmap planning

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📺 Resources

- **🎬 [Demo Video](https://www.youtube.com/watch?v=tx3xExU_Xhc)** - Live demonstration of the framework
- **📈 [Latest Test Report](reports/test/latest-test-report.html)** - Most recent test execution results
- **📖 [Medium Article](https://medium.com/@oxtiger/stop-writing-brittle-playwright-tests-why-yaml-based-testing-is-the-future-5cc90a81bfa2)** - Detailed explanation and benefits
- **🛠️ [Claude Code](https://claude.ai/code)** - AI-powered development environment
- **🎭 [Playwright MCP](https://github.com/microsoft/playwright-mcp)** - Browser automation integration

## 🆘 Support

If you encounter issues or have suggestions:

1. Watch the [demo video](https://www.youtube.com/watch?v=tx3xExU_Xhc) for visual guidance
2. Check this README documentation
3. Review [Issues](https://github.com/terryso/claude-code-playwright-mcp-test/issues) 
4. Create a new Issue describing the problem
5. Use `/help` in Claude Code for more assistance

---

**Happy Testing! 🚀**