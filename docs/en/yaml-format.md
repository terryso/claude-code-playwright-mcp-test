# YAML Format Guide

## Step Library Format

Step libraries use concise natural language descriptions:

```yaml
# steps/login.yml
# Supported environment variables: BASE_URL, TEST_USERNAME, TEST_PASSWORD
steps:
  - "Open {{BASE_URL}} page"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Verify page displays Swag Labs"
```

## Test Case Format

Test cases contain tags and steps, can reference step libraries or define steps directly:

```yaml
# test-cases/order.yml
# Environment variables are automatically loaded from .env.{environment} files
tags:
  - smoke
  - order  
  - checkout
steps:
  - include: "login"                           # Reference login step library
  - "Click Add to Cart button for first product"      # Direct step definition
  - "Click Add to Cart button for second product"
  - "Click shopping cart icon in top right"
  - "Enter First Name"
  - "Enter Last Name"
  - "Enter Postal Code"
  - "Click Continue button"
  - "Click Finish button"
  - "Verify page displays Thank you for your order!"
  - include: "cleanup"                         # Reference cleanup step library
```

## Test Suite Format

Test suites organize multiple test cases with simple, clean configuration:

```yaml
# test-suites/e-commerce.yml
name: "E-commerce Test Suite"
description: "Complete e-commerce workflow testing covering user registration, product browsing, cart operations, and checkout process"
tags:
  - e-commerce
  - integration
  - critical
  - smoke

# Test cases to execute in order
test-cases:
  - "test-cases/order.yml"
  - "test-cases/product-details.yml"
  - "test-cases/sort-optimized.yml"
```

**Key Features of Simplified Format**:
- **Clean Configuration**: Only essential fields - name, description, tags, and test-cases
- **Simple Test Case Lists**: Direct file paths without extra metadata
- **Environment via .env**: All environment configuration through standard .env files
- **Minimal Complexity**: Easy to read, write, and maintain