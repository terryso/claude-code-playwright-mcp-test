# Best Practices

## 1. Step Library Design

- **Single Responsibility**: Each step library focuses on one functional area
- **Parameterization**: Use environment variables instead of hardcoded values
- **Reusability**: Design generic steps that can be reused by multiple test cases

```yaml
# ✅ Good step library design
# steps/form-validation.yml
steps:
  - "Fill {{FIELD_NAME}} field with {{INVALID_VALUE}}"
  - "Click submit button"
  - "Verify page displays error message: {{ERROR_MESSAGE}}"
```

## 2. Test Case Organization

- **Tag Classification**: Use reasonable tags to classify test cases
- **Logical Grouping**: Organize test cases by functional modules  
- **Environment Adaptation**: Consider differences between environments
- **Cleanup Mechanism**: Perform appropriate cleanup after each test

```yaml
# ✅ Good test case structure
tags:
  - smoke        # Smoke test
  - login        # Login functionality
  - critical     # Critical functionality
steps:
  - include: "setup"           # Test preparation
  - include: "login"           # Login
  - "Execute core test steps"  # Main test logic
  - include: "cleanup"         # Environment cleanup
```

## 3. Tagging Strategy

- **Functional Tags**: Classify by functional modules, e.g., login, user, api
- **Priority Tags**: e.g., critical, high, medium, low
- **Type Tags**: e.g., smoke, regression, integration
- **Environment Tags**: e.g., dev-only, prod-safe

## 4. Environment Configuration

- **Sensitive Information**: Use environment variables for all passwords and API keys
- **Environment Isolation**: Use independent configuration files for different environments
- **Documentation**: Document all required variables in .env.example