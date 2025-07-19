---
description: Execute YAML-based Playwright test cases with step library references and parameter substitution support.
---

## Parameters
- `file` (optional): Test case file path, if not provided executes all test cases in test-cases directory
- `env` (optional): Environment name (dev/test/prod), defaults to dev
- `tags` (optional): Tag filtering, supports single or multiple tags

## Execution Process

1. **Load and Process Test Configuration**
   - Use the automated YAML test processor: `node .claude/scripts/yaml-test-processor.js --env={env} --tags={tags} --file={file}`
   - Parse the JSON output to extract processed test cases and configuration
   - Validate that test cases match the tag filtering criteria
   - Extract environment variables and session strategy from the processed data

2. **Initialize Session Management Strategy**
   - Set up persistent session strategy for cross-command optimization
   - Configure `--storage-state` for automatic session persistence
   - Ensure first test performs login and saves session state
   - All subsequent tests will auto-restore login session

3. **Execute Test Cases with Session Optimization**
   For each test case in the processed output:
   a. **Setup Test Case Environment**
      - Load test case configuration from processed data
      - Apply environment variable substitution
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

4. **Generate Test Report**
   a. **Prepare Test Data Structure**
      - Create test data object with metadata (name, description, tags)
      - Include test execution results with step-by-step details
      - Add test-level metrics and execution summary
      - Include environment configuration and session optimization stats
   
   b. **Create Report Data File**
      - Use the report data creation utility: `const { quickCreateTestData } = require('./.claude/scripts/create-report-data.js')`
      - Structure data according to test report format
      - Save data to JSON file in reports directory
   
   c. **Generate HTML Report** (if GENERATE_REPORT=true)
      - Execute report generation: `node .claude/scripts/gen-report.js --data={test-data-file}`
      - Ensure report style (overview/detailed) matches REPORT_STYLE environment variable
      - Update latest-test-report.html with test results

5. **Display Execution Summary**
   - Show total test cases executed and their status
   - Display test-level metrics (total steps, duration, success rate)
   - Highlight session optimization benefits (time saved)
   - Report any errors or failures that need attention
   - Provide links to generated reports if available

## Session Management Benefits
- **Revolutionary Performance**: 80-95% time savings after first login
- **Persistent Sessions**: Login once, reuse across all test executions
- **Cross-Command Persistence**: Sessions persist even after restarting Claude Code
- **Zero Login Time**: After first login, all tests skip login completely

## Example Usage Patterns

### Execute Specific Test Case
```
/run-yaml-test file:sort.yml env:dev
```

### Execute All Smoke Tests
```
/run-yaml-test tags:smoke env:dev
```

### Execute All Test Cases
```
/run-yaml-test env:test
```

### Execute Multiple Tag Tests
```
/run-yaml-test tags:smoke,login env:prod
```

## Error Handling
- If YAML processor fails, display error and suggest manual processing
- If test case execution fails, continue with remaining test cases
- If session persistence fails, fallback to traditional login for affected test cases
- If report generation fails, still display execution summary

## Report Generation for Test Cases

**Test-Level Reports**:
- **Individual Results**: Single report covering test case execution
- **Test Metrics**: Steps executed, passed/failed counts, execution time
- **Environment Tracking**: Document test environment and configuration
- **Session Analysis**: Session optimization status and benefits

**Report Configuration**:
- Use `GENERATE_REPORT` environment variable (true/false)
- **MANDATORY**: Use the **TWO-STEP REPORT GENERATION PROCESS**
- **STEP 1**: Create test data file using create-report-data.js helper functions
- **STEP 2**: Generate report using: `node .claude/scripts/gen-report.js --data=/path/to/test-data.json`
- **NO DYNAMIC CODE EXECUTION**: All data is pre-structured in JSON files

**Two-Step Test Report Generation Process**:

**STEP 1: Create Test Data File**
```javascript
const { createAndSaveTestData } = require('./.claude/scripts/create-report-data.js');

// Single test case data
const testCase = {
  name: 'sort.yml',
  description: 'Product sorting test',
  tags: ['smoke', 'sort'],
  steps: [
    'Login to application',
    'Click sorting dropdown, select Price(low to high)',
    'Verify first product price is $7.99'
  ]
};

const execution = {
  status: 'passed',
  startTime: Date.now() - 30000,
  endTime: Date.now(),
  duration: 30000,
  testName: 'sort.yml',
  validations: ['Price verified: $7.99'],
  sessionOptimized: true,
  steps_detail: [
    { step: 1, action: 'Login to application', status: 'passed', duration: 3000 },
    { step: 2, action: 'Click sorting dropdown', status: 'passed', duration: 2000 },
    { step: 3, action: 'Verify first product price', status: 'passed', duration: 1000 }
  ]
};

createAndSaveTestData(testCase, execution, 'test-data.json', {
  environment: 'dev',
  reportStyle: 'detailed'
});
```

**Quick Test Data Creation**:
```javascript
const { quickCreateTestData } = require('./.claude/scripts/create-report-data.js');

quickCreateTestData(
  'sort.yml',
  'passed',
  30000,
  'quick-test.json',
  {
    environment: 'dev',
    reportStyle: 'overview',
    tags: ['smoke', 'sort'],
    validations: ['Sorting verified']
  }
);
```

**Batch Test Cases Data Creation**:
```javascript
const { createAndSaveBatchData } = require('./.claude/scripts/create-report-data.js');

const testCases = [
  { name: 'sort.yml', description: 'Sorting test', tags: ['smoke'] },
  { name: 'order.yml', description: 'Order test', tags: ['smoke'] }
];

const execution = {
  name: 'smoke-tests-batch',
  status: 'passed',
  duration: 60000,
  testResults: [
    { 
      testName: 'sort.yml', 
      status: 'passed', 
      duration: 30000,
      steps_detail: [
        { step: 1, action: 'Login and navigate', status: 'passed', duration: 5000 },
        { step: 2, action: 'Perform sorting test', status: 'passed', duration: 15000 }
      ]
    },
    { 
      testName: 'order.yml', 
      status: 'passed', 
      duration: 30000,
      steps_detail: [
        { step: 1, action: 'Add products to cart', status: 'passed', duration: 10000 },
        { step: 2, action: 'Complete checkout', status: 'passed', duration: 20000 }
      ]
    }
  ]
};

createAndSaveBatchData(testCases, execution, 'batch-data.json', {
  environment: 'dev',
  reportStyle: 'detailed'
});
```

**STEP 2: Generate Test Report**
```bash
# Generate test report from data file
node .claude/scripts/gen-report.js --data=test-data.json
node .claude/scripts/gen-report.js --data=quick-test.json
node .claude/scripts/gen-report.js --data=batch-data.json
```

⚠️ **CRITICAL: For `REPORT_STYLE=detailed`, MUST include `steps_detail` array:**

```javascript
// ✅ CORRECT - Shows step details
const testResult = {
  testName: 'example.yml',
  status: 'passed',
  duration: 30000,
  steps_detail: [
    { step: 1, action: 'Open login page', status: 'passed', duration: 2000 },
    { step: 2, action: 'Fill username field', status: 'passed', duration: 500 }
  ]
};

// ❌ INCORRECT - Missing steps_detail array
const testResult = {
  testName: 'example.yml',
  status: 'passed',
  duration: 30000
  // Missing steps_detail array
};
```

**Key Requirements:**
1. Create `steps_detail` array for each test result
2. Include real execution status and timing for each step
3. Use two-step process: create JSON data file, then generate report
4. Pre-structure all data in JSON files (no dynamic code execution)

## Report Generation Requirements
- **For REPORT_STYLE=detailed**: Include `steps_detail` array in each test result
- **For REPORT_STYLE=overview**: Include only summary metrics
- **Data Structure**: Use pre-structured JSON files for report generation
- **No Dynamic Code**: All data must be prepared before report generation