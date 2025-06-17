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
1. **Use the automated processor**: Run `node scripts/yaml-test-processor.js` with appropriate parameters to get processed test cases
2. **Optimize execution strategy**: Leverage persistent session across all executions
3. **Execute processed steps**: Use the processor output directly with Playwright MCP to execute test steps
4. **Generate reports**: Create test reports based on execution results

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
node scripts/yaml-test-processor.js --env={env} --tags={tags} --file={file}
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
   - If GENERATE_REPORT=true, automatically generate test reports using the report generation script
   - **MANDATORY**: Use the TestCaseReportGenerator class to generate test case reports
   - Import and instantiate the class with environment configuration
   - Call generateTestCaseReport() method with execution data
   - The generator will automatically handle:
     * Template selection based on REPORT_STYLE (detailed/overview)
     * Embedded JSON data generation
     * File naming with full timestamps (includes date and time)
     * Report path management
     * latest-test-report.html redirect updates
**TestCaseReportGenerator Parameters**:

**Constructor Options**:
```javascript
const generator = new TestCaseReportGenerator({
  environment: 'dev',        // Environment name (dev/test/prod)
  reportStyle: 'overview',   // Report style (overview/detailed)  
  reportFormat: 'html',      // Report format (html/json/xml)
  projectRoot: process.cwd(), // Project root directory (optional)
  reportPath: 'reports/dev'  // Report output path (optional)
});
```

**generateTestCaseReport(testCaseData, executionResult) Parameters**:

**testCaseData** (Object or Array):
```javascript
// Single test case:
{
  name: 'sort.yml',                    // Test case file name
  description: 'Product sorting test', // Test description
  tags: ['smoke', 'sort'],            // Test tags array
  steps: [                            // Test steps array
    'Login to application',
    'Click sorting dropdown, select Price(low to high)',
    'Verify first product price is $7.99'
  ],
  stepCount: 9                        // Total step count
}

// Multiple test cases (array):
[
  { name: 'sort.yml', description: '...', tags: [...], steps: [...] },
  { name: 'order.yml', description: '...', tags: [...], steps: [...] }
]
```

**executionResult** (Object):
```javascript
{
  name: 'sort-execution',           // Execution name (optional)
  status: 'passed',                 // Overall status: 'passed'/'failed'
  startTime: Date.now(),           // Execution start timestamp
  endTime: Date.now(),             // Execution end timestamp
  duration: 30000,                 // Duration in milliseconds
  environment: 'dev',              // Environment name
  testResults: [                   // Individual test results (for batch)
    {
      testName: 'sort.yml',
      status: 'passed',
      duration: 15000,
      steps: [
        { step: 'Login', status: 'passed', duration: 3000 },
        { step: 'Sort products', status: 'passed', duration: 2000 }
      ],
      validations: ['Price low to high: $7.99', 'Price high to low: $49.99'],
      error: null                   // Error message if failed
    }
  ],
  screenshots: [                   // Screenshots taken
    'screenshots/dev/sort-final.png'
  ],
  sessionOptimized: true          // Whether session optimization was used
}
```

**Complete Example - Single Test Case**:
```javascript
const TestCaseReportGenerator = require('./scripts/test-case-report-generator.js');
const generator = new TestCaseReportGenerator({
  environment: 'dev',
  reportStyle: 'overview'
});

const testCaseData = {
  name: 'sort.yml',
  description: 'Product sorting functionality test',
  tags: ['smoke', 'sort'],
  steps: [
    'Login to application',
    'Click sorting dropdown, select Price(low to high)',
    'Verify first product price is $7.99',
    'Click sorting dropdown, select Price(high to low)',
    'Verify first product price is $49.99'
  ],
  stepCount: 5
};

const executionResult = {
  status: 'passed',
  startTime: Date.now() - 30000,
  endTime: Date.now(),
  duration: 30000,
  environment: 'dev',
  testResults: [{
    testName: 'sort.yml',
    status: 'passed',
    duration: 30000,
    validations: ['Low to high verified: $7.99', 'High to low verified: $49.99'],
    sessionOptimized: true
  }]
};

const result = generator.generateTestCaseReport(testCaseData, executionResult);
console.log('Report generated:', result.reportPath);
```

**Complete Example - Multiple Test Cases (Batch)**:
```javascript
const testCases = [
  { name: 'sort.yml', description: 'Sorting test', tags: ['smoke'] },
  { name: 'order.yml', description: 'Order test', tags: ['smoke'] }
];

const executionResult = {
  name: 'smoke-tests-batch',
  status: 'passed',
  testResults: [
    { testName: 'sort.yml', status: 'passed', duration: 15000 },
    { testName: 'order.yml', status: 'passed', duration: 20000 }
  ]
};

const result = generator.generateTestCaseReport(testCases, executionResult);
```

   - **DO NOT manually generate reports** - always use the class for consistency
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