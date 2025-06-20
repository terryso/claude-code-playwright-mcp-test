# Environment Configuration

## Environment Variable Reference

Supported environment variable types:

```bash
# .env.dev example
# Basic configuration
BASE_URL=https://dev.myapp.com

# Test account
TEST_USERNAME=dev_admin
TEST_PASSWORD=dev123

# Regular user account
USER_USERNAME=dev_user@example.com
USER_PASSWORD=devpass123

# Browser configuration
BROWSER_TIMEOUT=30000

# File paths
SCREENSHOT_PATH=screenshots/dev
REPORT_PATH=reports/dev

# Report configuration
GENERATE_REPORT=true
REPORT_FORMAT=html
```

## Multi-Environment Switching

```bash
# Development environment
/run-yaml-test file:test-cases/order.yml env:dev

# Test environment
/run-yaml-test file:test-cases/order.yml env:test

# Production environment
/run-yaml-test file:test-cases/order.yml env:prod
```