# Installation Guide

## 🔧 Prerequisites

### Install Playwright MCP

This project depends on Playwright MCP to execute browser automation. **Important**: Use the following command to enable session persistence features:

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest \
  --user-data-dir ~/.cache/claude-playwright \
  --storage-state ~/.cache/claude-playwright/auth-state.json \
  --save-trace \
  --output-dir ~/CascadeProjects/claude-code-playwright-mcp-test/screenshots
```

**New Features Explained**:
- `--storage-state`: Automatically save and restore login sessions
- `--user-data-dir`: Persistent browser data directory
- `--save-trace`: Save debugging trace files
- `--output-dir`: Specify screenshot output directory

For more installation information, please refer to: [Playwright MCP Official Repository](https://github.com/microsoft/playwright-mcp)

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

### 4. View Test Reports

```bash
# Launch report index viewer to browse all test reports
/view-reports-index

# Or use npm command
npm run view-reports
```