# Project Structure

```
├── .claude/                    # Claude Code project commands
│   └── commands/              # Commands directory
│       ├── run-yaml-test.md   # Execute test command
│       ├── validate-yaml-test.md # Validate test command
│       ├── run-test-suite.md  # Execute test suite command
│       └── validate-test-suite.md # Validate test suite command
├── .env.example               # Environment variable template
├── .env.dev                   # Development environment configuration
├── .env.test                  # Test environment configuration
├── .env.prod                  # Production environment configuration
├── steps/                     # Reusable step libraries
│   ├── login.yml              # Traditional login step library
│   ├── session-persist.yml    # 🆕 Persistent session management
│   ├── session-check.yml      # Intelligent session checking
│   ├── ensure-products-page.yml # Navigate to products page
│   └── cleanup.yml            # Cleanup step library
├── test-cases/                # Test cases
│   ├── order.yml              # Order test case
│   ├── sort-optimized.yml     # Session-optimized sort test
│   └── product-details.yml    # Product details test case
├── test-suites/               # Test suites (NEW)
│   ├── e-commerce.yml         # E-commerce test suite
│   ├── smoke-tests.yml        # Smoke test suite
│   └── regression.yml         # Regression test suite
├── screenshots/               # Test screenshots (organized by environment)
├── reports/                   # Test reports (organized by environment)
├── docs/                      # Documentation
│   ├── en/                    # English documentation
│   └── cn/                    # Chinese documentation
├── CLAUDE.md                  # Project description and command index
└── README.md                  # This document
```