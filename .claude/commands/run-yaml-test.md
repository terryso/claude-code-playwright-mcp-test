# Execute YAML Test Cases

Execute YAML-based Playwright test cases with step library references and parameter substitution support.

## Parameters

- `file` (optional): Test case file path, if not provided executes all test cases in test-cases directory
- `env` (optional): Environment name (dev/test/prod), defaults to dev
- `tags` (optional): Tag filtering, supports single or multiple tags
  - Single tag: `smoke`
  - Multiple tags AND: `smoke,login` (must contain both smoke and login tags)
  - Multiple tags OR: `smoke|login` (contains smoke or login tags)
  - Mixed conditions: `smoke,login|critical` (contains smoke and login or critical)

## Execution Process

You need to help me execute a YAML format Playwright test case. This test case may reference other YAML files defined in the step libraries.

Execution workflow:
1. Load the corresponding .env file based on env parameter (.env.dev, .env.test, .env.prod)
2. Determine which test cases to execute based on parameters:
   - If file parameter is specified, execute the specified file
   - If tags parameter is specified, scan test-cases directory and filter test cases by tags
   - If neither is specified, execute all test cases in test-cases directory
3. For each test case:
   - Check tags field and apply tag filtering logic
   - Scan steps directory and load all available step library files
   - Expand "include" references, inserting step library content
   - Apply environment variable substitution, replacing {{ENV_VAR}} with actual values
4. Use Playwright MCP to execute the expanded complete step sequence
5. Check GENERATE_REPORT environment variable and generate test reports if enabled:
   - If GENERATE_REPORT=true, automatically generate test reports
   - Use REPORT_FORMAT to determine report format (html/json/xml)
   - Save reports to path specified by REPORT_PATH environment variable
   - Include test execution details, step results, and environment information
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
- REPORT_PATH: Directory to save reports

Please load environment configuration based on parameters, parse YAML structure, apply tag filtering, expand includes and environment variables, execute tests using Playwright MCP, and generate reports if configured.

ARGUMENTS: {file} {env} {tags}