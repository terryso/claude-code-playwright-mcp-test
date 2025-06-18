#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

/**
 * YAML Test Processor
 * 处理 YAML 测试用例：标签过滤、步骤库展开、环境变量替换
 */
class YAMLTestProcessor {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.testCasesDir = path.join(this.projectRoot, 'test-cases');
        this.testSuitesDir = path.join(this.projectRoot, 'test-suites');
        this.stepsDir = path.join(this.projectRoot, 'steps');
        this.environment = options.environment || 'dev';
        this.tagFilter = options.tagFilter;
        
        // 加载环境变量
        this.loadEnvironmentConfig();
        
        // 加载步骤库
        this.stepLibraries = this.loadStepLibraries();
    }

    /**
     * 加载环境配置
     */
    loadEnvironmentConfig() {
        const envFile = path.join(this.projectRoot, `.env.${this.environment}`);
        if (fs.existsSync(envFile)) {
            const envContent = fs.readFileSync(envFile, 'utf8');
            const envVars = {};
            
            envContent.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    if (key && valueParts.length > 0) {
                        envVars[key.trim()] = valueParts.join('=').trim();
                    }
                }
            });
            
            this.envVars = envVars;
        } else {
            console.warn(`Environment file ${envFile} not found`);
            this.envVars = {};
        }
    }

    /**
     * 加载所有步骤库
     */
    loadStepLibraries() {
        const libraries = {};
        
        if (!fs.existsSync(this.stepsDir)) {
            console.warn(`Steps directory ${this.stepsDir} not found`);
            return libraries;
        }

        const stepFiles = fs.readdirSync(this.stepsDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
        
        stepFiles.forEach(file => {
            try {
                const filePath = path.join(this.stepsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const stepData = yaml.load(content);
                
                if (stepData && stepData.steps) {
                    const libraryName = path.basename(file, path.extname(file));
                    libraries[libraryName] = stepData.steps;
                }
            } catch (error) {
                console.error(`Error loading step library ${file}:`, error.message);
            }
        });
        
        return libraries;
    }

    /**
     * 获取所有测试用例文件
     */
    getTestCaseFiles(specificFile = null) {
        if (specificFile) {
            const filePath = path.isAbsolute(specificFile) ? specificFile : path.join(this.testCasesDir, specificFile);
            return fs.existsSync(filePath) ? [filePath] : [];
        }

        if (!fs.existsSync(this.testCasesDir)) {
            console.warn(`Test cases directory ${this.testCasesDir} not found`);
            return [];
        }

        return fs.readdirSync(this.testCasesDir)
            .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
            .map(file => path.join(this.testCasesDir, file));
    }

    /**
     * 解析标签过滤条件
     */
    parseTagFilter(tagFilter) {
        if (!tagFilter) return null;

        // 支持的格式:
        // smoke - 单个标签
        // smoke,login - 必须包含所有标签 (AND)
        // smoke|login - 包含任一标签 (OR)
        // smoke,login|critical - 混合条件
        
        const orGroups = tagFilter.split('|');
        return orGroups.map(group => group.split(',').map(tag => tag.trim()));
    }

    /**
     * 检查测试用例是否匹配标签过滤条件
     */
    matchesTagFilter(testCaseTags, tagFilter) {
        if (!tagFilter || !testCaseTags) return true;

        const filterGroups = this.parseTagFilter(tagFilter);
        
        // OR logic: 至少一个组匹配
        return filterGroups.some(andGroup => {
            // AND logic: 组内所有标签都必须存在
            return andGroup.every(tag => testCaseTags.includes(tag));
        });
    }

    /**
     * 展开步骤中的 include 引用
     */
    expandIncludes(steps) {
        const expandedSteps = [];
        
        steps.forEach(step => {
            if (typeof step === 'object' && step.include) {
                const libraryName = step.include;
                if (this.stepLibraries[libraryName]) {
                    // 递归展开步骤库中的 include
                    const librarySteps = this.expandIncludes(this.stepLibraries[libraryName]);
                    expandedSteps.push(...librarySteps);
                } else {
                    console.warn(`Step library '${libraryName}' not found`);
                    expandedSteps.push(`[MISSING LIBRARY: ${libraryName}]`);
                }
            } else {
                expandedSteps.push(step);
            }
        });
        
        return expandedSteps;
    }

    /**
     * 替换步骤中的环境变量
     */
    substituteEnvironmentVariables(steps) {
        return steps.map(step => {
            if (typeof step === 'string') {
                let substituted = step;
                
                // 替换 {{VAR}} 格式的环境变量
                const regex = /\{\{([^}]+)\}\}/g;
                substituted = substituted.replace(regex, (match, varName) => {
                    const envValue = this.envVars[varName.trim()];
                    if (envValue !== undefined) {
                        return envValue;
                    } else {
                        console.warn(`Environment variable '${varName}' not found`);
                        return match; // 保持原样
                    }
                });
                
                return substituted;
            }
            return step;
        });
    }

    /**
     * 处理单个测试用例
     */
    processTestCase(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const testCase = yaml.load(content);
            
            if (!testCase) {
                throw new Error('Invalid YAML content');
            }

            const fileName = path.basename(filePath);
            
            // 检查标签过滤
            if (!this.matchesTagFilter(testCase.tags, this.tagFilter)) {
                return null; // 不匹配，跳过
            }

            // 展开 include 引用
            const expandedSteps = this.expandIncludes(testCase.steps || []);
            
            // 替换环境变量
            const finalSteps = this.substituteEnvironmentVariables(expandedSteps);

            return {
                name: fileName,
                originalFile: filePath,
                tags: testCase.tags || [],
                steps: finalSteps,
                stepCount: finalSteps.length,
                rawSteps: testCase.steps || []
            };
        } catch (error) {
            console.error(`Error processing test case ${filePath}:`, error.message);
            return {
                name: path.basename(filePath),
                originalFile: filePath,
                error: error.message,
                tags: [],
                steps: [],
                stepCount: 0
            };
        }
    }

    /**
     * 处理所有测试用例
     */
    processAllTestCases(specificFile = null) {
        const files = this.getTestCaseFiles(specificFile);
        const processedCases = [];
        
        files.forEach(filePath => {
            const processed = this.processTestCase(filePath);
            if (processed) {
                processedCases.push(processed);
            }
        });

        return {
            environment: this.environment,
            tagFilter: this.tagFilter,
            envVars: this.envVars,
            stepLibraries: Object.keys(this.stepLibraries),
            testCases: processedCases,
            summary: {
                totalFound: files.length,
                totalMatched: processedCases.length,
                totalSteps: processedCases.reduce((sum, tc) => sum + tc.stepCount, 0)
            }
        };
    }

    /**
     * 获取所有测试套件文件
     */
    getTestSuiteFiles(specificSuite = null) {
        if (specificSuite) {
            const filePath = path.isAbsolute(specificSuite) ? specificSuite : path.join(this.testSuitesDir, specificSuite);
            return fs.existsSync(filePath) ? [filePath] : [];
        }

        if (!fs.existsSync(this.testSuitesDir)) {
            console.warn(`Test suites directory ${this.testSuitesDir} not found`);
            return [];
        }

        return fs.readdirSync(this.testSuitesDir)
            .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
            .map(file => path.join(this.testSuitesDir, file));
    }

    /**
     * 处理单个测试套件
     */
    processTestSuite(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const suite = yaml.load(content);
            
            if (!suite) {
                throw new Error('Invalid YAML content');
            }

            const fileName = path.basename(filePath);
            
            // 检查套件级别的标签过滤
            if (!this.matchesTagFilter(suite.tags, this.tagFilter)) {
                return null; // 不匹配，跳过
            }

            // 处理套件中的测试用例
            const processedTestCases = [];
            const suiteErrors = [];

            if (suite['test-cases'] && Array.isArray(suite['test-cases'])) {
                for (const testCaseRef of suite['test-cases']) {
                    try {
                        let testCasePath;

                        // 简化格式：支持直接字符串路径
                        if (typeof testCaseRef === 'string') {
                            testCasePath = testCaseRef;
                        } else if (typeof testCaseRef === 'object' && testCaseRef.path) {
                            // 兼容旧格式
                            testCasePath = testCaseRef.path;
                        } else {
                            throw new Error('Invalid test case reference format');
                        }

                        // 解析测试用例路径
                        const fullPath = path.isAbsolute(testCasePath) 
                            ? testCasePath 
                            : path.join(this.projectRoot, testCasePath);

                        if (!fs.existsSync(fullPath)) {
                            throw new Error(`Test case file not found: ${testCasePath}`);
                        }

                        // 处理测试用例 - 在套件上下文中不应用标签过滤
                        const originalTagFilter = this.tagFilter;
                        this.tagFilter = null; // 临时禁用标签过滤
                        const processedCase = this.processTestCase(fullPath);
                        this.tagFilter = originalTagFilter; // 恢复标签过滤
                        
                        if (processedCase) {
                            processedTestCases.push(processedCase);
                        }

                    } catch (error) {
                        suiteErrors.push({
                            testCase: testCaseRef,
                            error: error.message
                        });
                    }
                }
            }

            return {
                name: fileName,
                originalFile: filePath,
                suiteName: suite.name || fileName,
                description: suite.description || '',
                tags: suite.tags || [],
                preActions: suite['pre-actions'] || [],
                postActions: suite['post-actions'] || [],
                testCases: processedTestCases,
                errors: suiteErrors,
                summary: {
                    totalTestCases: processedTestCases.length,
                    totalSteps: processedTestCases.reduce((sum, tc) => sum + tc.stepCount, 0),
                    totalErrors: suiteErrors.length
                }
            };

        } catch (error) {
            console.error(`Error processing test suite ${filePath}:`, error.message);
            return {
                name: path.basename(filePath),
                originalFile: filePath,
                suiteName: path.basename(filePath),
                description: '',
                tags: [],
                preActions: [],
                postActions: [],
                error: error.message,
                testCases: [],
                errors: [],
                summary: {
                    totalTestCases: 0,
                    totalSteps: 0,
                    totalErrors: 1
                }
            };
        }
    }

    /**
     * 处理所有测试套件
     */
    processAllTestSuites(specificSuite = null) {
        const files = this.getTestSuiteFiles(specificSuite);
        const processedSuites = [];
        
        files.forEach(filePath => {
            const processed = this.processTestSuite(filePath);
            if (processed) {
                processedSuites.push(processed);
            }
        });

        return {
            environment: this.environment,
            tagFilter: this.tagFilter,
            envVars: this.envVars,
            stepLibraries: Object.keys(this.stepLibraries),
            testSuites: processedSuites,
            summary: {
                totalSuitesFound: files.length,
                totalSuitesMatched: processedSuites.length,
                totalTestCases: processedSuites.reduce((sum, suite) => sum + suite.summary.totalTestCases, 0),
                totalSteps: processedSuites.reduce((sum, suite) => sum + suite.summary.totalSteps, 0),
                totalErrors: processedSuites.reduce((sum, suite) => sum + suite.summary.totalErrors, 0)
            }
        };
    }
}

/**
 * CLI 接口
 */
function main() {
    const args = process.argv.slice(2);
    const options = {};
    let specificFile = null;
    let specificSuite = null;
    let mode = 'testcases'; // 'testcases' or 'suites'

    // 解析命令行参数
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--env=')) {
            options.environment = arg.split('=')[1];
        } else if (arg.startsWith('--tags=')) {
            options.tagFilter = arg.split('=')[1];
        } else if (arg.startsWith('--file=')) {
            specificFile = arg.split('=')[1];
        } else if (arg.startsWith('--suite=')) {
            specificSuite = arg.split('=')[1];
            mode = 'suites';
        } else if (arg === '--suites') {
            mode = 'suites';
        } else if (arg === '--help' || arg === '-h') {
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
        }
    }

    try {
        const processor = new YAMLTestProcessor(options);
        let result;
        
        if (mode === 'suites') {
            result = processor.processAllTestSuites(specificSuite);
        } else {
            result = processor.processAllTestCases(specificFile);
        }
        
        // 输出 JSON 结果
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = YAMLTestProcessor;
module.exports.main = main;