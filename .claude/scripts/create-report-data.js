#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 报告数据生成器 - 用于创建data.json文件
 * AI使用此工具来生成标准化的报告数据文件
 */
class ReportDataCreator {
    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * 创建测试用例报告数据
     */
    createTestCaseData(testCaseInfo, executionInfo, options = {}) {
        const data = {
            reportType: "test",
            reportData: {
                testCase: this.formatTestCase(testCaseInfo, options),
                execution: this.formatExecution(executionInfo, options)
            },
            config: this.createConfig(options),
            environment: this.createEnvironment(options)
        };

        return data;
    }

    /**
     * 创建批量测试报告数据
     */
    createBatchTestData(testCases, executionInfo, options = {}) {
        const data = {
            reportType: "test",
            reportData: {
                testCase: testCases.map(tc => this.formatTestCase(tc, options)),
                execution: this.formatBatchExecution(executionInfo, options)
            },
            config: this.createConfig(options),
            environment: this.createEnvironment(options)
        };

        return data;
    }

    /**
     * 创建测试套件报告数据
     */
    createSuiteData(suiteInfo, resultsInfo, options = {}) {
        const data = {
            reportType: "suite",
            reportData: {
                suite: this.formatSuite(suiteInfo),
                results: resultsInfo.map(result => this.formatSuiteResult(result, options))
            },
            config: this.createConfig(options),
            environment: this.createEnvironment(options)
        };

        return data;
    }

    /**
     * 格式化测试用例信息
     */
    formatTestCase(testCase, options = {}) {
        const tc = testCase || {};
        const result = {
            name: tc.name || 'unnamed-test.yml',
            description: tc.description || '',
            tags: tc.tags || []
        };
        
        // 只在详细模式下包含步骤信息
        const reportStyle = options.reportStyle || options.environment?.REPORT_STYLE || 'overview';
        if (reportStyle === 'detailed') {
            result.steps = tc.steps || [];
        }
        
        return result;
    }

    /**
     * 格式化执行信息
     */
    formatExecution(execution, options = {}) {
        const ex = execution || {};
        return {
            status: ex.status || 'unknown',
            startTime: ex.startTime || Date.now(),
            endTime: ex.endTime || Date.now(),
            duration: ex.duration || 0,
            testResults: ex.testResults ? 
                ex.testResults.map(tr => this.formatTestResult(tr, options)) : 
                [{
                    testName: ex.testName || 'test',
                    status: ex.status || 'unknown',
                    duration: ex.duration || 0,
                    validations: ex.validations || [],
                    sessionOptimized: ex.sessionOptimized || false
                }],
            screenshots: ex.screenshots || []
        };
    }

    /**
     * 格式化批量执行信息
     */
    formatBatchExecution(execution, options = {}) {
        return {
            name: execution.name || 'batch-execution',
            status: execution.status || 'unknown',
            startTime: execution.startTime || Date.now(),
            endTime: execution.endTime || Date.now(),
            duration: execution.duration || 0,
            testResults: execution.testResults ? 
                execution.testResults.map(tr => this.formatTestResult(tr, options)) : []
        };
    }

    /**
     * 格式化测试结果
     */
    formatTestResult(result, options = {}) {
        const r = result || {};
        const formattedResult = {
            testName: r.testName || r.name || 'test',
            status: r.status || 'unknown',
            duration: r.duration || 0,
            validations: Array.isArray(r.validations) ? r.validations : [],
            sessionOptimized: r.sessionOptimized || false,
            error: r.error || null
        };
        
        // 只在详细模式下包含步骤信息
        const reportStyle = options.reportStyle || options.environment?.REPORT_STYLE || 'overview';
        if (reportStyle === 'detailed') {
            formattedResult.steps = Array.isArray(r.steps) ? r.steps : [];
            formattedResult.steps_detail = r.steps_detail || r.stepsDetail || [];
        }
        
        return formattedResult;
    }

    /**
     * 格式化测试套件信息
     */
    formatSuite(suite) {
        const s = suite || {};
        return {
            name: s.name || 'Unnamed Suite',
            description: s.description || '',
            tags: s.tags || [],
            testCases: s.testCases || []
        };
    }

    /**
     * 格式化套件结果
     */
    formatSuiteResult(result, options = {}) {
        const formattedResult = {
            testName: result.testName || result.name || 'test',
            description: result.description || '',
            status: result.status || 'unknown',
            steps: result.steps || 0,
            duration: result.duration || 0,
            features: result.features || '',
            tags: result.tags || [],
            validations: result.validations || '',
            sessionOptimized: result.sessionOptimized || false,
            error: result.error || null
        };
        
        // 只在详细模式下包含详细步骤
        const reportStyle = options.reportStyle || options.environment?.REPORT_STYLE || 'overview';
        if (reportStyle === 'detailed') {
            formattedResult.steps_detail = result.steps_detail || result.stepsDetail || [];
        }
        
        return formattedResult;
    }

    /**
     * 创建配置对象
     */
    createConfig(options) {
        const opts = options || {};
        return {
            environment: opts.environment || 'dev',
            reportStyle: opts.reportStyle || 'overview',
            reportFormat: opts.reportFormat || 'html',
            reportPath: opts.reportPath || `reports/${opts.environment || 'dev'}`,
            screenshotPath: opts.screenshotPath || `screenshots/${opts.environment || 'dev'}`,
            ...(opts.config || {})
        };
    }

    /**
     * 创建环境变量对象
     */
    createEnvironment(options) {
        const opts = options || {};
        const defaultEnv = {
            BASE_URL: 'https://www.saucedemo.com/',
            TEST_USERNAME: 'standard_user',
            TEST_PASSWORD: 'secret_sauce',
            BROWSER_TIMEOUT: '45000',
            GENERATE_REPORT: 'true',
            REPORT_STYLE: opts.reportStyle || 'overview',
            REPORT_FORMAT: opts.reportFormat || 'html'
        };

        return {
            ...defaultEnv,
            ...(opts.environment && typeof opts.environment === 'object' ? opts.environment : {})
        };
    }

    /**
     * 解析数据文件路径，优先使用REPORT_PATH环境变量
     */
    resolveDataFilePath(filePath, options = {}) {
        // 如果已经是绝对路径，直接使用
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        
        // 从环境变量或选项中获取REPORT_PATH
        const reportPath = options.reportPath || 
                          process.env.REPORT_PATH || 
                          (options.environment && options.environment.REPORT_PATH) ||
                          `reports/${options.environment || 'dev'}`;
        
        // 确保REPORT_PATH存在
        const fullReportPath = path.isAbsolute(reportPath) ? reportPath : path.join(this.projectRoot, reportPath);
        
        return path.join(fullReportPath, filePath);
    }

    /**
     * 保存数据到JSON文件
     */
    saveDataFile(data, filePath) {
        try {
            // 支持相对路径和绝对路径
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
            
            // 确保目录存在
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // 格式化JSON并写入文件
            const jsonContent = JSON.stringify(data, null, 2);
            fs.writeFileSync(fullPath, jsonContent, 'utf8');
            
            console.log(`Report data saved to: ${fullPath}`);
            return fullPath;
        } catch (error) {
            throw new Error(`Failed to save data file: ${error.message}`);
        }
    }

    /**
     * 从执行结果快速创建单个测试数据
     */
    quickCreateTestData(testName, status, duration, options = {}) {
        const testCase = {
            name: testName,
            description: options.description || `Test case: ${testName}`,
            tags: options.tags || ['test'],
            steps: options.steps || ['Execute test steps']
        };

        const execution = {
            status: status,
            duration: duration,
            testName: testName,
            validations: options.validations || [],
            sessionOptimized: options.sessionOptimized || false
        };

        return this.createTestCaseData(testCase, execution, options);
    }

    /**
     * 从执行结果快速创建套件数据
     */
    quickCreateSuiteData(suiteName, testResults, options = {}) {
        const suite = {
            name: suiteName,
            description: options.description || `Test suite: ${suiteName}`,
            tags: options.tags || ['suite'],
            testCases: testResults.map(tr => ({
                name: tr.testName || tr.name,
                tags: tr.tags || []
            }))
        };

        return this.createSuiteData(suite, testResults, options);
    }
}

/**
 * 便捷函数 - 创建并保存测试数据
 * 自动处理REPORT_PATH环境变量，将数据文件保存到正确位置
 */
function createAndSaveTestData(testCaseInfo, executionInfo, filePath, options = {}) {
    const creator = new ReportDataCreator();
    const data = creator.createTestCaseData(testCaseInfo, executionInfo, options);
    const finalPath = creator.resolveDataFilePath(filePath, options);
    return creator.saveDataFile(data, finalPath);
}

/**
 * 便捷函数 - 创建并保存批量测试数据
 * 自动处理REPORT_PATH环境变量，将数据文件保存到正确位置
 */
function createAndSaveBatchData(testCases, executionInfo, filePath, options = {}) {
    const creator = new ReportDataCreator();
    const data = creator.createBatchTestData(testCases, executionInfo, options);
    const finalPath = creator.resolveDataFilePath(filePath, options);
    return creator.saveDataFile(data, finalPath);
}

/**
 * 便捷函数 - 创建并保存套件数据
 * 自动处理REPORT_PATH环境变量，将数据文件保存到正确位置
 */
function createAndSaveSuiteData(suiteInfo, resultsInfo, filePath, options = {}) {
    const creator = new ReportDataCreator();
    const data = creator.createSuiteData(suiteInfo, resultsInfo, options);
    const finalPath = creator.resolveDataFilePath(filePath, options);
    return creator.saveDataFile(data, finalPath);
}

/**
 * 便捷函数 - 快速创建单个测试数据
 * 自动处理REPORT_PATH环境变量，将数据文件保存到正确位置
 */
function quickCreateTestData(testName, status, duration, filePath, options = {}) {
    const creator = new ReportDataCreator();
    const data = creator.quickCreateTestData(testName, status, duration, options);
    
    // 解析环境变量并确定正确的文件路径
    const finalPath = creator.resolveDataFilePath(filePath, options);
    return creator.saveDataFile(data, finalPath);
}

/**
 * 便捷函数 - 快速创建套件数据
 * 自动处理REPORT_PATH环境变量，将数据文件保存到正确位置
 */
function quickCreateSuiteData(suiteName, testResults, filePath, options = {}) {
    const creator = new ReportDataCreator();
    const data = creator.quickCreateSuiteData(suiteName, testResults, options);
    const finalPath = creator.resolveDataFilePath(filePath, options);
    return creator.saveDataFile(data, finalPath);
}

// 命令行执行示例
if (require.main === module) {
    const creator = new ReportDataCreator();
    
    console.log('Report Data Creator');
    console.log('==================');
    console.log('This tool helps create standardized data.json files for report generation.');
    console.log('');
    console.log('Usage examples:');
    console.log('');
    console.log('1. Create test case data:');
    console.log('   const data = creator.createTestCaseData(testCase, execution, options);');
    console.log('   creator.saveDataFile(data, "test-data.json");');
    console.log('');
    console.log('2. Create suite data:');
    console.log('   const data = creator.createSuiteData(suite, results, options);');
    console.log('   creator.saveDataFile(data, "suite-data.json");');
    console.log('');
    console.log('3. Quick create test data:');
    console.log('   quickCreateTestData("test.yml", "passed", 30000, "quick-test.json");');
    console.log('');
    console.log('See data-examples/ directory for sample data files.');
}

module.exports = {
    ReportDataCreator,
    createAndSaveTestData,
    createAndSaveBatchData,
    createAndSaveSuiteData,
    quickCreateTestData,
    quickCreateSuiteData
};