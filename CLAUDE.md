# Claude Test Framework - Demo Project

## Overview

This is a **live demonstration project** for the **[claude-test CLI framework](https://github.com/terryso/claude-test)**. While this project contains working examples and comprehensive documentation, **the framework code and CLI commands are now maintained in the official `claude-test` npm package**.

This YAML-based Playwright testing framework supports multi-environment configuration, reusable step libraries, and natural language test descriptions.

## Prerequisites

### For New Projects (Recommended)
1. **Install claude-test CLI globally**:
   ```bash
   npm install -g claude-test
   ```
2. **Initialize framework in your project**:
   ```bash
   cd your-project
   claude-test init
   ```
3. **Install Playwright MCP**:
   - Project URL: https://github.com/microsoft/playwright-mcp
   - Installation: `claude mcp add playwright -- npx -y @playwright/mcp@latest`

### For This Demo Project
This project requires Playwright MCP:
- Project URL: https://github.com/microsoft/playwright-mcp
- Installation: `claude mcp add playwright -- npx -y @playwright/mcp@latest`

## Project Structure

```
├── .claude/                    # Claude Code project commands
│   └── commands/              # Commands directory
│       ├── run-yaml-test.md   # Execute test command
│       ├── validate-yaml-test.md # Validate test command
│       ├── run-test-suite.md  # Execute test suite command
│       └── validate-test-suite.md # Validate test suite command
├── .claude/                    # Claude Code project commands and scripts
│   ├── commands/              # Commands directory
│   │   ├── run-yaml-test.md   # Execute test command
│   │   ├── validate-yaml-test.md # Validate test command
│   │   ├── run-test-suite.md  # Execute test suite command
│   │   └── validate-test-suite.md # Validate test suite command
│   └── scripts/               # Automation scripts
│   ├── yaml-test-processor.js # YAML test processing engine
│   ├── create-report-data.js   # Report data creation (Step 1 of two-step reporting)
│   ├── gen-report.js          # JSON-based report generator (Step 2 of two-step reporting)
│   ├── suite-report-generator.js # Test suite report generator
│   ├── scan-reports.js        # Report scanning and indexing utility
│   ├── start-report-server.js # Local HTTP server for viewing reports
│   └── *.test.js              # Comprehensive test coverage for all scripts
├── .env.example               # Environment variable template
├── .env.dev                   # Development environment configuration
├── .env.test                  # Test environment configuration
├── .env.prod                  # Production environment configuration
├── steps/                     # Reusable step libraries
│   ├── login.yml              # Traditional login step library
│   ├── session-persist.yml    # NEW - Persistent session management
│   ├── session-check.yml      # Intelligent session checking
│   ├── ensure-products-page.yml # Navigate to products page
│   └── cleanup.yml            # Cleanup step library
├── test-cases/                # Test cases
│   ├── order.yml              # Order test case
│   ├── sort.yml               # Sort test case
│   ├── sort-optimized.yml     # Session-optimized sort test
│   └── product-details.yml    # Product details test case
├── test-suites/               # Test suites (NEW)
│   ├── e-commerce.yml         # E-commerce test suite
│   ├── smoke-tests.yml        # Smoke test suite
│   └── regression.yml         # Regression test suite
├── screenshots/               # Test screenshots (organized by environment)
├── reports/                   # Test reports (organized by environment)
├── docs/                      # Documentation
│   ├── en/                    # English documentation
│   │   ├── README.md          # English docs index
│   │   ├── installation.md    # Installation guide
│   │   ├── project-structure.md # Project structure
│   │   ├── commands.md        # Commands reference
│   │   ├── yaml-format.md     # YAML format guide
│   │   ├── environment-config.md # Environment configuration
│   │   └── best-practices.md  # Best practices
│   ├── cn/                    # Chinese documentation
│   │   ├── README.md          # Chinese docs index
│   │   ├── installation.md    # 安装指南
│   │   ├── project-structure.md # 项目结构
│   │   ├── commands.md        # 命令详解
│   │   ├── yaml-format.md     # YAML格式说明
│   │   ├── environment-config.md # 环境配置
│   │   └── best-practices.md  # 最佳实践
│   └── README.md              # Documentation index
├── package.json               # Node.js dependencies
├── CLAUDE.md                  # Project description and command index
├── README.md                  # Main README (English)
└── README.cn.md               # Main README (Chinese)
```

## Features

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

## Available Commands

**Note**: These commands are maintained by the **[claude-test CLI framework](https://github.com/terryso/claude-test)**. For new projects, use `claude-test init` to get these commands automatically.

All commands are located in the `.claude/` directory with parameter prompts:

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
  - 📈 **Statistics**: Environment-based report counts and statistics

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
5. Check documentation: [docs/README.md](docs/README.md)
6. Run test suites: `/run-test-suite suite:test-suites/smoke-tests.yml env:dev`

## YAML Test Processor

The framework includes an automated YAML test processor (`.claude/scripts/yaml-test-processor.js`) that handles:

- **Tag Filtering**: Automatically identifies test cases matching tag criteria
- **Step Library Expansion**: Expands `include` references to insert step library content
- **Environment Variable Substitution**: Replaces `{{ENV_VAR}}` placeholders with actual values
- **Test Case Analysis**: Provides structured output for AI execution
- **Test Suite Processing**: Handles test suite organization and batch execution

### Usage Examples:
```bash
# Process smoke tests for dev environment
node .claude/scripts/yaml-test-processor.js --env=dev --tags=smoke

# Process specific test file
node .claude/scripts/yaml-test-processor.js --file=order.yml --env=test

# Process tests with complex tag filtering
node .claude/scripts/yaml-test-processor.js --tags="smoke,login|critical"

# Process test suites
node .claude/scripts/yaml-test-processor.js --suites --env=test

# Process specific test suite
node .claude/scripts/yaml-test-processor.js --suite=e-commerce.yml --env=prod
```

### AI Integration:
When executing tests with `/run-yaml-test` and `/run-test-suite`, the AI can now:
1. Call the processor script to get analyzed test cases or test suites
2. Use the processed output directly with Playwright MCP
3. Generate reports based on execution results

This significantly improves performance and reduces the need for manual test case analysis.

## Two-Step Report Generation System

The framework uses a **revolutionary two-step report generation approach** for clean separation of data creation and report rendering:

⚠️ **IMPORTANT FOR AI**: Always use this two-step approach for report generation. Do NOT use the deprecated `test-case-report-generator.js` script.

### Step 1: Report Data Creation (`.claude/scripts/create-report-data.js`)
- **Purpose**: Create standardized JSON data files containing all test execution information
- **Features**: 
  * Structured data format for test cases, suites, and execution results
  * Automatic REPORT_PATH environment variable handling
  * Support for single tests, batch tests, and test suites
  * ReportDataCreator class with helper functions
- **Key Functions**:
  * `createAndSaveTestData(testCase, execution, fileName, options)` - Single test data
  * `createAndSaveBatchData(testCases, execution, fileName, options)` - Batch test data
  * `createAndSaveSuiteData(suite, results, fileName, options)` - Suite data
  * `quickCreateTestData(name, status, duration, fileName, options)` - Quick creation

### Step 2: JSON-Based Report Generation (`.claude/scripts/gen-report.js`)
- **Purpose**: Generate HTML reports from JSON data files
- **Features**:
  * Template-free report generation (no external dependencies)
  * Embedded CSS and JavaScript in HTML output
  * Support for both test and suite report types
  * Automatic latest-report link creation
- **Usage**: `node .claude/scripts/gen-report.js --data=/path/to/data.json`

### Utility Scripts
- **Report Scanner** (`.claude/scripts/scan-reports.js`): Index and organize generated reports
- **Report Server** (`.claude/scripts/start-report-server.js`): Local HTTP server for viewing reports
- **Comprehensive Testing**: All scripts include `.test.js` files for reliability

### Two-Step Workflow Benefits
- **Clean Separation**: Data creation and report generation are independent
- **No Dynamic Code Execution**: All data pre-structured in JSON files
- **Reusable Data**: JSON files can be stored, versioned, and reused
- **Template-Free**: No external template dependencies
- **Reliable Loading**: All data embedded directly in HTML files

### Two-Step Report Generation Examples

**Example 1: Single Test Case Report**
```javascript
// Step 1: Create data file
const { createAndSaveTestData } = require('./.claude/scripts/create-report-data.js');

const testCase = {
  name: 'sort.yml',
  description: 'Product sorting test',
  tags: ['smoke', 'sort'],
  steps: ['Login to application', 'Sort products by price', 'Verify sorting']
};

const execution = {
  status: 'passed',
  duration: 30000,
  testName: 'sort.yml',
  validations: ['Price verified: $7.99', 'Price verified: $49.99']
};

createAndSaveTestData(testCase, execution, 'sort-test.json', {
  environment: 'dev',
  reportStyle: 'overview'
});

// Step 2: Generate report
// node .claude/scripts/gen-report.js --data=sort-test.json
```

**Example 2: Batch Test Report**
```javascript
// Step 1: Create batch data file
const { createAndSaveBatchData } = require('./.claude/scripts/create-report-data.js');

const testCases = [
  { name: 'sort.yml', description: 'Sorting test', tags: ['smoke'], steps: [...] },
  { name: 'order.yml', description: 'Order test', tags: ['smoke'], steps: [...] }
];

const execution = {
  name: 'smoke-tests-batch',
  status: 'passed',
  duration: 90000,
  testResults: [
    { testName: 'sort.yml', status: 'passed', duration: 30000 },
    { testName: 'order.yml', status: 'passed', duration: 60000 }
  ]
};

createAndSaveBatchData(testCases, execution, 'smoke-batch.json', {
  environment: 'dev'
});

// Step 2: Generate report
// node .claude/scripts/gen-report.js --data=smoke-batch.json
```

**Example 3: Quick Test Data Creation**
```javascript
// Quick single-line creation for simple cases
const { quickCreateTestData } = require('./.claude/scripts/create-report-data.js');

quickCreateTestData('sort.yml', 'passed', 30000, 'quick-test.json', {
  environment: 'dev',
  tags: ['smoke', 'sort'],
  validations: ['All sorting verified']
});

// Step 2: Generate report
// node .claude/scripts/gen-report.js --data=quick-test.json
```

### Report Configuration
- **Output Paths**: Environment-specific directories (`reports/dev/`, `reports/test/`, `reports/prod/`)
- **File Naming**: Timestamp-based: `test-{name}-{timestamp}.html` / `suite-{name}-{timestamp}.html`
- **Latest Links**: Automatic `latest-test-report.html` and `latest-suite-report.html` redirects
- **Styles**: 
  * `overview`: Fast generation, summary information only
  * `detailed`: Complete step-by-step execution details (requires `steps_detail` array in data)

### IMPORTANT: Detailed Report Requirements
**For `REPORT_STYLE=detailed` to show step-by-step details, you MUST include `steps_detail` array in test results:**

```javascript
// ✅ CORRECT - Detailed steps will be shown
const testResult = {
  testName: 'example.yml',
  status: 'passed',
  duration: 30000,
  steps_detail: [
    { step: 1, action: 'Open login page', status: 'passed', duration: 2000 },
    { step: 2, action: 'Fill username field', status: 'passed', duration: 500 },
    { step: 3, action: 'Click login button', status: 'passed', duration: 3000 }
  ]
};

// ❌ INCORRECT - Only summary will be shown (even with REPORT_STYLE=detailed)
const testResult = {
  testName: 'example.yml',
  status: 'passed',
  duration: 30000
  // Missing steps_detail array
};
```

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

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Report Generation Mandate
**CRITICAL**: Always use the two-step report generation process:
1. **Step 1**: Use `.claude/scripts/create-report-data.js` to create JSON data files
2. **Step 2**: Use `node .claude/scripts/gen-report.js --data=filename.json` to generate reports
**DO NOT** use the deprecated `test-case-report-generator.js` script for any report generation.