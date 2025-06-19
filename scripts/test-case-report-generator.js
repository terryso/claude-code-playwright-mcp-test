#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Test Case Report Generator
 * 生成单个测试用例的标准化报告，支持 overview 和 detailed 两种样式
 */
class TestCaseReportGenerator {
    constructor(options = {}) {
        this.environment = options.environment || 'dev';
        this.reportStyle = options.reportStyle || 'overview';
        this.reportFormat = options.reportFormat || 'html';
        this.projectRoot = options.projectRoot || process.cwd();
        this.reportPath = options.reportPath || `reports/${this.environment}`;
    }

    /**
     * 生成测试用例报告
     * @param {Object|Array} testCaseData - 单个测试用例数据或测试用例数组
     * @param {Object} executionResult - 执行结果
     * @returns {Object} 报告生成结果
     */
    generateTestCaseReport(testCaseData, executionResult) {
        const now = new Date();
        const timestamp = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0') + '-' + 
                         String(now.getHours()).padStart(2, '0') + '-' + 
                         String(now.getMinutes()).padStart(2, '0') + '-' + 
                         String(now.getSeconds()).padStart(2, '0') + '-' + 
                         String(now.getMilliseconds()).padStart(3, '0');
        
        // 处理多个测试用例的情况
        if (Array.isArray(testCaseData)) {
            return this.generateBatchReport(testCaseData, executionResult, timestamp);
        }
        
        // 处理单个测试用例
        const testName = (testCaseData.name || 'unnamed-test').replace('.yml', '');
        const fileName = `test-${testName}-${timestamp}.html`;
        const fullPath = path.join(this.projectRoot, this.reportPath, fileName);

        // 确保目录存在
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let reportContent;
        if (this.reportStyle === 'overview') {
            reportContent = this.generateOverviewReport(testCaseData, executionResult, timestamp);
        } else {
            reportContent = this.generateDetailedReport(testCaseData, executionResult, timestamp);
        }

        fs.writeFileSync(fullPath, reportContent, 'utf8');

        // 创建最新报告链接
        const latestLink = path.join(dir, 'latest-test-report.html');
        if (fs.existsSync(latestLink)) {
            fs.unlinkSync(latestLink);
        }
        fs.symlinkSync(fileName, latestLink);

        return {
            reportPath: fullPath,
            fileName: fileName,
            latestLink: latestLink
        };
    }

    /**
     * 生成批量测试报告（针对一次测试执行）
     * @param {Array} testCases - 测试用例数组
     * @param {Object} executionResult - 执行结果
     * @param {string} timestamp - 时间戳
     * @returns {Object} 报告生成结果
     */
    generateBatchReport(testCases, executionResult, timestamp) {
        const reportName = executionResult.name || `execution-${timestamp}`;
        const fileName = `test-${reportName}-${timestamp}.html`;
        const fullPath = path.join(this.projectRoot, this.reportPath, fileName);

        // 确保目录存在
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let reportContent;
        if (this.reportStyle === 'overview') {
            reportContent = this.generateBatchOverviewReport(testCases, executionResult, timestamp);
        } else {
            reportContent = this.generateBatchDetailedReport(testCases, executionResult, timestamp);
        }

        fs.writeFileSync(fullPath, reportContent, 'utf8');

        // 创建最新报告链接
        const latestLink = path.join(dir, 'latest-test-report.html');
        if (fs.existsSync(latestLink)) {
            fs.unlinkSync(latestLink);
        }
        fs.symlinkSync(fileName, latestLink);

        return {
            reportPath: fullPath,
            fileName: fileName,
            latestLink: latestLink,
            testCount: testCases.length
        };
    }

    /**
     * 生成概览样式报告（不包含详细步骤）
     */
    generateOverviewReport(testCaseData, executionResult, timestamp) {
        const status = executionResult ? executionResult.status : 'unknown';
        const stepCount = testCaseData.steps ? testCaseData.steps.length : 0;
        const duration = executionResult ? executionResult.duration : 0;
        const tags = testCaseData.tags || [];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Case Report - ${testCaseData.name || 'Unnamed Test'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${status === 'passed' ? '#28a745, #20c997' : status === 'failed' ? '#dc3545, #e74c3c' : '#6c757d, #8d9498'}); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header h1 { font-size: 2.2em; margin-bottom: 10px; display: flex; align-items: center; gap: 15px; }
        .header .subtitle { font-size: 1.1em; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid ${status === 'passed' ? '#28a745' : status === 'failed' ? '#dc3545' : '#6c757d'}; }
        .stat-card h3 { color: #495057; margin-bottom: 10px; font-size: 1em; }
        .stat-number { font-size: 2em; font-weight: bold; color: ${status === 'passed' ? '#28a745' : status === 'failed' ? '#dc3545' : '#6c757d'}; margin-bottom: 5px; }
        .stat-label { color: #6c757d; font-size: 0.9em; }
        .test-info { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
        .info-item { padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #007bff; }
        .info-item h4 { color: #495057; margin-bottom: 8px; }
        .info-item p { color: #6c757d; line-height: 1.4; }
        .tag { background: #007bff; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75em; margin: 2px; display: inline-block; }
        .status-badge { padding: 8px 16px; border-radius: 20px; font-size: 0.9em; font-weight: 600; display: inline-block; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-unknown { background: #e2e3e5; color: #6c757d; }
        .steps-summary { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .step-count { font-size: 3em; font-weight: bold; color: #17a2b8; text-align: center; margin-bottom: 10px; }
        .error-section { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .error-title { color: #721c24; font-weight: 600; margin-bottom: 10px; }
        .error-message { color: #721c24; font-family: monospace; font-size: 0.9em; }
        .footer { text-align: center; color: #6c757d; margin-top: 40px; padding: 20px; background: white; border-radius: 12px; }
        .icon { font-size: 1.2em; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <span class="icon">${this.getStatusIcon(status)}</span>
                Test Case Report
            </h1>
            <div class="subtitle">Test: ${testCaseData.name || 'Unnamed Test'} | Environment: ${this.environment} | Style: ${this.reportStyle} | Generated: ${timestamp}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Execution Status</h3>
                <div class="stat-number">${this.getStatusIcon(status)}</div>
                <div class="stat-label">
                    <span class="status-badge status-${status}">${status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="stat-card">
                <h3>📝 Steps Count</h3>
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
            <h2 style="margin-bottom: 20px;">📋 Test Case Information</h2>
            
            <div class="info-grid">
                <div class="info-item">
                    <h4>Test Name</h4>
                    <p>${testCaseData.name || 'Unnamed Test'}</p>
                </div>
                
                <div class="info-item">
                    <h4>Description</h4>
                    <p>${testCaseData.description || 'No description provided'}</p>
                </div>
                
                <div class="info-item">
                    <h4>Tags</h4>
                    <div>
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        ${tags.length === 0 ? '<span style="color: #6c757d;">No tags</span>' : ''}
                    </div>
                </div>
                
                <div class="info-item">
                    <h4>Environment</h4>
                    <p>${this.environment}</p>
                </div>
            </div>
        </div>

        ${status === 'failed' && executionResult && executionResult.error ? `
        <div class="error-section">
            <div class="error-title">❌ Error Details</div>
            <div class="error-message">${executionResult.error}</div>
        </div>
        ` : ''}

        <div class="steps-summary">
            <h2 style="margin-bottom: 20px; text-align: center;">📝 Steps Summary</h2>
            <div class="step-count">${stepCount}</div>
            <p style="text-align: center; color: #6c757d;">
                ${stepCount === 0 ? 'No steps defined' : 
                  stepCount === 1 ? '1 step executed' : 
                  `${stepCount} steps executed`}
            </p>
            ${this.reportStyle === 'overview' ? `
            <p style="text-align: center; color: #6c757d; margin-top: 15px; font-style: italic;">
                💡 Switch to detailed report style to view individual steps
            </p>
            ` : ''}
        </div>

        <div class="footer">
            <strong>Generated by Claude Code Playwright MCP Test Framework</strong><br>
            Test: ${testCaseData.name || 'Unnamed Test'} | Environment: ${this.environment} | Report Style: ${this.reportStyle}<br>
            Execution completed on ${timestamp}
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * 生成详细样式报告（包含详细步骤）
     */
    generateDetailedReport(testCaseData, executionResult, timestamp) {
        const baseReport = this.generateOverviewReport(testCaseData, executionResult, timestamp);
        const steps = testCaseData.steps || [];
        
        // 在步骤摘要部分插入详细步骤
        const stepDetailsHtml = `
        <div class="steps-detail" style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h2 style="margin-bottom: 20px;">📝 Detailed Steps</h2>
            ${steps.length === 0 ? '<p style="color: #6c757d; text-align: center;">No steps defined</p>' : 
              steps.map((step, index) => `
                <div style="border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 10px; padding: 15px; background: ${executionResult && executionResult.failedStepIndex === index ? '#f8d7da' : '#f8f9fa'};">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="background: ${executionResult && executionResult.failedStepIndex === index ? '#dc3545' : '#28a745'}; color: white; padding: 4px 8px; border-radius: 50%; font-size: 0.8em; font-weight: bold;">${index + 1}</span>
                        <span style="font-weight: 600; color: #495057;">${typeof step === 'string' ? step : step.action || 'Unknown step'}</span>
                    </div>
                    ${typeof step === 'object' && step.description ? `
                    <div style="color: #6c757d; font-size: 0.9em; margin-left: 30px;">
                        ${step.description}
                    </div>
                    ` : ''}
                </div>
              `).join('')
            }
        </div>`;

        return baseReport
            .replace('Style: overview', 'Style: detailed')
            .replace('<div class="steps-summary">', stepDetailsHtml + '<div class="steps-summary">')
            .replace('💡 Switch to detailed report style to view individual steps', '✅ Showing detailed step information');
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
     * 生成批量测试概览报告
     */
    generateBatchOverviewReport(testCases, executionResult, timestamp) {
        const totalTests = testCases.length;
        
        // 从 testResults 数组计算统计数据
        const testResults = executionResult.testResults || [];
        const passedTests = testResults.filter(result => result.status === 'passed').length;
        const failedTests = testResults.filter(result => result.status === 'failed').length;
        const skippedTests = testResults.filter(result => result.status === 'skipped').length;
        
        // 计算总步骤数
        const totalSteps = testResults.reduce((sum, result) => {
            if (result.steps && Array.isArray(result.steps)) {
                return sum + result.steps.length;
            }
            return sum;
        }, 0);
        
        // 计算总持续时间
        const totalDurationMs = testResults.reduce((sum, result) => {
            return sum + (typeof result.duration === 'number' ? result.duration : 0);
        }, 0);
        const totalDuration = Math.round(totalDurationMs / 1000 * 100) / 100 + 's';
        
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const status = failedTests > 0 ? 'failed' : (passedTests > 0 ? 'passed' : 'unknown');
        const reportName = executionResult.name || 'Test Execution';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${reportName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${status === 'passed' ? '#28a745, #20c997' : '#dc3545, #e74c3c'}); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header h1 { font-size: 2.2em; margin-bottom: 10px; display: flex; align-items: center; gap: 15px; }
        .header .subtitle { font-size: 1.1em; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid ${status === 'passed' ? '#28a745' : '#dc3545'}; }
        .stat-card h3 { color: #495057; margin-bottom: 10px; font-size: 1em; }
        .stat-number { font-size: 2em; font-weight: bold; color: ${status === 'passed' ? '#28a745' : '#dc3545'}; margin-bottom: 5px; }
        .stat-label { color: #6c757d; font-size: 0.9em; }
        .tests-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .test-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .test-card h4 { margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
        .test-status { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-skipped { background: #e2e3e5; color: #6c757d; }
        .tag { background: #007bff; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.7em; margin: 2px; display: inline-block; }
        .footer { text-align: center; color: #6c757d; margin-top: 40px; padding: 20px; background: white; border-radius: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <span class="icon">${this.getStatusIcon(status)}</span>
                ${reportName} Report
            </h1>
            <div class="subtitle">Environment: ${this.environment} | Tests: ${totalTests} | Success Rate: ${successRate}% | Generated: ${timestamp}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Overall Status</h3>
                <div class="stat-number">${this.getStatusIcon(status)}</div>
                <div class="stat-label">${successRate}% Success Rate</div>
            </div>
            
            <div class="stat-card">
                <h3>✅ Passed Tests</h3>
                <div class="stat-number">${passedTests}</div>
                <div class="stat-label">out of ${totalTests}</div>
            </div>
            
            <div class="stat-card">
                <h3>❌ Failed Tests</h3>
                <div class="stat-number">${failedTests}</div>
                <div class="stat-label">out of ${totalTests}</div>
            </div>

            <div class="stat-card">
                <h3>📝 Total Steps</h3>
                <div class="stat-number">${totalSteps}</div>
                <div class="stat-label">Executed</div>
            </div>
            
            <div class="stat-card">
                <h3>⏱️ Duration</h3>
                <div class="stat-number">${totalDuration}</div>
                <div class="stat-label">Total Time</div>
            </div>
        </div>

        <div class="tests-grid">
            ${testCases.map((testCase, index) => {
                const testResult = executionResult.testResults ? executionResult.testResults[index] : { status: 'unknown', duration: '0s' };
                return `
                <div class="test-card">
                    <h4>
                        ${this.getStatusIcon(testResult.status || 'unknown')}
                        ${testCase.name || `Test ${index + 1}`}
                        <span class="test-status status-${testResult.status || 'unknown'}">${(testResult.status || 'unknown').toUpperCase()}</span>
                    </h4>
                    <p style="color: #6c757d; margin-bottom: 10px;">${testCase.description || 'No description'}</p>
                    <div style="margin-bottom: 10px;">
                        ${(testCase.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; color: #6c757d; font-size: 0.9em;">
                        <span>Steps: ${testCase.steps ? testCase.steps.length : 0}</span>
                        <span>Duration: ${typeof testResult.duration === 'number' ? Math.round(testResult.duration / 1000 * 100) / 100 + 's' : testResult.duration || '0s'}</span>
                    </div>
                </div>
                `;
            }).join('')}
        </div>

        <div class="footer">
            <strong>Generated by Claude Code Playwright MCP Test Framework</strong><br>
            Execution: ${reportName} | Environment: ${this.environment} | Report Style: ${this.reportStyle}<br>
            Execution completed on ${timestamp}
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * 生成批量测试详细报告
     */
    generateBatchDetailedReport(testCases, executionResult, timestamp) {
        const overviewReport = this.generateBatchOverviewReport(testCases, executionResult, timestamp);
        
        // 添加详细步骤信息
        const detailedSteps = testCases.map((testCase, index) => {
            const testResult = executionResult.testResults ? executionResult.testResults[index] : { status: 'unknown' };
            const steps = testCase.steps || [];
            
            return `
            <div class="test-details" style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    ${this.getStatusIcon(testResult.status || 'unknown')}
                    ${testCase.name || `Test ${index + 1}`} - Detailed Steps
                </h3>
                ${steps.length === 0 ? '<p style="color: #6c757d;">No steps defined</p>' : 
                  steps.map((step, stepIndex) => `
                    <div style="border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; padding: 12px; background: #f8f9fa;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 50%; font-size: 0.8em; font-weight: bold;">${stepIndex + 1}</span>
                            <span style="font-weight: 500; color: #495057;">${typeof step === 'string' ? step : step.action || 'Unknown step'}</span>
                        </div>
                    </div>
                  `).join('')
                }
            </div>
            `;
        }).join('');

        return overviewReport
            .replace('Style: overview', 'Style: detailed')
            .replace('<div class="footer">', detailedSteps + '<div class="footer">');
    }

    /**
     * 生成步骤执行报告（用于实时更新）
     */
    generateStepExecutionReport(testCaseData, stepResults) {
        const passedSteps = stepResults.filter(s => s.status === 'passed').length;
        const failedSteps = stepResults.filter(s => s.status === 'failed').length;
        const totalSteps = stepResults.length;

        return {
            summary: {
                total: totalSteps,
                passed: passedSteps,
                failed: failedSteps,
                successRate: totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0
            },
            steps: stepResults,
            testCase: testCaseData
        };
    }
}

module.exports = TestCaseReportGenerator;

// 向后兼容的便捷函数
function generateTestCaseReport(testCaseData, executionResult, options = {}) {
    const generator = new TestCaseReportGenerator(options);
    return generator.generateTestCaseReport(testCaseData, executionResult);
}

// 导出便捷函数以保持向后兼容
module.exports.generateTestCaseReport = generateTestCaseReport;
module.exports.TestCaseReportGenerator = TestCaseReportGenerator;

// 如果直接运行此脚本
if (require.main === module) {
    const generator = new TestCaseReportGenerator({
        environment: process.argv[2] || 'dev',
        reportStyle: process.argv[3] || 'overview'
    });
    
    console.log('Test Case Report Generator initialized');
    console.log(`Environment: ${generator.environment}`);
    console.log(`Report Style: ${generator.reportStyle}`);
    console.log('');
    console.log('⚠️  DEPRECATION NOTICE:');
    console.log('   This class-based approach is deprecated.');
    console.log('   Please use the simplified generate-report.js script instead:');
    console.log('   const { generateTestReport } = require("./generate-report.js");');
    console.log('   For full migration guide, see updated command documentation.');
}