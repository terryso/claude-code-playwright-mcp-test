---
description: Execute YAML-based test suites containing multiple organized test cases with suite-level configuration and reporting.
---

## Parameters
- `suite` (optional): Test suite file path, if not provided executes all test suites in test-suites directory
- `env` (optional): Environment name (dev/test/prod), defaults to the suite's configured environment or dev
- `tags` (optional): Tag filtering for both suite-level and test-level tags

## Execution Process

1. **Load and Process Suite Configuration**
   - Use the automated YAML test processor: `node .claude/scripts/yaml-test-processor.js --suites --env={env} --tags={tags} --suite={suite}`
   - Parse the JSON output to extract processed test suites and configuration
   - Validate that test suites match the tag filtering criteria
   - Extract environment variables and session strategy from the processed data

2. **Initialize Session Management Strategy**
   - Set up persistent session strategy for suite-level optimization
   - Configure `--storage-state` for automatic session persistence across test cases
   - Ensure first test case in suite performs login and saves session state
   - All subsequent test cases will auto-restore login session

3. **Execute Pre-Actions** (if configured in suite)
   - Check if the processed suite data contains pre-actions
   - Execute each pre-action sequentially before starting test cases
   - Log pre-action execution status and any errors

4. **Execute Test Cases with Session Optimization**
   For each test case in the processed suite:
   a. **Setup Test Case Environment**
      - Load test case configuration from processed data
      - Apply environment variable overrides from suite configuration
      - Set session strategy (session-persist for first test, session reuse for subsequent)
   
   b. **Execute Test Case with Playwright MCP**
      - Use `browser_navigate` to start browser session
      - For first test case: perform login and save session state
      - For subsequent test cases: restore session state automatically
      - Execute all test steps as defined in the processed test case
      - Capture step-by-step execution results with timing and status
      - Handle any test failures gracefully and continue with next test case
   
   c. **Collect Test Results**
      - Record test execution status (passed/failed)
      - Capture step count, duration, and detailed step results
      - Store features tested and validation results
      - Include session optimization status in results

5. **Execute Post-Actions** (if configured in suite)
   - Check if the processed suite data contains post-actions
   - Execute each post-action sequentially after all test cases complete
   - Common post-actions include browser cleanup and report generation

6. **Generate Consolidated Suite Report**
   a. **Prepare Suite Data Structure**
      - Create suite data object with metadata (name, description, tags)
      - Include all test case results with step-by-step details
      - Add suite-level metrics and execution summary
      - Include environment configuration and session optimization stats
   
   b. **Create Report Data File**
      - Use the report data creation utility: `const { quickCreateSuiteData } = require('./.claude/scripts/create-report-data.js')`
      - Structure data according to suite report format
      - Save data to JSON file in reports directory
   
   c. **Generate HTML Report** (if GENERATE_REPORT=true)
      - Execute report generation: `node .claude/scripts/gen-report.js --data={suite-data-file}`
      - Ensure report style (overview/detailed) matches REPORT_STYLE environment variable
      - Update latest-test-report.html with consolidated suite results

7. **Display Execution Summary**
   - Show total test cases executed and their status
   - Display suite-level metrics (total steps, duration, success rate)
   - Highlight session optimization benefits (time saved)
   - Report any errors or failures that need attention
   - Provide links to generated reports if available

## Session Management Benefits
- **Revolutionary Performance**: 50-75% time savings compared to individual test executions
- **Persistent Sessions**: Login once per suite, reuse across all test cases
- **Cross-Suite Persistence**: Sessions persist even between different suite executions
- **Zero Login Time**: After first login in any suite, subsequent executions skip login

## Example Usage Patterns

### Execute Specific Test Suite
```
/run-test-suite suite:e-commerce.yml env:test
```

### Execute All Smoke Test Suites  
```
/run-test-suite tags:smoke env:dev
```

### Execute All Test Suites
```
/run-test-suite env:test
```

### Execute Regression Suites
```
/run-test-suite tags:regression env:prod
```

## Error Handling
- If YAML processor fails, display error and suggest manual processing
- If test case execution fails, continue with remaining test cases in suite
- If session persistence fails, fallback to traditional login for affected test cases
- If report generation fails, still display execution summary

## Report Generation for Test Suites

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

// Suite and results with steps_detail for detailed reports
const suite = {
  name: 'E-commerce Smoke Tests',
  description: 'Critical smoke tests for e-commerce functionality',
  tags: ['smoke', 'critical'],
  testCases: [{ name: 'sort.yml' }, { name: 'order.yml' }]
};

const results = [
  {
    testName: 'sort.yml',
    status: 'passed',
    steps: 13,
    duration: 45000,
    features: 'Price sorting',
    sessionOptimized: true,
    steps_detail: [
      { step: 1, action: 'Login to application', status: 'passed', duration: 3000 },
      { step: 2, action: 'Sort products by price', status: 'passed', duration: 2000 }
    ]
  },
  {
    testName: 'order.yml',
    status: 'failed',
    steps: 25,
    duration: 60000,
    error: 'Payment failed',
    sessionOptimized: true,
    steps_detail: [
      { step: 1, action: 'Add to cart', status: 'passed', duration: 3000 },
      { step: 2, action: 'Submit payment', status: 'failed', duration: 5000 }
    ]
  }
];

createAndSaveSuiteData(suite, results, 'suite-data.json', {
  environment: 'dev',
  reportStyle: 'detailed'
});
```

**Quick Suite Data Creation**:
```javascript
const { quickCreateSuiteData } = require('./.claude/scripts/create-report-data.js');

quickCreateSuiteData(
  'E-commerce Tests',
  [
    { testName: 'sort.yml', status: 'passed', duration: 30000, steps: 10 },
    { testName: 'order.yml', status: 'failed', duration: 45000, steps: 15, error: 'Timeout' }
  ],
  'quick-suite.json',
  { environment: 'dev', reportStyle: 'overview' }
);
```

**STEP 2: Generate Suite Report**
```bash
# Generate suite report from data file using the gen-report.js script in scripts directory
node .claude/scripts/gen-report.js --data=suite-data.json
node .claude/scripts/gen-report.js --data=quick-suite.json
node .claude/scripts/gen-report.js --data=/absolute/path/to/suite-data.json
```

**Complete Workflow Example**:
```javascript
// Step 1: Create suite data file
const { quickCreateSuiteData } = require('./.claude/scripts/create-report-data.js');
const testResults = [
  { testName: 'sort.yml', status: 'passed', duration: 30000, steps: 10 },
  { testName: 'order.yml', status: 'failed', duration: 45000, steps: 15, error: 'Payment failed' }
];
quickCreateSuiteData('E-commerce Tests', testResults, 'latest-suite.json', {
  environment: 'dev', reportStyle: 'detailed'
});

// Step 2: Generate report
// node .claude/scripts/gen-report.js --data=latest-suite.json
```

**Data File Structure**:
```json
{
  "reportType": "suite",
  "reportData": {
    "suite": { "name": "E-commerce Tests", "description": "...", "tags": [...] },
    "results": [
      {
        "testName": "sort.yml",
        "status": "passed",
        "steps": 13,
        "duration": 45000,
        "sessionOptimized": true,
        "steps_detail": [
          { "step": 1, "action": "Login", "status": "passed", "duration": 3000 }
        ]
      }
    ]
  },
  "config": { "environment": "dev", "reportStyle": "detailed" }
}
```

⚠️ **CRITICAL: For `REPORT_STYLE=detailed`, MUST include `steps_detail` array:**

```javascript
// ✅ CORRECT - Shows step details
const result = {
  testName: 'sort.yml',
  status: 'passed',
  duration: 35000,
  steps_detail: [
    { step: 1, action: 'Login', status: 'passed', duration: 3000 },
    { step: 2, action: 'Sort products', status: 'passed', duration: 2000 }
  ]
};

// ❌ INCORRECT - Missing steps_detail array
const result = {
  testName: 'sort.yml',
  status: 'passed',
  duration: 35000
  // Missing steps_detail array
};
```

**Key Requirements:**
1. Create `steps_detail` array for each test case result
2. Include real execution status and timing for each step
3. Use two-step process: create JSON data file, then generate report
4. Pre-structure all data in JSON files (no dynamic code execution)

## Report Generation Requirements
- **For REPORT_STYLE=detailed**: Include `steps_detail` array in each test result
- **For REPORT_STYLE=overview**: Include only summary metrics
- **Data Structure**: Use pre-structured JSON files for report generation
- **No Dynamic Code**: All data must be prepared before report generation