# Validate YAML Test Cases

Validates YAML-based Playwright test cases for syntax and completeness, ensuring all referenced step libraries exist and environment variables are properly configured.

## Parameters

- `file` (required): Path to the test case file to validate
- `env` (optional): Environment name (dev/test/prod), defaults to dev

## Validation Process

You need to help me validate a YAML format Playwright test case. This test case may reference other YAML files defined in the step libraries.

Validation workflow:
1. Load the corresponding .env file based on env parameter (.env.dev, .env.test, .env.prod)
2. Parse the specified test case file:
   - Check YAML syntax validity
   - Verify tags field exists and is an array
   - Verify steps field exists and is an array
3. For each test case:
   - Validate all "include" references point to existing step library files in steps/ directory
   - Check that all referenced step libraries have valid YAML syntax
   - Verify all environment variables used in {{ENV_VAR}} format are defined in the .env file
   - Ensure all required environment variables are present (BASE_URL, TEST_USERNAME, TEST_PASSWORD, etc.)
   - Validate GENERATE_REPORT and REPORT_FORMAT configurations if present
4. Report validation results and any issues found
5. Provide suggestions for fixing any problems
6. If validation passes, display file structure summary, tag information, and environment variable usage

YAML format specifications:
- Test case format: contains tags array and steps array
- Tag format: tags field as array, containing all tags for this test case
- Step library format: directly contains steps array, using natural language descriptions
- Include syntax: use include field to reference step library names
- Environment variables: use {{ENV_VAR}} syntax, automatically loaded from .env files
- Step descriptions: directly use natural language, more readable and writable

Please load environment configuration based on parameters, parse YAML structure, validate includes and environment variables, then provide a comprehensive validation report.

ARGUMENTS: {file} {env}