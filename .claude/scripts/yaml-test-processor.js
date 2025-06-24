#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 尝试加载 dotenv，如果不存在则忽略
try {
    require('dotenv').config();
} catch (error) {
    // dotenv 不是必需的依赖，如果不存在就跳过
}

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
     * 加载所有步骤库（支持参数化）
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
                
                if (stepData) {
                    const libraryName = path.basename(file, path.extname(file));
                    libraries[libraryName] = {
                        description: stepData.description || '',
                        parameters: stepData.parameters || [],
                        steps: stepData.steps || []
                    };
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
     * 解析和合并参数
     */
    resolveParameters(library, providedParams = {}) {
        const resolvedParams = {};
        
        // 首先设置默认值
        if (library.parameters) {
            library.parameters.forEach(param => {
                if (param.default !== undefined) {
                    resolvedParams[param.name] = param.default;
                }
            });
        }
        
        // 然后应用提供的参数
        Object.assign(resolvedParams, providedParams);
        
        return resolvedParams;
    }

    /**
     * 替换步骤中的参数和环境变量
     */
    substituteVariables(step, parameters = {}) {
        if (typeof step === 'string') {
            let substituted = step;
            
            // 替换参数 {{PARAM_NAME}}
            const paramRegex = /\{\{([^}]+)\}\}/g;
            substituted = substituted.replace(paramRegex, (match, varName) => {
                const trimmedName = varName.trim();
                
                // 首先检查参数
                if (parameters[trimmedName] !== undefined) {
                    return parameters[trimmedName];
                }
                
                // 然后检查环境变量
                const envValue = this.envVars[trimmedName];
                if (envValue !== undefined) {
                    return envValue;
                }
                
                console.warn(`Variable '${trimmedName}' not found`);
                return match; // 保持原样
            });
            
            return substituted;
        }
        return step;
    }

    /**
     * 评估条件表达式
     */
    evaluateCondition(condition, parameters = {}) {
        if (!condition) return true;
        
        // 替换变量
        const resolvedCondition = this.substituteVariables(condition, parameters);
        
        try {
            // 支持简单的条件表达式
            // 例如: "{{PARAM}} != ''" 或 "{{PARAM}} == true"
            
            // 处理字符串比较
            if (resolvedCondition.includes('!=')) {
                const [left, right] = resolvedCondition.split('!=').map(s => s.trim());
                const leftValue = left.replace(/['"]/g, '');
                const rightValue = right.replace(/['"]/g, '');
                return leftValue !== rightValue;
            }
            
            if (resolvedCondition.includes('==')) {
                const [left, right] = resolvedCondition.split('==').map(s => s.trim());
                const leftValue = left.replace(/['"]/g, '');
                const rightValue = right.replace(/['"]/g, '');
                
                // 处理布尔值
                if (rightValue === 'true') return leftValue === 'true' || leftValue === true;
                if (rightValue === 'false') return leftValue === 'false' || leftValue === false;
                
                return leftValue === rightValue;
            }
            
            // 如果没有比较运算符，尝试作为布尔值评估
            if (resolvedCondition === 'true') return true;
            if (resolvedCondition === 'false') return false;
            
            return Boolean(resolvedCondition);
            
        } catch (error) {
            console.warn(`Error evaluating condition '${condition}':`, error.message);
            return false;
        }
    }

    /**
     * 处理单个步骤（支持条件和参数）
     */
    processStep(step, parameters = {}) {
        const processedSteps = [];
        
        if (typeof step === 'string') {
            // 简单字符串步骤
            processedSteps.push(this.substituteVariables(step, parameters));
        } else if (typeof step === 'object') {
            if (step.condition) {
                // 条件步骤
                if (this.evaluateCondition(step.condition, parameters)) {
                    if (step.step) {
                        processedSteps.push(this.substituteVariables(step.step, parameters));
                    } else if (step.steps) {
                        step.steps.forEach(subStep => {
                            const processed = this.processStep(subStep, parameters);
                            processedSteps.push(...processed);
                        });
                    }
                }
            } else if (step.include) {
                // Include 步骤（递归处理）
                const included = this.expandSingleInclude(step, parameters);
                processedSteps.push(...included);
            } else {
                // 其他对象类型的步骤
                processedSteps.push(this.substituteVariables(JSON.stringify(step), parameters));
            }
        }
        
        return processedSteps;
    }

    /**
     * 展开单个 include 引用（支持参数化）
     */
    expandSingleInclude(includeStep, inheritedParams = {}) {
        const libraryName = includeStep.include;
        const providedParams = includeStep.parameters || {};
        
        if (!this.stepLibraries[libraryName]) {
            console.warn(`Step library '${libraryName}' not found`);
            return [`[MISSING LIBRARY: ${libraryName}]`];
        }
        
        const library = this.stepLibraries[libraryName];
        
        // 合并参数：继承的参数 < 库的默认参数 < 提供的参数
        const allParams = this.resolveParameters(library, { ...inheritedParams, ...providedParams });
        
        // 递归展开库中的步骤
        const expandedSteps = [];
        
        library.steps.forEach(step => {
            const processed = this.processStep(step, allParams);
            expandedSteps.push(...processed);
        });
        
        return expandedSteps;
    }

    /**
     * 展开步骤中的 include 引用（增强版本）
     */
    expandIncludes(steps, inheritedParams = {}) {
        const expandedSteps = [];
        
        steps.forEach(step => {
            if (typeof step === 'object' && step.include) {
                const included = this.expandSingleInclude(step, inheritedParams);
                expandedSteps.push(...included);
            } else {
                const processed = this.processStep(step, inheritedParams);
                expandedSteps.push(...processed);
            }
        });
        
        return expandedSteps;
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

            // 展开 include 引用（支持参数化）
            const expandedSteps = this.expandIncludes(testCase.steps || []);

            return {
                name: fileName,
                originalFile: filePath,
                description: testCase.description || '',
                tags: testCase.tags || [],
                steps: expandedSteps,
                stepCount: expandedSteps.length,
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