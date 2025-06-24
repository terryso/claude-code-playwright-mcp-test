#!/usr/bin/env node

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const ReportScanner = require('./scan-reports');

/**
 * 简单的HTTP服务器用于托管报告索引页面
 */
class ReportServer {
    constructor(port = 8080, reportsDir = null) {
        this.port = port;
        // 优先使用传入的reportsDir，然后是环境变量，最后是默认值
        const defaultReportsDir = reportsDir || 
                                process.env.REPORT_PATH || 
                                process.env.REPORTS_DIR || 
                                'reports';
        this.reportsDir = path.resolve(defaultReportsDir);
        this.scanner = new ReportScanner(this.reportsDir);
    }

    /**
     * 启动服务器
     */
    async start() {
        if (process.env.NODE_ENV !== 'test') {
            console.log('🚀 启动测试报告服务器...');
        }
        
        // 先刷新报告索引
        await this.refreshReportIndex();
        
        // 创建HTTP服务器
        const server = http.createServer(async (req, res) => {
            try {
                await this.handleRequest(req, res);
            } catch (error) {
                console.error('处理请求失败:', error);
                this.sendError(res, 500, '服务器内部错误');
            }
        });

        return new Promise((resolve, reject) => {
            server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    const url = `http://localhost:${this.port}`;
                    if (process.env.NODE_ENV !== 'test') {
                        console.log(`✅ 报告服务器已启动: ${url}`);
                        console.log('📊 报告索引页面: ${url}/index.html');
                    }
                    
                    // 自动打开浏览器
                    this.openBrowser(url + '/index.html');
                    
                    resolve(server);
                }
            });
        });
    }

    /**
     * 刷新报告索引
     */
    async refreshReportIndex() {
        if (process.env.NODE_ENV !== 'test') {
            console.log('📋 扫描报告目录...');
        }
        
        try {
            const indexPath = path.join(this.reportsDir, 'index.json');
            await this.scanner.generateReportIndex(indexPath);
            if (process.env.NODE_ENV !== 'test') {
                console.log('✅ 报告索引已更新');
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn('⚠️  更新报告索引失败:', error.message);
            }
        }
    }

    /**
     * 处理HTTP请求
     */
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const pathname = url.pathname;
        
        if (process.env.NODE_ENV !== 'test') {
            console.log(`📥 ${req.method} ${pathname}`);
        }

        // 特殊路由处理
        if (pathname === '/') {
            return this.redirect(res, '/index.html');
        }
        
        if (pathname === '/api/reports') {
            return this.handleApiReports(req, res);
        }
        
        if (pathname === '/api/refresh') {
            return this.handleApiRefresh(req, res);
        }

        // 静态文件处理
        await this.serveStaticFile(req, res, pathname);
    }

    /**
     * 处理API：获取报告列表
     */
    async handleApiReports(req, res) {
        try {
            const reportsData = await this.scanner.generateApiData();
            this.sendJson(res, reportsData);
        } catch (error) {
            this.sendError(res, 500, '获取报告列表失败: ' + error.message);
        }
    }

    /**
     * 处理API：刷新报告索引
     */
    async handleApiRefresh(req, res) {
        try {
            await this.refreshReportIndex();
            const reportsData = await this.scanner.generateApiData();
            this.sendJson(res, { 
                success: true, 
                message: '报告索引已刷新',
                data: reportsData.data 
            });
        } catch (error) {
            this.sendError(res, 500, '刷新报告索引失败: ' + error.message);
        }
    }

    /**
     * 服务静态文件
     */
    async serveStaticFile(req, res, pathname) {
        let filePath = path.join(this.reportsDir, pathname);
        
        // 安全检查：防止路径遍历攻击
        if (!filePath.startsWith(this.reportsDir)) {
            return this.sendError(res, 403, '禁止访问');
        }

        try {
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                // 目录：查找index.html
                filePath = path.join(filePath, 'index.html');
                await fs.access(filePath);
            }

            const content = await fs.readFile(filePath);
            const contentType = this.getContentType(filePath);
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.sendError(res, 404, '文件未找到');
            } else {
                this.sendError(res, 500, '读取文件失败');
            }
        }
    }

    /**
     * 获取内容类型
     */
    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || 'text/plain; charset=utf-8';
    }

    /**
     * 发送JSON响应
     */
    sendJson(res, data) {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(data, null, 2));
    }

    /**
     * 发送错误响应
     */
    sendError(res, statusCode, message) {
        res.writeHead(statusCode, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end(`错误 ${statusCode}: ${message}`);
    }

    /**
     * 重定向
     */
    redirect(res, location) {
        res.writeHead(302, { 'Location': location });
        res.end();
    }

    /**
     * 在浏览器中打开URL
     */
    openBrowser(url) {
        const platform = process.platform;
        let command;
        
        if (platform === 'darwin') {
            command = `open "${url}"`;
        } else if (platform === 'win32') {
            command = `start "${url}"`;
        } else {
            command = `xdg-open "${url}"`;
        }
        
        exec(command, (error) => {
            if (process.env.NODE_ENV !== 'test') {
                if (error) {
                    console.log(`请手动在浏览器中打开: ${url}`);
                } else {
                    console.log('🌐 已在浏览器中打开报告索引页面');
                }
            }
        });
    }
}

// CLI接口
async function main() {
    const args = process.argv.slice(2);
    const port = parseInt(args[0]) || 8080;
    
    try {
        const server = new ReportServer(port);
        await server.start();
        
        // 保持服务器运行
        console.log('按 Ctrl+C 停止服务器');
        
        process.on('SIGINT', () => {
            console.log('\n👋 停止报告服务器');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 启动服务器失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

module.exports = ReportServer;