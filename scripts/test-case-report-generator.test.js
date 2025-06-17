const fs = require('fs');
const path = require('path');
const TestCaseReportGenerator = require('./test-case-report-generator');

// Mock fs module
jest.mock('fs');

describe('TestCaseReportGenerator', () => {
    let generator;
    let mockTestCaseData;
    let mockExecutionResult;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup default generator
        generator = new TestCaseReportGenerator({
            environment: 'test',
            reportStyle: 'overview',
            reportFormat: 'html',
            projectRoot: '/test/project'
        });

        // Mock test case data
        mockTestCaseData = {
            name: 'sample-test.yml',
            description: 'Sample test case description',
            tags: ['smoke', 'critical'],
            steps: [
                'Step 1: Login to application',
                'Step 2: Navigate to dashboard',
                { action: 'Step 3: Click button', description: 'Click the submit button' }
            ]
        };

        // Mock execution result
        mockExecutionResult = {
            status: 'passed',
            duration: 45,
            startTime: '2025-06-17T10:00:00Z',
            endTime: '2025-06-17T10:00:45Z'
        };

        // Mock fs methods
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation();
        fs.writeFileSync.mockImplementation();
        fs.unlinkSync.mockImplementation();
        fs.symlinkSync.mockImplementation();
    });

    describe('Constructor', () => {
        test('should initialize with default values', () => {
            const defaultGenerator = new TestCaseReportGenerator();
            
            expect(defaultGenerator.environment).toBe('dev');
            expect(defaultGenerator.reportStyle).toBe('overview');
            expect(defaultGenerator.reportFormat).toBe('html');
            expect(defaultGenerator.projectRoot).toBe(process.cwd());
            expect(defaultGenerator.reportPath).toBe('reports/dev');
        });

        test('should initialize with custom options', () => {
            const customGenerator = new TestCaseReportGenerator({
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

    describe('generateTestCaseReport', () => {
        test('should generate report with correct file name and path', () => {
            const timestamp = '2025-06-17';
            jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-06-17T10:00:00.000Z');

            const result = generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(result.fileName).toBe('test-sample-test-2025-06-17.html');
            expect(result.reportPath).toBe('/test/project/reports/test/test-sample-test-2025-06-17.html');
            expect(result.latestLink).toMatch(/latest-test-report\.html$/);
        });

        test('should create directory if it does not exist', () => {
            fs.existsSync.mockReturnValue(false);

            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(fs.mkdirSync).toHaveBeenCalledWith(
                '/test/project/reports/test',
                { recursive: true }
            );
        });

        test('should not create directory if it exists', () => {
            fs.existsSync.mockReturnValue(true);

            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        test('should write report file', () => {
            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(fs.writeFileSync).toHaveBeenCalled();
            const writeCall = fs.writeFileSync.mock.calls[0];
            expect(writeCall[0]).toMatch(/test-sample-test-\d{4}-\d{2}-\d{2}\.html$/);
            expect(writeCall[1]).toContain('<!DOCTYPE html>');
            expect(writeCall[2]).toBe('utf8');
        });

        test('should create symlink for latest report', () => {
            fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(fs.unlinkSync).toHaveBeenCalledWith(
                '/test/project/reports/test/latest-test-report.html'
            );
            expect(fs.symlinkSync).toHaveBeenCalled();
        });

        test('should handle overview style report', () => {
            generator.reportStyle = 'overview';
            
            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            const reportContent = fs.writeFileSync.mock.calls[0][1];
            expect(reportContent).toContain('Style: overview');
            expect(reportContent).not.toContain('Style: detailed');
        });

        test('should handle detailed style report', () => {
            generator.reportStyle = 'detailed';
            
            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            const reportContent = fs.writeFileSync.mock.calls[0][1];
            expect(reportContent).toContain('Style: detailed');
            expect(reportContent).toContain('Detailed Steps');
        });

        test('should handle missing test case name', () => {
            const noNameTestCase = {
                description: 'Test without name'
            };

            const result = generator.generateTestCaseReport(noNameTestCase, mockExecutionResult);

            expect(result.fileName).toMatch(/test-unnamed-test-\d{4}-\d{2}-\d{2}\.html$/);
        });
    });

    describe('generateOverviewReport', () => {
        test('should generate correct HTML structure for passed test', () => {
            const timestamp = '2025-06-17';
            const result = generator.generateOverviewReport(mockTestCaseData, mockExecutionResult, timestamp);

            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<title>Test Case Report - sample-test.yml</title>');
            expect(result).toContain('Environment: test');
            expect(result).toContain('Style: overview');
            expect(result).toContain('PASSED');
            expect(result).toContain('✅'); // Success icon
            expect(result).toContain('#28a745'); // Success color
        });

        test('should handle failed test correctly', () => {
            const failedResult = {
                ...mockExecutionResult,
                status: 'failed',
                error: 'Test failed due to element not found'
            };

            const result = generator.generateOverviewReport(mockTestCaseData, failedResult, '2025-06-17');

            expect(result).toContain('FAILED');
            expect(result).toContain('❌'); // Failed icon
            expect(result).toContain('#dc3545'); // Failed color
            expect(result).toContain('Test failed due to element not found');
        });

        test('should include test case information', () => {
            const result = generator.generateOverviewReport(mockTestCaseData, mockExecutionResult, '2025-06-17');

            expect(result).toContain('sample-test.yml');
            expect(result).toContain('Sample test case description');
            expect(result).toContain('smoke');
            expect(result).toContain('critical');
            expect(result).toContain('3'); // Step count
            expect(result).toContain('45'); // Duration
        });

        test('should handle missing optional fields', () => {
            const minimalTestCase = {
                name: 'minimal-test.yml'
            };
            const minimalResult = {
                status: 'passed'
            };

            const result = generator.generateOverviewReport(minimalTestCase, minimalResult, '2025-06-17');

            expect(result).toContain('minimal-test.yml');
            expect(result).toContain('No description provided');
            expect(result).toContain('No tags');
            expect(result).toContain('0'); // No steps
        });

        test('should handle unknown status', () => {
            const unknownResult = {
                status: 'unknown'
            };

            const result = generator.generateOverviewReport(mockTestCaseData, unknownResult, '2025-06-17');

            expect(result).toContain('UNKNOWN');
            expect(result).toContain('❓'); // Unknown icon
            expect(result).toContain('#6c757d'); // Unknown color
        });

        test('should handle null execution result', () => {
            const result = generator.generateOverviewReport(mockTestCaseData, null, '2025-06-17');

            expect(result).toContain('UNKNOWN');
            expect(result).toContain('0'); // Duration defaults to 0
        });

        test('should handle empty tags array', () => {
            const testCaseWithoutTags = {
                ...mockTestCaseData,
                tags: []
            };

            const result = generator.generateOverviewReport(testCaseWithoutTags, mockExecutionResult, '2025-06-17');

            expect(result).toContain('No tags');
            expect(result).toContain('0'); // Tag count
        });
    });

    describe('generateDetailedReport', () => {
        test('should generate detailed report with step information', () => {
            const timestamp = '2025-06-17';
            const result = generator.generateDetailedReport(mockTestCaseData, mockExecutionResult, timestamp);

            expect(result).toContain('Style: detailed');
            expect(result).toContain('Detailed Steps');
            expect(result).toContain('Step 1: Login to application');
            expect(result).toContain('Step 2: Navigate to dashboard');
            expect(result).toContain('Step 3: Click button');
            expect(result).toContain('Click the submit button'); // Description
        });

        test('should include all overview content in detailed report', () => {
            const result = generator.generateDetailedReport(mockTestCaseData, mockExecutionResult, '2025-06-17');

            // Should contain overview elements
            expect(result).toContain('sample-test.yml');
            expect(result).toContain('PASSED');
            
            // Plus detailed elements
            expect(result).toContain('📝 Detailed Steps');
        });

        test('should handle empty steps array', () => {
            const testCaseWithoutSteps = {
                ...mockTestCaseData,
                steps: []
            };

            const result = generator.generateDetailedReport(testCaseWithoutSteps, mockExecutionResult, '2025-06-17');

            expect(result).toContain('No steps defined');
        });

        test('should highlight failed step', () => {
            const failedResult = {
                ...mockExecutionResult,
                status: 'failed',
                failedStepIndex: 1
            };

            const result = generator.generateDetailedReport(mockTestCaseData, failedResult, '2025-06-17');

            expect(result).toContain('#f8d7da'); // Failed step background color
            expect(result).toContain('#dc3545'); // Failed step indicator color
        });

        test('should handle object steps with descriptions', () => {
            const testCaseWithObjectSteps = {
                ...mockTestCaseData,
                steps: [
                    { action: 'Complex step', description: 'This is a complex step with description' }
                ]
            };

            const result = generator.generateDetailedReport(testCaseWithObjectSteps, mockExecutionResult, '2025-06-17');

            expect(result).toContain('Complex step');
            expect(result).toContain('This is a complex step with description');
        });
    });

    describe('getStatusIcon', () => {
        test('should return correct icons for different statuses', () => {
            expect(generator.getStatusIcon('passed')).toBe('✅');
            expect(generator.getStatusIcon('failed')).toBe('❌');
            expect(generator.getStatusIcon('skipped')).toBe('⏭️');
            expect(generator.getStatusIcon('pending')).toBe('⏳');
            expect(generator.getStatusIcon('unknown')).toBe('❓');
            expect(generator.getStatusIcon('invalid')).toBe('❓'); // Default case
        });
    });

    describe('generateStepExecutionReport', () => {
        test('should generate step execution summary', () => {
            const stepResults = [
                { step: 'Step 1', status: 'passed', duration: 10 },
                { step: 'Step 2', status: 'passed', duration: 15 },
                { step: 'Step 3', status: 'failed', duration: 5, error: 'Element not found' }
            ];

            const result = generator.generateStepExecutionReport(mockTestCaseData, stepResults);

            expect(result.summary.total).toBe(3);
            expect(result.summary.passed).toBe(2);
            expect(result.summary.failed).toBe(1);
            expect(result.summary.successRate).toBe(67); // 2/3 * 100 rounded
            expect(result.steps).toBe(stepResults);
            expect(result.testCase).toBe(mockTestCaseData);
        });

        test('should handle empty step results', () => {
            const result = generator.generateStepExecutionReport(mockTestCaseData, []);

            expect(result.summary.total).toBe(0);
            expect(result.summary.passed).toBe(0);
            expect(result.summary.failed).toBe(0);
            expect(result.summary.successRate).toBe(0);
        });

        test('should calculate correct success rate', () => {
            const allPassedSteps = [
                { step: 'Step 1', status: 'passed' },
                { step: 'Step 2', status: 'passed' }
            ];

            const result = generator.generateStepExecutionReport(mockTestCaseData, allPassedSteps);

            expect(result.summary.successRate).toBe(100);
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle missing test case data', () => {
            const result = generator.generateTestCaseReport({}, mockExecutionResult);

            expect(result.fileName).toMatch(/test-unnamed-test-\d{4}-\d{2}-\d{2}\.html$/);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should handle undefined steps', () => {
            const testCaseWithoutSteps = {
                name: 'no-steps.yml',
                description: 'Test without steps'
            };

            const result = generator.generateOverviewReport(testCaseWithoutSteps, mockExecutionResult, '2025-06-17');

            expect(result).toContain('0'); // Step count should be 0
        });

        test('should handle custom report path', () => {
            const customGenerator = new TestCaseReportGenerator({
                environment: 'test',
                reportPath: 'custom/path/reports'
            });

            const result = customGenerator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(result.reportPath).toContain('custom/path/reports');
        });

        test('should handle different test statuses', () => {
            const statuses = ['passed', 'failed', 'skipped', 'pending'];
            
            statuses.forEach(status => {
                const result = generator.generateOverviewReport(mockTestCaseData, { status }, '2025-06-17');
                expect(result).toContain(status.toUpperCase());
                expect(result).toContain(generator.getStatusIcon(status));
            });
        });
    });

    describe('File system operations', () => {
        test('should handle existing symlink removal', () => {
            fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(fs.symlinkSync).toHaveBeenCalled();
        });

        test('should handle missing symlink', () => {
            fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);

            generator.generateTestCaseReport(mockTestCaseData, mockExecutionResult);

            expect(fs.unlinkSync).not.toHaveBeenCalled();
            expect(fs.symlinkSync).toHaveBeenCalled();
        });
    });

    describe('Direct script execution', () => {
        test('should handle command line arguments', () => {
            const originalArgv = process.argv;

            try {
                process.argv = ['node', 'test-case-report-generator.js', 'prod', 'detailed'];
                
                const testGenerator = new TestCaseReportGenerator({
                    environment: process.argv[2] || 'dev',
                    reportStyle: process.argv[3] || 'overview'
                });

                expect(testGenerator.environment).toBe('prod');
                expect(testGenerator.reportStyle).toBe('detailed');
            } finally {
                process.argv = originalArgv;
            }
        });

        test('should use default values when no args provided', () => {
            const originalArgv = process.argv;

            try {
                process.argv = ['node', 'test-case-report-generator.js'];
                
                const defaultGenerator = new TestCaseReportGenerator({
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

    describe('Complex scenarios', () => {
        test('should handle complex test case with mixed step types', () => {
            const complexTestCase = {
                name: 'complex-test.yml',
                description: 'Complex test with multiple step types',
                tags: ['integration', 'complex', 'e2e'],
                steps: [
                    'Simple string step',
                    { action: 'Object step with action' },
                    { action: 'Object step with description', description: 'Detailed description' },
                    'Another string step'
                ]
            };

            const result = generator.generateDetailedReport(complexTestCase, mockExecutionResult, '2025-06-17');

            expect(result).toContain('Simple string step');
            expect(result).toContain('Object step with action');
            expect(result).toContain('Object step with description');
            expect(result).toContain('Detailed description');
            expect(result).toContain('Another string step');
        });

        test('should generate report with all data types', () => {
            const fullTestCase = {
                name: 'full-test.yml',
                description: 'Full test case with all fields',
                tags: ['smoke', 'regression', 'critical'],
                steps: ['Step 1', 'Step 2', 'Step 3']
            };

            const fullResult = {
                status: 'passed',
                duration: 120,
                startTime: '2025-06-17T10:00:00Z',
                endTime: '2025-06-17T10:02:00Z'
            };

            const report = generator.generateTestCaseReport(fullTestCase, fullResult);

            expect(report.fileName).toMatch(/test-full-test-\d{4}-\d{2}-\d{2}\.html$/);
            expect(fs.writeFileSync).toHaveBeenCalled();
            
            const reportContent = fs.writeFileSync.mock.calls[0][1];
            expect(reportContent).toContain('full-test.yml');
            expect(reportContent).toContain('Full test case with all fields');
            expect(reportContent).toContain('smoke');
            expect(reportContent).toContain('regression');
            expect(reportContent).toContain('critical');
            expect(reportContent).toContain('120'); // Duration
        });
    });
});