#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * 扫描报告目录并生成报告索引数据
 */
class ReportScanner {
    constructor(reportsDir = 'reports') {
        this.reportsDir = path.resolve(reportsDir);
        this.environments = ['dev', 'test', 'prod'];
    }

    /**
     * 扫描所有环境的报告
     */
    async scanAllReports() {
        const reportsData = {};
        
        for (const env of this.environments) {
            try {
                reportsData[env] = await this.scanEnvironmentReports(env);
            } catch (error) {
                console.warn(`扫描环境 ${env} 失败:`, error.message);
                reportsData[env] = [];
            }
        }
        
        return reportsData;
    }

    /**
     * 扫描指定环境的报告
     */
    async scanEnvironmentReports(environment) {
        const envDir = path.join(this.reportsDir, environment);
        
        try {
            await fs.access(envDir);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.log(`环境目录 ${envDir} 不存在，跳过扫描`);
            }
            return [];
        }

        const files = await fs.readdir(envDir);
        const reports = [];

        for (const file of files) {
            if (this.isReportFile(file)) {
                const reportInfo = await this.analyzeReportFile(environment, file);
                if (reportInfo) {
                    reports.push(reportInfo);
                }
            }
        }

        // 按时间倒序排列
        return reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 判断是否为报告文件
     */
    isReportFile(filename) {
        return filename.endsWith('.html') && 
               (filename.startsWith('test-') || 
                filename.startsWith('suite-') || 
                filename.includes('batch'));
    }

    /**
     * 分析报告文件信息
     */
    async analyzeReportFile(environment, filename) {
        const filePath = path.join(this.reportsDir, environment, filename);
        
        try {
            const stats = await fs.stat(filePath);
            const fileContent = await fs.readFile(filePath, 'utf8');
            
            const reportInfo = {
                name: filename,
                path: `${environment}/${filename}`,
                environment: environment,
                size: this.formatFileSize(stats.size),
                timestamp: stats.mtime.toISOString(),
                date: this.formatDate(stats.mtime),
                type: this.determineReportType(filename),
                ...this.extractReportMetadata(fileContent)
            };

            return reportInfo;
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn(`分析文件 ${filename} 失败:`, error.message);
            }
            return null;
        }
    }

    /**
     * 确定报告类型
     */
    determineReportType(filename) {
        if (filename.startsWith('suite-')) return 'suite';
        if (filename.includes('batch')) return 'batch';
        if (filename.startsWith('test-')) return 'test';
        return 'unknown';
    }

    /**
     * 从HTML内容中提取报告元数据
     */
    extractReportMetadata(htmlContent) {
        const metadata = {
            title: 'Unknown Report',
            description: '无描述信息',
            testCount: 0,
            status: 'unknown'
        };

        try {
            // 提取标题
            const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) {
                metadata.title = titleMatch[1].replace(' - Test Report', '').trim();
            }

            // 提取描述
            const descMatch = htmlContent.match(/<meta name="description" content="(.*?)"/i);
            if (descMatch) {
                metadata.description = descMatch[1];
            }

            // 从JSON数据中提取信息
            const jsonMatch = htmlContent.match(/window\.reportData\s*=\s*({.*?});/s);
            if (jsonMatch) {
                const reportData = JSON.parse(jsonMatch[1]);
                
                if (reportData.reportData) {
                    const data = reportData.reportData;
                    
                    // 套件报告
                    if (data.suite) {
                        metadata.title = data.suite.name || metadata.title;
                        metadata.description = data.suite.description || metadata.description;
                        metadata.testCount = data.results ? data.results.length : 0;
                        metadata.status = this.calculateSuiteStatus(data.results);
                    }
                    // 单个测试报告
                    else if (data.testCase) {
                        metadata.title = data.testCase.name || metadata.title;
                        metadata.description = data.testCase.description || metadata.description;
                        metadata.testCount = 1;
                        metadata.status = data.executionResult?.status || 'unknown';
                    }
                    // 批量测试报告
                    else if (data.testCases && Array.isArray(data.testCases)) {
                        metadata.testCount = data.testCases.length;
                        metadata.status = this.calculateBatchStatus(data.executionResult);
                        metadata.title = data.executionResult?.name || metadata.title;
                    }
                }
            }

        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn('提取报告元数据失败:', error.message);
            }
        }

        return metadata;
    }

    /**
     * 计算套件状态
     */
    calculateSuiteStatus(results) {
        if (!results || results.length === 0) return 'unknown';
        
        const passed = results.filter(r => r.status === 'passed').length;
        const total = results.length;
        
        if (passed === total) return 'passed';
        if (passed === 0) return 'failed';
        return 'partial';
    }

    /**
     * 计算批量测试状态
     */
    calculateBatchStatus(executionResult) {
        if (!executionResult) return 'unknown';
        
        if (executionResult.status) return executionResult.status;
        
        if (executionResult.testResults) {
            const passed = executionResult.testResults.filter(r => r.status === 'passed').length;
            const total = executionResult.testResults.length;
            
            if (passed === total) return 'passed';
            if (passed === 0) return 'failed';
            return 'partial';
        }
        
        return 'unknown';
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * 格式化日期 - 使用当地时间
     */
    formatDate(date) {
        // 获取当地时间的各个组件
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // 返回格式: YYYY-MM-DD HH:mm:ss (当地时间)
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * 生成报告索引数据文件
     */
    async generateReportIndex(outputPath = null) {
        const reportsData = await this.scanAllReports();
        
        const indexData = {
            generatedAt: new Date().toISOString(),
            totalReports: Object.values(reportsData).reduce((sum, reports) => sum + reports.length, 0),
            environments: Object.keys(reportsData),
            reports: reportsData
        };

        if (outputPath) {
            await fs.writeFile(outputPath, JSON.stringify(indexData, null, 2), 'utf8');
            if (process.env.NODE_ENV !== 'test') {
                console.log(`报告索引已生成: ${outputPath}`);
            }
        }

        return indexData;
    }

    /**
     * 生成API端点数据
     */
    async generateApiData() {
        const reportsData = await this.scanAllReports();
        return {
            success: true,
            data: reportsData,
            timestamp: new Date().toISOString()
        };
    }
}

// CLI接口
async function main() {
    const scanner = new ReportScanner();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'scan';
    
    try {
        switch (command) {
            case 'scan':
                const reportsData = await scanner.scanAllReports();
                console.log('扫描完成:');
                console.log(JSON.stringify(reportsData, null, 2));
                break;
                
            case 'generate':
                const outputPath = args[1] || path.join(scanner.reportsDir, 'index.json');
                await scanner.generateReportIndex(outputPath);
                break;
                
            case 'api':
                const apiData = await scanner.generateApiData();
                console.log(JSON.stringify(apiData));
                break;
                
            default:
                console.log('用法:');
                console.log('  node scan-reports.js scan          # 扫描并输出报告数据');
                console.log('  node scan-reports.js generate      # 生成报告索引文件');
                console.log('  node scan-reports.js api           # 生成API格式数据');
        }
    } catch (error) {
        console.error('执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

module.exports = ReportScanner;