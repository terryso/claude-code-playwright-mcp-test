---
trigger: always_on
description: 
globs: 
---
# Command Rules Documentation

🔥 **CMD.MDC 规则已加载** - 测试命令规则文档现在生效 🔥

## General Execution Principles

**Smart Execution**: Always check if tests are already completed before executing. Look for:
- Test completion messages or summaries
- Validation results and confirmations  
- Success/failure status indicators
- Existing test reports or screenshots

**Avoid Redundant Execution**: If tests are already completed successfully, focus on report generation (if needed) rather than re-executing tests.

---

## Test Case Execution Commands

- `/run-yaml-test [parameters...]` - Execute YAML test cases with Playwright automation
  - Purpose: Execute Playwright automation tests using YAML testing framework
  - Supports multi-environment configuration, tag filtering, and report generation
  - **CRITICAL**: MUST follow EVERY step in @run-yaml-test.md
  - **MANDATORY**: If GENERATE_REPORT=true, MUST generate reports using TestCaseReportGenerator
  - **REQUIREMENT**: Use automated YAML test processor first, then execute with Playwright MCP
  - **ENFORCEMENT**: After test execution, always check environment variables and generate reports if configured

### MANDATORY Report Generation Process:
1. **Check Environment**: Verify GENERATE_REPORT environment variable from processor output
2. **Use TestCaseReportGenerator**: Import and instantiate the class with environment configuration
3. **Provide Complete Data**: Pass test case data and execution results with proper structure
4. **Execute Generation**: Call generateTestCaseReport() method
5. **Verify Output**: Confirm report file creation and latest-test-report.html update

---

## Test Suite Execution Commands

- `/run-test-suite [parameters...]` - Execute YAML test suites containing multiple organized test cases
  - Purpose: Execute multiple test cases as organized test suites with consolidated reporting
  - Supports suite-level configuration, pre/post actions, and enhanced reporting
  - **CRITICAL**: MUST follow EVERY step in @run-test-suite.md
  - **MANDATORY**: If GENERATE_REPORT=true, MUST generate reports using SuiteReportGenerator
  - **REQUIREMENT**: Use automated test suite processor first, then execute with Playwright MCP
  - **ENFORCEMENT**: After suite execution, always check environment variables and generate reports if configured

### MANDATORY Suite Report Generation Process:
1. **Check Environment**: Verify GENERATE_REPORT environment variable from suite processor output
2. **Use SuiteReportGenerator**: Import and instantiate the class with environment configuration
3. **Provide Complete Data**: Pass test suite data and execution results with proper structure
4. **Execute Generation**: Call generateSuiteReport() method
5. **Verify Output**: Confirm report file creation and latest-test-report.html update