# Execute YAML Test Cases

Execute YAML-based Playwright test cases with step library references and parameter substitution support.

## Parameters

- `file` (optional): Test case file path, if not provided executes all test cases in test-cases directory
- `env` (optional): Environment name (dev/test/prod), defaults to dev
- `tags` (optional): Tag filtering, supports single or multiple tags. **Executes ALL test cases that match the tag criteria**
  - Single tag: `smoke` (executes all test cases containing the 'smoke' tag)
  - Multiple tags AND: `smoke,login` (must contain both smoke and login tags)
  - Multiple tags OR: `smoke|login` (contains smoke or login tags)
  - Mixed conditions: `smoke,login|critical` (contains smoke and login or critical)

## Execution Process

You need to help me execute a YAML format Playwright test case. This test case may reference other YAML files defined in the step libraries.

**IMPORTANT: Use the YAML Test Processor for efficient execution**
**BREAKTHROUGH: Playwright MCP now supports persistent session across commands**

Execution workflow:
1. **Use the automated processor**: Run `node .claude/scripts/yaml-test-processor.js` with appropriate parameters to get processed test cases
2. **Optimize execution strategy**: Leverage persistent session across all executions
3. **Execute processed steps**: Use the processor output directly with Playwright MCP to execute test steps
4. **MANDATORY: Execute ALL matching test cases**: When using tag filtering, execute ALL test cases that match the criteria
5. **MANDATORY: Generate reports**: Always generate test reports if GENERATE_REPORT=true, regardless of execution results

### Session Management Strategy (REVOLUTIONARY - Persistent Across Commands):

**New Capability**: Playwright MCP now automatically preserves login sessions across all command executions!

**How it works**:
- **First login**: Any test that performs login automatically saves session state
- **Automatic restoration**: All subsequent tests automatically restore login session
- **Cross-command persistence**: Session remains valid even after restarting Claude Code
- **Zero login time**: After first login, all tests skip login completely

**Available Session Strategies**:

1. **session-persist** (Recommended for new tests):
   - Uses `--storage-state` for automatic session persistence
   - First execution logs in and saves state
   - All subsequent executions auto-restore login

2. **session-check** (Backward compatible):
   - Intelligent checking of current login state
   - Falls back to login if session not found

3. **Traditional login** (Legacy):
   - Always performs full login process
   - Use only for testing login functionality itself

**Available Session-Optimized Step Libraries**:
- `session-persist`: NEW - Automatic session persistence (recommended)
- `session-check`: Intelligent login that only logs in if needed
- `ensure-products-page`: Navigate to products page if not already there
- `cleanup`: Return to home page and take screenshot
- Use these instead of `login` for non-first test cases

### Automated Processing Command:
```bash
node .claude/scripts/yaml-test-processor.js --env={env} --tags={tags} --file={file}
```

### Manual Processing (Legacy - use only if processor fails):
1. Load the corresponding .env file based on env parameter (.env.dev, .env.test, .env.prod)
2. Determine which test cases to execute based on parameters:
   - If file parameter is specified, execute the specified file
   - If tags parameter is specified, scan test-cases directory and execute **ALL** test cases that contain the specified tags
   - If neither is specified, execute all test cases in test-cases directory
3. For each test case:
   - Check tags field and apply tag filtering logic
   - Scan steps directory and load all available step library files
   - Expand "include" references, inserting step library content
   - Apply environment variable substitution, replacing {{ENV_VAR}} with actual values
4. Use Playwright MCP to execute the expanded complete step sequence
5. Check GENERATE_REPORT environment variable and generate test reports if enabled:
   - If GENERATE_REPORT=true, use the **TWO-STEP REPORT GENERATION PROCESS**
   - **STEP 1**: Create report data file using create-report-data.js helper functions
   - **STEP 2**: Generate report using: `node .claude/scripts/gen-report.js --data=/path/to/data.json`
   - **NO DYNAMIC CODE EXECUTION**: All data is pre-structured in JSON files
   - **CRITICAL**: Use the ReportDataCreator helper functions to structure data properly
   - **CRITICAL**: Ensure executionResult contains proper status, duration, and steps data for each test
**Two-Step Report Generation Process**:

**STEP 1: Create Report Data File**
```javascript
const { createAndSaveTestData } = require('./.claude/scripts/create-report-data.js');

// Single Test Case Data Creation
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
  validations: ['Price verified: $7.99', 'Price verified: $49.99'],
  sessionOptimized: true,
  steps_detail: [
    { step: 1, action: 'Login to application', status: 'passed', duration: 3000 },
    { step: 2, action: 'Click sorting dropdown, select Price(low to high)', status: 'passed', duration: 2000 },
    { step: 3, action: 'Verify first product price is $7.99', status: 'passed', duration: 1000 }
  ]
};

const options = {
  environment: 'dev',
  reportStyle: 'overview'
};

// Create and save data file - automatically saves to REPORT_PATH environment variable location
createAndSaveTestData(testCase, execution, 'test-data.json', options);
```

**Batch Test Cases Data Creation**:
```javascript
const { createAndSaveBatchData } = require('./.claude/scripts/create-report-data.js');

const testCases = [
  { name: 'sort.yml', description: 'Sorting test', tags: ['smoke'], steps: [...] },
  { name: 'order.yml', description: 'Order test', tags: ['smoke'], steps: [...] }
];

const execution = {
  name: 'smoke-tests-batch',
  status: 'passed',
  startTime: Date.now() - 60000,
  endTime: Date.now(),
  duration: 60000,
  testResults: [
    { 
      testName: 'sort.yml', 
      status: 'passed', 
      duration: 30000,
      steps_detail: [
        { step: 1, action: 'Login and navigate', status: 'passed', duration: 5000 },
        { step: 2, action: 'Perform sorting test', status: 'passed', duration: 15000 },
        { step: 3, action: 'Verify results', status: 'passed', duration: 10000 }
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

createAndSaveBatchData(testCases, execution, 'batch-data.json', options);
```

**Quick Data Creation (for simple cases)**:
```javascript
const { quickCreateTestData } = require('./.claude/scripts/create-report-data.js');

// Quick create test data - automatically saves to REPORT_PATH environment variable location
quickCreateTestData(
  'sort.yml',           // test name
  'passed',             // status
  30000,                // duration
  'quick-test.json',    // output file
  {
    environment: 'dev',
    reportStyle: 'overview',
    tags: ['smoke', 'sort'],
    validations: ['Sorting verified']
  }
);
```

**STEP 2: Generate Report**
```bash
# Generate report from data file using the gen-report.js script in scripts directory
# Data files are automatically saved to REPORT_PATH, so use relative path:
node .claude/scripts/gen-report.js --data=test-data.json
node .claude/scripts/gen-report.js --data=batch-data.json
# Or use absolute path if needed:
node .claude/scripts/gen-report.js --data=/absolute/path/to/data.json
```

**Complete Two-Step Workflow Example**:
```javascript
// Step 1: AI creates data file after test execution
const { quickCreateTestData } = require('./.claude/scripts/create-report-data.js');
quickCreateTestData('sort.yml', 'passed', 30000, 'latest-test.json', {
  environment: 'dev',
  tags: ['smoke'],
  validations: ['All validations passed']
});

// Step 2: AI executes report generation command
// node .claude/scripts/gen-report.js --data=latest-test.json
```

   - **NO DYNAMIC CODE EXECUTION** - all data is pre-structured in JSON files
   - **CLEAN SEPARATION** - data creation and report generation are separate steps
   - **REUSABLE DATA** - JSON files can be stored, versioned, and reused
6. Output execution results and statistics

YAML format specifications:
- Test case format: contains tags array and steps array
- Tag format: tags field as array, containing all tags for this test case
- Step library format: directly contains steps array, using natural language descriptions
- Include syntax: use include field to reference step library names
- Environment variables: use {{ENV_VAR}} syntax, automatically loaded from .env files
- Step descriptions: directly use natural language, more readable and writable

Report generation configuration:
- GENERATE_REPORT: Whether to generate test reports (true/false)
- REPORT_FORMAT: Report format (html/json/xml)
- REPORT_STYLE: Report content style (detailed/overview)
  * detailed: Complete test information including all steps and execution details
  * overview: Summary information only with totals and success rates
- REPORT_PATH: Directory to save reports
- Template system: Uses HTML templates with **embedded JSON data** (no external files)
- Report files include timestamp for historical tracking
- All test data is embedded directly in the HTML file for reliable loading
- latest-test-report.html always redirects to the most recent report

⚠️ **CRITICAL: Detailed Report Requirements**
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

**When executing tests with `REPORT_STYLE=detailed`:**
1. Always create `steps_detail` array for each test result
2. Each step object must include: `step`, `action`, `status`, `duration`
3. Map actual test execution to step-by-step breakdown
4. Include real execution status and timing information

## Session Optimization Examples

### Example 1: Multiple Test Cases with Session Reuse
```bash
# Execute multiple smoke tests with session optimization
/run-yaml-test tags:smoke env:dev
```

**AI Execution Strategy**:
1. Process all smoke test cases (order.yml, sort-optimized.yml, product-details.yml)
2. Execute order.yml first with session-check (includes login if needed)
3. For sort-optimized.yml and product-details.yml: use session-check to reuse existing login
4. Keep browser open between test cases within single execution
5. Generate single combined report

### Example 2: Session-Optimized Test Cases
Use the session-optimized versions with `session-optimized` tag:
- `order.yml` (with session-check)
- `sort-optimized.yml` (optimized for session reuse)
- `product-details.yml` (tests product details page)

### Example 3: Mixed Execution Strategy
```bash
# Execute specific optimized test after a regular test
/run-yaml-test file:order.yml env:dev
# Then run optimized version (reuses session)
/run-yaml-test file:sort-optimized.yml env:dev
```

## Performance Impact

**Revolutionary Improvement with Persistent Sessions**:

**Before (Traditional)**:
- Each test case: ~30-45 seconds (including login every time)
- 3 test cases: ~90-135 seconds total

**After (Session Persistence)**:
- **First test ever**: ~30-45 seconds (login + save session)
- **All subsequent tests**: ~5-15 seconds (no login needed)
- **Cross-command**: 0 seconds login time
- **Time savings: 80-95% after first login**

**Real-world Example**:
- Day 1, First test: 30 seconds
- Day 1, Tests 2-10: 10 seconds each = 90 seconds
- Day 2+, All tests: 10 seconds each (no login time)
- **Massive productivity boost for daily testing**

Please load environment configuration based on parameters, parse YAML structure, apply tag filtering, expand includes and environment variables, execute tests using Playwright MCP with session optimization, and generate reports if configured.

ARGUMENTS: {file} {env} {tags}