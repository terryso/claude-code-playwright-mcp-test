# YAML Test Framework Usage Example

## Traditional vs. Automated Approach

### Before (Manual Processing):
AI needs to manually:
1. Read .env files
2. Parse YAML test cases
3. Apply tag filtering logic
4. Load and expand step libraries
5. Replace environment variables
6. Execute tests

### After (Automated Processing):
AI simply calls the processor and uses the output:

```bash
# Get processed test cases
node scripts/yaml-test-processor.js --env=dev --tags=smoke

# Output is ready-to-execute structured data
{
  "environment": "dev",
  "testCases": [
    {
      "name": "order.yml",
      "steps": [
        "Open https://www.saucedemo.com/ page",
        "Fill username field with standard_user",
        "Fill password field with secret_sauce",
        // ... fully expanded and processed steps
      ]
    }
  ]
}
```

## Performance Benefits

- **Speed**: No manual YAML parsing or file reading
- **Accuracy**: Consistent tag filtering and variable substitution
- **Scalability**: Handles large test suites efficiently
- **Maintainability**: Single source of truth for processing logic

## Example Command Execution

```bash
# Process all smoke tests
/run-yaml-test tags:smoke

# Process specific file
/run-yaml-test file:order.yml env:test

# Process with complex tag filtering
/run-yaml-test tags:"smoke,login|critical" env:prod
```

The AI now follows this simple workflow:
1. Call `node scripts/yaml-test-processor.js` with parameters
2. Parse JSON output to get processed test cases
3. Execute steps using Playwright MCP
4. Generate reports based on results