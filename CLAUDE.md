# Claude Code YAML Testing Project

## Overview

This is a YAML-based Playwright testing framework that supports multi-environment configuration, reusable step libraries, and natural language test descriptions.

## Prerequisites

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
├── scripts/                   # Automation scripts
│   ├── yaml-test-processor.js # YAML test processing engine
│   ├── test-case-report-generator.js # Test case report generator
│   └── suite-report-generator.js     # Test suite report generator
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
├── package.json               # Node.js dependencies
├── CLAUDE.md                  # Project description and command index
└── README.md                  # This document
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

## Quick Start

1. Install Playwright MCP
2. Install Node.js dependencies: `npm install`
3. Configure environment variables in `.env.*` files
4. Run tests: `/run-yaml-test file:test-cases/example.yml env:dev`
5. Run test suites: `/run-test-suite suite:test-suites/smoke-tests.yml env:dev`

## YAML Test Processor

The framework includes an automated YAML test processor (`scripts/yaml-test-processor.js`) that handles:

- **Tag Filtering**: Automatically identifies test cases matching tag criteria
- **Step Library Expansion**: Expands `include` references to insert step library content
- **Environment Variable Substitution**: Replaces `{{ENV_VAR}}` placeholders with actual values
- **Test Case Analysis**: Provides structured output for AI execution
- **Test Suite Processing**: Handles test suite organization and batch execution

### Usage Examples:
```bash
# Process smoke tests for dev environment
node scripts/yaml-test-processor.js --env=dev --tags=smoke

# Process specific test file
node scripts/yaml-test-processor.js --file=order.yml --env=test

# Process tests with complex tag filtering
node scripts/yaml-test-processor.js --tags="smoke,login|critical"

# Process test suites
node scripts/yaml-test-processor.js --suites --env=test

# Process specific test suite
node scripts/yaml-test-processor.js --suite=e-commerce.yml --env=prod
```

### AI Integration:
When executing tests with `/run-yaml-test` and `/run-test-suite`, the AI can now:
1. Call the processor script to get analyzed test cases or test suites
2. Use the processed output directly with Playwright MCP
3. Generate reports based on execution results

This significantly improves performance and reduces the need for manual test case analysis.

## Report Generation Scripts

The framework includes dedicated report generation scripts for standardized reporting:

### Test Case Report Generator (`scripts/test-case-report-generator.js`)
- **Purpose**: Generate reports for individual test case executions
- **Features**: 
  * Automatic template selection based on `REPORT_STYLE` (overview/detailed)
  * Embedded JSON data generation (no external files)
  * Timestamp-based file naming: `test-{testname}-{timestamp}.html`
  * Automatic `latest-test-report.html` redirect updates
- **Usage**: Called automatically by `/run-yaml-test` when `GENERATE_REPORT=true`

### Suite Report Generator (`scripts/suite-report-generator.js`)
- **Purpose**: Generate consolidated reports for test suite executions
- **Features**:
  * Suite-level metrics and statistics
  * Consolidated test case results
  * Performance analysis across multiple test cases
  * Timestamp-based file naming: `suite-{suitename}-{timestamp}.html`
  * Automatic `latest-suite-report.html` redirect updates
- **Usage**: Called automatically by `/run-test-suite` when `GENERATE_REPORT=true`

### Report Configuration
- **Templates**: Located in `reports/template-overview.html` and `reports/template-detailed.html`
- **Output Paths**: Environment-specific directories (`reports/dev/`, `reports/test/`, `reports/prod/`)
- **Embedded Data**: All test data embedded directly in HTML files for reliable loading
- **Styles**: 
  * `overview`: Fast generation, summary information only
  * `detailed`: Complete step-by-step execution details

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