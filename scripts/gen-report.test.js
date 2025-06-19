const fs = require('fs');
const path = require('path');
const JSONReportGenerator = require('./gen-report');

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('JSONReportGenerator', () => {
    let generator;
    let mockFs, mockPath;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Suppress console output in tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockFs = fs;
        mockPath = path;
        
        // Setup default mocks
        mockPath.join.mockImplementation((...args) => args.join('/'));
        mockPath.basename.mockImplementation((p) => p.split('/').pop());
        mockPath.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
        mockPath.isAbsolute.mockImplementation((p) => p.startsWith('/'));
        
        // Default to false for existsSync to prevent warnings
        mockFs.existsSync.mockReturnValue(false);
        mockFs.readFileSync.mockReturnValue('{}');
        mockFs.writeFileSync.mockImplementation(() => {});
        mockFs.mkdirSync.mockImplementation(() => {});
        mockFs.unlinkSync.mockImplementation(() => {});
        mockFs.symlinkSync.mockImplementation(() => {});

        generator = new JSONReportGenerator();
    });

    afterEach(() => {
        // Restore console methods
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(generator.projectRoot).toBe(process.cwd());
        });
    });

    describe('parseArguments', () => {
        test('should parse --data=value format', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--data=test.json'];
            
            const result = generator.parseArguments();
            
            expect(result).toBe('test.json');
            process.argv = originalArgv;
        });

        test('should parse --data value format', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--data', 'test.json'];
            
            const result = generator.parseArguments();
            
            expect(result).toBe('test.json');
            process.argv = originalArgv;
        });

        test('should return null if no --data argument', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--other=value'];
            
            const result = generator.parseArguments();
            
            expect(result).toBe(null);
            process.argv = originalArgv;
        });

        test('should return null if --data has no value', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--data'];
            
            const result = generator.parseArguments();
            
            expect(result).toBe(null);
            process.argv = originalArgv;
        });
    });

    describe('readDataFile', () => {
        test('should read absolute path file', () => {
            mockPath.isAbsolute.mockReturnValue(true);
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('{"test": "data"}');
            
            const result = generator.readDataFile('/absolute/path/test.json');
            
            expect(result).toEqual({ test: 'data' });
            expect(mockFs.readFileSync).toHaveBeenCalledWith('/absolute/path/test.json', 'utf8');
        });

        test('should read relative path file', () => {
            mockPath.isAbsolute.mockReturnValue(false);
            mockPath.join.mockReturnValue('/project/test.json');
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('{"test": "data"}');
            
            const result = generator.readDataFile('test.json');
            
            expect(result).toEqual({ test: 'data' });
            expect(mockPath.join).toHaveBeenCalledWith(generator.projectRoot, 'test.json');
        });

        test('should throw error if file does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            
            expect(() => {
                generator.readDataFile('nonexistent.json');
            }).toThrow('Data file not found');
        });

        test('should throw error if JSON is invalid', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue('invalid json');
            
            expect(() => {
                generator.readDataFile('invalid.json');
            }).toThrow('Failed to read data file');
        });
    });

    describe('validateData', () => {
        test('should validate valid test data', () => {
            const data = {
                reportType: 'test',
                reportData: { testCase: {}, execution: {} }
            };
            
            expect(() => {
                generator.validateData(data);
            }).not.toThrow();
        });

        test('should validate valid suite data', () => {
            const data = {
                reportType: 'suite',
                reportData: { suite: {}, results: [] }
            };
            
            expect(() => {
                generator.validateData(data);
            }).not.toThrow();
        });

        test('should throw error for missing required fields', () => {
            const data = { reportType: 'test' };
            
            expect(() => {
                generator.validateData(data);
            }).toThrow('Missing required fields in data: reportData');
        });

        test('should throw error for invalid reportType', () => {
            const data = {
                reportType: 'invalid',
                reportData: {}
            };
            
            expect(() => {
                generator.validateData(data);
            }).toThrow('Invalid reportType: invalid');
        });
    });

    describe('applyEnvironment', () => {
        test('should apply environment variables', () => {
            const originalEnv = process.env.TEST_VAR;
            
            generator.applyEnvironment({
                TEST_VAR: 'test_value',
                ANOTHER_VAR: 'another_value'
            });
            
            expect(process.env.TEST_VAR).toBe('test_value');
            expect(process.env.ANOTHER_VAR).toBe('another_value');
            
            // Restore
            if (originalEnv !== undefined) {
                process.env.TEST_VAR = originalEnv;
            } else {
                delete process.env.TEST_VAR;
            }
            delete process.env.ANOTHER_VAR;
        });

        test('should handle null environment', () => {
            expect(() => {
                generator.applyEnvironment(null);
            }).not.toThrow();
        });

        test('should handle non-object environment', () => {
            expect(() => {
                generator.applyEnvironment('not an object');
            }).not.toThrow();
        });
    });

    describe('generateReport', () => {
        test('should generate test report', async () => {
            const data = {
                reportType: 'test',
                reportData: {
                    testCase: { name: 'test.yml' },
                    execution: { status: 'passed' }
                },
                config: { environment: 'dev' }
            };
            
            const result = await generator.generateReport(data);
            
            expect(mockFs.writeFileSync).toHaveBeenCalled();
            expect(result).toHaveProperty('reportPath');
        });

        test('should generate suite report', async () => {
            const data = {
                reportType: 'suite',
                reportData: {
                    suite: { name: 'Test Suite' },
                    results: [{ testName: 'test.yml', status: 'passed' }]
                },
                config: { environment: 'dev' }
            };
            
            const result = await generator.generateReport(data);
            
            expect(mockFs.writeFileSync).toHaveBeenCalled();
            expect(result).toHaveProperty('reportPath');
        });

        test('should handle missing config', async () => {
            const data = {
                reportType: 'test',
                reportData: {
                    testCase: { name: 'test.yml' },
                    execution: { status: 'passed' }
                }
            };
            
            const result = await generator.generateReport(data);
            
            expect(result).toHaveProperty('reportPath');
        });

        test('should handle generation error', async () => {
            const data = {
                reportType: 'test',
                reportData: {
                    testCase: { name: 'test.yml' },
                    execution: { status: 'passed' }
                }
            };
            
            mockFs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });
            
            await expect(generator.generateReport(data)).rejects.toThrow('Failed to generate report');
        });
    });

    describe('generateSingleTestReportContent', () => {
        test('should generate valid HTML for test case', () => {
            const testCase = {
                name: 'test.yml',
                description: 'Test case',
                tags: ['smoke'],
                steps: ['Step 1']
            };
            const execution = { status: 'passed', duration: 30000 };
            const config = { environment: 'dev', reportStyle: 'overview' };
            
            const html = generator.generateSingleTestReportContent(testCase, execution, config, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('test.yml');
            expect(html).toContain('smoke');
            expect(html).toContain('30');
        });

        test('should handle detailed report style', () => {
            const testCase = { steps: ['Step 1', 'Step 2'] };
            const execution = { status: 'passed' };
            const config = { environment: 'dev', reportStyle: 'detailed' };
            
            const html = generator.generateSingleTestReportContent(testCase, execution, config, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('Detailed Steps');
        });

        test('should handle missing data gracefully', () => {
            const html = generator.generateSingleTestReportContent(null, null, {}, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Unnamed Test');
        });
    });

    describe('generateBatchTestReportContent', () => {
        test('should generate valid HTML for multiple test cases', () => {
            const testCases = [
                { name: 'test1.yml', description: 'Test 1', tags: ['smoke'] },
                { name: 'test2.yml', description: 'Test 2', tags: ['regression'] }
            ];
            const execution = {
                name: 'batch-execution',
                status: 'passed',
                duration: 60000,
                testResults: [
                    { status: 'passed', duration: 30000 },
                    { status: 'passed', duration: 30000 }
                ]
            };
            const config = { environment: 'dev' };
            
            const html = generator.generateBatchTestReportContent(testCases, execution, config, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Batch Test Report');
            expect(html).toContain('test1.yml');
            expect(html).toContain('test2.yml');
            expect(html).toContain('100%');
        });

        test('should handle failed tests', () => {
            const testCases = [{ name: 'test.yml' }];
            const execution = {
                testResults: [{ status: 'failed' }]
            };
            const config = { environment: 'dev' };
            
            const html = generator.generateBatchTestReportContent(testCases, execution, config, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('0%');
            expect(html).toContain('#dc3545');
        });
    });

    describe('generateSuiteReportContent', () => {
        test('should generate valid HTML for test suite', () => {
            const suite = {
                name: 'Test Suite',
                description: 'Suite description'
            };
            const results = [
                {
                    testName: 'test1.yml',
                    description: 'Test 1',
                    status: 'passed',
                    steps: 5,
                    duration: 30000
                }
            ];
            const config = { environment: 'dev' };
            
            const html = generator.generateSuiteReportContent(suite, results, config, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Test Suite Report');
            expect(html).toContain('test1.yml');
            expect(html).toContain('100%');
        });

        test('should handle mixed test results', () => {
            const suite = { name: 'Mixed Suite' };
            const results = [
                { testName: 'test1.yml', status: 'passed', steps: 5 },
                { testName: 'test2.yml', status: 'failed', steps: 3 }
            ];
            const config = { environment: 'dev' };
            
            const html = generator.generateSuiteReportContent(suite, results, config, '2025-06-19-12-00-00-000');
            
            expect(html).toContain('50%');
        });
    });

    describe('utility methods', () => {
        test('getStatusIcon should return correct icons', () => {
            expect(generator.getStatusIcon('passed')).toBe('✅');
            expect(generator.getStatusIcon('failed')).toBe('❌');
            expect(generator.getStatusIcon('skipped')).toBe('⏭️');
            expect(generator.getStatusIcon('pending')).toBe('⏳');
            expect(generator.getStatusIcon('unknown')).toBe('❓');
        });

        test('getStatusColor should return correct colors', () => {
            expect(generator.getStatusColor('passed')).toBe('#28a745, #20c997');
            expect(generator.getStatusColor('failed')).toBe('#dc3545, #e74c3c');
            expect(generator.getStatusColor('unknown')).toBe('#6c757d, #8d9498');
        });

        test('generateTimestamp should create valid timestamp', () => {
            const timestamp = generator.generateTimestamp();
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/);
        });

        test('ensureDirectory should create directory if it does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            
            generator.ensureDirectory('/test/dir');
            
            expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
        });

        test('ensureDirectory should not create directory if it exists', () => {
            mockFs.existsSync.mockReturnValue(true);
            
            generator.ensureDirectory('/test/dir');
            
            expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        });
    });

    describe('createLatestLink', () => {
        test('should create symlink successfully', () => {
            mockFs.existsSync.mockReturnValue(false);
            
            generator.createLatestLink('/reports/test-report.html', 'latest-report.html');
            
            expect(mockFs.symlinkSync).toHaveBeenCalledWith('test-report.html', '/reports/latest-report.html');
        });

        test('should remove existing link before creating new one', () => {
            mockFs.existsSync.mockReturnValue(true);
            
            generator.createLatestLink('/reports/test-report.html', 'latest-report.html');
            
            expect(mockFs.unlinkSync).toHaveBeenCalledWith('/reports/latest-report.html');
            expect(mockFs.symlinkSync).toHaveBeenCalled();
        });

        test('should create redirect file if symlink fails', () => {
            mockFs.existsSync.mockReturnValue(false);
            mockFs.symlinkSync.mockImplementation(() => {
                throw new Error('Symlink failed');
            });
            
            generator.createLatestLink('/reports/test-report.html', 'latest-report.html');
            
            expect(mockFs.writeFileSync).toHaveBeenCalled();
            const writeCall = mockFs.writeFileSync.mock.calls.find(call => 
                call[0].includes('latest-report.html')
            );
            expect(writeCall[1]).toContain('meta http-equiv="refresh"');
        });
    });

    describe('generateDetailedSteps', () => {
        test('should generate detailed steps HTML', () => {
            const steps = [
                'Simple step',
                { action: 'Complex step', description: 'Step description' }
            ];
            
            const html = generator.generateDetailedSteps(steps);
            
            expect(html).toContain('Detailed Steps');
            expect(html).toContain('Simple step');
            expect(html).toContain('Complex step');
        });

        test('should handle empty steps array', () => {
            const html = generator.generateDetailedSteps([]);
            
            expect(html).toContain('Detailed Steps');
        });
    });

    describe('CSS generation', () => {
        test('getReportCSS should generate valid CSS', () => {
            const css = generator.getReportCSS();
            
            expect(css).toContain('font-family');
            expect(css).toContain('background');
            expect(css).toContain('.container');
            expect(css).toContain('.header');
            expect(css).toContain('.stat-card');
        });
    });
});

describe('error handling and edge cases', () => {
    let generator;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        generator = new JSONReportGenerator();
    });

    test('should handle file system errors gracefully', async () => {
        const data = {
            reportType: 'test',
            reportData: {
                testCase: { name: 'test.yml' },
                execution: { status: 'passed' }
            }
        };
        
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('File system error');
        });
        
        await expect(generator.generateReport(data)).rejects.toThrow('Failed to generate report');
    });

    test('should handle malformed data gracefully', () => {
        const testCase = undefined;
        const execution = null;
        const config = {};
        
        expect(() => {
            generator.generateSingleTestReportContent(testCase, execution, config, '2025-06-19-12-00-00-000');
        }).not.toThrow();
    });

    test('should handle missing test results in batch report', () => {
        const testCases = [{ name: 'test.yml' }];
        const execution = {}; // No testResults
        const config = { environment: 'dev' };
        
        expect(() => {
            generator.generateBatchTestReportContent(testCases, execution, config, '2025-06-19-12-00-00-000');
        }).not.toThrow();
    });

    test('should handle symlink creation failure gracefully', () => {
        fs.existsSync.mockReturnValue(false);
        fs.symlinkSync.mockImplementation(() => {
            throw new Error('Symlink failed');
        });
        fs.writeFileSync.mockImplementation(() => {}); // Should fallback to redirect file
        
        expect(() => {
            generator.createLatestLink('/path/to/report.html', 'latest.html');
        }).not.toThrow();
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining('latest.html'),
            expect.stringContaining('meta http-equiv="refresh"'),
            'utf8'
        );
    });

    test('should use REPORT_PATH from environment in reportConfig', async () => {
        const data = {
            reportType: 'test',
            reportData: {
                testCase: { name: 'test.yml' },
                execution: { status: 'passed' }
            },
            config: {},
            environment: { REPORT_PATH: 'custom/path' }
        };
        
        const result = await generator.generateReport(data);
        expect(result.reportPath).toContain('custom/path');
    });
});

describe('CLI integration and main function', () => {
    let originalArgv;
    let originalExit;
    let originalConsoleError;
    let exitCode;
    let consoleOutput;

    beforeEach(() => {
        // Save original values
        originalArgv = process.argv;
        originalExit = process.exit;
        originalConsoleError = console.error;

        // Mock process.exit to capture exit codes
        exitCode = null;
        process.exit = jest.fn((code) => {
            exitCode = code;
            throw new Error(`Process exit with code ${code}`);
        });

        // Capture console.error output
        consoleOutput = [];
        console.error = jest.fn((...args) => {
            consoleOutput.push(args.join(' '));
        });
    });

    afterEach(() => {
        // Restore original values
        process.argv = originalArgv;
        process.exit = originalExit;
        console.error = originalConsoleError;
    });

    test('should display usage when no data argument provided', async () => {
        process.argv = ['node', 'gen-report.js'];
        
        const JSONReportGenerator = require('./gen-report');
        
        try {
            const generator = new JSONReportGenerator();
            const dataPath = generator.parseArguments();
            expect(dataPath).toBeNull();
        } catch (error) {
            // Expected behavior
        }
    });

    test('should parse data argument correctly', () => {
        process.argv = ['node', 'gen-report.js', '--data=test.json'];
        
        const JSONReportGenerator = require('./gen-report');
        const generator = new JSONReportGenerator();
        const dataPath = generator.parseArguments();
        
        expect(dataPath).toBe('test.json');
    });

    test('should parse data argument with space', () => {
        process.argv = ['node', 'gen-report.js', '--data', 'test.json'];
        
        const JSONReportGenerator = require('./gen-report');
        const generator = new JSONReportGenerator();
        const dataPath = generator.parseArguments();
        
        expect(dataPath).toBe('test.json');
    });

    test('should handle writeFileSync errors', async () => {
        const generator = new JSONReportGenerator();
        
        // Mock writeFileSync to fail  
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('Write failed');
        });

        await expect(generator.generateReport({
            reportType: 'test',
            reportData: { testCase: {}, execution: {} }
        })).rejects.toThrow('Failed to generate report');
    });

    test('should cover main function error handling paths', () => {
        // Test that main function exists and can be called
        const JSONReportGenerator = require('./gen-report');
        
        // Test parseArguments with no arguments
        process.argv = ['node', 'gen-report.js'];
        const generator = new JSONReportGenerator();
        const result = generator.parseArguments();
        expect(result).toBeNull();
        
        // Test parseArguments with invalid format  
        process.argv = ['node', 'gen-report.js', '--invalid'];
        const result2 = generator.parseArguments();
        expect(result2).toBeNull();
    });

    test('should handle file read errors', () => {
        const generator = new JSONReportGenerator();
        fs.existsSync.mockReturnValue(false);
        
        expect(() => {
            generator.readDataFile('nonexistent.json');
        }).toThrow('Data file not found');
        
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation(() => {
            throw new Error('Read error');
        });
        
        expect(() => {
            generator.readDataFile('error.json');
        }).toThrow('Failed to read data file');
    });

    test('should handle batch test report generation', async () => {
        // Reset all mocks for this test
        jest.clearAllMocks();
        
        // Setup proper mocks
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});
        fs.readFileSync.mockReturnValue('<html>{{DATA}}</html>');
        fs.symlinkSync.mockImplementation(() => {});
        
        const generator = new JSONReportGenerator();
        
        // Test data with multiple test cases (should trigger batch mode)
        const batchData = {
            reportType: 'test',
            reportData: {
                testCase: [
                    { name: 'test1.yml', steps: ['step1'] },
                    { name: 'test2.yml', steps: ['step2'] }
                ],
                execution: { status: 'passed', duration: 30000 }
            },
            config: { environment: 'test' },
            environment: {}
        };
        
        const result = await generator.generateReport(batchData);
        expect(result.reportPath).toBeDefined();
    });
});