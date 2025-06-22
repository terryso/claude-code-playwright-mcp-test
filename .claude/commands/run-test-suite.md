# Execute Test Suites

Execute YAML-based test suites containing multiple organized test cases with suite-level configuration and reporting.

## Parameters

- `suite` (optional): Test suite file path, if not provided executes all test suites in test-suites directory
- `env` (optional): Environment name (dev/test/prod), defaults to the suite's configured environment or dev
- `tags` (optional): Tag filtering for both suite-level and test-level tags. **Executes ALL test suites and test cases that match the tag criteria**
  - Single tag: `smoke` (executes all suites/tests containing the 'smoke' tag)
  - Multiple tags AND: `smoke,integration` (must contain both smoke and integration tags)
  - Multiple tags OR: `smoke|regression` (contains smoke or regression tags)
  - Mixed conditions: `smoke,integration|critical` (contains smoke and integration or critical)

## Execution Process

You need to help me execute a YAML format test suite that orchestrates multiple test cases. Test suites provide enhanced organization, configuration, and reporting capabilities.

**IMPORTANT: Use the YAML Test Processor with --suites flag for efficient execution**
**BREAKTHROUGH: Playwright MCP now supports persistent session across commands and test cases**

Execution workflow:
1. **Use the automated processor**: Run `node .claude/scripts/yaml-test-processor.js --suites` with appropriate parameters to get processed test suites
2. **Optimize execution strategy**: Leverage persistent session across all test cases in suite
3. **Execute suite configuration**: Apply suite-level pre-actions, configuration, and environment variables
4. **Execute test cases**: Run each test case in the suite with session optimization
5. **Execute post-actions**: Run suite-level post-actions and cleanup
6. **Generate suite reports**: Create consolidated reports for the entire suite execution

### Test Suite Features

**Simplified Suite Configuration**:
- **Clean Structure**: Only essential fields - name, description, tags, and test-cases
- **Environment via .env**: All environment configuration through standard .env files
- **Direct Test Case Paths**: Simple file path strings without extra metadata

**Pre/Post Actions** (Optional):
- **Pre-actions**: Setup tasks executed before any test cases
- **Post-actions**: Cleanup and reporting tasks executed after all test cases
- **Natural Language**: Use descriptive action names for clarity

**Enhanced Reporting**:
- **Consolidated Reports**: Single report covering all test cases in the suite
- **Suite Metrics**: Summary statistics across all test cases
- **Simple Configuration**: Minimal configuration for maximum usability

### Session Management Strategy (REVOLUTIONARY - Persistent Across Test Cases):

**Suite-Level Session Optimization**:
- **Single Login per Suite**: First test case in suite performs login and saves session
- **Session Reuse**: All subsequent test cases in suite reuse the login session
- **Cross-Suite Persistence**: Sessions persist even between different suite executions
- **Zero Login Time**: After first login in any suite, all subsequent executions skip login

**Available Session Strategies for Suites**:

1. **session-persist** (Recommended for suite execution):
   - Uses `--storage-state` for automatic session persistence
   - First test case logs in and saves state
   - All subsequent test cases auto-restore login
   - Session persists across suite boundaries

2. **session-check** (Intelligent fallback):
   - Checks current login state before each test case
   - Only logs in if session is not valid
   - Provides fallback for session expiration

3. **Traditional login** (Legacy - for login testing):
   - Always performs full login process
   - Use only when testing login functionality itself

### Automated Processing Command:
```bash
node .claude/scripts/yaml-test-processor.js --suites --env={env} --tags={tags} --suite={suite}
```

### Test Suite Execution Process:

1. **Load Suite Configuration**: Parse test suite YAML file to extract:
   - Suite metadata (name, description, version)
   - Environment configuration and overrides
   - Execution settings (parallel, timeout, retry)
   - Pre-actions and post-actions
   - Test case references

2. **Apply Tag Filtering**: Filter test suites and individual test cases based on tag criteria

3. **Execute Pre-actions**: Run any configured pre-suite setup tasks

4. **Process Test Cases**: For each test case in the suite:
   - Load and process the referenced test case file
   - Apply suite-level environment variables
   - Expand step library includes
   - Execute test case with session optimization
   - Collect execution results and metrics

5. **Execute Post-actions**: Run suite-level cleanup and reporting tasks

6. **Generate Suite Reports**: Create comprehensive reports including:
   - Suite execution summary
   - Individual test case results  
   - Performance metrics across the suite
   - Environment and configuration details
   - **IMPORTANT**: Use correct environment-specific directories (reports/{env}/, screenshots/{env}/)
   - **IMPORTANT**: Use SuiteReportGenerator for standardized report templates
   - **IMPORTANT**: Respect REPORT_STYLE setting (overview/detailed) to control report verbosity

### Manual Processing (Legacy - use only if processor fails):

1. Load test suite YAML file and extract configuration
2. Apply environment variable overrides from suite configuration
3. Filter test suites and test cases based on tag parameters
4. Execute pre-actions if configured
5. For each test case in the suite:
   - Load test case file and apply processing
   - Execute with Playwright MCP using session optimization
   - Collect results and timing information
6. Execute post-actions if configured
7. Generate consolidated suite report with embedded data

### Report Generation for Test Suites:

**Suite-Level Reports**:
- **Consolidated Results**: Single report covering all test cases in suite
- **Suite Metrics**: Total cases, passed/failed counts, execution time
- **Environment Tracking**: Document suite environment and configuration
- **Performance Analysis**: Execution time breakdown by test case

**Report Configuration**:
- Use `GENERATE_REPORT` environment variable (true/false)
- **MANDATORY**: Use the **TWO-STEP REPORT GENERATION PROCESS**
- **STEP 1**: Create suite data file using create-report-data.js helper functions
- **STEP 2**: Generate report using: `node .claude/scripts/gen-report.js --data=/path/to/suite-data.json`
- **NO DYNAMIC CODE EXECUTION**: All data is pre-structured in JSON files
- The process will automatically handle:
  * Environment configuration from JSON data files
  * Template selection based on reportStyle in data file
  * Embedded JSON data generation
  * File naming with full timestamps: `suite-{suite-name}-{timestamp}.html`
  * Report path management in correct environment directory: `reports/{env}/`
  * latest-suite-report.html redirect updates

**Two-Step Suite Report Generation Process**:

**STEP 1: Create Suite Data File**
```javascript
const { createAndSaveSuiteData } = require('./.claude/scripts/create-report-data.js');

// Suite Information
const suite = {
  name: 'E-commerce Smoke Tests',
  description: 'Critical smoke tests for e-commerce functionality',
  tags: ['smoke', 'critical', 'e-commerce'],
  testCases: [
    { name: 'sort.yml', tags: ['smoke', 'sort'] },
    { name: 'product-details.yml', tags: ['smoke', 'product-details'] },
    { name: 'order.yml', tags: ['smoke', 'order'] }
  ]
};

// Test Results (with steps_detail for detailed reports)
const results = [
  {
    testName: 'sort.yml',
    description: 'Product sorting functionality test',
    status: 'passed',
    steps: 13,
    duration: 45000,
    features: 'Price sorting, Product display',
    tags: ['smoke', 'sort'],
    validations: 'Low to high: $7.99, High to low: $49.99',
    sessionOptimized: true,
    steps_detail: [
      { step: 1, action: 'Login to application', status: 'passed', duration: 3000 },
      { step: 2, action: 'Navigate to products page', status: 'passed', duration: 2000 },
      { step: 3, action: 'Click sorting dropdown', status: 'passed', duration: 1500 },
      { step: 4, action: 'Select Price (low to high)', status: 'passed', duration: 2000 },
      { step: 5, action: 'Verify first product price $7.99', status: 'passed', duration: 1000 }
    ]
  },
  {
    testName: 'product-details.yml',
    description: 'Product details and cart functionality test',
    status: 'passed',
    steps: 18,
    duration: 35000,
    features: 'Product details, Add to cart',
    tags: ['smoke', 'product-details'],
    validations: 'Product info displayed, Cart updated',
    sessionOptimized: true,
    steps_detail: [
      { step: 1, action: 'Navigate to product details page', status: 'passed', duration: 2000 },
      { step: 2, action: 'Verify product name and price', status: 'passed', duration: 1500 },
      { step: 3, action: 'Click Add to cart button', status: 'passed', duration: 1000 },
      { step: 4, action: 'Verify cart icon updated', status: 'passed', duration: 500 }
    ]
  },
  {
    testName: 'order.yml',
    description: 'Complete order flow test',
    status: 'failed',
    steps: 25,
    duration: 60000,
    features: 'Order flow, Checkout, Payment',
    tags: ['smoke', 'order'],
    validations: 'Cart items verified, Checkout form validation',
    sessionOptimized: true,
    error: 'Payment form validation failed',
    steps_detail: [
      { step: 1, action: 'Add items to cart', status: 'passed', duration: 3000 },
      { step: 2, action: 'Navigate to checkout', status: 'passed', duration: 2000 },
      { step: 3, action: 'Fill shipping information', status: 'passed', duration: 4000 },
      { step: 4, action: 'Submit payment form', status: 'failed', duration: 5000 }
    ]
  }
];

const options = {
  environment: 'dev',
  reportStyle: 'detailed'
};

// Create and save suite data file - automatically saves to REPORT_PATH environment variable location
createAndSaveSuiteData(suite, results, 'suite-data.json', options);
```

**Quick Suite Data Creation**:
```javascript
const { quickCreateSuiteData } = require('./.claude/scripts/create-report-data.js');

// Simplified suite creation - automatically saves to REPORT_PATH environment variable location
quickCreateSuiteData(
  'E-commerce Smoke Tests',  // suite name
  [                          // test results
    { testName: 'sort.yml', status: 'passed', duration: 30000, steps: 10 },
    { testName: 'order.yml', status: 'failed', duration: 45000, steps: 15, error: 'Timeout' }
  ],
  'quick-suite.json',        // output file
  {
    environment: 'dev',
    reportStyle: 'overview',
    description: 'Quick smoke test suite'
  }
);
```

**STEP 2: Generate Suite Report**
```bash
# Generate suite report from data file using the gen-report.js script in scripts directory
node .claude/scripts/gen-report.js --data=suite-data.json
node .claude/scripts/gen-report.js --data=quick-suite.json
node .claude/scripts/gen-report.js --data=/absolute/path/to/suite-data.json
```

**Complete Two-Step Suite Workflow Example**:
```javascript
// Step 1: AI creates suite data file after test suite execution
const { quickCreateSuiteData } = require('./.claude/scripts/create-report-data.js');

const testResults = [
  { testName: 'sort.yml', status: 'passed', duration: 30000, steps: 10 },
  { testName: 'product.yml', status: 'passed', duration: 25000, steps: 8 },
  { testName: 'order.yml', status: 'failed', duration: 45000, steps: 15, error: 'Payment failed' }
];

quickCreateSuiteData('E-commerce Tests', testResults, 'latest-suite.json', {
  environment: 'dev',
  reportStyle: 'detailed',
  tags: ['smoke', 'e-commerce']
});

// Step 2: AI executes report generation command
// node .claude/scripts/gen-report.js --data=latest-suite.json
```

**Data File Structure (suite-data.json)**:
```json
{
  "reportType": "suite",
  "reportData": {
    "suite": {
      "name": "E-commerce Smoke Tests",
      "description": "Critical smoke tests for e-commerce functionality",
      "tags": ["smoke", "critical"],
      "testCases": [...]
    },
    "results": [
      {
        "testName": "sort.yml",
        "status": "passed",
        "steps": 13,
        "duration": 45000,
        "features": "Price sorting, Product display",
        "validations": "All sorting verified",
        "sessionOptimized": true,
        "steps_detail": [
          { "step": 1, "action": "Login to application", "status": "passed", "duration": 3000 },
          { "step": 2, "action": "Navigate to products page", "status": "passed", "duration": 1000 },
          { "step": 3, "action": "Click sorting dropdown", "status": "passed", "duration": 2000 }
        ]
      }
    ]
  },
  "config": {
    "environment": "dev",
    "reportStyle": "detailed",
    "reportPath": "reports/dev"
  },
  "environment": {
    "BASE_URL": "https://www.saucedemo.com/",
    "GENERATE_REPORT": "true",
    "REPORT_STYLE": "detailed"
  }
}
```

⚠️ **CRITICAL: Detailed Suite Report Requirements**
**For `REPORT_STYLE=detailed` to show step-by-step details in suite reports, you MUST include `steps_detail` array in each test result:**

```javascript
// ✅ CORRECT - Detailed steps will be shown for each test in suite
const suiteResults = [
  {
    testName: 'sort.yml',
    status: 'passed',
    duration: 35000,
    steps_detail: [
      { step: 1, action: 'Login to application', status: 'passed', duration: 3000 },
      { step: 2, action: 'Sort products by price', status: 'passed', duration: 2000 },
      { step: 3, action: 'Verify sorting order', status: 'passed', duration: 1000 }
    ]
  },
  {
    testName: 'product-details.yml',
    status: 'passed',
    duration: 25000,
    steps_detail: [
      { step: 1, action: 'Navigate to product page', status: 'passed', duration: 2000 },
      { step: 2, action: 'Verify product details', status: 'passed', duration: 1500 },
      { step: 3, action: 'Add to cart', status: 'passed', duration: 1000 }
    ]
  }
];

// ❌ INCORRECT - Only suite summary will be shown (no step details)
const suiteResults = [
  {
    testName: 'sort.yml',
    status: 'passed',
    duration: 35000
    // Missing steps_detail array
  }
];
```

**When executing test suites with `REPORT_STYLE=detailed`:**
1. Create `steps_detail` array for each test case result in the suite
2. Map actual test execution to step-by-step breakdown for every test
3. Include real execution status and timing for each step
4. Aggregate suite-level metrics while preserving individual test details

- **NO DYNAMIC CODE EXECUTION** - all data is pre-structured in JSON files
- **CLEAN SEPARATION** - data creation and report generation are separate steps
- **REUSABLE DATA** - JSON files can be stored, versioned, and reused
- **SUITE-SPECIFIC FEATURES** - consolidated metrics and multi-test reporting

## Suite Performance Impact

**Revolutionary Improvement with Suite-Level Session Management**:

**Before (Individual Test Execution)**:
- 3 separate test executions: 3 × 30 seconds = 90 seconds
- Login overhead: 3 × 20 seconds = 60 seconds

**After (Suite Execution with Session Persistence)**:
- **First suite execution**: ~40 seconds (login once + 3 tests)
- **Subsequent suite executions**: ~20 seconds (no login + 3 tests)
- **Time savings: 50-75% compared to individual executions**

**Real-world Example - E-commerce Suite**:
- Traditional: login + order (30s) + login + product (30s) + login + sort (30s) = 90s
- Suite optimized: login + order + product + sort = 40s first time, 20s after
- **Productivity improvement: 4.5x faster after first execution**

## Examples

### Execute Specific Test Suite
```bash
/run-test-suite suite:e-commerce.yml env:test
```

### Execute All Smoke Test Suites
```bash
/run-test-suite tags:smoke env:dev
```

### Execute All Test Suites
```bash
/run-test-suite env:test
```

### Execute Regression Suites
```bash
/run-test-suite tags:regression env:prod
```

Please load suite configuration, apply filtering, execute pre-actions, process all test cases with session optimization, execute post-actions, and generate consolidated suite reports.

ARGUMENTS: {suite} {env} {tags}