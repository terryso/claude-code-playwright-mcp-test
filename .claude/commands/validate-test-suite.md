# Validate Test Suites

Validate YAML test suite syntax, configuration, and test case references for completeness and correctness.

## Parameters

- `suite` (required): Path to test suite file to validate
- `env` (optional): Environment name for environment variable validation and test case processing

## Validation Process

You need to help me validate a YAML format test suite to ensure it's properly configured and all referenced test cases are valid.

**IMPORTANT: Use the YAML Test Processor with --suites flag for comprehensive validation**

Validation workflow:
1. **Use the automated processor**: Run `node .claude/scripts/yaml-test-processor.js --suites --suite={suite} --env={env}` to process and validate the test suite
2. **Analyze processor output**: Check for any errors or missing references in the processing results
3. **Validate test suite structure**: Ensure all required fields and proper YAML syntax
4. **Validate test case references**: Confirm all referenced test cases exist and are valid
5. **Validate environment variables**: Check that all required variables are available
6. **Report validation results**: Provide comprehensive validation feedback

### Test Suite Validation Checks

**Structure Validation**:
- **YAML Syntax**: Valid YAML formatting and structure
- **Required Fields**: Ensure `name` and `test-cases` fields are present
- **Schema Compliance**: Validate against expected test suite schema
- **Configuration Validity**: Check suite-level config settings are valid

**Test Case References**:
- **File Existence**: All referenced test case files exist
- **Test Case Validity**: Each referenced test case is valid YAML
- **Path Resolution**: Test case paths resolve correctly
- **Tag Compatibility**: Test case tags are compatible with suite expectations

**Environment Configuration**:
- **Variable Availability**: All referenced environment variables are defined
- **Environment Files**: Required .env files exist for specified environments
- **Variable Substitution**: Environment variable substitution works correctly
- **Override Conflicts**: No conflicts between suite-level and global environment variables

**Step Library Dependencies**:
- **Library Existence**: All step libraries referenced by test cases exist
- **Include Resolution**: All `include` references can be resolved
- **Circular Dependencies**: No circular dependencies in step library includes
- **Variable Dependencies**: All environment variables used in step libraries are available

### Automated Validation Command:
```bash
node .claude/scripts/yaml-test-processor.js --suites --suite={suite} --env={env}
```

### Manual Validation Process (Legacy - use only if processor fails):

1. **Parse Test Suite File**:
   - Load YAML file and check for parsing errors
   - Validate required fields (name, test-cases)
   - Check optional fields for correct format

2. **Validate Configuration**:
   - Check config section for valid settings
   - Validate timeout, retry, and execution settings
   - Ensure environment overrides are properly formatted

3. **Validate Test Case References**:
   - Check each test case path exists
   - Load and validate each referenced test case
   - Ensure test cases have required structure

4. **Validate Environment Setup**:
   - Load environment configuration for specified environment
   - Check all environment variables referenced in suite and test cases
   - Validate environment variable substitution

5. **Validate Step Library Dependencies**:
   - Load all step libraries
   - Check include references in test cases
   - Validate environment variables in step libraries

6. **Generate Validation Report**:
   - Summary of validation results
   - List of any errors or warnings
   - Recommendations for fixes

### Validation Output

The validation will provide:

**Success Indicators**:
- ✅ YAML syntax is valid
- ✅ All test case files exist and are valid
- ✅ All environment variables are available
- ✅ All step library includes can be resolved
- ✅ Suite configuration is valid

**Error Detection**:
- ❌ YAML parsing errors
- ❌ Missing test case files
- ❌ Invalid test case structure
- ❌ Missing environment variables
- ❌ Missing step libraries
- ❌ Invalid configuration settings

**Warning Detection**:
- ⚠️ Unused environment variables
- ⚠️ Deprecated configuration options
- ⚠️ Test cases without tags
- ⚠️ Long timeout values
- ⚠️ Missing descriptions

### Validation Examples

**Example 1: Validate E-commerce Suite**
```bash
/validate-test-suite suite:e-commerce.yml env:test
```

**Example 2: Validate with Development Environment**
```bash
/validate-test-suite suite:smoke-tests.yml env:dev
```

**Example 3: Validate Suite Structure Only**
```bash
/validate-test-suite suite:regression.yml
```

### Common Validation Issues

**Test Case Reference Issues**:
- Test case file not found: `test-cases/missing.yml`
- Invalid test case YAML syntax
- Test case missing required fields

**Environment Issues**:
- Missing environment file: `.env.test`
- Undefined environment variables: `{{MISSING_VAR}}`
- Environment variable conflicts between suite and global

**Step Library Issues**:
- Missing step library: `missing-steps.yml`
- Circular include dependencies
- Invalid step library format

**Configuration Issues**:
- Invalid timeout values
- Unsupported configuration options
- Conflicting configuration settings

### Best Practices for Test Suite Validation

1. **Always validate before execution**: Run validation before executing test suites
2. **Test with target environment**: Use the same environment for validation as execution
3. **Check dependencies**: Ensure all test cases and step libraries are validated
4. **Regular validation**: Include validation in CI/CD pipelines
5. **Address warnings**: Fix warnings to improve test suite maintainability

Please analyze the test suite structure, validate all references and dependencies, check environment configuration, and provide comprehensive validation feedback with specific recommendations for any issues found.

ARGUMENTS: {suite} {env}