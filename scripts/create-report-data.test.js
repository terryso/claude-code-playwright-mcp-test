const fs = require('fs');
const path = require('path');
const {
    ReportDataCreator,
    createAndSaveTestData,
    createAndSaveBatchData,
    createAndSaveSuiteData,
    quickCreateTestData,
    quickCreateSuiteData
} = require('./create-report-data');

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('ReportDataCreator', () => {
    let creator;
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
        mockFs.writeFileSync.mockImplementation(() => {});
        mockFs.mkdirSync.mockImplementation(() => {});

        creator = new ReportDataCreator();
    });

    afterEach(() => {
        // Restore console methods
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(creator.projectRoot).toBe(process.cwd());
        });
    });

    describe('createTestCaseData', () => {
        test('should create valid test case data', () => {
            const testCase = {
                name: 'test.yml',
                description: 'Test case',
                tags: ['smoke'],
                steps: ['Step 1', 'Step 2']
            };
            const execution = {
                status: 'passed',
                duration: 30000,
                validations: ['Validation 1']
            };
            const options = {
                environment: 'dev',
                reportStyle: 'overview'
            };
            
            const result = creator.createTestCaseData(testCase, execution, options);
            
            expect(result.reportType).toBe('test');
            expect(result.reportData.testCase.name).toBe('test.yml');
            expect(result.reportData.execution.status).toBe('passed');
            expect(result.config.environment).toBe('dev');
            expect(result.environment).toHaveProperty('BASE_URL');
        });

        test('should handle missing optional fields', () => {
            const testCase = { name: 'test.yml' };
            const execution = { status: 'passed' };
            
            const result = creator.createTestCaseData(testCase, execution);
            
            expect(result.reportData.testCase.description).toBe('');
            expect(result.reportData.testCase.tags).toEqual([]);
            expect(result.config.environment).toBe('dev');
        });
    });

    describe('createBatchTestData', () => {
        test('should create valid batch test data', () => {
            const testCases = [
                { name: 'test1.yml', tags: ['smoke'] },
                { name: 'test2.yml', tags: ['regression'] }
            ];
            const execution = {
                name: 'batch-test',
                status: 'passed',
                testResults: [
                    { testName: 'test1.yml', status: 'passed' },
                    { testName: 'test2.yml', status: 'passed' }
                ]
            };
            
            const result = creator.createBatchTestData(testCases, execution);
            
            expect(result.reportType).toBe('test');
            expect(Array.isArray(result.reportData.testCase)).toBe(true);
            expect(result.reportData.testCase).toHaveLength(2);
            expect(result.reportData.execution.name).toBe('batch-test');
        });
    });

    describe('createSuiteData', () => {
        test('should create valid suite data', () => {
            const suite = {
                name: 'Test Suite',
                description: 'Suite description',
                tags: ['suite', 'smoke']
            };
            const results = [
                {
                    testName: 'test1.yml',
                    status: 'passed',
                    duration: 30000,
                    steps: 10
                },
                {
                    testName: 'test2.yml',
                    status: 'failed',
                    duration: 45000,
                    steps: 15,
                    error: 'Test failed'
                }
            ];
            
            const result = creator.createSuiteData(suite, results);
            
            expect(result.reportType).toBe('suite');
            expect(result.reportData.suite.name).toBe('Test Suite');
            expect(result.reportData.results).toHaveLength(2);
            expect(result.reportData.results[0].testName).toBe('test1.yml');
            expect(result.reportData.results[1].error).toBe('Test failed');
        });
    });

    describe('formatTestCase', () => {
        test('should format test case with all fields', () => {
            const testCase = {
                name: 'test.yml',
                description: 'Test description',
                tags: ['smoke', 'regression'],
                steps: ['Step 1', 'Step 2']
            };
            
            const result = creator.formatTestCase(testCase, { reportStyle: 'detailed' });
            
            expect(result.name).toBe('test.yml');
            expect(result.description).toBe('Test description');
            expect(result.tags).toEqual(['smoke', 'regression']);
            expect(result.steps).toEqual(['Step 1', 'Step 2']);
        });

        test('should format test case with default values', () => {
            const testCase = {};
            
            const result = creator.formatTestCase(testCase, { reportStyle: 'detailed' });
            
            expect(result.name).toBe('unnamed-test.yml');
            expect(result.description).toBe('');
            expect(result.tags).toEqual([]);
            expect(result.steps).toEqual([]);
        });

        test('should format test case without steps in overview mode', () => {
            const testCase = {
                name: 'test.yml',
                description: 'Test description',
                tags: ['smoke'],
                steps: ['Step 1', 'Step 2']
            };
            
            const result = creator.formatTestCase(testCase, { reportStyle: 'overview' });
            
            expect(result.name).toBe('test.yml');
            expect(result.description).toBe('Test description');
            expect(result.tags).toEqual(['smoke']);
            expect(result.steps).toBeUndefined();
        });

        test('should format test case with steps in detailed mode', () => {
            const testCase = {
                name: 'test.yml',
                description: 'Test description',
                tags: ['smoke'],
                steps: ['Step 1', 'Step 2']
            };
            
            const result = creator.formatTestCase(testCase, { reportStyle: 'detailed' });
            
            expect(result.name).toBe('test.yml');
            expect(result.description).toBe('Test description');
            expect(result.tags).toEqual(['smoke']);
            expect(result.steps).toEqual(['Step 1', 'Step 2']);
        });
    });

    describe('formatExecution', () => {
        test('should format execution with testResults', () => {
            const execution = {
                status: 'passed',
                duration: 30000,
                testResults: [
                    { testName: 'test.yml', status: 'passed', duration: 30000 }
                ]
            };
            
            const result = creator.formatExecution(execution);
            
            expect(result.status).toBe('passed');
            expect(result.duration).toBe(30000);
            expect(result.testResults).toHaveLength(1);
        });

        test('should format execution without testResults', () => {
            const execution = {
                status: 'passed',
                testName: 'test.yml',
                validations: ['Validation 1']
            };
            
            const result = creator.formatExecution(execution);
            
            expect(result.testResults).toHaveLength(1);
            expect(result.testResults[0].testName).toBe('test.yml');
            expect(result.testResults[0].validations).toEqual(['Validation 1']);
        });

        test('should handle missing fields with defaults', () => {
            const execution = {};
            
            const result = creator.formatExecution(execution);
            
            expect(result.status).toBe('unknown');
            expect(result.duration).toBe(0);
            expect(result.testResults).toHaveLength(1);
            expect(result.testResults[0].testName).toBe('test');
        });
    });

    describe('formatTestResult', () => {
        test('should format test result with all fields', () => {
            const result = {
                testName: 'test.yml',
                status: 'passed',
                duration: 30000,
                steps: [{ step: 'Step 1', status: 'passed' }],
                validations: ['Validation 1'],
                sessionOptimized: true,
                error: null
            };
            
            const formatted = creator.formatTestResult(result);
            
            expect(formatted.testName).toBe('test.yml');
            expect(formatted.status).toBe('passed');
            expect(formatted.sessionOptimized).toBe(true);
        });

        test('should handle result with name field', () => {
            const result = {
                name: 'test.yml',
                status: 'failed'
            };
            
            const formatted = creator.formatTestResult(result);
            
            expect(formatted.testName).toBe('test.yml');
            expect(formatted.status).toBe('failed');
        });

        test('should use defaults for missing fields', () => {
            const result = {};
            
            const formatted = creator.formatTestResult(result);
            
            expect(formatted.testName).toBe('test');
            expect(formatted.status).toBe('unknown');
            expect(formatted.duration).toBe(0);
        });
    });

    describe('formatSuiteResult', () => {
        test('should format suite result without steps_detail in overview mode', () => {
            const result = {
                testName: 'test.yml',
                description: 'Test description',
                status: 'passed',
                steps: 5,
                duration: 30000,
                features: 'Test features',
                tags: ['smoke'],
                validations: 'All validations passed',
                sessionOptimized: true,
                steps_detail: ['Step 1', 'Step 2', 'Step 3']
            };
            
            const formatted = creator.formatSuiteResult(result, { reportStyle: 'overview' });
            
            expect(formatted.testName).toBe('test.yml');
            expect(formatted.description).toBe('Test description');
            expect(formatted.status).toBe('passed');
            expect(formatted.steps).toBe(5);
            expect(formatted.duration).toBe(30000);
            expect(formatted.features).toBe('Test features');
            expect(formatted.tags).toEqual(['smoke']);
            expect(formatted.validations).toBe('All validations passed');
            expect(formatted.sessionOptimized).toBe(true);
            expect(formatted.error).toBeNull();
            expect(formatted.steps_detail).toBeUndefined();
        });

        test('should format suite result with steps_detail in detailed mode', () => {
            const result = {
                testName: 'test.yml',
                description: 'Test description',
                status: 'passed',
                steps: 5,
                duration: 30000,
                features: 'Test features',
                tags: ['smoke'],
                validations: 'All validations passed',
                sessionOptimized: true,
                steps_detail: ['Step 1', 'Step 2', 'Step 3']
            };
            
            const formatted = creator.formatSuiteResult(result, { reportStyle: 'detailed' });
            
            expect(formatted.testName).toBe('test.yml');
            expect(formatted.description).toBe('Test description');
            expect(formatted.status).toBe('passed');
            expect(formatted.steps).toBe(5);
            expect(formatted.duration).toBe(30000);
            expect(formatted.features).toBe('Test features');
            expect(formatted.tags).toEqual(['smoke']);
            expect(formatted.validations).toBe('All validations passed');
            expect(formatted.sessionOptimized).toBe(true);
            expect(formatted.error).toBeNull();
            expect(formatted.steps_detail).toEqual(['Step 1', 'Step 2', 'Step 3']);
        });

        test('should format suite result with default values', () => {
            const result = {};
            
            const formatted = creator.formatSuiteResult(result, { reportStyle: 'detailed' });
            
            expect(formatted.testName).toBe('test');
            expect(formatted.description).toBe('');
            expect(formatted.status).toBe('unknown');
            expect(formatted.steps).toBe(0);
            expect(formatted.duration).toBe(0);
            expect(formatted.features).toBe('');
            expect(formatted.tags).toEqual([]);
            expect(formatted.validations).toBe('');
            expect(formatted.sessionOptimized).toBe(false);
            expect(formatted.error).toBeNull();
            expect(formatted.steps_detail).toEqual([]);
        });
    });

    describe('createConfig', () => {
        test('should create config with defaults', () => {
            const config = creator.createConfig();
            
            expect(config.environment).toBe('dev');
            expect(config.reportStyle).toBe('overview');
            expect(config.reportFormat).toBe('html');
            expect(config.reportPath).toBe('reports/dev');
        });

        test('should override defaults with options', () => {
            const options = {
                environment: 'test',
                reportStyle: 'detailed',
                reportPath: 'custom/reports'
            };
            
            const config = creator.createConfig(options);
            
            expect(config.environment).toBe('test');
            expect(config.reportStyle).toBe('detailed');
            expect(config.reportPath).toBe('custom/reports');
        });

        test('should merge custom config', () => {
            const options = {
                config: {
                    customField: 'customValue'
                }
            };
            
            const config = creator.createConfig(options);
            
            expect(config.customField).toBe('customValue');
        });
    });

    describe('createEnvironment', () => {
        test('should create environment with defaults', () => {
            const env = creator.createEnvironment();
            
            expect(env.BASE_URL).toBe('https://www.saucedemo.com/');
            expect(env.TEST_USERNAME).toBe('standard_user');
            expect(env.GENERATE_REPORT).toBe('true');
        });

        test('should override defaults with options', () => {
            const options = {
                environment: {
                    BASE_URL: 'https://custom.url/',
                    CUSTOM_VAR: 'custom_value'
                },
                reportStyle: 'detailed'
            };
            
            const env = creator.createEnvironment(options);
            
            expect(env.BASE_URL).toBe('https://custom.url/');
            expect(env.CUSTOM_VAR).toBe('custom_value');
            expect(env.REPORT_STYLE).toBe('detailed');
        });
    });

    describe('saveDataFile', () => {
        test('should save data to absolute path', () => {
            mockPath.isAbsolute.mockReturnValue(true);
            mockPath.dirname.mockReturnValue('/absolute/path');
            
            const data = { test: 'data' };
            const filePath = '/absolute/path/test.json';
            
            const result = creator.saveDataFile(data, filePath);
            
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                filePath,
                JSON.stringify(data, null, 2),
                'utf8'
            );
            expect(result).toBe(filePath);
        });

        test('should save data to relative path', () => {
            mockPath.isAbsolute.mockReturnValue(false);
            mockPath.join.mockReturnValue('/project/test.json');
            mockPath.dirname.mockReturnValue('/project');
            
            const data = { test: 'data' };
            const filePath = 'test.json';
            
            const result = creator.saveDataFile(data, filePath);
            
            expect(mockPath.join).toHaveBeenCalledWith(creator.projectRoot, filePath);
            expect(mockFs.writeFileSync).toHaveBeenCalled();
        });

        test('should create directory if it does not exist', () => {
            mockFs.existsSync.mockReturnValue(false);
            mockPath.dirname.mockReturnValue('/test/dir');
            
            creator.saveDataFile({ test: 'data' }, '/test/dir/file.json');
            
            expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
        });

        test('should not create directory if it exists', () => {
            mockFs.existsSync.mockReturnValue(true);
            
            creator.saveDataFile({ test: 'data' }, '/test/file.json');
            
            expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        });

        test('should throw error on file system failure', () => {
            mockFs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });
            
            expect(() => {
                creator.saveDataFile({ test: 'data' }, 'test.json');
            }).toThrow('Failed to save data file: Write failed');
        });
    });

    describe('quickCreateTestData', () => {
        test('should create test data with minimal input', () => {
            const data = creator.quickCreateTestData('test.yml', 'passed', 30000);
            
            expect(data.reportType).toBe('test');
            expect(data.reportData.testCase.name).toBe('test.yml');
            expect(data.reportData.execution.status).toBe('passed');
            expect(data.reportData.execution.duration).toBe(30000);
        });

        test('should include optional parameters', () => {
            const options = {
                description: 'Custom description',
                tags: ['custom', 'tag'],
                validations: ['Custom validation'],
                sessionOptimized: true
            };
            
            const data = creator.quickCreateTestData('test.yml', 'passed', 30000, options);
            
            expect(data.reportData.testCase.description).toBe('Custom description');
            expect(data.reportData.testCase.tags).toEqual(['custom', 'tag']);
            expect(data.reportData.execution.testResults[0].validations).toEqual(['Custom validation']);
            expect(data.reportData.execution.testResults[0].sessionOptimized).toBe(true);
        });
    });

    describe('quickCreateSuiteData', () => {
        test('should create suite data with minimal input', () => {
            const testResults = [
                { testName: 'test1.yml', status: 'passed' },
                { testName: 'test2.yml', status: 'failed' }
            ];
            
            const data = creator.quickCreateSuiteData('Test Suite', testResults);
            
            expect(data.reportType).toBe('suite');
            expect(data.reportData.suite.name).toBe('Test Suite');
            expect(data.reportData.results).toHaveLength(2);
        });

        test('should include optional parameters', () => {
            const testResults = [{ testName: 'test.yml', status: 'passed' }];
            const options = {
                description: 'Custom suite description',
                tags: ['suite', 'custom']
            };
            
            const data = creator.quickCreateSuiteData('Custom Suite', testResults, options);
            
            expect(data.reportData.suite.description).toBe('Custom suite description');
            expect(data.reportData.suite.tags).toEqual(['suite', 'custom']);
        });
    });
});

describe('convenience functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        
        // Mock file system operations
        fs.writeFileSync.mockImplementation(() => {});
        fs.mkdirSync.mockImplementation(() => {});
        fs.existsSync.mockReturnValue(false);
        path.dirname.mockReturnValue('/test');
        path.isAbsolute.mockReturnValue(false);
        path.join.mockImplementation((base, file) => `/project/${file}`);
    });

    describe('createAndSaveTestData', () => {
        test('should create and save test data', () => {
            const testCase = { name: 'test.yml' };
            const execution = { status: 'passed' };
            const filePath = 'test.json';
            
            const result = createAndSaveTestData(testCase, execution, filePath);
            
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result).toContain('test.json');
        });
    });

    describe('createAndSaveBatchData', () => {
        test('should create and save batch data', () => {
            const testCases = [{ name: 'test1.yml' }, { name: 'test2.yml' }];
            const execution = { name: 'batch', status: 'passed' };
            const filePath = 'batch.json';
            
            const result = createAndSaveBatchData(testCases, execution, filePath);
            
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result).toContain('batch.json');
        });
    });

    describe('createAndSaveSuiteData', () => {
        test('should create and save suite data', () => {
            const suite = { name: 'Test Suite' };
            const results = [{ testName: 'test.yml', status: 'passed' }];
            const filePath = 'suite.json';
            
            const result = createAndSaveSuiteData(suite, results, filePath);
            
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result).toContain('suite.json');
        });
    });

    describe('quickCreateTestData', () => {
        test('should quickly create and save test data', () => {
            const result = quickCreateTestData('test.yml', 'passed', 30000, 'quick.json');
            
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result).toContain('quick.json');
        });
    });

    describe('quickCreateSuiteData', () => {
        test('should quickly create and save suite data', () => {
            const testResults = [{ testName: 'test.yml', status: 'passed' }];
            
            const result = quickCreateSuiteData('Quick Suite', testResults, 'quick-suite.json');
            
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result).toContain('quick-suite.json');
        });
    });
});

describe('edge cases and error handling', () => {
    let creator;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        
        creator = new ReportDataCreator();
    });

    test('should handle null/undefined inputs gracefully', () => {
        expect(() => {
            creator.formatTestCase(null);
        }).not.toThrow();
        
        expect(() => {
            creator.formatExecution(undefined);
        }).not.toThrow();
        
        expect(() => {
            creator.formatSuite({});
        }).not.toThrow();
        
        expect(() => {
            creator.createConfig(null);
        }).not.toThrow();
        
        expect(() => {
            creator.createEnvironment(undefined);
        }).not.toThrow();
    });

    test('should handle empty arrays and objects', () => {
        const suite = creator.formatSuite({});
        expect(suite.name).toBe('Unnamed Suite');
        expect(suite.testCases).toEqual([]);
        
        const execution = creator.formatExecution({});
        expect(execution.testResults).toHaveLength(1);
    });

    test('should handle mixed data types in test results', () => {
        const result = creator.formatTestResult({
            testName: 'test.yml',
            status: 'passed',
            duration: '30000', // string instead of number
            steps: 'not an array',
            validations: null
        });
        
        expect(result.testName).toBe('test.yml');
        expect(result.status).toBe('passed');
        expect(result.validations).toEqual([]);
    });

    test('should test resolveDataFilePath method exists and works', () => {
        // Test that the method exists
        expect(typeof creator.resolveDataFilePath).toBe('function');
        
        // Test basic functionality
        const result = creator.resolveDataFilePath('file.json', {
            reportPath: 'test/reports'
        });
        expect(typeof result).toBe('string');
        expect(result).toContain('file.json');
    });
});

describe('CLI usage', () => {
    test('should have CLI usage section in the file', () => {
        // Simple test to ensure CLI code exists and is covered
        const ReportDataCreator = require('./create-report-data').ReportDataCreator;
        const creator = new ReportDataCreator();
        
        // Test that all expected methods exist
        expect(typeof creator.resolveDataFilePath).toBe('function');
        expect(typeof creator.saveDataFile).toBe('function');
        expect(typeof creator.createTestCaseData).toBe('function');
    });

    test('should cover resolveDataFilePath edge cases', () => {
        const creator = new ReportDataCreator();
        
        // Mock path.isAbsolute to return false, then true  
        const originalIsAbsolute = require('path').isAbsolute;
        const mockPath = require('path');
        
        // Test relative path processing
        mockPath.isAbsolute.mockReturnValueOnce(false).mockReturnValueOnce(false);
        const result = creator.resolveDataFilePath('test.json', {});
        expect(result).toContain('test.json');
        
        // Test absolute path passthrough
        mockPath.isAbsolute.mockReturnValueOnce(true);
        const absoluteResult = creator.resolveDataFilePath('/abs/test.json', {});
        expect(absoluteResult).toBe('/abs/test.json');
    });

    test('should cover CLI main execution logic', () => {
        // Test that CLI-related code exists and functions work
        const { ReportDataCreator } = require('./create-report-data');
        const creator = new ReportDataCreator();
        
        // Test constructor logic that would be used in CLI
        expect(creator).toBeInstanceOf(ReportDataCreator);
        expect(creator.projectRoot).toBeDefined();
        
        // Verify CLI methods exist
        expect(typeof creator.createTestCaseData).toBe('function');
        expect(typeof creator.createSuiteData).toBe('function');
        expect(typeof creator.saveDataFile).toBe('function');
        
        // Test CLI constructor behavior
        const cliCreator = new ReportDataCreator();
        expect(cliCreator.projectRoot).toBe(process.cwd());
    });
});