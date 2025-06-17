const fs = require('fs');
const path = require('path');
const SuiteReportGenerator = require('./suite-report-generator');

// Mock fs module
jest.mock('fs');

describe('SuiteReportGenerator', () => {
    let generator;
    let mockSuiteData;
    let mockExecutionResults;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup default generator
        generator = new SuiteReportGenerator({
            environment: 'test',
            reportStyle: 'overview',
            reportFormat: 'html',
            projectRoot: '/test/project'
        });

        // Mock suite data
        mockSuiteData = {
            name: 'test-suite.yml',
            suiteName: 'Test Suite',
            description: 'Test suite description',
            summary: { totalSteps: 50 },
            testCases: [
                { name: 'test1.yml' },
                { name: 'test2.yml' }
            ]
        };

        // Mock execution results
        mockExecutionResults = [
            {
                testName: 'test1.yml',
                description: 'First test case',
                status: 'passed',
                steps: 25,
                features: 'Login, Navigation',
                tags: ['smoke', 'critical'],
                validations: 'Login validation, Navigation check'
            },
            {
                testName: 'test2.yml',
                description: 'Second test case',
                status: 'passed',
                steps: 25,
                features: 'Product, Cart',
                tags: ['regression'],
                validations: 'Product display, Cart functionality'
            }
        ];

        // Mock fs methods
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation();
        fs.writeFileSync.mockImplementation();
        fs.unlinkSync.mockImplementation();
        fs.symlinkSync.mockImplementation();
    });

    describe('Constructor', () => {
        test('should initialize with default values', () => {
            const defaultGenerator = new SuiteReportGenerator();
            
            expect(defaultGenerator.environment).toBe('dev');
            expect(defaultGenerator.reportStyle).toBe('overview');
            expect(defaultGenerator.reportFormat).toBe('html');
            expect(defaultGenerator.projectRoot).toBe(process.cwd());
            expect(defaultGenerator.reportPath).toBe('reports/dev');
        });

        test('should initialize with custom options', () => {
            const customGenerator = new SuiteReportGenerator({
                environment: 'prod',
                reportStyle: 'detailed',
                reportFormat: 'json',
                projectRoot: '/custom/path',
                reportPath: 'custom/reports'
            });

            expect(customGenerator.environment).toBe('prod');
            expect(customGenerator.reportStyle).toBe('detailed');
            expect(customGenerator.reportFormat).toBe('json');
            expect(customGenerator.projectRoot).toBe('/custom/path');
            expect(customGenerator.reportPath).toBe('custom/reports');
        });
    });

    describe('generateSuiteReport', () => {
        test('should generate report with correct file name and path', () => {
            const timestamp = '2025-06-17';
            jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-06-17T10:00:00.000Z');

            const result = generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(result.fileName).toBe('suite-test-suite-2025-06-17.html');
            expect(result.reportPath).toBe('/test/project/reports/test/suite-test-suite-2025-06-17.html');
            expect(result.latestLink).toMatch(/latest-suite-report\.html$/);
        });

        test('should create directory if it does not exist', () => {
            fs.existsSync.mockReturnValue(false);

            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(fs.mkdirSync).toHaveBeenCalledWith(
                '/test/project/reports/test',
                { recursive: true }
            );
        });

        test('should not create directory if it exists', () => {
            fs.existsSync.mockReturnValue(true);

            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        test('should write report file', () => {
            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(fs.writeFileSync).toHaveBeenCalled();
            const writeCall = fs.writeFileSync.mock.calls[0];
            expect(writeCall[0]).toMatch(/suite-test-suite-\d{4}-\d{2}-\d{2}\.html$/);
            expect(writeCall[1]).toContain('<!DOCTYPE html>');
            expect(writeCall[2]).toBe('utf8');
        });

        test('should create symlink for latest report', () => {
            fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(fs.unlinkSync).toHaveBeenCalledWith(
                '/test/project/reports/test/latest-suite-report.html'
            );
            expect(fs.symlinkSync).toHaveBeenCalled();
        });

        test('should handle overview style report', () => {
            generator.reportStyle = 'overview';
            
            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            const reportContent = fs.writeFileSync.mock.calls[0][1];
            expect(reportContent).toContain('Style: overview');
            expect(reportContent).not.toContain('Style: detailed');
        });

        test('should handle detailed style report', () => {
            generator.reportStyle = 'detailed';
            
            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            const reportContent = fs.writeFileSync.mock.calls[0][1];
            expect(reportContent).toContain('Style: detailed');
            expect(reportContent).toContain('Detailed Steps');
        });
    });

    describe('generateOverviewReport', () => {
        test('should generate correct HTML structure for all passed tests', () => {
            const timestamp = '2025-06-17';
            const result = generator.generateOverviewReport(mockSuiteData, mockExecutionResults, timestamp);

            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<title>Test Suite Report - Test Suite</title>');
            expect(result).toContain('Environment: test');
            expect(result).toContain('Style: overview');
            expect(result).toContain('2/2'); // Success rate
            expect(result).toContain('100% Success Rate');
            expect(result).toContain('Revolutionary Session Management');
        });

        test('should handle failed tests correctly', () => {
            const failedResults = [
                { ...mockExecutionResults[0], status: 'passed' }, // Keep first as passed
                {
                    testName: 'test2.yml',
                    description: 'Failed test case',
                    status: 'failed',
                    steps: 10,
                    features: 'Error handling',
                    tags: ['error'],
                    validations: 'Error validation',
                    error: 'Test failed due to timeout'
                }
            ];

            const result = generator.generateOverviewReport(mockSuiteData, failedResults, '2025-06-17');

            expect(result).toContain('1/2'); // Success rate with failure
            expect(result).toContain('50% Success Rate');
            expect(result).toContain('#dc3545'); // Failed color
            expect(result).toContain('❌'); // Failed icon
            expect(result).toContain('Test failed due to timeout');
            expect(result).not.toContain('Revolutionary Session Management'); // Should not show for failed tests
        });

        test('should include test case information', () => {
            const result = generator.generateOverviewReport(mockSuiteData, mockExecutionResults, '2025-06-17');

            // Check first test case
            expect(result).toContain('test1.yml - First test case');
            expect(result).toContain('PASSED');
            expect(result).toContain('25'); // Steps
            expect(result).toContain('Login, Navigation');
            expect(result).toContain('smoke');
            expect(result).toContain('critical');

            // Check second test case
            expect(result).toContain('test2.yml - Second test case');
            expect(result).toContain('Product, Cart');
            expect(result).toContain('regression');
        });

        test('should handle missing optional fields', () => {
            const minimalResults = [{
                testName: 'minimal.yml',
                status: 'passed'
            }];

            const minimalSuiteData = {
                name: 'minimal.yml'
            };

            const result = generator.generateOverviewReport(minimalSuiteData, minimalResults, '2025-06-17');

            expect(result).toContain('minimal.yml');
            expect(result).toContain('PASSED');
            expect(result).toContain('N/A'); // For missing features/validations
        });
    });

    describe('generateDetailedReport', () => {
        test('should generate detailed report with step information', () => {
            const timestamp = '2025-06-17';
            const result = generator.generateDetailedReport(mockSuiteData, mockExecutionResults, timestamp);

            expect(result).toContain('Style: detailed');
            expect(result).toContain('Detailed Steps');
            expect(result).toContain('Steps details would be included');
        });

        test('should include all overview content in detailed report', () => {
            const result = generator.generateDetailedReport(mockSuiteData, mockExecutionResults, '2025-06-17');

            // Should contain overview elements
            expect(result).toContain('Test Suite');
            expect(result).toContain('2/2');
            expect(result).toContain('100% Success Rate');
            
            // Plus detailed elements
            expect(result).toContain('📝 Detailed Steps');
        });
    });

    describe('generateCoverageItems', () => {
        test('should generate coverage items HTML', () => {
            const result = generator.generateCoverageItems(mockExecutionResults);

            expect(result).toContain('Authentication & Login');
            expect(result).toContain('Product Sorting');
            expect(result).toContain('Product Details');
            expect(result).toContain('Shopping Cart');
            expect(result).toContain('Session Management');
            expect(result).toContain('Navigation');
            
            // Check icons
            expect(result).toContain('✅');
            expect(result).toContain('🚀');
            expect(result).toContain('🔄');
        });

        test('should return consistent coverage items regardless of input', () => {
            const emptyResults = [];
            const result1 = generator.generateCoverageItems(mockExecutionResults);
            const result2 = generator.generateCoverageItems(emptyResults);

            // Coverage items should be the same regardless of execution results
            expect(result1).toBe(result2);
            expect(result1).toContain('Revolutionary session persistence');
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle empty test cases array', () => {
            const emptySuiteData = {
                ...mockSuiteData,
                testCases: []
            };
            const emptyResults = [];

            const result = generator.generateSuiteReport(emptySuiteData, emptyResults);

            expect(result.fileName).toMatch(/suite-test-suite-\d{4}-\d{2}-\d{2}\.html$/);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should handle missing suite name', () => {
            const noNameSuiteData = {
                description: 'Suite without name'
            };

            const result = generator.generateSuiteReport(noNameSuiteData, mockExecutionResults);

            expect(result.fileName).toMatch(/suite-unnamed-suite-\d{4}-\d{2}-\d{2}\.html$/);
        });

        test('should handle undefined summary', () => {
            const noSummarySuiteData = {
                ...mockSuiteData,
                summary: undefined
            };

            const result = generator.generateOverviewReport(noSummarySuiteData, mockExecutionResults, '2025-06-17');

            expect(result).toContain('<div class="stat-number" style="color: #17a2b8;">0</div>');
        });

        test('should handle mixed passed and failed results', () => {
            const mixedResults = [
                { ...mockExecutionResults[0], status: 'passed' },
                { ...mockExecutionResults[1], status: 'failed', error: 'Connection timeout' }
            ];

            const result = generator.generateOverviewReport(mockSuiteData, mixedResults, '2025-06-17');

            expect(result).toContain('1/2'); // 1 passed out of 2
            expect(result).toContain('50% Success Rate');
            expect(result).toContain('status-passed');
            expect(result).toContain('status-failed');
            expect(result).toContain('Connection timeout');
        });

        test('should handle custom report path', () => {
            const customGenerator = new SuiteReportGenerator({
                environment: 'test',
                reportPath: 'custom/path/reports'
            });

            const result = customGenerator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(result.reportPath).toContain('custom/path/reports');
        });
    });

    describe('File system operations', () => {
        test('should handle existing symlink removal', () => {
            fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(fs.symlinkSync).toHaveBeenCalled();
        });

        test('should handle missing symlink', () => {
            fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);

            generator.generateSuiteReport(mockSuiteData, mockExecutionResults);

            expect(fs.unlinkSync).not.toHaveBeenCalled();
            expect(fs.symlinkSync).toHaveBeenCalled();
        });
    });

    describe('Direct script execution', () => {
        test('should handle command line arguments', () => {
            // Test the command line argument parsing logic
            const originalArgv = process.argv;
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            try {
                process.argv = ['node', 'suite-report-generator.js', 'test', 'detailed'];
                
                // Test the argument parsing directly
                const testGenerator = new SuiteReportGenerator({
                    environment: process.argv[2] || 'dev',
                    reportStyle: process.argv[3] || 'overview'
                });

                expect(testGenerator.environment).toBe('test');
                expect(testGenerator.reportStyle).toBe('detailed');
            } finally {
                process.argv = originalArgv;
                consoleSpy.mockRestore();
            }
        });

        test('should use default values when no args provided', () => {
            const originalArgv = process.argv;

            try {
                process.argv = ['node', 'suite-report-generator.js'];
                
                const defaultGenerator = new SuiteReportGenerator({
                    environment: process.argv[2] || 'dev',
                    reportStyle: process.argv[3] || 'overview'
                });

                expect(defaultGenerator.environment).toBe('dev');
                expect(defaultGenerator.reportStyle).toBe('overview');
            } finally {
                process.argv = originalArgv;
            }
        });
    });

    describe('Additional edge cases', () => {
        test('should handle null execution results', () => {
            const result = generator.generateOverviewReport(mockSuiteData, null, '2025-06-17');
            expect(result).toContain('<!DOCTYPE html>');
        });

        test('should handle execution results with undefined tags', () => {
            const resultsWithoutTags = [{
                testName: 'test-no-tags.yml',
                description: 'Test without tags',
                status: 'passed',
                steps: 5
            }];

            const result = generator.generateOverviewReport(mockSuiteData, resultsWithoutTags, '2025-06-17');
            expect(result).toContain('test-no-tags.yml');
            expect(result).toContain('PASSED');
        });

        test('should handle zero steps execution results', () => {
            const zeroStepsResults = [{
                testName: 'zero-steps.yml',
                status: 'passed',
                steps: 0
            }];

            const result = generator.generateOverviewReport(mockSuiteData, zeroStepsResults, '2025-06-17');
            expect(result).toContain('0'); // Steps count
        });
    });
});