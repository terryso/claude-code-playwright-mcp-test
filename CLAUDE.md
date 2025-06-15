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

## Features

- 🌍 **Multi-Environment Support**: Support for dev/test/prod environments with automatic configuration loading
- 📚 **Reusable Step Libraries**: Reusable step libraries with parameterization support
- 🗣️ **Natural Language**: Direct use of natural language for test step descriptions
- 🔧 **Environment Variables**: Automatic configuration loading from .env files
- 📊 **Smart Reporting**: Configurable test report generation supporting HTML/JSON formats
- 📝 **Input Prompts**: Parameter prompts and descriptions for every command

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
2. Configure environment variables in `.env.*` files
3. Run tests: `/run-yaml-test file:test-cases/example.yml env:dev`

## Environment Variable Support

Supported environment variables:
- `BASE_URL`: Base URL for testing
- `TEST_USERNAME/TEST_PASSWORD`: Test account credentials
- `USER_USERNAME/USER_PASSWORD`: Regular user account credentials
- `BROWSER_TIMEOUT`: Browser timeout duration
- `SCREENSHOT_PATH/REPORT_PATH`: File path configurations
- `GENERATE_REPORT`: Whether to generate test reports (true/false)
- `REPORT_FORMAT`: Report format (html/json/xml)