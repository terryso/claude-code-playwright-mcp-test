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
│       └── validate-yaml-test.md # Validate test command
├── scripts/                   # Automation scripts
│   └── yaml-test-processor.js # YAML test processing engine
├── .env.example               # Environment variable template
├── .env.dev                   # Development environment configuration
├── .env.test                  # Test environment configuration
├── .env.prod                  # Production environment configuration
├── steps/                     # Reusable step libraries
│   ├── login.yml              # Login step library
│   └── cleanup.yml            # Cleanup step library
├── test-cases/                # Test cases
│   ├── order.yml              # Order test case
│   └── sort.yml               # Sort test case
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
- 📊 **Smart Reporting**: Configurable test report generation supporting HTML/JSON formats
- 📝 **Input Prompts**: Parameter prompts and descriptions for every command
- ⚡ **Automated Processing**: YAML test processor script for efficient test case analysis and execution

## Available Commands

All commands are located in the `.claude/` directory with parameter prompts:

### 🚀 Test Execution
- **run-yaml-test**: Execute YAML test cases with tag filtering and report generation
  - Parameters: `file`(optional), `env`(optional), `tags`(optional)
  - 📊 **Report Generation**: Automatically generates test reports based on `GENERATE_REPORT` environment variable

### ✅ Test Validation  
- **validate-yaml-test**: Validate test case syntax and completeness
  - Parameters: `file`(required), `env`(optional)

## Quick Start

1. Install Playwright MCP
2. Install Node.js dependencies: `npm install`
3. Configure environment variables in `.env.*` files
4. Run tests: `/run-yaml-test file:test-cases/example.yml env:dev`

## YAML Test Processor

The framework includes an automated YAML test processor (`scripts/yaml-test-processor.js`) that handles:

- **Tag Filtering**: Automatically identifies test cases matching tag criteria
- **Step Library Expansion**: Expands `include` references to insert step library content
- **Environment Variable Substitution**: Replaces `{{ENV_VAR}}` placeholders with actual values
- **Test Case Analysis**: Provides structured output for AI execution

### Usage Examples:
```bash
# Process smoke tests for dev environment
node scripts/yaml-test-processor.js --env=dev --tags=smoke

# Process specific test file
node scripts/yaml-test-processor.js --file=order.yml --env=test

# Process tests with complex tag filtering
node scripts/yaml-test-processor.js --tags="smoke,login|critical"
```

### AI Integration:
When executing tests with `/run-yaml-test`, the AI can now:
1. Call the processor script to get analyzed test cases
2. Use the processed output directly with Playwright MCP
3. Generate reports based on execution results

This significantly improves performance and reduces the need for manual test case analysis.

## Environment Variable Support

Supported environment variables:
- `BASE_URL`: Base URL for testing
- `TEST_USERNAME/TEST_PASSWORD`: Test account credentials
- `USER_USERNAME/USER_PASSWORD`: Regular user account credentials
- `BROWSER_TIMEOUT`: Browser timeout duration
- `SCREENSHOT_PATH/REPORT_PATH`: File path configurations
- `GENERATE_REPORT`: Whether to generate test reports (true/false)
- `REPORT_FORMAT`: Report format (html/json/xml)