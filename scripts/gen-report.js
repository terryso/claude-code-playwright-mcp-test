#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 基于JSON数据文件的报告生成器
 * 使用方式: node gen-report.js --data=/path/to/data.json
 */
class JSONReportGenerator {
    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * 解析命令行参数
     */
    parseArguments() {
        const args = process.argv.slice(2);
        
        for (const arg of args) {
            if (arg.startsWith('--data=')) {
                return arg.split('=')[1];
            }
            if (arg === '--data' && args[args.indexOf(arg) + 1]) {
                return args[args.indexOf(arg) + 1];
            }
        }
        
        return null;
    }

    /**
     * 智能解析数据文件路径，支持环境变量路径
     */
    resolveDataFilePath(filePath) {
        // 如果已经是绝对路径，直接使用
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        
        // 首先尝试从项目根目录查找
        const rootPath = path.join(this.projectRoot, filePath);
        if (fs.existsSync(rootPath)) {
            return rootPath;
        }
        
        // 然后尝试从REPORT_PATH环境变量查找
        const reportPath = process.env.REPORT_PATH || 'reports/dev';
        const envPath = path.isAbsolute(reportPath) ? 
            path.join(reportPath, filePath) : 
            path.join(this.projectRoot, reportPath, filePath);
        
        if (fs.existsSync(envPath)) {
            return envPath;
        }
        
        // 最后尝试在reports目录下的各个环境子目录中查找
        const environments = ['dev', 'test', 'prod'];
        for (const env of environments) {
            const envDirPath = path.join(this.projectRoot, 'reports', env, filePath);
            if (fs.existsSync(envDirPath)) {
                return envDirPath;
            }
        }
        
        // 如果都找不到，返回原始路径用于错误报告
        return rootPath;
    }

    /**
     * 读取JSON数据文件
     */
    readDataFile(dataPath) {
        try {
            const fullPath = this.resolveDataFilePath(dataPath);
            
            if (!fs.existsSync(fullPath)) {
                throw new Error(`Data file not found: ${fullPath}`);
            }
            
            const content = fs.readFileSync(fullPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to read data file: ${error.message}`);
        }
    }

    /**
     * 验证数据格式
     */
    validateData(data) {
        const required = ['reportType', 'reportData'];
        const missing = required.filter(field => !data.hasOwnProperty(field));
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields in data: ${missing.join(', ')}`);
        }
        
        if (!['test', 'suite'].includes(data.reportType)) {
            throw new Error(`Invalid reportType: ${data.reportType}. Must be 'test' or 'suite'`);
        }
    }

    /**
     * 生成报告
     */
    async generateReport(data) {
        this.validateData(data);
        
        const {
            reportType,
            reportData,
            config = {},
            environment = {}
        } = data;
        
        // 应用环境变量
        this.applyEnvironment(environment);
        
        // 获取配置
        const reportConfig = {
            environment: config.environment || 'dev',
            reportStyle: config.reportStyle || 'overview',
            reportFormat: config.reportFormat || 'html',
            reportPath: config.reportPath || 
                       environment.REPORT_PATH || 
                       process.env.REPORT_PATH || 
                       `reports/${config.environment || environment.environment || 'dev'}`,
            ...config
        };
        
        // 生成时间戳
        const timestamp = this.generateTimestamp();
        
        try {
            let result;
            if (reportType === 'suite') {
                result = this.generateSuiteReport(reportData, reportConfig, timestamp);
            } else {
                result = this.generateTestReport(reportData, reportConfig, timestamp);
            }
            
            console.log(`Report generated successfully: ${result.reportPath}`);
            return result;
        } catch (error) {
            console.error(`Failed to generate report: ${error.message}`);
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }

    /**
     * 应用环境变量
     */
    applyEnvironment(environment) {
        if (environment && typeof environment === 'object') {
            Object.keys(environment).forEach(key => {
                process.env[key] = environment[key];
            });
        }
    }

    /**
     * 生成测试报告
     */
    generateTestReport(reportData, config, timestamp) {
        const { testCase, execution } = reportData;
        
        // 处理单个或多个测试用例
        const isMultiple = Array.isArray(testCase);
        const reportName = isMultiple ? 
            `batch-${timestamp}` : 
            (testCase.name || 'unnamed-test').replace('.yml', '');
        
        const fileName = `test-${reportName}-${timestamp}.html`;
        const fullPath = path.join(this.projectRoot, config.reportPath, fileName);

        // 确保目录存在
        this.ensureDirectory(path.dirname(fullPath));

        // 生成报告内容
        let reportContent;
        if (isMultiple) {
            reportContent = this.generateBatchTestReportContent(testCase, execution, config, timestamp);
        } else {
            reportContent = this.generateSingleTestReportContent(testCase, execution, config, timestamp);
        }

        // 写入文件
        fs.writeFileSync(fullPath, reportContent, 'utf8');

        // 创建最新报告链接
        this.createLatestLink(fullPath, 'latest-test-report.html');

        return {
            reportPath: fullPath,
            fileName: fileName,
            latestLink: path.join(path.dirname(fullPath), 'latest-test-report.html')
        };
    }

    /**
     * 生成测试套件报告
     */
    generateSuiteReport(reportData, config, timestamp) {
        const { suite, results } = reportData;
        
        const suiteName = (suite.name || 'unnamed-suite')
            .replace('.yml', '')
            .replace(/\s+/g, '-')  // 替换空格为连字符
            .toLowerCase();  // 转换为小写
        const fileName = `suite-${suiteName}-${timestamp}.html`;
        const fullPath = path.join(this.projectRoot, config.reportPath, fileName);

        // 确保目录存在
        this.ensureDirectory(path.dirname(fullPath));

        // 生成报告内容
        const reportContent = this.generateSuiteReportContent(suite, results, config, timestamp);

        // 写入文件
        fs.writeFileSync(fullPath, reportContent, 'utf8');

        // 创建最新报告链接
        this.createLatestLink(fullPath, 'latest-suite-report.html');

        return {
            reportPath: fullPath,
            fileName: fileName,
            latestLink: path.join(path.dirname(fullPath), 'latest-suite-report.html')
        };
    }

    /**
     * 生成单个测试用例报告内容
     */
    generateSingleTestReportContent(testCase, execution, config, timestamp) {
        testCase = testCase || {};
        execution = execution || {};
        
        const status = execution.status || 'unknown';
        const stepCount = testCase.steps ? testCase.steps.length : 0;
        const duration = execution.duration || 0;
        const tags = testCase.tags || [];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${testCase.name || 'Unnamed Test'}</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, ${this.getStatusColor(status)});">
            <h1>
                <span class="icon">${this.getStatusIcon(status)}</span>
                Test Case Report
            </h1>
            <div class="subtitle">Test: ${testCase.name || 'Unnamed Test'} | Environment: ${config.environment} | Generated: ${timestamp}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Status</h3>
                <div class="stat-number">${this.getStatusIcon(status)}</div>
                <div class="stat-label">
                    <span class="status-badge status-${status}">${status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>📝 Steps</h3>
                <div class="stat-number">${stepCount}</div>
                <div class="stat-label">Total Steps</div>
            </div>
            
            <div class="stat-card">
                <h3>⏱️ Duration</h3>
                <div class="stat-number">${Math.round(duration / 1000 * 100) / 100}</div>
                <div class="stat-label">Seconds</div>
            </div>
            
            <div class="stat-card">
                <h3>🏷️ Tags</h3>
                <div class="stat-number">${tags.length}</div>
                <div class="stat-label">Test Tags</div>
            </div>
        </div>

        <div class="test-info">
            <h2>📋 Test Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <h4>Test Name</h4>
                    <p>${testCase.name || 'Unnamed Test'}</p>
                </div>
                <div class="info-item">
                    <h4>Description</h4>
                    <p>${testCase.description || 'No description'}</p>
                </div>
                <div class="info-item">
                    <h4>Tags</h4>
                    <div>
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="info-item">
                    <h4>Environment</h4>
                    <p>${config.environment}</p>
                </div>
            </div>
        </div>

        ${config.reportStyle === 'detailed' ? this.generateDetailedSteps(testCase.steps || []) : ''}

        <div class="footer">
            <strong>Generated by Claude Code Playwright MCP Test Framework</strong><br>
            Test: ${testCase.name || 'Unnamed Test'} | Environment: ${config.environment}<br>
            Generated on ${timestamp}
        </div>
    </div>

    <script>
        // 嵌入完整测试数据
        window.reportData = ${JSON.stringify({
            testCase: testCase,
            execution: execution,
            config: config,
            timestamp: timestamp
        })};
    </script>
</body>
</html>`;
    }

    /**
     * 生成批量测试报告内容
     */
    generateBatchTestReportContent(testCases, execution, config, timestamp) {
        const testResults = execution.testResults || [];
        const totalTests = testCases.length;
        const passedTests = testResults.filter(r => r.status === 'passed').length;
        const failedTests = testResults.filter(r => r.status === 'failed').length;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const status = failedTests > 0 ? 'failed' : 'passed';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Batch Test Report - ${execution.name || 'Test Execution'}</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, ${this.getStatusColor(status)});">
            <h1>
                <span class="icon">${this.getStatusIcon(status)}</span>
                Batch Test Report
            </h1>
            <div class="subtitle">Environment: ${config.environment} | Tests: ${totalTests} | Success: ${successRate}% | Generated: ${timestamp}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Overall</h3>
                <div class="stat-number">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            
            <div class="stat-card">
                <h3>✅ Passed</h3>
                <div class="stat-number">${passedTests}</div>
                <div class="stat-label">out of ${totalTests}</div>
            </div>
            
            <div class="stat-card">
                <h3>❌ Failed</h3>
                <div class="stat-number">${failedTests}</div>
                <div class="stat-label">out of ${totalTests}</div>
            </div>
            
            <div class="stat-card">
                <h3>⏱️ Duration</h3>
                <div class="stat-number">${Math.round((execution.duration || 0) / 1000)}</div>
                <div class="stat-label">Seconds</div>
            </div>
        </div>

        <div class="test-cases">
            <h2>📋 Test Cases</h2>
            <div class="tests-grid">
                ${testCases.map((testCase, index) => {
                    const result = testResults[index] || { status: 'unknown' };
                    const status = result.status || 'unknown';
                    return `
                    <div class="test-card">
                        <h4>
                            ${this.getStatusIcon(status)}
                            ${testCase.name || `Test ${index + 1}`}
                            <span class="test-status status-${status}">${status.toUpperCase()}</span>
                        </h4>
                        <p>${testCase.description || 'No description'}</p>
                        <div class="tags">
                            ${(testCase.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="result-meta">
                            <span>Duration: ${Math.round((result.duration || 0) / 1000)}s</span>
                            ${result.sessionOptimized ? '<span>🚀 Session Optimized</span>' : ''}
                        </div>
                        ${result.validations ? `<div class="validations"><strong>Validations:</strong> ${Array.isArray(result.validations) ? result.validations.join(', ') : result.validations}</div>` : ''}
                        ${result.error ? `<div class="error-info"><strong>Error:</strong> ${result.error}</div>` : ''}
                        ${config.reportStyle === 'detailed' && result.steps_detail ? this.generateTestStepsDetail(result.steps_detail) : ''}
                    </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="footer">
            <strong>Generated by Claude Code Playwright MCP Test Framework</strong><br>
            Environment: ${config.environment} | Generated on ${timestamp}
        </div>
    </div>

    <script>
        // 嵌入完整测试数据
        window.reportData = ${JSON.stringify({
            testCases: testCases,
            execution: execution,
            config: config,
            timestamp: timestamp
        })};
    </script>
</body>
</html>`;
    }

    /**
     * 生成测试套件报告内容
     */
    generateSuiteReportContent(suite, results, config, timestamp) {
        const totalTests = results.length;
        const passedTests = results.filter(r => r.status === 'passed').length;
        const failedTests = results.filter(r => r.status === 'failed').length;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const status = failedTests > 0 ? 'failed' : 'passed';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suite Report - ${suite.name || 'Test Suite'}</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, ${this.getStatusColor(status)});">
            <h1>
                <span class="icon">${this.getStatusIcon(status)}</span>
                Test Suite Report
            </h1>
            <div class="subtitle">Suite: ${suite.name} | Environment: ${config.environment} | Generated: ${timestamp}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Suite Status</h3>
                <div class="stat-number">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            
            <div class="stat-card">
                <h3>✅ Passed</h3>
                <div class="stat-number">${passedTests}</div>
                <div class="stat-label">Test Cases</div>
            </div>
            
            <div class="stat-card">
                <h3>❌ Failed</h3>
                <div class="stat-number">${failedTests}</div>
                <div class="stat-label">Test Cases</div>
            </div>
            
            <div class="stat-card">
                <h3>📝 Total</h3>
                <div class="stat-number">${totalTests}</div>
                <div class="stat-label">Test Cases</div>
            </div>
        </div>

        <div class="suite-info">
            <h2>📋 Suite Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <h4>Suite Name</h4>
                    <p>${suite.name || 'Unnamed Suite'}</p>
                </div>
                <div class="info-item">
                    <h4>Description</h4>
                    <p>${suite.description || 'No description'}</p>
                </div>
                <div class="info-item">
                    <h4>Environment</h4>
                    <p>${config.environment}</p>
                </div>
                <div class="info-item">
                    <h4>Total Tests</h4>
                    <p>${totalTests}</p>
                </div>
            </div>
        </div>

        <div class="test-results">
            <h2>📊 Test Results</h2>
            <div class="results-grid">
                ${results.map(result => `
                <div class="result-card ${result.status}">
                    <div class="result-header">
                        <h4>${this.getStatusIcon(result.status)} ${result.testName}</h4>
                        <span class="test-status status-${result.status}">${result.status.toUpperCase()}</span>
                    </div>
                    <p>${result.description || 'No description'}</p>
                    <div class="result-meta">
                        <span>Steps: ${result.steps || 0}</span>
                        <span>Duration: ${Math.round((result.duration || 0) / 1000)}s</span>
                        ${result.features ? `<span>Features: ${result.features}</span>` : ''}
                        ${result.sessionOptimized ? '<span>🚀 Session Optimized</span>' : ''}
                    </div>
                    ${result.validations ? `<div class="validations"><strong>Validations:</strong> ${result.validations}</div>` : ''}
                    ${result.error ? `<div class="error-info"><strong>Error:</strong> ${result.error}</div>` : ''}
                    ${config.reportStyle === 'detailed' && result.steps_detail ? this.generateTestStepsDetail(result.steps_detail) : ''}
                </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <strong>Generated by Claude Code Playwright MCP Test Framework</strong><br>
            Suite: ${suite.name} | Environment: ${config.environment}<br>
            Generated on ${timestamp}
        </div>
    </div>

    <script>
        // 嵌入完整测试数据
        window.reportData = ${JSON.stringify({
            suite: suite,
            results: results,
            config: config,
            timestamp: timestamp
        })};
    </script>
</body>
</html>`;
    }

    /**
     * 生成详细步骤内容
     */
    generateDetailedSteps(steps) {
        return `
        <div class="steps-detail">
            <h2>📝 Detailed Steps</h2>
            ${steps.map((step, index) => `
            <div class="step-item">
                <span class="step-number">${index + 1}</span>
                <span class="step-text">${typeof step === 'string' ? step : step.action || 'Unknown step'}</span>
            </div>
            `).join('')}
        </div>`;
    }

    /**
     * 生成测试步骤详细内容（用于套件报告中的单个测试）
     */
    generateTestStepsDetail(steps) {
        if (!steps || steps.length === 0) return '';
        
        return `
        <div class="test-steps-detail">
            <h5>📝 Test Steps:</h5>
            <div class="steps-list">
                ${steps.map((step, index) => `
                <div class="mini-step-item">
                    <span class="mini-step-number">${index + 1}</span>
                    <span class="mini-step-text">${typeof step === 'string' ? step : step.action || 'Unknown step'}</span>
                </div>
                `).join('')}
            </div>
        </div>`;
    }

    /**
     * 获取报告CSS样式
     */
    getReportCSS() {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header h1 { font-size: 2.2em; margin-bottom: 10px; display: flex; align-items: center; gap: 15px; }
        .header .subtitle { font-size: 1.1em; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #28a745; }
        .stat-card h3 { color: #495057; margin-bottom: 10px; font-size: 1em; }
        .stat-number { font-size: 2em; font-weight: bold; color: #28a745; margin-bottom: 5px; }
        .stat-label { color: #6c757d; font-size: 0.9em; }
        .test-info, .suite-info, .test-cases, .test-results, .steps-detail { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .info-grid, .tests-grid, .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
        .info-item { padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #007bff; }
        .info-item h4 { color: #495057; margin-bottom: 8px; }
        .info-item p { color: #6c757d; line-height: 1.4; }
        .test-card, .result-card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; }
        .test-card.passed, .result-card.passed { border-left: 4px solid #28a745; }
        .test-card.failed, .result-card.failed { border-left: 4px solid #dc3545; }
        .test-status { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-unknown { background: #e2e3e5; color: #6c757d; }
        .tag { background: #007bff; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.7em; margin: 2px; display: inline-block; }
        .step-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; background: #f8f9fa; }
        .step-number { background: #28a745; color: white; padding: 4px 8px; border-radius: 50%; font-size: 0.8em; font-weight: bold; }
        .step-text { font-weight: 500; color: #495057; }
        .footer { text-align: center; color: #6c757d; margin-top: 40px; padding: 20px; background: white; border-radius: 12px; }
        .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .result-meta { display: flex; gap: 15px; color: #6c757d; font-size: 0.9em; margin-top: 10px; flex-wrap: wrap; }
        .validations { margin-top: 10px; padding: 8px; background: #d4edda; border-radius: 6px; font-size: 0.9em; color: #155724; }
        .error-info { margin-top: 10px; padding: 8px; background: #f8d7da; border-radius: 6px; font-size: 0.9em; color: #721c24; }
        .test-steps-detail { margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #007bff; }
        .test-steps-detail h5 { color: #495057; margin-bottom: 10px; font-size: 0.95em; }
        .steps-list { max-height: 200px; overflow-y: auto; }
        .mini-step-item { display: flex; align-items: center; gap: 8px; padding: 6px; margin-bottom: 4px; background: white; border-radius: 4px; font-size: 0.85em; }
        .mini-step-number { background: #007bff; color: white; padding: 2px 6px; border-radius: 50%; font-size: 0.75em; font-weight: bold; min-width: 20px; text-align: center; }
        .mini-step-text { color: #495057; flex: 1; }
        `;
    }

    /**
     * 获取状态图标
     */
    getStatusIcon(status) {
        switch (status) {
            case 'passed': return '✅';
            case 'failed': return '❌';
            case 'skipped': return '⏭️';
            case 'pending': return '⏳';
            default: return '❓';
        }
    }

    /**
     * 获取状态颜色
     */
    getStatusColor(status) {
        switch (status) {
            case 'passed': return '#28a745, #20c997';
            case 'failed': return '#dc3545, #e74c3c';
            default: return '#6c757d, #8d9498';
        }
    }

    /**
     * 生成时间戳
     */
    generateTimestamp() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0') + '-' + 
               String(now.getHours()).padStart(2, '0') + '-' + 
               String(now.getMinutes()).padStart(2, '0') + '-' + 
               String(now.getSeconds()).padStart(2, '0') + '-' + 
               String(now.getMilliseconds()).padStart(3, '0');
    }

    /**
     * 确保目录存在
     */
    ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * 创建最新报告链接
     */
    createLatestLink(fullPath, linkName) {
        const dir = path.dirname(fullPath);
        const fileName = path.basename(fullPath);
        const latestLink = path.join(dir, linkName);
        
        if (fs.existsSync(latestLink)) {
            fs.unlinkSync(latestLink);
        }
        
        try {
            fs.symlinkSync(fileName, latestLink);
        } catch (error) {
            // 在某些系统上符号链接可能失败，创建重定向文件
            const redirectContent = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=${fileName}">
    <title>Redirecting...</title>
</head>
<body>
    <p>Redirecting to <a href="${fileName}">latest report</a>...</p>
</body>
</html>`;
            fs.writeFileSync(latestLink, redirectContent, 'utf8');
        }
    }
}

// 主执行逻辑
async function main() {
    const generator = new JSONReportGenerator();
    
    try {
        // 解析命令行参数
        const dataPath = generator.parseArguments();
        
        if (!dataPath) {
            console.error('Usage: node gen-report.js --data=/path/to/data.json');
            console.error('');
            console.error('Examples:');
            console.error('  node gen-report.js --data=test-data.json');
            console.error('  node gen-report.js --data=/absolute/path/to/data.json');
            console.error('  node gen-report.js --data ./reports/data.json');
            process.exit(1);
        }
        
        // 读取数据文件
        console.log(`Reading data from: ${dataPath}`);
        const data = generator.readDataFile(dataPath);
        
        // 生成报告
        console.log(`Generating ${data.reportType} report...`);
        const result = await generator.generateReport(data);
        
        console.log('Report generation completed successfully!');
        console.log(`Output: ${result.reportPath}`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = JSONReportGenerator;