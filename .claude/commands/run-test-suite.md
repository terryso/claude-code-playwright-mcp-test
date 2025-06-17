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
1. **Use the automated processor**: Run `node scripts/yaml-test-processor.js --suites` with appropriate parameters to get processed test suites
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
node scripts/yaml-test-processor.js --suites --env={env} --tags={tags} --suite={suite}
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
- **MANDATORY**: Use the SuiteReportGenerator class to generate suite reports
- Import and instantiate the class with environment configuration
- Call generateSuiteReport() method with execution data
- The generator will automatically handle:
  * Template selection based on REPORT_STYLE (detailed/overview)
  * Embedded JSON data generation
  * File naming with full timestamps: `suite-{suite-name}-{timestamp}.html`
  * Report path management in correct environment directory: `reports/{env}/`
  * latest-suite-report.html redirect updates

**SuiteReportGenerator Parameters**:

**Constructor Options**:
```javascript
const generator = new SuiteReportGenerator({
  environment: 'dev',        // Environment name (dev/test/prod)
  reportStyle: 'overview',   // Report style (overview/detailed)
  reportFormat: 'html',      // Report format (html/json/xml) 
  projectRoot: process.cwd(), // Project root directory (optional)
  reportPath: 'reports/dev'  // Report output path (optional)
});
```

**generateSuiteReport(suiteData, executionResults) Parameters**:

**suiteData** (Object):
```javascript
{
  name: 'Smoke Test Suite',              // Suite name
  suiteName: 'Smoke Test Suite',         // Display name (optional)
  description: 'Quick smoke tests...',   // Suite description
  tags: ['smoke', 'quick', 'sanity'],   // Suite tags array
  environment: 'dev',                    // Environment name
  testCases: [                           // Test cases array
    { name: 'sort.yml', tags: ['smoke', 'sort'] },
    { name: 'product-details.yml', tags: ['smoke', 'product-details'] }
  ],
  summary: { totalSteps: 32 }            // Optional summary info
}
```

**executionResults** (Array):
```javascript
[
  {
    testName: 'sort.yml',                    // Test case file name
    description: 'Product sorting test',    // Test description
    status: 'passed',                       // Status: 'passed'/'failed'
    steps: 9,                              // Number of steps executed
    features: 'Price sorting, Display',    // Features tested
    tags: ['smoke', 'sort'],               // Test tags
    validations: 'Low: $7.99, High: $49.99', // Key validations
    error: 'Error message'                 // Error message (if failed)
  }
]
```

**Complete Example**:
```javascript
const SuiteReportGenerator = require('./scripts/suite-report-generator.js');
const generator = new SuiteReportGenerator({
  environment: 'dev',
  reportStyle: 'overview'
});

const suiteData = {
  name: 'Smoke Test Suite',
  description: 'Quick smoke tests to validate core functionality',
  tags: ['smoke', 'quick'],
  testCases: [
    { name: 'sort.yml', tags: ['smoke', 'sort'] },
    { name: 'product-details.yml', tags: ['smoke', 'product-details'] }
  ]
};

const executionResults = [
  {
    testName: 'sort.yml',
    description: 'Product sorting functionality test',
    status: 'passed',
    steps: 9,
    features: 'Price sorting, Product display',
    tags: ['smoke', 'sort'],
    validations: 'Low to high: $7.99, High to low: $49.99'
  },
  {
    testName: 'product-details.yml',
    description: 'Product details and cart test',
    status: 'passed', 
    steps: 23,
    features: 'Product details, Add to cart',
    tags: ['smoke', 'product-details'],
    validations: 'Product info, Button changes, Navigation'
  }
];

const result = generator.generateSuiteReport(suiteData, executionResults);
console.log('Report generated:', result.reportPath);
```

- **DO NOT manually generate reports** - always use the class for consistency

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