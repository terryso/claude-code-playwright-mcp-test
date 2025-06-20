# Command Reference

All commands are located in the `.claude/` directory with parameter prompts.

## 🚀 Test Execution

### `/run-yaml-test`
Execute YAML test cases with multi-environment configuration, tag filtering, and report generation support.

### `/run-test-suite`
Execute YAML test suites containing multiple organized test cases with suite-level configuration and reporting.

**Test Case Parameters:**
- `file` (optional): Test case file path, if not provided, executes all cases in test-cases directory
- `env` (optional): Environment name (dev/test/prod), defaults to dev
- `tags` (optional): Tag filtering, supports single or multiple tag combinations

**Test Suite Parameters:**
- `suite` (optional): Test suite file path, if not provided, executes all suites in test-suites directory
- `env` (optional): Environment name (dev/test/prod), defaults to suite's configured environment or dev
- `tags` (optional): Tag filtering for both suite-level and test-level tags

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

# Execute specific test suite
/run-test-suite suite:e-commerce.yml env:test

# Execute all smoke test suites
/run-test-suite tags:smoke env:dev

# Execute all test suites
/run-test-suite env:test
```

## ✅ Test Validation

### `/validate-yaml-test`
Validate YAML test case syntax and reference completeness.

### `/validate-test-suite`
Validate YAML test suite configuration and test case references.

**Test Case Validation Parameters:**
- `file` (required): Path to test case file to validate
- `env` (optional): Environment name for environment variable validation

**Test Suite Validation Parameters:**
- `suite` (required): Path to test suite file to validate
- `env` (optional): Environment name for environment variable validation

**Examples:**
```bash
# Validate test case
/validate-yaml-test file:test-cases/complex-test.yml env:test

# Validate test suite
/validate-test-suite suite:e-commerce.yml env:test
```

## 📊 Report Management

### `/view-reports-index`
Launch a comprehensive test report index viewer with environment switching and report browsing capabilities.

**Features:**
- 📊 **Auto-discovery**: Automatically scans all environments for test reports
- 🎯 **Environment Switching**: Support for dev/test/prod environment tab switching
- 📈 **Statistics**: Shows report statistics for each environment
- 🔍 **Report Details**: Displays report type, size, generation time, and other information
- 📱 **Responsive Design**: Supports desktop and mobile device access
- 🌐 **Local Server**: Runs on localhost:8080 with auto browser opening

**What it does:**
1. **Refresh Report Index**: Scans all environment directories and generates latest report list
2. **Start Local Server**: Launches HTTP server to host the report index page
3. **Open Browser**: Automatically opens the report index page in your browser

**No parameters required** - automatically scans all environments.

**Report Types Supported:**
- **Suite Reports**: Multi-test case suite execution reports
- **Test Reports**: Individual test case detailed execution reports  
- **Batch Reports**: Comprehensive reports for batch test executions

**Examples:**
```bash
# Launch report index viewer (Claude Code command)
/view-reports-index

# The command will:
# 1. Scan reports/dev/, reports/test/, reports/prod/ directories
# 2. Generate reports/index.json data file
# 3. Start local HTTP server on port 8080
# 4. Open http://localhost:8080/index.html in browser
```

**Manual npm startup** (alternative method):
```bash
# Method 1: Using npm script (recommended)
npm run view-reports

# Method 2: Using alternative npm script
npm run reports-server

# Method 3: Direct node command
node scripts/start-report-server.js

# All methods will:
# - Automatically scan all environment reports
# - Start HTTP server on localhost:8080
# - Open browser automatically
# - Provide real-time report management interface
```

**Server Features:**
- 🌐 **Auto Browser Opening**: Automatically opens http://localhost:8080/index.html
- 🔄 **Live Refresh**: Manual refresh button to update report lists
- 📊 **Real-time Statistics**: Environment-based report counts and statistics
- 🎯 **Environment Filtering**: Tab-based environment switching (dev/test/prod)
- 📱 **Responsive UI**: Works on desktop and mobile devices
- 🔍 **Report Search**: Easy browsing and filtering of test reports