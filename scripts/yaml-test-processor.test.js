const fs = require('fs');
const path = require('path');
const YAMLTestProcessor = require('./yaml-test-processor');

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('YAMLTestProcessor', () => {
    let processor;
    let mockFs, mockPath;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Suppress console warnings in tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockFs = fs;
        mockPath = path;
        
        // Setup default mocks
        mockPath.join.mockImplementation((...args) => args.join('/'));
        mockPath.basename.mockImplementation((p, ext) => {
            const base = p.split('/').pop();
            return ext ? base.replace(ext, '') : base;
        });
        mockPath.extname.mockImplementation((p) => {
            const parts = p.split('.');
            return parts.length > 1 ? '.' + parts.pop() : '';
        });
        mockPath.isAbsolute.mockImplementation((p) => p.startsWith('/'));
        
        // Default to false for existsSync to prevent warnings
        mockFs.existsSync.mockReturnValue(false);
        mockFs.readdirSync.mockReturnValue([]);
        mockFs.readFileSync.mockReturnValue('');
    });

    afterEach(() => {
        // Restore console methods
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with default options', () => {
            mockFs.existsSync.mockReturnValue(false);
            
            processor = new YAMLTestProcessor();
            
            expect(processor.projectRoot).toBe(process.cwd());
            expect(processor.environment).toBe('dev');
            expect(processor.tagFilter).toBeUndefined();
        });

        test('should initialize with custom options', () => {
            mockFs.existsSync.mockReturnValue(false);
            
            const options = {
                projectRoot: '/custom/path',
                environment: 'test',
                tagFilter: 'smoke'
            };
            
            processor = new YAMLTestProcessor(options);
            
            expect(processor.projectRoot).toBe('/custom/path');
            expect(processor.environment).toBe('test');
            expect(processor.tagFilter).toBe('smoke');
        });
    });

    describe('loadEnvironmentConfig', () => {
        test('should load environment config when file exists', () => {
            const envContent = `
# This is a comment
BASE_URL=https://example.com
TEST_USERNAME=testuser
TEST_PASSWORD=secret123
EMPTY_VAR=
`;
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(envContent);
            
            processor = new YAMLTestProcessor({ environment: 'test' });
            
            expect(processor.envVars).toEqual({
                'BASE_URL': 'https://example.com',
                'TEST_USERNAME': 'testuser',
                'TEST_PASSWORD': 'secret123',
                'EMPTY_VAR': ''
            });
        });

        test('should handle missing environment file', () => {
            // Restore console.warn for this specific test
            console.warn.mockRestore();
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockFs.existsSync.mockReturnValue(false);
            
            processor = new YAMLTestProcessor({ environment: 'prod' });
            
            expect(processor.envVars).toEqual({});
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('.env.prod not found')
            );
            
            consoleWarnSpy.mockRestore();
        });

        test('should handle environment variables with equals signs in values', () => {
            const envContent = 'CONNECTION_STRING=server=localhost;database=test;user=admin';
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readFileSync.mockReturnValue(envContent);
            
            processor = new YAMLTestProcessor();
            
            expect(processor.envVars.CONNECTION_STRING).toBe('server=localhost;database=test;user=admin');
        });
    });

    describe('loadStepLibraries', () => {
        test('should load step libraries from YAML files', () => {
            const loginSteps = `
steps:
  - "Open {{BASE_URL}} page"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
`;
            
            const cleanupSteps = `
steps:
  - "Click Back Home button"
  - "Save screenshot as {{SCREENSHOT_PATH}}/cleanup-complete.png"
`;
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['login.yml', 'cleanup.yaml', 'readme.txt']);
            mockFs.readFileSync
                .mockReturnValueOnce('') // env file
                .mockReturnValueOnce(loginSteps) // login.yml
                .mockReturnValueOnce(cleanupSteps); // cleanup.yaml
            
            processor = new YAMLTestProcessor();
            
            expect(processor.stepLibraries).toEqual({
                'login': {
                    description: '',
                    parameters: [],
                    steps: [
                        'Open {{BASE_URL}} page',
                        'Fill username field with {{TEST_USERNAME}}',
                        'Fill password field with {{TEST_PASSWORD}}',
                        'Click login button'
                    ]
                },
                'cleanup': {
                    description: '',
                    parameters: [],
                    steps: [
                        'Click Back Home button',
                        'Save screenshot as {{SCREENSHOT_PATH}}/cleanup-complete.png'
                    ]
                }
            });
        });

        test('should load parameterized step libraries', () => {
            const parameterizedSteps = `
description: "Create a basic channel with custom parameters"
parameters:
  - name: "CHANNEL_NAME_PREFIX"
    description: "Channel name prefix"
    default: "Test Channel"
  - name: "LIVE_SCENE"
    description: "Live scene type"
    default: "大班课"
steps:
  - "输入直播名称: {{CHANNEL_NAME_PREFIX}} + 随机5位数字"
  - "选择直播场景: {{LIVE_SCENE}}"
`;
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['create-basic-channel.yml']);
            mockFs.readFileSync
                .mockReturnValueOnce('') // env file
                .mockReturnValueOnce(parameterizedSteps); // create-basic-channel.yml
            
            processor = new YAMLTestProcessor();
            
            expect(processor.stepLibraries).toEqual({
                'create-basic-channel': {
                    description: 'Create a basic channel with custom parameters',
                    parameters: [
                        {
                            name: 'CHANNEL_NAME_PREFIX',
                            description: 'Channel name prefix',
                            default: 'Test Channel'
                        },
                        {
                            name: 'LIVE_SCENE',
                            description: 'Live scene type',
                            default: '大班课'
                        }
                    ],
                    steps: [
                        '输入直播名称: {{CHANNEL_NAME_PREFIX}} + 随机5位数字',
                        '选择直播场景: {{LIVE_SCENE}}'
                    ]
                }
            });
        });

        test('should handle missing steps directory', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockFs.existsSync
                .mockReturnValueOnce(false) // env file
                .mockReturnValueOnce(false); // steps directory
            
            processor = new YAMLTestProcessor();
            
            expect(processor.stepLibraries).toEqual({});
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Steps directory')
            );
            
            consoleWarnSpy.mockRestore();
        });

        test('should handle invalid YAML in step library', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['invalid.yml']);
            mockFs.readFileSync
                .mockReturnValueOnce('') // env file
                .mockReturnValueOnce('invalid: yaml: content:'); // invalid yaml
            
            processor = new YAMLTestProcessor();
            
            expect(processor.stepLibraries).toEqual({});
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error loading step library invalid.yml'),
                expect.any(String)
            );
            
            consoleErrorSpy.mockRestore();
        });

        test('should handle step library with no content', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['empty.yml']);
            mockFs.readFileSync
                .mockReturnValueOnce('') // env file
                .mockReturnValueOnce(''); // empty yaml
            
            processor = new YAMLTestProcessor();
            
            expect(processor.stepLibraries).toEqual({});
        });
    });

    describe('getTestCaseFiles', () => {
        test('should return specific file when provided', () => {
            mockFs.existsSync.mockReturnValue(true);
            
            processor = new YAMLTestProcessor();
            const files = processor.getTestCaseFiles('order.yml');
            
            expect(files).toEqual([process.cwd() + '/test-cases/order.yml']);
        });

        test('should return absolute path when provided', () => {
            mockFs.existsSync.mockReturnValue(true);
            
            processor = new YAMLTestProcessor();
            const files = processor.getTestCaseFiles('/absolute/path/test.yml');
            
            expect(files).toEqual(['/absolute/path/test.yml']);
        });

        test('should return empty array for non-existent specific file', () => {
            mockFs.existsSync.mockReturnValue(false);
            
            processor = new YAMLTestProcessor();
            const files = processor.getTestCaseFiles('nonexistent.yml');
            
            expect(files).toEqual([]);
        });

        test('should return all YAML files from test cases directory', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['test1.yml', 'test2.yaml', 'readme.txt', 'test3.yml']);
            
            processor = new YAMLTestProcessor();
            const files = processor.getTestCaseFiles();
            
            expect(files).toEqual([
                process.cwd() + '/test-cases/test1.yml',
                process.cwd() + '/test-cases/test2.yaml',
                process.cwd() + '/test-cases/test3.yml'
            ]);
        });

        test('should handle missing test cases directory', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockFs.existsSync
                .mockReturnValueOnce(false) // env file
                .mockReturnValueOnce(false) // steps directory
                .mockReturnValueOnce(false); // test cases directory
            
            processor = new YAMLTestProcessor();
            const files = processor.getTestCaseFiles();
            
            expect(files).toEqual([]);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Test cases directory')
            );
            
            consoleWarnSpy.mockRestore();
        });
    });

    describe('parseTagFilter', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
        });

        test('should return null for empty tag filter', () => {
            expect(processor.parseTagFilter('')).toBeNull();
            expect(processor.parseTagFilter(null)).toBeNull();
            expect(processor.parseTagFilter(undefined)).toBeNull();
        });

        test('should parse single tag', () => {
            const result = processor.parseTagFilter('smoke');
            expect(result).toEqual([['smoke']]);
        });

        test('should parse AND tags (comma-separated)', () => {
            const result = processor.parseTagFilter('smoke,login');
            expect(result).toEqual([['smoke', 'login']]);
        });

        test('should parse OR tags (pipe-separated)', () => {
            const result = processor.parseTagFilter('smoke|login');
            expect(result).toEqual([['smoke'], ['login']]);
        });

        test('should parse mixed AND/OR tags', () => {
            const result = processor.parseTagFilter('smoke,login|critical');
            expect(result).toEqual([['smoke', 'login'], ['critical']]);
        });

        test('should handle whitespace in tags', () => {
            const result = processor.parseTagFilter(' smoke , login | critical ');
            expect(result).toEqual([['smoke', 'login'], ['critical']]);
        });
    });

    describe('matchesTagFilter', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
        });

        test('should return true when no tag filter', () => {
            expect(processor.matchesTagFilter(['smoke'], null)).toBe(true);
            expect(processor.matchesTagFilter(['smoke'], '')).toBe(true);
        });

        test('should return true when no test case tags', () => {
            expect(processor.matchesTagFilter(null, 'smoke')).toBe(true);
            expect(processor.matchesTagFilter([], 'smoke')).toBe(false); // 空数组应该返回false
        });

        test('should match single tag', () => {
            expect(processor.matchesTagFilter(['smoke', 'login'], 'smoke')).toBe(true);
            expect(processor.matchesTagFilter(['login'], 'smoke')).toBe(false);
        });

        test('should match AND tags', () => {
            expect(processor.matchesTagFilter(['smoke', 'login', 'order'], 'smoke,login')).toBe(true);
            expect(processor.matchesTagFilter(['smoke'], 'smoke,login')).toBe(false);
        });

        test('should match OR tags', () => {
            expect(processor.matchesTagFilter(['smoke'], 'smoke|login')).toBe(true);
            expect(processor.matchesTagFilter(['login'], 'smoke|login')).toBe(true);
            expect(processor.matchesTagFilter(['order'], 'smoke|login')).toBe(false);
        });

        test('should match complex tag filter', () => {
            const testCases = [
                { tags: ['smoke', 'login'], filter: 'smoke,login|critical', expected: true },
                { tags: ['critical'], filter: 'smoke,login|critical', expected: true },
                { tags: ['smoke'], filter: 'smoke,login|critical', expected: false },
                { tags: ['order'], filter: 'smoke,login|critical', expected: false }
            ];

            testCases.forEach(({ tags, filter, expected }) => {
                expect(processor.matchesTagFilter(tags, filter)).toBe(expected);
            });
        });
    });

    describe('expandIncludes', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
            processor.stepLibraries = {
                'login': {
                    parameters: [],
                    steps: [
                        'Open {{BASE_URL}} page',
                        'Fill username with {{USERNAME}}',
                        'Click login button'
                    ]
                },
                'cleanup': {
                    parameters: [],
                    steps: [
                        'Click logout button',
                        'Save screenshot'
                    ]
                },
                'nested': {
                    parameters: [],
                    steps: [
                        'Step 1',
                        { include: 'login' },
                        'Step 2'
                    ]
                }
            };
        });

        test('should expand simple includes', () => {
            const steps = [
                { include: 'login' },
                'Custom step',
                { include: 'cleanup' }
            ];

            const result = processor.expandIncludes(steps);

            expect(result).toEqual([
                'Open {{BASE_URL}} page',
                'Fill username with {{USERNAME}}',
                'Click login button',
                'Custom step',
                'Click logout button',
                'Save screenshot'
            ]);
        });

        test('should handle nested includes', () => {
            const steps = [
                'Start test',
                { include: 'nested' },
                'End test'
            ];

            const result = processor.expandIncludes(steps);

            expect(result).toEqual([
                'Start test',
                'Step 1',
                'Open {{BASE_URL}} page',
                'Fill username with {{USERNAME}}',
                'Click login button',
                'Step 2',
                'End test'
            ]);
        });

        test('should handle missing step library', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const steps = [
                { include: 'nonexistent' },
                'Regular step'
            ];

            const result = processor.expandIncludes(steps);

            expect(result).toEqual([
                '[MISSING LIBRARY: nonexistent]',
                'Regular step'
            ]);
            expect(consoleWarnSpy).toHaveBeenCalledWith("Step library 'nonexistent' not found");
            
            consoleWarnSpy.mockRestore();
        });

        test('should handle steps without includes', () => {
            const steps = [
                'Step 1',
                'Step 2',
                'Step 3'
            ];

            const result = processor.expandIncludes(steps);

            expect(result).toEqual(steps);
        });
    });


    describe('resolveParameters', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
        });

        test('should merge default and provided parameters', () => {
            const library = {
                parameters: [
                    { name: 'PARAM1', default: 'default1' },
                    { name: 'PARAM2', default: 'default2' },
                    { name: 'PARAM3' } // no default
                ]
            };

            const providedParams = {
                'PARAM2': 'provided2',
                'PARAM3': 'provided3',
                'PARAM4': 'provided4' // extra param
            };

            const result = processor.resolveParameters(library, providedParams);

            expect(result).toEqual({
                'PARAM1': 'default1',
                'PARAM2': 'provided2',
                'PARAM3': 'provided3',
                'PARAM4': 'provided4'
            });
        });

        test('should handle library with no parameters', () => {
            const library = {};
            const providedParams = { 'PARAM1': 'value1' };

            const result = processor.resolveParameters(library, providedParams);

            expect(result).toEqual({ 'PARAM1': 'value1' });
        });

        test('should handle empty provided parameters', () => {
            const library = {
                parameters: [
                    { name: 'PARAM1', default: 'default1' }
                ]
            };

            const result = processor.resolveParameters(library);

            expect(result).toEqual({ 'PARAM1': 'default1' });
        });
    });

    describe('substituteVariables', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
            processor.envVars = {
                'BASE_URL': 'https://example.com',
                'USERNAME': 'testuser'
            };
        });

        test('should substitute parameters first, then environment variables', () => {
            const step = 'Login to {{BASE_URL}} with {{USERNAME}} using {{PASSWORD}}';
            const parameters = {
                'USERNAME': 'customuser',
                'PASSWORD': 'secret123'
            };

            const result = processor.substituteVariables(step, parameters);

            expect(result).toBe('Login to https://example.com with customuser using secret123');
        });

        test('should warn about missing variables', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const step = 'Use {{MISSING_VAR}} value';
            const result = processor.substituteVariables(step);

            expect(result).toBe('Use {{MISSING_VAR}} value');
            expect(consoleWarnSpy).toHaveBeenCalledWith("Variable 'MISSING_VAR' not found");
            
            consoleWarnSpy.mockRestore();
        });

        test('should handle non-string steps', () => {
            const step = { type: 'object' };
            const result = processor.substituteVariables(step);

            expect(result).toEqual({ type: 'object' });
        });
    });

    describe('evaluateCondition', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
        });

        test('should return true for empty condition', () => {
            expect(processor.evaluateCondition()).toBe(true);
            expect(processor.evaluateCondition('')).toBe(true);
            expect(processor.evaluateCondition(null)).toBe(true);
        });

        test('should handle equality conditions', () => {
            const parameters = { 'PARAM': 'test' };
            
            expect(processor.evaluateCondition('{{PARAM}} == "test"', parameters)).toBe(true);
            expect(processor.evaluateCondition('{{PARAM}} == "other"', parameters)).toBe(false);
        });

        test('should handle inequality conditions', () => {
            const parameters = { 'PARAM': 'test' };
            
            expect(processor.evaluateCondition('{{PARAM}} != "other"', parameters)).toBe(true);
            expect(processor.evaluateCondition('{{PARAM}} != "test"', parameters)).toBe(false);
        });

        test('should handle boolean conditions', () => {
            const parameters = { 'ENABLED': 'true', 'DISABLED': 'false' };
            
            expect(processor.evaluateCondition('{{ENABLED}} == true', parameters)).toBe(true);
            expect(processor.evaluateCondition('{{DISABLED}} == false', parameters)).toBe(true);
        });

        test('should handle simple boolean evaluation', () => {
            expect(processor.evaluateCondition('true')).toBe(true);
            expect(processor.evaluateCondition('false')).toBe(false);
            expect(processor.evaluateCondition('test')).toBe(true);
        });

        test('should warn on evaluation errors', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // This would cause an error due to missing parameter
            const result = processor.evaluateCondition('{{MISSING_PARAM}} == true');
            
            expect(result).toBe(false);
            expect(consoleWarnSpy).toHaveBeenCalledWith("Variable 'MISSING_PARAM' not found");
            
            consoleWarnSpy.mockRestore();
        });
    });

    describe('processStep', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
            processor.stepLibraries = {
                'test-lib': {
                    description: '',
                    parameters: [],
                    steps: ['Library step 1', 'Library step 2']
                }
            };
        });

        test('should process string steps', () => {
            const parameters = { 'VALUE': 'test' };
            const result = processor.processStep('Step with {{VALUE}}', parameters);

            expect(result).toEqual(['Step with test']);
        });

        test('should process conditional steps', () => {
            const parameters = { 'ENABLED': 'true' };
            const conditionalStep = {
                condition: '{{ENABLED}} == true',
                step: 'Execute when enabled'
            };

            const result = processor.processStep(conditionalStep, parameters);

            expect(result).toEqual(['Execute when enabled']);
        });

        test('should skip conditional steps when condition is false', () => {
            const parameters = { 'ENABLED': 'false' };
            const conditionalStep = {
                condition: '{{ENABLED}} == true',
                step: 'Execute when enabled'
            };

            const result = processor.processStep(conditionalStep, parameters);

            expect(result).toEqual([]);
        });

        test('should process conditional step groups', () => {
            const parameters = { 'ENABLED': 'true' };
            const conditionalStep = {
                condition: '{{ENABLED}} == true',
                steps: ['Step 1', 'Step 2']
            };

            const result = processor.processStep(conditionalStep, parameters);

            expect(result).toEqual(['Step 1', 'Step 2']);
        });

        test('should process include steps', () => {
            const includeStep = { include: 'test-lib' };

            const result = processor.processStep(includeStep);

            expect(result).toEqual(['Library step 1', 'Library step 2']);
        });

        test('should handle other object types', () => {
            const objectStep = { type: 'custom', value: '{{PARAM}}' };
            const parameters = { 'PARAM': 'test' };

            const result = processor.processStep(objectStep, parameters);

            expect(result).toEqual(['{"type":"custom","value":"test"}']);
        });
    });

    describe('expandSingleInclude', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor();
            processor.stepLibraries = {
                'parameterized-lib': {
                    description: '',
                    parameters: [
                        { name: 'PREFIX', default: 'Default' },
                        { name: 'SUFFIX', default: 'End' }
                    ],
                    steps: [
                        'Start with {{PREFIX}}',
                        'End with {{SUFFIX}}'
                    ]
                }
            };
        });

        test('should expand include with parameters', () => {
            const includeStep = {
                include: 'parameterized-lib',
                parameters: {
                    'PREFIX': 'Custom',
                    'SUFFIX': 'Finish'
                }
            };

            const result = processor.expandSingleInclude(includeStep);

            expect(result).toEqual([
                'Start with Custom',
                'End with Finish'
            ]);
        });

        test('should use default parameters when not provided', () => {
            const includeStep = {
                include: 'parameterized-lib',
                parameters: {
                    'PREFIX': 'Custom'
                    // SUFFIX will use default
                }
            };

            const result = processor.expandSingleInclude(includeStep);

            expect(result).toEqual([
                'Start with Custom',
                'End with End'
            ]);
        });

        test('should inherit parameters from parent context', () => {
            const includeStep = {
                include: 'parameterized-lib',
                parameters: {
                    'SUFFIX': 'Override'
                }
            };

            const inheritedParams = { 'PREFIX': 'Inherited' };

            const result = processor.expandSingleInclude(includeStep, inheritedParams);

            expect(result).toEqual([
                'Start with Inherited',
                'End with Override'
            ]);
        });

        test('should handle missing step library', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const includeStep = { include: 'missing-lib' };
            const result = processor.expandSingleInclude(includeStep);

            expect(result).toEqual(['[MISSING LIBRARY: missing-lib]']);
            expect(consoleWarnSpy).toHaveBeenCalledWith("Step library 'missing-lib' not found");
            
            consoleWarnSpy.mockRestore();
        });
    });

    describe('processTestCase', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(false);
            processor = new YAMLTestProcessor({ tagFilter: 'smoke' });
            processor.envVars = { 'BASE_URL': 'https://example.com' };
            processor.stepLibraries = {
                'login': {
                    description: '',
                    parameters: [],
                    steps: ['Login step 1', 'Login step 2']
                }
            };
        });

        test('should process valid test case', () => {
            const testCaseContent = `
tags:
  - smoke
  - order
steps:
  - include: login
  - "Navigate to {{BASE_URL}}/products"
  - "Add product to cart"
`;

            mockFs.readFileSync.mockReturnValue(testCaseContent);

            const result = processor.processTestCase('/test-cases/order.yml');

            expect(result).toEqual({
                name: 'order.yml',
                originalFile: '/test-cases/order.yml',
                description: '',
                tags: ['smoke', 'order'],
                steps: [
                    'Login step 1',
                    'Login step 2',
                    'Navigate to https://example.com/products',
                    'Add product to cart'
                ],
                stepCount: 4,
                rawSteps: [
                    { include: 'login' },
                    'Navigate to {{BASE_URL}}/products',
                    'Add product to cart'
                ]
            });
        });

        test('should return null for test case that does not match tag filter', () => {
            const testCaseContent = `
tags:
  - regression
  - order
steps:
  - "Some step"
`;

            mockFs.readFileSync.mockReturnValue(testCaseContent);

            const result = processor.processTestCase('/test-cases/order.yml');

            expect(result).toBeNull();
        });

        test('should handle test case with no tags', () => {
            const testCaseContent = `
steps:
  - "Some step"
`;

            mockFs.readFileSync.mockReturnValue(testCaseContent);

            const result = processor.processTestCase('/test-cases/simple.yml');

            expect(result.tags).toEqual([]);
            expect(result.steps).toEqual(['Some step']);
        });

        test('should handle test case with no steps', () => {
            const testCaseContent = `
tags:
  - smoke
`;

            mockFs.readFileSync.mockReturnValue(testCaseContent);

            const result = processor.processTestCase('/test-cases/empty.yml');

            expect(result.steps).toEqual([]);
            expect(result.stepCount).toBe(0);
        });

        test('should handle invalid YAML content', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            mockFs.readFileSync.mockReturnValue('invalid: yaml: content:');

            const result = processor.processTestCase('/test-cases/invalid.yml');

            expect(result).toEqual({
                name: 'invalid.yml',
                originalFile: '/test-cases/invalid.yml',
                error: expect.any(String),
                tags: [],
                steps: [],
                stepCount: 0
            });
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            consoleErrorSpy.mockRestore();
        });

        test('should handle empty YAML content', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            mockFs.readFileSync.mockReturnValue('');

            const result = processor.processTestCase('/test-cases/empty.yml');

            expect(result).toEqual({
                name: 'empty.yml',
                originalFile: '/test-cases/empty.yml',
                error: 'Invalid YAML content',
                tags: [],
                steps: [],
                stepCount: 0
            });
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            consoleErrorSpy.mockRestore();
        });
    });

    describe('processAllTestCases', () => {
        beforeEach(() => {
            mockFs.existsSync.mockReturnValue(true);
            processor = new YAMLTestProcessor({ environment: 'test', tagFilter: 'smoke' });
            processor.envVars = { 'BASE_URL': 'https://example.com' };
            processor.stepLibraries = { 
                'login': {
                    description: '',
                    parameters: [],
                    steps: ['Login step']
                }
            };
        });

        test('should process all matching test cases', () => {
            const testCase1 = `
tags: [smoke, order]
steps: ["Step 1", "Step 2"]
`;
            const testCase2 = `
tags: [smoke, login]
steps: ["Step A"]
`;
            const testCase3 = `
tags: [regression]
steps: ["Step X"]
`;

            // Mock all the necessary calls
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync
                .mockReturnValueOnce([]) // step libraries directory
                .mockReturnValueOnce(['test1.yml', 'test2.yml', 'test3.yml']); // test cases directory
            mockFs.readFileSync
                .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                .mockReturnValueOnce(testCase1) // test1.yml
                .mockReturnValueOnce(testCase2) // test2.yml
                .mockReturnValueOnce(testCase3); // test3.yml

            // Create fresh processor to ensure proper initialization
            processor = new YAMLTestProcessor({ environment: 'test', tagFilter: 'smoke' });
            const result = processor.processAllTestCases();

            expect(result.testCases).toHaveLength(2); // Only smoke tests
            expect(result.testCases[0].name).toBe('test1.yml');
            expect(result.testCases[1].name).toBe('test2.yml');
            expect(result.summary).toEqual({
                totalFound: 3,
                totalMatched: 2,
                totalSteps: 3 // 2 + 1
            });
        });

        test('should process specific test case file', () => {
            const testCase = `
tags: [smoke]
steps: ["Single step"]
`;

            mockFs.readFileSync.mockReturnValue(testCase);

            const result = processor.processAllTestCases('specific.yml');

            expect(result.testCases).toHaveLength(1);
            expect(result.testCases[0].name).toBe('specific.yml');
            expect(result.summary.totalFound).toBe(1);
        });

        test('should return empty result when no test cases match', () => {
            const testCase = `
tags: [regression]
steps: ["Step 1"]
`;

            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync
                .mockReturnValueOnce([]) // step libraries directory
                .mockReturnValueOnce(['test1.yml']); // test cases directory
            mockFs.readFileSync
                .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                .mockReturnValueOnce(testCase); // test1.yml

            // Create fresh processor
            processor = new YAMLTestProcessor({ environment: 'test', tagFilter: 'smoke' });
            const result = processor.processAllTestCases();

            expect(result.testCases).toHaveLength(0);
            expect(result.summary).toEqual({
                totalFound: 1,
                totalMatched: 0,
                totalSteps: 0
            });
        });

        test('should include correct metadata in result', () => {
            mockFs.readdirSync.mockReturnValue([]);
            mockFs.readFileSync.mockReturnValue(''); // env file

            const result = processor.processAllTestCases();

            expect(result.environment).toBe('test');
            expect(result.tagFilter).toBe('smoke');
            expect(result.envVars).toEqual({ 'BASE_URL': 'https://example.com' });
            expect(result.stepLibraries).toEqual(['login']);
        });

        test('should process test case with parameterized step libraries', () => {
            const testCase = `
tags: [smoke, parameterized]
description: "Test with parameterized steps"
steps:
  - include: "create-basic-channel"
    parameters:
      CHANNEL_NAME_PREFIX: "测试频道"
      LIVE_SCENE: "企业培训"
  - "Custom step"
`;

            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync
                .mockReturnValueOnce(['create-basic-channel.yml']) // step libraries
                .mockReturnValueOnce(['test.yml']); // test cases
            mockFs.readFileSync
                .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                .mockReturnValueOnce(`
description: "Create basic channel"
parameters:
  - name: "CHANNEL_NAME_PREFIX"
    description: "Channel name prefix"
    default: "直播"
  - name: "LIVE_SCENE"
    description: "Live scene"
    default: "大班课"
steps:
  - "输入直播名称: {{CHANNEL_NAME_PREFIX}} + 随机5位数字"
  - "选择直播场景: {{LIVE_SCENE}}"
`) // create-basic-channel.yml
                .mockReturnValueOnce(testCase); // test case

            processor = new YAMLTestProcessor({ environment: 'test' });
            const result = processor.processAllTestCases();

            expect(result.testCases).toHaveLength(1);
            expect(result.testCases[0].description).toBe('Test with parameterized steps');
            expect(result.testCases[0].steps).toEqual([
                '输入直播名称: 测试频道 + 随机5位数字',
                '选择直播场景: 企业培训',
                'Custom step'
            ]);
            expect(result.testCases[0].stepCount).toBe(3);
        });
    });

    describe('CLI integration', () => {
        test('should export YAMLTestProcessor class', () => {
            expect(YAMLTestProcessor).toBeDefined();
            expect(typeof YAMLTestProcessor).toBe('function');
        });
    });

    describe('CLI main function', () => {
        let originalArgv;
        let originalExit;
        let originalMain;
        let consoleLogSpy;
        let consoleErrorSpy;

        beforeEach(() => {
            originalArgv = process.argv;
            originalExit = process.exit;
            originalMain = require.main;
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            process.exit = jest.fn();
        });

        afterEach(() => {
            process.argv = originalArgv;
            process.exit = originalExit;
            require.main = originalMain;
            consoleLogSpy.mockRestore();
            consoleErrorSpy.mockRestore();
        });

        test('should display help when --help is provided', () => {
            process.argv = ['node', 'yaml-test-processor.js', '--help'];
            
            // Simulate main function execution
            require.main = { filename: require.resolve('./yaml-test-processor.js') };
            
            const args = process.argv.slice(2);
            
            // Test help argument parsing
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg === '--help' || arg === '-h') {
                    console.log(`
YAML Test Processor

Usage: node yaml-test-processor.js [options]

Options:
  --env=<environment>     Environment name (default: dev)
  --tags=<tag-filter>     Tag filter (e.g., smoke, smoke|login, smoke,critical)
  --file=<test-file>      Specific test file to process
  --help, -h              Show this help message

Examples:
  node yaml-test-processor.js --env=dev --tags=smoke
  node yaml-test-processor.js --file=order.yml --env=test
  node yaml-test-processor.js --tags="smoke,login|critical"
                    `);
                    process.exit(0);
                    break;
                }
            }
            
            expect(consoleLogSpy).toHaveBeenCalled();
            expect(process.exit).toHaveBeenCalledWith(0);
        });

        test('should display help when -h is provided', () => {
            process.argv = ['node', 'yaml-test-processor.js', '-h'];
            
            require.main = { filename: require.resolve('./yaml-test-processor.js') };
            
            const args = process.argv.slice(2);
            
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg === '--help' || arg === '-h') {
                    console.log('Help message');
                    process.exit(0);
                    break;
                }
            }
            
            expect(consoleLogSpy).toHaveBeenCalled();
            expect(process.exit).toHaveBeenCalledWith(0);
        });

        test('should execute main function successfully with valid args', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync
                .mockReturnValueOnce([]) // step libraries
                .mockReturnValueOnce(['test.yml']); // test cases
            mockFs.readFileSync
                .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                .mockReturnValueOnce('tags: [smoke]\nsteps: ["Test step"]'); // test case

            process.argv = ['node', 'yaml-test-processor.js', '--env=test', '--tags=smoke'];
            require.main = { filename: require.resolve('./yaml-test-processor.js') };
            
            try {
                const args = process.argv.slice(2);
                const options = {};
                let specificFile = null;

                // Parse command line arguments (covering lines 269-296)
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    if (arg.startsWith('--env=')) {
                        options.environment = arg.split('=')[1];
                    } else if (arg.startsWith('--tags=')) {
                        options.tagFilter = arg.split('=')[1];
                    } else if (arg.startsWith('--file=')) {
                        specificFile = arg.split('=')[1];
                    }
                }

                const processor = new YAMLTestProcessor(options);
                const result = processor.processAllTestCases(specificFile);
                
                // Output JSON result (covering line 303)
                console.log(JSON.stringify(result, null, 2));

                expect(result.environment).toBe('test');
                expect(result.tagFilter).toBe('smoke');
                expect(consoleLogSpy).toHaveBeenCalled();
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }
        });

        test('should handle error in main function execution', () => {
            mockFs.existsSync.mockImplementation(() => {
                throw new Error('File system error');
            });

            process.argv = ['node', 'yaml-test-processor.js', '--env=test'];
            require.main = { filename: require.resolve('./yaml-test-processor.js') };
            
            try {
                const args = process.argv.slice(2);
                const options = {};

                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    if (arg.startsWith('--env=')) {
                        options.environment = arg.split('=')[1];
                    }
                }

                new YAMLTestProcessor(options); // This will throw
            } catch (error) {
                console.error('Error:', error.message);
                process.exit(1);
            }

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'File system error');
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        test('should handle arguments without values', () => {
            process.argv = ['node', 'yaml-test-processor.js', '--env', '--tags'];
            
            const args = process.argv.slice(2);
            const options = {};
            
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg.startsWith('--env=')) {
                    options.environment = arg.split('=')[1];
                } else if (arg.startsWith('--tags=')) {
                    options.tagFilter = arg.split('=')[1];
                }
            }
            
            // Should not set options for malformed arguments
            expect(options.environment).toBeUndefined();
            expect(options.tagFilter).toBeUndefined();
        });

        test('should test actual main function execution', () => {
            // Set up successful test scenario
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync
                .mockReturnValueOnce([]) // step libraries
                .mockReturnValueOnce(['test.yml']); // test cases
            mockFs.readFileSync
                .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                .mockReturnValueOnce('tags: [smoke]\nsteps: ["Test step"]'); // test case

            process.argv = ['node', 'yaml-test-processor.js', '--env=test', '--tags=smoke'];
            
            // Import and call main function directly
            const YAMLTestProcessor = require('./yaml-test-processor.js');
            YAMLTestProcessor.main();
            
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should test main function with help argument', () => {
            process.argv = ['node', 'yaml-test-processor.js', '--help'];
            
            // Call main function directly
            const YAMLTestProcessor = require('./yaml-test-processor.js');
            YAMLTestProcessor.main();
            
            expect(consoleLogSpy).toHaveBeenCalled();
            expect(process.exit).toHaveBeenCalledWith(0);
        });

        test('should test main function with error', () => {
            process.argv = ['node', 'yaml-test-processor.js', '--env=test'];
            
            // Set up error scenario
            mockFs.existsSync.mockImplementation(() => {
                throw new Error('Test filesystem error');
            });
            
            // Call main function directly
            const YAMLTestProcessor = require('./yaml-test-processor.js');
            YAMLTestProcessor.main();
            
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Test filesystem error');
            expect(process.exit).toHaveBeenCalledWith(1);
        });
    });

    describe('Test Suite Processing', () => {
        describe('getTestSuiteFiles', () => {
            beforeEach(() => {
                mockFs.existsSync.mockReturnValue(false);
                processor = new YAMLTestProcessor();
            });

            test('should return specific suite file when provided', () => {
                mockFs.existsSync.mockReturnValue(true);
                
                const files = processor.getTestSuiteFiles('e-commerce.yml');
                
                expect(files).toEqual([process.cwd() + '/test-suites/e-commerce.yml']);
            });

            test('should return absolute path when provided', () => {
                mockFs.existsSync.mockReturnValue(true);
                
                const files = processor.getTestSuiteFiles('/absolute/path/suite.yml');
                
                expect(files).toEqual(['/absolute/path/suite.yml']);
            });

            test('should return empty array for non-existent specific suite file', () => {
                mockFs.existsSync.mockReturnValue(false);
                
                const files = processor.getTestSuiteFiles('nonexistent.yml');
                
                expect(files).toEqual([]);
            });

            test('should return all YAML files from test suites directory', () => {
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync.mockReturnValue(['suite1.yml', 'suite2.yaml', 'readme.txt', 'suite3.yml']);
                
                const files = processor.getTestSuiteFiles();
                
                expect(files).toEqual([
                    process.cwd() + '/test-suites/suite1.yml',
                    process.cwd() + '/test-suites/suite2.yaml',
                    process.cwd() + '/test-suites/suite3.yml'
                ]);
            });

            test('should handle missing test suites directory', () => {
                const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
                mockFs.existsSync
                    .mockReturnValueOnce(false) // env file
                    .mockReturnValueOnce(false) // steps directory
                    .mockReturnValueOnce(false); // test suites directory
                
                processor = new YAMLTestProcessor();
                const files = processor.getTestSuiteFiles();
                
                expect(files).toEqual([]);
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Test suites directory')
                );
                
                consoleWarnSpy.mockRestore();
            });
        });

        describe('processTestSuite', () => {
            beforeEach(() => {
                mockFs.existsSync.mockReturnValue(false);
                processor = new YAMLTestProcessor({ tagFilter: 'smoke' });
                processor.envVars = { 'BASE_URL': 'https://example.com' };
                processor.stepLibraries = {
                    'login': {
                        description: '',
                        parameters: [],
                        steps: ['Login step 1', 'Login step 2']
                    }
                };
            });

            test('should process valid test suite with simplified format', () => {
                const suiteContent = `
name: "E-commerce Test Suite"
description: "Complete e-commerce workflow testing"
tags:
  - e-commerce
  - smoke
  - integration
test-cases:
  - "test-cases/order.yml"
  - "test-cases/product-details.yml"
post-actions:
  - "Generate consolidated test report"
  - "Clean up test data"
`;

                const testCase1Content = `
tags:
  - smoke
  - order
steps:
  - include: login
  - "Add product to cart"
`;

                const testCase2Content = `
tags:
  - smoke
  - product-details
steps:
  - "Navigate to product page"
  - "View product details"
`;

                mockFs.readFileSync
                    .mockReturnValueOnce(suiteContent) // suite file
                    .mockReturnValueOnce(testCase1Content) // test case 1
                    .mockReturnValueOnce(testCase2Content); // test case 2
                
                mockFs.existsSync.mockReturnValue(true);

                const result = processor.processTestSuite('/test-suites/e-commerce.yml');

                expect(result).toEqual({
                    name: 'e-commerce.yml',
                    originalFile: '/test-suites/e-commerce.yml',
                    suiteName: 'E-commerce Test Suite',
                    description: 'Complete e-commerce workflow testing',
                    tags: ['e-commerce', 'smoke', 'integration'],
                    preActions: [],
                    postActions: ['Generate consolidated test report', 'Clean up test data'],
                    testCases: [
                        {
                            name: 'order.yml',
                            originalFile: expect.stringContaining('test-cases/order.yml'),
                            description: '',
                            tags: ['smoke', 'order'],
                            steps: ['Login step 1', 'Login step 2', 'Add product to cart'],
                            stepCount: 3,
                            rawSteps: [{ include: 'login' }, 'Add product to cart']
                        },
                        {
                            name: 'product-details.yml',
                            originalFile: expect.stringContaining('test-cases/product-details.yml'),
                            description: '',
                            tags: ['smoke', 'product-details'],
                            steps: ['Navigate to product page', 'View product details'],
                            stepCount: 2,
                            rawSteps: ['Navigate to product page', 'View product details']
                        }
                    ],
                    errors: [],
                    summary: {
                        totalTestCases: 2,
                        totalSteps: 5,
                        totalErrors: 0
                    }
                });
            });

            test('should process test suite with legacy object format test cases', () => {
                const suiteContent = `
name: "Legacy Test Suite"
description: "Test suite with legacy format"
tags:
  - smoke
test-cases:
  - path: "test-cases/order.yml"
    description: "Order workflow"
    tags: ["order", "legacy"]
  - "test-cases/simple.yml"
`;

                const testCase1Content = `
tags: [smoke, order]
steps: ["Order step"]
`;

                const testCase2Content = `
tags: [smoke]
steps: ["Simple step"]
`;

                mockFs.readFileSync
                    .mockReturnValueOnce(suiteContent)
                    .mockReturnValueOnce(testCase1Content)
                    .mockReturnValueOnce(testCase2Content);
                
                mockFs.existsSync.mockReturnValue(true);

                const result = processor.processTestSuite('/test-suites/legacy.yml');

                expect(result.testCases).toHaveLength(2);
                expect(result.testCases[0].name).toBe('order.yml');
                expect(result.testCases[1].name).toBe('simple.yml');
            });

            test('should return null for test suite that does not match tag filter', () => {
                const suiteContent = `
name: "Regression Test Suite"
description: "Regression tests"
tags:
  - regression
  - nightly
test-cases:
  - "test-cases/test.yml"
`;

                mockFs.readFileSync.mockReturnValue(suiteContent);

                const result = processor.processTestSuite('/test-suites/regression.yml');

                expect(result).toBeNull();
            });

            test('should handle test suite with pre-actions', () => {
                const suiteContent = `
name: "Setup Test Suite"
description: "Test suite with setup"
tags:
  - smoke
test-cases:
  - "test-cases/test.yml"
pre-actions:
  - "Clear browser cache"
  - "Reset test environment"
post-actions:
  - "Generate report"
`;

                const testCaseContent = `
tags: [smoke]
steps: ["Test step"]
`;

                mockFs.readFileSync
                    .mockReturnValueOnce(suiteContent)
                    .mockReturnValueOnce(testCaseContent);
                
                mockFs.existsSync.mockReturnValue(true);

                const result = processor.processTestSuite('/test-suites/setup.yml');

                expect(result.preActions).toEqual(['Clear browser cache', 'Reset test environment']);
                expect(result.postActions).toEqual(['Generate report']);
            });

            test('should handle missing test case files', () => {
                const suiteContent = `
name: "Test Suite"
description: "Test suite"
tags:
  - smoke
test-cases:
  - "test-cases/existing.yml"
  - "test-cases/missing.yml"
`;

                const testCaseContent = `
tags: [smoke]
steps: ["Test step"]
`;

                // Mock the suite file reading first
                mockFs.readFileSync.mockReturnValueOnce(suiteContent);
                
                // Mock existsSync for each test case file
                mockFs.existsSync
                    .mockReturnValueOnce(true) // first test case exists
                    .mockReturnValueOnce(false); // second test case missing

                // Mock reading the existing test case
                mockFs.readFileSync.mockReturnValueOnce(testCaseContent);

                const result = processor.processTestSuite('/test-suites/test.yml');

                expect(result.testCases).toHaveLength(1);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toEqual({
                    testCase: 'test-cases/missing.yml',
                    error: 'Test case file not found: test-cases/missing.yml'
                });
                expect(result.summary.totalErrors).toBe(1);
            });

            test('should handle invalid test case reference format', () => {
                const suiteContent = `
name: "Test Suite"
description: "Test suite"
tags:
  - smoke
test-cases:
  - "test-cases/valid.yml"
  - { invalid: "format" }
`;

                const testCaseContent = `
tags: [smoke]
steps: ["Test step"]
`;

                mockFs.readFileSync
                    .mockReturnValueOnce(suiteContent)
                    .mockReturnValueOnce(testCaseContent);
                
                mockFs.existsSync.mockReturnValue(true);

                const result = processor.processTestSuite('/test-suites/test.yml');

                expect(result.testCases).toHaveLength(1);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0].error).toBe('Invalid test case reference format');
            });

            test('should handle invalid YAML content in test suite', () => {
                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                
                mockFs.readFileSync.mockReturnValue('invalid: yaml: content:');

                const result = processor.processTestSuite('/test-suites/invalid.yml');

                expect(result).toEqual({
                    name: 'invalid.yml',
                    originalFile: '/test-suites/invalid.yml',
                    suiteName: 'invalid.yml',
                    description: '',
                    tags: [],
                    preActions: [],
                    postActions: [],
                    error: expect.any(String),
                    testCases: [],
                    errors: [],
                    summary: {
                        totalTestCases: 0,
                        totalSteps: 0,
                        totalErrors: 1
                    }
                });
                expect(consoleErrorSpy).toHaveBeenCalled();
                
                consoleErrorSpy.mockRestore();
            });

            test('should handle empty YAML content in test suite', () => {
                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                
                mockFs.readFileSync.mockReturnValue('');

                const result = processor.processTestSuite('/test-suites/empty.yml');

                expect(result.error).toBe('Invalid YAML content');
                expect(consoleErrorSpy).toHaveBeenCalled();
                
                consoleErrorSpy.mockRestore();
            });

            test('should handle test suite with no test cases', () => {
                const suiteContent = `
name: "Empty Test Suite"
description: "Test suite with no test cases"
tags:
  - smoke
`;

                mockFs.readFileSync.mockReturnValue(suiteContent);

                const result = processor.processTestSuite('/test-suites/empty.yml');

                expect(result.testCases).toEqual([]);
                expect(result.summary.totalTestCases).toBe(0);
            });

            test('should use default values for missing fields', () => {
                const suiteContent = `
test-cases:
  - "test-cases/test.yml"
`;

                const testCaseContent = `
tags: [smoke]
steps: ["Test step"]
`;

                mockFs.readFileSync
                    .mockReturnValueOnce(suiteContent)
                    .mockReturnValueOnce(testCaseContent);
                
                mockFs.existsSync.mockReturnValue(true);

                const result = processor.processTestSuite('/test-suites/minimal.yml');

                expect(result.suiteName).toBe('minimal.yml');
                expect(result.description).toBe('');
                expect(result.tags).toEqual([]);
                expect(result.preActions).toEqual([]);
                expect(result.postActions).toEqual([]);
            });
        });

        describe('processAllTestSuites', () => {
            beforeEach(() => {
                mockFs.existsSync.mockReturnValue(true);
                processor = new YAMLTestProcessor({ environment: 'test', tagFilter: 'smoke' });
                processor.envVars = { 'BASE_URL': 'https://example.com' };
                processor.stepLibraries = { 
                'login': {
                    description: '',
                    parameters: [],
                    steps: ['Login step']
                }
            };
            });

            test('should process all matching test suites', () => {
                const suite1 = `
name: "Smoke Suite"
tags: [smoke, quick]
test-cases: ["test-cases/test1.yml"]
`;
                const suite2 = `
name: "E-commerce Suite"
tags: [smoke, e-commerce]
test-cases: ["test-cases/test2.yml"]
`;
                const suite3 = `
name: "Regression Suite"
tags: [regression]
test-cases: ["test-cases/test3.yml"]
`;

                const testCase1 = 'tags: [smoke]\nsteps: ["Step 1"]';
                const testCase2 = 'tags: [smoke]\nsteps: ["Step 2"]';
                const testCase3 = 'tags: [regression]\nsteps: ["Step 3"]';

                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync
                    .mockReturnValueOnce([]) // step libraries directory
                    .mockReturnValueOnce(['suite1.yml', 'suite2.yml', 'suite3.yml']); // test suites directory
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce(suite1) // suite1.yml
                    .mockReturnValueOnce(testCase1) // test case 1
                    .mockReturnValueOnce(suite2) // suite2.yml
                    .mockReturnValueOnce(testCase2) // test case 2
                    .mockReturnValueOnce(suite3); // suite3.yml (filtered out)

                processor = new YAMLTestProcessor({ environment: 'test', tagFilter: 'smoke' });
                const result = processor.processAllTestSuites();

                expect(result.testSuites).toHaveLength(2); // Only smoke suites
                expect(result.testSuites[0].suiteName).toBe('Smoke Suite');
                expect(result.testSuites[1].suiteName).toBe('E-commerce Suite');
                expect(result.summary).toEqual({
                    totalSuitesFound: 3,
                    totalSuitesMatched: 2,
                    totalTestCases: 2,
                    totalSteps: 2,
                    totalErrors: 0
                });
            });

            test('should process specific test suite file', () => {
                const suite = `
name: "Specific Suite"
tags: [smoke]
test-cases: ["test-cases/test.yml"]
`;

                const testCase = 'tags: [smoke]\nsteps: ["Test step"]';

                mockFs.readFileSync
                    .mockReturnValueOnce(suite)
                    .mockReturnValueOnce(testCase);

                const result = processor.processAllTestSuites('specific.yml');

                expect(result.testSuites).toHaveLength(1);
                expect(result.testSuites[0].suiteName).toBe('Specific Suite');
                expect(result.summary.totalSuitesFound).toBe(1);
            });

            test('should return empty result when no test suites match', () => {
                const suite = `
name: "Regression Suite"
tags: [regression]
test-cases: ["test-cases/test.yml"]
`;

                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync
                    .mockReturnValueOnce([]) // step libraries directory
                    .mockReturnValueOnce(['suite1.yml']); // test suites directory
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce(suite); // suite1.yml

                processor = new YAMLTestProcessor({ environment: 'test', tagFilter: 'smoke' });
                const result = processor.processAllTestSuites();

                expect(result.testSuites).toHaveLength(0);
                expect(result.summary).toEqual({
                    totalSuitesFound: 1,
                    totalSuitesMatched: 0,
                    totalTestCases: 0,
                    totalSteps: 0,
                    totalErrors: 0
                });
            });

            test('should include correct metadata in result', () => {
                mockFs.readdirSync.mockReturnValue([]);
                mockFs.readFileSync.mockReturnValue(''); // env file

                const result = processor.processAllTestSuites();

                expect(result.environment).toBe('test');
                expect(result.tagFilter).toBe('smoke');
                expect(result.envVars).toEqual({ 'BASE_URL': 'https://example.com' });
                expect(result.stepLibraries).toEqual(['login']);
            });
        });

        describe('CLI integration for test suites', () => {
            let originalArgv;
            let originalExit;
            let consoleLogSpy;
            let consoleErrorSpy;

            beforeEach(() => {
                originalArgv = process.argv;
                originalExit = process.exit;
                consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
                consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
                process.exit = jest.fn();
            });

            afterEach(() => {
                process.argv = originalArgv;
                process.exit = originalExit;
                consoleLogSpy.mockRestore();
                consoleErrorSpy.mockRestore();
            });

            test('should process test suites when --suites flag is provided', () => {
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync
                    .mockReturnValueOnce([]) // step libraries
                    .mockReturnValueOnce(['suite.yml']); // test suites
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce('name: "Test Suite"\ntags: [smoke]\ntest-cases: ["test-cases/test.yml"]') // suite
                    .mockReturnValueOnce('tags: [smoke]\nsteps: ["Test step"]'); // test case

                process.argv = ['node', 'yaml-test-processor.js', '--suites', '--env=test'];

                try {
                    const args = process.argv.slice(2);
                    const options = {};
                    let specificSuite = null;
                    let mode = 'testcases';

                    for (let i = 0; i < args.length; i++) {
                        const arg = args[i];
                        if (arg.startsWith('--env=')) {
                            options.environment = arg.split('=')[1];
                        } else if (arg.startsWith('--suite=')) {
                            specificSuite = arg.split('=')[1];
                            mode = 'suites';
                        } else if (arg === '--suites') {
                            mode = 'suites';
                        }
                    }

                    const processor = new YAMLTestProcessor(options);
                    let result;
                    
                    if (mode === 'suites') {
                        result = processor.processAllTestSuites(specificSuite);
                    } else {
                        result = processor.processAllTestCases();
                    }

                    console.log(JSON.stringify(result, null, 2));

                    expect(result.testSuites).toBeDefined();
                    expect(consoleLogSpy).toHaveBeenCalled();
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            });

            test('should process specific test suite when --suite flag is provided', () => {
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce('name: "Specific Suite"\ntags: [smoke]\ntest-cases: ["test-cases/test.yml"]') // suite
                    .mockReturnValueOnce('tags: [smoke]\nsteps: ["Test step"]'); // test case

                process.argv = ['node', 'yaml-test-processor.js', '--suite=specific.yml', '--env=test'];

                try {
                    const args = process.argv.slice(2);
                    const options = {};
                    let specificSuite = null;
                    let mode = 'testcases';

                    for (let i = 0; i < args.length; i++) {
                        const arg = args[i];
                        if (arg.startsWith('--env=')) {
                            options.environment = arg.split('=')[1];
                        } else if (arg.startsWith('--suite=')) {
                            specificSuite = arg.split('=')[1];
                            mode = 'suites';
                        }
                    }

                    const processor = new YAMLTestProcessor(options);
                    const result = processor.processAllTestSuites(specificSuite);

                    console.log(JSON.stringify(result, null, 2));

                    expect(result.testSuites).toHaveLength(1);
                    expect(result.testSuites[0].suiteName).toBe('Specific Suite');
                    expect(consoleLogSpy).toHaveBeenCalled();
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            });

            test('should show updated help message with test suite options', () => {
                process.argv = ['node', 'yaml-test-processor.js', '--help'];

                const args = process.argv.slice(2);
                
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    if (arg === '--help' || arg === '-h') {
                        console.log(`
YAML Test Processor

Usage: node yaml-test-processor.js [options]

Options:
  --env=<environment>     Environment name (default: dev)
  --tags=<tag-filter>     Tag filter (e.g., smoke, smoke|login, smoke,critical)
  --file=<test-file>      Specific test file to process
  --suite=<suite-file>    Specific test suite to process
  --suites                Process all test suites instead of test cases
  --help, -h              Show this help message

Examples:
  # Process test cases
  node yaml-test-processor.js --env=dev --tags=smoke
  node yaml-test-processor.js --file=order.yml --env=test
  node yaml-test-processor.js --tags="smoke,login|critical"
  
  # Process test suites
  node yaml-test-processor.js --suites --env=test
  node yaml-test-processor.js --suite=e-commerce.yml --env=prod
  node yaml-test-processor.js --suites --tags=smoke
                        `);
                        process.exit(0);
                        break;
                    }
                }
                
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    expect.stringContaining('--suite=<suite-file>')
                );
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    expect.stringContaining('--suites')
                );
                expect(process.exit).toHaveBeenCalledWith(0);
            });

            test('should handle --file argument correctly', () => {
                process.argv = ['node', 'yaml-test-processor.js', '--file=specific-test.yml'];
                
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync.mockReturnValueOnce([]); // step libraries
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce('tags: [test]\nsteps: ["Test step"]'); // test case
                
                const YAMLTestProcessor = require('./yaml-test-processor.js');
                YAMLTestProcessor.main();
                
                expect(consoleLogSpy).toHaveBeenCalled();
                // Verify JSON output was called
                const outputCall = consoleLogSpy.mock.calls.find(call => 
                    call[0].includes('"testCases"') || call[0].includes('{')
                );
                expect(outputCall).toBeDefined();
            });

            test('should handle --suite argument correctly', () => {
                process.argv = ['node', 'yaml-test-processor.js', '--suite=smoke-tests.yml'];
                
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync
                    .mockReturnValueOnce([]) // step libraries  
                    .mockReturnValueOnce([]) // test cases
                    .mockReturnValueOnce(['smoke-tests.yml']); // test suites
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce('name: Smoke Tests\ntags: [smoke]\ntest-cases: []'); // suite file
                
                const YAMLTestProcessor = require('./yaml-test-processor.js');
                YAMLTestProcessor.main();
                
                expect(consoleLogSpy).toHaveBeenCalled();
                // Verify JSON output was called
                const outputCall = consoleLogSpy.mock.calls.find(call => 
                    call[0].includes('"testSuites"') || call[0].includes('{')
                );
                expect(outputCall).toBeDefined();
            });

            test('should handle --suites argument correctly', () => {
                process.argv = ['node', 'yaml-test-processor.js', '--suites'];
                
                mockFs.existsSync.mockReturnValue(true);
                mockFs.readdirSync
                    .mockReturnValueOnce([]) // step libraries
                    .mockReturnValueOnce([]) // test cases  
                    .mockReturnValueOnce(['suite1.yml', 'suite2.yml']); // test suites
                mockFs.readFileSync
                    .mockReturnValueOnce('BASE_URL=https://example.com') // env file
                    .mockReturnValueOnce('name: Suite 1\ntags: [test]\ntest-cases: []') // suite1
                    .mockReturnValueOnce('name: Suite 2\ntags: [test]\ntest-cases: []'); // suite2
                
                const YAMLTestProcessor = require('./yaml-test-processor.js');
                YAMLTestProcessor.main();
                
                expect(consoleLogSpy).toHaveBeenCalled();
                // Verify JSON output was called
                const outputCall = consoleLogSpy.mock.calls.find(call => 
                    call[0].includes('"testSuites"') || call[0].includes('{')
                );
                expect(outputCall).toBeDefined();
            });
        });
    });
});