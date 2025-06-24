const fs = require('fs');
const path = require('path');
const os = require('os');
const SuiteReportGenerator = require('./suite-report-generator.js');

describe('SuiteReportGenerator Integration Tests', () => {
    let testDir;
    let generator;

    beforeEach(() => {
        // 使用唯一的临时目录避免竞争条件
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-suite-reports-'));
        // 确保目录存在
        fs.mkdirSync(testDir, { recursive: true });

        generator = new SuiteReportGenerator({
            environment: 'test',
            reportStyle: 'overview',
            projectRoot: testDir,
            reportPath: 'suite-reports'
        });
    });

    afterEach(() => {
        // 清理测试目录
        if (testDir && fs.existsSync(testDir)) {
            try {
                fs.rmSync(testDir, { recursive: true, force: true });
            } catch (error) {
                // 忽略清理错误，避免影响测试结果
                console.warn(`Warning: Failed to clean up test directory ${testDir}:`, error.message);
            }
        }
    });

    describe('Real Suite Report Generation', () => {
        test('should generate comprehensive suite report for smoke tests', () => {
            const suiteData = {
                name: 'smoke-test-suite.yml',
                suiteName: 'Smoke Test Suite',
                description: 'Comprehensive smoke testing for e-commerce application',
                summary: {
                    totalSteps: 61,
                    totalTests: 4,
                    estimatedDuration: '5-10 minutes'
                },
                testCases: [
                    { name: 'order.yml', description: 'Complete order flow test' },
                    { name: 'sort-optimized.yml', description: 'Product sorting with session optimization' },
                    { name: 'product-details.yml', description: 'Product details navigation test' },
                    { name: 'sort.yml', description: 'Basic sorting functionality test' }
                ],
                environment: 'dev',
                tags: ['smoke', 'critical', 'e2e']
            };

            const executionResults = [
                {
                    testName: 'order.yml',
                    description: 'Complete e-commerce order flow with checkout process',
                    status: 'passed',
                    steps: 16,
                    duration: '45s',
                    features: 'Login, Product Selection, Checkout, Order Confirmation',
                    tags: ['smoke', 'order', 'checkout'],
                    validations: 'User authentication, Cart functionality, Payment processing, Order confirmation'
                },
                {
                    testName: 'sort-optimized.yml',
                    description: 'Product sorting functionality with session optimization',
                    status: 'passed',
                    steps: 13,
                    duration: '15s',
                    features: 'Session Management, Product Sorting',
                    tags: ['smoke', 'sort', 'session-optimized'],
                    validations: 'Session persistence, Price sorting accuracy'
                },
                {
                    testName: 'product-details.yml',
                    description: 'Product details page navigation and verification',
                    status: 'passed',
                    steps: 23,
                    duration: '20s',
                    features: 'Product Navigation, Details Verification, Cart Integration',
                    tags: ['smoke', 'product-details', 'session-optimized'],
                    validations: 'Product information accuracy, Navigation functionality, Cart operations'
                },
                {
                    testName: 'sort.yml',
                    description: 'Basic product sorting functionality test',
                    status: 'passed',
                    steps: 9,
                    duration: '12s',
                    features: 'Product Sorting',
                    tags: ['smoke', 'sort'],
                    validations: 'Sorting algorithm correctness, Price display accuracy'
                }
            ];

            const result = generator.generateSuiteReport(suiteData, executionResults);

            // 验证基本结果
            expect(result.reportPath).toBeDefined();
            expect(result.fileName).toBeDefined();
            expect(result.latestLink).toBeDefined();
            expect(fs.existsSync(result.reportPath)).toBe(true);

            // 验证文件内容
            const content = fs.readFileSync(result.reportPath, 'utf8');
            
            // 验证套件信息
            expect(content).toContain('Smoke Test Suite');
            expect(content).toContain('Test Cases Passed');
            expect(content).toContain('100% Success Rate');
            
            // 验证所有测试用例
            expect(content).toContain('order.yml');
            expect(content).toContain('sort-optimized.yml');
            expect(content).toContain('product-details.yml');
            expect(content).toContain('sort.yml');
            
            // 验证执行状态
            expect(content).toContain('100% Success Rate');
            expect(content).toContain('PASSED');
            
            // 验证持续时间（这些可能在detailed模式下显示）
            // expect(content).toContain('45s');
        });

        test('should generate detailed suite report with step information', () => {
            const detailedGenerator = new SuiteReportGenerator({
                environment: 'test',
                reportStyle: 'detailed',
                projectRoot: testDir,
                reportPath: 'detailed-suite-reports'
            });

            const suiteData = {
                name: 'detailed-suite.yml',
                suiteName: 'Detailed Test Suite',
                description: 'Detailed test suite with comprehensive step tracking',
                summary: { totalSteps: 10, totalTests: 2 },
                testCases: [
                    { name: 'detailed-test1.yml', description: 'First detailed test' },
                    { name: 'detailed-test2.yml', description: 'Second detailed test' }
                ]
            };

            const executionResults = [
                {
                    testName: 'detailed-test1.yml',
                    description: 'Comprehensive test with detailed steps',
                    status: 'passed',
                    steps: 5,
                    duration: '30s',
                    features: 'Feature A, Feature B',
                    tags: ['detailed', 'comprehensive'],
                    validations: 'Validation A, Validation B'
                },
                {
                    testName: 'detailed-test2.yml',
                    description: 'Another detailed test case',
                    status: 'passed',
                    steps: 5,
                    duration: '25s',
                    features: 'Feature C, Feature D',
                    tags: ['detailed', 'thorough'],
                    validations: 'Validation C, Validation D'
                }
            ];

            const result = detailedGenerator.generateSuiteReport(suiteData, executionResults);

            const content = fs.readFileSync(result.reportPath, 'utf8');
            
            // 验证详细报告特性
            expect(content).toContain('Style: detailed');
            expect(content).toContain('Feature A, Feature B');
            expect(content).toContain('Validation A, Validation B');
            expect(content).toContain('comprehensive');
            expect(content).toContain('thorough');
        });

        test('should handle suite with mixed test results', () => {
            const suiteData = {
                name: 'mixed-results-suite.yml',
                suiteName: 'Mixed Results Suite',
                description: 'Test suite with both passing and failing tests',
                summary: { totalSteps: 20, totalTests: 3 },
                testCases: [
                    { name: 'pass-test.yml', description: 'Passing test' },
                    { name: 'fail-test.yml', description: 'Failing test' },
                    { name: 'another-pass-test.yml', description: 'Another passing test' }
                ]
            };

            const executionResults = [
                {
                    testName: 'pass-test.yml',
                    description: 'This test should pass',
                    status: 'passed',
                    steps: 8,
                    duration: '20s',
                    features: 'Basic functionality',
                    tags: ['basic'],
                    validations: 'Basic validations'
                },
                {
                    testName: 'fail-test.yml',
                    description: 'This test fails',
                    status: 'failed',
                    steps: 5,
                    duration: '15s',
                    features: 'Advanced functionality',
                    tags: ['advanced'],
                    validations: 'Advanced validations',
                    error: 'Element not found during execution'
                },
                {
                    testName: 'another-pass-test.yml',
                    description: 'Another test that passes',
                    status: 'passed',
                    steps: 7,
                    duration: '18s',
                    features: 'Additional functionality',
                    tags: ['additional'],
                    validations: 'Additional validations'
                }
            ];

            const result = generator.generateSuiteReport(suiteData, executionResults);

            const content = fs.readFileSync(result.reportPath, 'utf8');
            
            // 验证混合结果
            expect(content).toContain('67% Success Rate');
            expect(content).toContain('2/3');
            expect(content).toContain('PASSED');
            expect(content).toContain('FAILED');
            expect(content).toContain('Element not found during execution');
        });

        test('should automatically create report directory', () => {
            const autoCreateDir = path.join(testDir, 'auto-created-suite-dir');
            const autoGenerator = new SuiteReportGenerator({
                environment: 'test',
                reportStyle: 'overview',
                projectRoot: testDir,
                reportPath: 'auto-created-suite-dir'
            });

            expect(fs.existsSync(autoCreateDir)).toBe(false);

            const suiteData = {
                name: 'auto-create-test.yml',
                suiteName: 'Auto Create Test',
                description: 'Test automatic directory creation',
                summary: { totalSteps: 5, totalTests: 1 },
                testCases: [{ name: 'simple-test.yml', description: 'Simple test' }]
            };

            const executionResults = [{
                testName: 'simple-test.yml',
                description: 'Simple test case',
                status: 'passed',
                steps: 5,
                duration: '10s',
                features: 'Basic feature',
                tags: ['simple'],
                validations: 'Basic validation'
            }];

            const result = autoGenerator.generateSuiteReport(suiteData, executionResults);

            expect(fs.existsSync(autoCreateDir)).toBe(true);
            expect(fs.existsSync(result.reportPath)).toBe(true);
            expect(fs.existsSync(result.latestLink)).toBe(true);
        });

        test('should handle empty test suites gracefully', () => {
            const suiteData = {
                name: 'empty-suite.yml',
                suiteName: 'Empty Test Suite',
                description: 'A test suite with no test cases',
                summary: { totalSteps: 0, totalTests: 0 },
                testCases: []
            };

            const executionResults = [];

            const result = generator.generateSuiteReport(suiteData, executionResults);

            const content = fs.readFileSync(result.reportPath, 'utf8');
            
            expect(content).toContain('Empty Test Suite');
            expect(content).toContain('0/0');
        });
    });

    describe('Test Suite Report Formats', () => {
        test('should generate overview format correctly', () => {
            const suiteData = {
                name: 'format-test.yml',
                suiteName: 'Format Test Suite',
                description: 'Testing report format generation',
                summary: { totalSteps: 15, totalTests: 2 },
                testCases: [
                    { name: 'format-test1.yml', description: 'Format test 1' },
                    { name: 'format-test2.yml', description: 'Format test 2' }
                ]
            };

            const executionResults = [
                {
                    testName: 'format-test1.yml',
                    description: 'First format test',
                    status: 'passed',
                    steps: 8,
                    duration: '15s',
                    features: 'Format Feature A',
                    tags: ['format'],
                    validations: 'Format Validation A'
                },
                {
                    testName: 'format-test2.yml',
                    description: 'Second format test',
                    status: 'passed',
                    steps: 7,
                    duration: '12s',
                    features: 'Format Feature B',
                    tags: ['format'],
                    validations: 'Format Validation B'
                }
            ];

            const result = generator.generateSuiteReport(suiteData, executionResults);

            const content = fs.readFileSync(result.reportPath, 'utf8');
            
            // 验证概览格式特性
            expect(content).toContain('Format Test Suite');
            expect(content).toContain('100% Success Rate');
            expect(content).toContain('Test Cases Passed');
            
            // 验证HTML结构
            expect(content).toContain('<!DOCTYPE html>');
            expect(content).toContain('<html lang="en">');
            expect(content).toContain('Suite Report');
        });

        test('should handle test suite with performance data', () => {
            const suiteData = {
                name: 'performance-suite.yml',
                suiteName: 'Performance Test Suite',
                description: 'Suite focused on performance testing',
                summary: { totalSteps: 30, totalTests: 3 },
                testCases: [
                    { name: 'load-test.yml', description: 'Load testing' },
                    { name: 'stress-test.yml', description: 'Stress testing' },
                    { name: 'endurance-test.yml', description: 'Endurance testing' }
                ],
                performance: {
                    averageResponseTime: '150ms',
                    maxResponseTime: '500ms',
                    minResponseTime: '50ms'
                }
            };

            const executionResults = [
                {
                    testName: 'load-test.yml',
                    description: 'Load testing scenario',
                    status: 'passed',
                    steps: 10,
                    duration: '60s',
                    features: 'Load handling, Response time monitoring',
                    tags: ['performance', 'load'],
                    validations: 'Response time under threshold, No memory leaks'
                },
                {
                    testName: 'stress-test.yml',
                    description: 'Stress testing scenario',
                    status: 'passed',
                    steps: 10,
                    duration: '90s',
                    features: 'Stress handling, Resource monitoring',
                    tags: ['performance', 'stress'],
                    validations: 'System stability under load, Resource cleanup'
                },
                {
                    testName: 'endurance-test.yml',
                    description: 'Endurance testing scenario',
                    status: 'passed',
                    steps: 10,
                    duration: '300s',
                    features: 'Long-term stability, Memory monitoring',
                    tags: ['performance', 'endurance'],
                    validations: 'No memory leaks over time, Consistent performance'
                }
            ];

            const result = generator.generateSuiteReport(suiteData, executionResults);

            const content = fs.readFileSync(result.reportPath, 'utf8');
            
            expect(content).toContain('Performance Test Suite');
            expect(content).toContain('load-test.yml');
            expect(content).toContain('stress-test.yml');
            expect(content).toContain('endurance-test.yml');
        });
    });
});