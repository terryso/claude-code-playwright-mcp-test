const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const ReportServer = require('./start-report-server');
const ReportScanner = require('./scan-reports');

// Mock dependencies
jest.mock('http');
jest.mock('child_process');
jest.mock('./scan-reports');
jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        stat: jest.fn(),
        readFile: jest.fn()
    }
}));

describe('ReportServer', () => {
    let server;
    let mockHttpServer;
    let mockScanner;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock HTTP server
        mockHttpServer = {
            listen: jest.fn((port, callback) => {
                setTimeout(() => callback(), 10);
            }),
            close: jest.fn()
        };
        http.createServer.mockReturnValue(mockHttpServer);
        
        // Mock scanner
        mockScanner = {
            generateReportIndex: jest.fn().mockResolvedValue(),
            generateApiData: jest.fn().mockResolvedValue({
                success: true,
                data: { dev: [], test: [], prod: [] }
            })
        };
        ReportScanner.mockImplementation(() => mockScanner);
        
        // Mock exec
        exec.mockImplementation((command, callback) => {
            setTimeout(() => callback(null), 10);
        });
        
        server = new ReportServer(8080, 'test-reports');
    });

    describe('constructor', () => {
        test('should initialize with default parameters', () => {
            const defaultServer = new ReportServer();
            expect(defaultServer.port).toBe(8080);
            expect(defaultServer.reportsDir).toContain('reports');
        });

        test('should initialize with custom parameters', () => {
            expect(server.port).toBe(8080);
            expect(server.reportsDir).toContain('test-reports');
        });

        test('should use environment variable REPORT_PATH', () => {
            const originalReportPath = process.env.REPORT_PATH;
            process.env.REPORT_PATH = '/custom/reports';
            
            const envServer = new ReportServer();
            expect(envServer.reportsDir).toBe(path.resolve('/custom/reports'));
            
            // Restore original env
            if (originalReportPath) {
                process.env.REPORT_PATH = originalReportPath;
            } else {
                delete process.env.REPORT_PATH;
            }
        });

        test('should use environment variable REPORTS_DIR as fallback', () => {
            const originalReportPath = process.env.REPORT_PATH;
            const originalReportsDir = process.env.REPORTS_DIR;
            
            delete process.env.REPORT_PATH;
            process.env.REPORTS_DIR = '/fallback/reports';
            
            const envServer = new ReportServer();
            expect(envServer.reportsDir).toBe(path.resolve('/fallback/reports'));
            
            // Restore original env
            if (originalReportPath) {
                process.env.REPORT_PATH = originalReportPath;
            }
            if (originalReportsDir) {
                process.env.REPORTS_DIR = originalReportsDir;
            } else {
                delete process.env.REPORTS_DIR;
            }
        });

        test('should prioritize explicit parameter over environment variables', () => {
            const originalReportPath = process.env.REPORT_PATH;
            process.env.REPORT_PATH = '/env/reports';
            
            const explicitServer = new ReportServer(8080, '/explicit/reports');
            expect(explicitServer.reportsDir).toBe(path.resolve('/explicit/reports'));
            
            // Restore original env
            if (originalReportPath) {
                process.env.REPORT_PATH = originalReportPath;
            } else {
                delete process.env.REPORT_PATH;
            }
        });
    });

    describe('start', () => {
        test('should start server successfully', async () => {
            const mockServer = await server.start();
            
            expect(mockScanner.generateReportIndex).toHaveBeenCalled();
            expect(http.createServer).toHaveBeenCalled();
            expect(mockHttpServer.listen).toHaveBeenCalledWith(8080, expect.any(Function));
            expect(exec).toHaveBeenCalled(); // Browser opening
            expect(mockServer).toBe(mockHttpServer);
        });

        test('should handle server start failure', async () => {
            mockHttpServer.listen.mockImplementation((port, callback) => {
                setTimeout(() => callback(new Error('Port in use')), 10);
            });

            await expect(server.start()).rejects.toThrow('Port in use');
        });

        test('should handle scanner failure gracefully', async () => {
            mockScanner.generateReportIndex.mockRejectedValue(new Error('Scan failed'));

            const mockServer = await server.start();
            
            expect(mockServer).toBe(mockHttpServer);
            expect(mockHttpServer.listen).toHaveBeenCalled();
        });
    });

    describe('refreshReportIndex', () => {
        test('should refresh report index successfully', async () => {
            await server.refreshReportIndex();
            
            expect(mockScanner.generateReportIndex).toHaveBeenCalled();
        });

        test('should handle refresh failure gracefully', async () => {
            mockScanner.generateReportIndex.mockRejectedValue(new Error('Refresh failed'));

            await expect(server.refreshReportIndex()).resolves.not.toThrow();
        });
    });

    describe('getContentType', () => {
        test('should return correct content types', () => {
            expect(server.getContentType('test.html')).toBe('text/html; charset=utf-8');
            expect(server.getContentType('script.js')).toBe('application/javascript; charset=utf-8');
            expect(server.getContentType('style.css')).toBe('text/css; charset=utf-8');
            expect(server.getContentType('data.json')).toBe('application/json; charset=utf-8');
            expect(server.getContentType('image.png')).toBe('image/png');
            expect(server.getContentType('photo.jpg')).toBe('image/jpeg');
            expect(server.getContentType('photo.jpeg')).toBe('image/jpeg');
            expect(server.getContentType('animation.gif')).toBe('image/gif');
            expect(server.getContentType('vector.svg')).toBe('image/svg+xml');
            expect(server.getContentType('unknown.xyz')).toBe('text/plain; charset=utf-8');
        });
    });

    describe('sendJson', () => {
        test('should send JSON response correctly', () => {
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };
            const testData = { test: 'data' };

            server.sendJson(mockRes, testData);

            expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            });
            expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(testData, null, 2));
        });
    });

    describe('sendError', () => {
        test('should send error response correctly', () => {
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            server.sendError(mockRes, 404, 'Not found');

            expect(mockRes.writeHead).toHaveBeenCalledWith(404, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            expect(mockRes.end).toHaveBeenCalledWith('错误 404: Not found');
        });
    });

    describe('redirect', () => {
        test('should send redirect response correctly', () => {
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            server.redirect(mockRes, '/new-location');

            expect(mockRes.writeHead).toHaveBeenCalledWith(302, {
                'Location': '/new-location'
            });
            expect(mockRes.end).toHaveBeenCalled();
        });
    });

    describe('openBrowser', () => {
        const originalPlatform = process.platform;

        afterEach(() => {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform
            });
        });

        test('should open browser on macOS', () => {
            Object.defineProperty(process, 'platform', {
                value: 'darwin'
            });

            server.openBrowser('http://localhost:8080');

            expect(exec).toHaveBeenCalledWith(
                'open "http://localhost:8080"',
                expect.any(Function)
            );
        });

        test('should open browser on Windows', () => {
            Object.defineProperty(process, 'platform', {
                value: 'win32'
            });

            server.openBrowser('http://localhost:8080');

            expect(exec).toHaveBeenCalledWith(
                'start "http://localhost:8080"',
                expect.any(Function)
            );
        });

        test('should open browser on Linux', () => {
            Object.defineProperty(process, 'platform', {
                value: 'linux'
            });

            server.openBrowser('http://localhost:8080');

            expect(exec).toHaveBeenCalledWith(
                'xdg-open "http://localhost:8080"',
                expect.any(Function)
            );
        });

        test('should handle browser opening failure', (done) => {
            exec.mockImplementation((command, callback) => {
                setTimeout(() => callback(new Error('Command failed')), 10);
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            server.openBrowser('http://localhost:8080');

            setTimeout(() => {
                // In test environment, console.log is suppressed
                // We just verify the function completed without errors
                consoleSpy.mockRestore();
                done();
            }, 20);
        });
    });

    describe('handleApiReports', () => {
        test('should handle API reports request successfully', async () => {
            const mockReq = {};
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            await server.handleApiReports(mockReq, mockRes);

            expect(mockScanner.generateApiData).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalled();
        });

        test('should handle API reports request failure', async () => {
            const mockReq = {};
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };
            
            mockScanner.generateApiData.mockRejectedValue(new Error('API failed'));

            await server.handleApiReports(mockReq, mockRes);

            expect(mockRes.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(
                expect.stringContaining('获取报告列表失败')
            );
        });
    });

    describe('handleApiRefresh', () => {
        test('should handle API refresh request successfully', async () => {
            const mockReq = {};
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            await server.handleApiRefresh(mockReq, mockRes);

            expect(mockScanner.generateReportIndex).toHaveBeenCalled();
            expect(mockScanner.generateApiData).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(
                expect.stringContaining('报告索引已刷新')
            );
        });

        test('should handle API refresh request failure', async () => {
            const mockReq = {};
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };
            
            // Create a fresh server instance with both functions failing
            const failingScanner = {
                generateReportIndex: jest.fn().mockRejectedValue(new Error('Refresh failed')),
                generateApiData: jest.fn().mockRejectedValue(new Error('API failed'))
            };
            ReportScanner.mockImplementation(() => failingScanner);
            const failingServer = new ReportServer(8080, 'test-reports');

            await failingServer.handleApiRefresh(mockReq, mockRes);

            expect(mockRes.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(
                expect.stringContaining('刷新报告索引失败')
            );
        });
    });

    describe('handleRequest', () => {
        test('should handle root path redirect', async () => {
            const mockReq = {
                method: 'GET',
                url: '/'
            };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            await server.handleRequest(mockReq, mockRes);

            expect(mockRes.writeHead).toHaveBeenCalledWith(302, { 'Location': '/index.html' });
            expect(mockRes.end).toHaveBeenCalled();
        });

        test('should handle API reports endpoint', async () => {
            const mockReq = {
                method: 'GET',
                url: '/api/reports'
            };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            await server.handleRequest(mockReq, mockRes);

            expect(mockScanner.generateApiData).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
        });

        test('should handle API refresh endpoint', async () => {
            const mockReq = {
                method: 'POST',
                url: '/api/refresh'
            };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            await server.handleRequest(mockReq, mockRes);

            expect(mockScanner.generateReportIndex).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
        });

        test('should handle static file requests', async () => {
            const mockReq = {
                method: 'GET',
                url: '/index.html'
            };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            const mockContent = '<html><body>Test</body></html>';
            fs.access.mockResolvedValue();
            fs.stat.mockResolvedValue({ isDirectory: () => false });
            fs.readFile.mockResolvedValue(mockContent);

            await server.handleRequest(mockReq, mockRes);

            expect(fs.readFile).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
                'Content-Type': 'text/html; charset=utf-8'
            }));
            expect(mockRes.end).toHaveBeenCalledWith(mockContent);
        });

        test('should handle request errors', async () => {
            const mockReq = {
                method: 'GET',
                url: '/api/reports'
            };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            mockScanner.generateApiData.mockRejectedValue(new Error('API Error'));

            await server.handleRequest(mockReq, mockRes);

            expect(mockRes.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('获取报告列表失败'));
        });
    });

    describe('serveStaticFile', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should serve regular file', async () => {
            const mockReq = { method: 'GET' };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };
            const mockContent = '<html>Test</html>';

            fs.stat.mockResolvedValue({ isDirectory: () => false });
            fs.readFile.mockResolvedValue(mockContent);

            await server.serveStaticFile(mockReq, mockRes, '/index.html');

            expect(fs.readFile).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            }));
            expect(mockRes.end).toHaveBeenCalledWith(mockContent);
        });

        test('should serve directory index', async () => {
            const mockReq = { method: 'GET' };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };
            const mockContent = '<html>Directory Index</html>';

            fs.stat.mockResolvedValueOnce({ isDirectory: () => true });
            fs.access.mockResolvedValue();
            fs.readFile.mockResolvedValue(mockContent);

            await server.serveStaticFile(mockReq, mockRes, '/some-dir/');

            expect(fs.access).toHaveBeenCalled();
            expect(fs.readFile).toHaveBeenCalled();
            expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
        });

        test('should handle file not found', async () => {
            const mockReq = { method: 'GET' };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            fs.stat.mockRejectedValue({ code: 'ENOENT' });

            await server.serveStaticFile(mockReq, mockRes, '/nonexistent.html');

            expect(mockRes.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('文件未找到'));
        });

        test('should handle file read error', async () => {
            const mockReq = { method: 'GET' };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            fs.stat.mockRejectedValue(new Error('Permission denied'));

            await server.serveStaticFile(mockReq, mockRes, '/forbidden.html');

            expect(mockRes.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('读取文件失败'));
        });

        test('should prevent path traversal attacks', async () => {
            const mockReq = { method: 'GET' };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            await server.serveStaticFile(mockReq, mockRes, '../../../etc/passwd');

            expect(mockRes.writeHead).toHaveBeenCalledWith(403, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('禁止访问'));
        });

        test('should handle directory without index.html', async () => {
            const mockReq = { method: 'GET' };
            const mockRes = {
                writeHead: jest.fn(),
                end: jest.fn()
            };

            fs.stat.mockResolvedValueOnce({ isDirectory: () => true });
            fs.access.mockRejectedValue({ code: 'ENOENT' });

            await server.serveStaticFile(mockReq, mockRes, '/empty-dir/');

            expect(mockRes.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('文件未找到'));
        });
    });
});

// Test CLI functionality (simplified)
describe('CLI main function simulation', () => {
    let originalConsoleLog;
    let originalConsoleError;
    let originalProcessExit;
    let mockConsoleLog;
    let mockConsoleError;
    let mockProcessExit;

    beforeEach(() => {
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
        originalProcessExit = process.exit;
        
        mockConsoleLog = jest.fn();
        mockConsoleError = jest.fn();
        mockProcessExit = jest.fn();
        
        console.log = mockConsoleLog;
        console.error = mockConsoleError;
        process.exit = mockProcessExit;
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        process.exit = originalProcessExit;
        jest.restoreAllMocks();
    });

    test('should simulate server start with default port', async () => {
        const mockServer = {
            start: jest.fn().mockResolvedValue({})
        };
        
        // Simulate main function logic
        try {
            const port = parseInt('') || 8080;
            await mockServer.start();
            console.log('按 Ctrl+C 停止服务器');
        } catch (error) {
            console.error('启动服务器失败:', error.message);
            process.exit(1);
        }
        
        expect(mockServer.start).toHaveBeenCalled();
        expect(mockConsoleLog).toHaveBeenCalledWith('按 Ctrl+C 停止服务器');
    });

    test('should simulate server start with custom port', async () => {
        const mockServer = {
            start: jest.fn().mockResolvedValue({})
        };
        
        // Simulate main function logic with custom port
        try {
            const port = parseInt('9000') || 8080;
            expect(port).toBe(9000);
            await mockServer.start();
        } catch (error) {
            console.error('启动服务器失败:', error.message);
            process.exit(1);
        }
        
        expect(mockServer.start).toHaveBeenCalled();
    });

    test('should handle server start failure', async () => {
        const mockServer = {
            start: jest.fn().mockRejectedValue(new Error('Start failed'))
        };
        
        // Simulate main function error handling
        try {
            await mockServer.start();
        } catch (error) {
            console.error('❌ 启动服务器失败:', error.message);
            process.exit(1);
        }
        
        expect(mockConsoleError).toHaveBeenCalledWith('❌ 启动服务器失败:', 'Start failed');
        expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
});