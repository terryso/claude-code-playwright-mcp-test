# claude-test CLI 工具技术设计

## 概述

本文档描述了将现有 YAML 测试框架重构为 `claude-test` CLI 工具的技术设计方案。

---

## 架构设计

### 整体架构

```
┌─────────────────┐    ├── claude-test CLI ──┤    ┌─────────────────┐
│                 │    │                      │    │                 │
│   用户项目       │◄───┤  init/update/check   ├───►│   NPM Registry  │
│                 │    │                      │    │                 │
│  .claude/       │    │  文件管理/版本控制    │    │  claude-test    │
│  ├─ commands/   │    │                      │    │  package        │
│  └─ scripts/    │    └──────────────────────┘    │                 │
└─────────────────┘                                └─────────────────┘
```

### 组件设计

#### 1. CLI 入口 (`bin/claude-test.js`)
```javascript
#!/usr/bin/env node
const { Command } = require('commander');
const { version } = require('../package.json');

const program = new Command();
program
  .name('claude-test')
  .description('YAML-based Playwright testing framework for Claude Code')
  .version(version);

program
  .command('init')
  .description('Initialize testing framework in current project')
  .action(require('../lib/commands/init'));

program
  .command('update')
  .description('Update framework to latest version')
  .action(require('../lib/commands/update'));

program
  .command('check')
  .description('Check framework version and status')
  .action(require('../lib/commands/check'));

program.parse();
```

#### 2. 命令实现 (`lib/commands/`)

**init.js**
```javascript
const FileManager = require('../utils/file-manager');
const VersionManager = require('../utils/version-manager');

async function init() {
  try {
    // 检查当前目录
    const currentDir = process.cwd();
    
    // 检查是否已初始化
    if (await FileManager.isFrameworkExists(currentDir)) {
      console.log('Framework already exists. Use "claude-test update" to update.');
      return;
    }
    
    // 复制框架文件
    await FileManager.copyFrameworkFiles(currentDir);
    
    // 创建版本文件
    await VersionManager.createVersionFile(currentDir);
    
    console.log('✅ Framework initialized successfully!');
    console.log('Run your first test: /run-yaml-test');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

module.exports = init;
```

**update.js**
```javascript
const FileManager = require('../utils/file-manager');
const VersionManager = require('../utils/version-manager');

async function update() {
  try {
    const currentDir = process.cwd();
    
    // 检查框架是否存在
    if (!await FileManager.isFrameworkExists(currentDir)) {
      console.log('Framework not found. Use "claude-test init" first.');
      return;
    }
    
    // 检查版本
    const currentVersion = await VersionManager.getCurrentVersion(currentDir);
    const latestVersion = await VersionManager.getLatestVersion();
    
    if (currentVersion === latestVersion) {
      console.log(`✅ Already on latest version: ${latestVersion}`);
      return;
    }
    
    console.log(`🔄 Updating from ${currentVersion} to ${latestVersion}`);
    
    // 备份现有文件
    await FileManager.backupFrameworkFiles(currentDir);
    
    // 更新文件
    await FileManager.updateFrameworkFiles(currentDir);
    
    // 更新版本
    await VersionManager.updateVersionFile(currentDir, latestVersion);
    
    console.log('✅ Framework updated successfully!');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    // 尝试恢复备份
    await FileManager.restoreBackup(currentDir);
    process.exit(1);
  }
}

module.exports = update;
```

#### 3. 工具类 (`lib/utils/`)

**file-manager.js**
```javascript
const fs = require('fs-extra');
const path = require('path');

class FileManager {
  static async isFrameworkExists(projectDir) {
    const claudeDir = path.join(projectDir, '.claude');
    return fs.pathExists(claudeDir);
  }
  
  static async copyFrameworkFiles(projectDir) {
    const templateDir = path.join(__dirname, '../templates/.claude');
    const targetDir = path.join(projectDir, '.claude');
    
    await fs.copy(templateDir, targetDir, {
      overwrite: false,
      errorOnExist: false
    });
  }
  
  static async updateFrameworkFiles(projectDir) {
    const templateDir = path.join(__dirname, '../templates/.claude');
    const targetDir = path.join(projectDir, '.claude');
    
    // 只更新核心文件，保留用户自定义内容
    const coreFiles = ['commands', 'scripts'];
    
    for (const file of coreFiles) {
      const srcPath = path.join(templateDir, file);
      const destPath = path.join(targetDir, file);
      
      await fs.copy(srcPath, destPath, { overwrite: true });
    }
  }
  
  static async backupFrameworkFiles(projectDir) {
    const claudeDir = path.join(projectDir, '.claude');
    const backupDir = path.join(projectDir, '.claude-backup');
    
    if (await fs.pathExists(claudeDir)) {
      await fs.copy(claudeDir, backupDir);
    }
  }
  
  static async restoreBackup(projectDir) {
    const claudeDir = path.join(projectDir, '.claude');
    const backupDir = path.join(projectDir, '.claude-backup');
    
    if (await fs.pathExists(backupDir)) {
      await fs.remove(claudeDir);
      await fs.copy(backupDir, claudeDir);
      await fs.remove(backupDir);
    }
  }
}

module.exports = FileManager;
```

---

## 文件结构设计

### NPM 包结构
```
claude-test/
├── bin/
│   └── claude-test.js              # CLI 入口点
├── lib/
│   ├── commands/
│   │   ├── init.js                # init 命令
│   │   ├── update.js              # update 命令
│   │   └── check.js               # check 命令
│   ├── utils/
│   │   ├── file-manager.js        # 文件操作
│   │   ├── version-manager.js     # 版本管理
│   │   └── logger.js              # 日志工具
│   └── templates/
│       └── .claude/               # 框架模板
│           ├── commands/          # 命令文件
│           │   ├── run-yaml-test.md
│           │   ├── validate-yaml-test.md
│           │   ├── run-test-suite.md
│           │   └── validate-test-suite.md
│           └── scripts/           # 脚本文件
│               ├── yaml-test-processor.js
│               ├── create-report-data.js
│               ├── gen-report.js
│               └── ...
├── test/
│   ├── commands/
│   │   ├── init.test.js
│   │   ├── update.test.js
│   │   └── check.test.js
│   └── utils/
│       ├── file-manager.test.js
│       └── version-manager.test.js
├── docs/
│   ├── README.md
│   ├── api.md
│   └── examples/
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── publish.yml
├── package.json
├── .gitignore
└── LICENSE
```

### 用户项目结构（初始化后）
```
user-project/
├── .claude/
│   ├── commands/                  # 从 NPM 包复制
│   │   ├── run-yaml-test.md
│   │   ├── validate-yaml-test.md
│   │   ├── run-test-suite.md
│   │   └── validate-test-suite.md
│   ├── scripts/                   # 从 NPM 包复制
│   │   ├── yaml-test-processor.js
│   │   ├── create-report-data.js
│   │   ├── gen-report.js
│   │   └── ...
│   └── .framework-version         # 版本信息
├── test-cases/                    # 用户创建
├── test-suites/                   # 用户创建
├── steps/                         # 用户创建
├── .env.dev                       # 用户配置
├── .env.test                      # 用户配置
├── .env.prod                      # 用户配置
└── package.json                   # 用户项目
```

---

## 版本管理策略

### 版本文件格式 (`.claude/.framework-version`)
```json
{
  "version": "1.0.0",
  "installedAt": "2025-06-19T12:00:00.000Z",
  "updatedAt": "2025-06-19T12:00:00.000Z",
  "source": "npm"
}
```

### 版本检查逻辑
1. 读取本地版本文件
2. 查询 NPM registry 获取最新版本
3. 比较版本号（使用 semver）
4. 提供更新建议

---

## 路径引用更新策略

### 当前路径引用分析
```bash
# 需要更新的文件路径引用
.claude/commands/run-yaml-test.md:
  - scripts/yaml-test-processor.js → .claude/scripts/yaml-test-processor.js
  - scripts/create-report-data.js → .claude/scripts/create-report-data.js
  - scripts/gen-report.js → .claude/scripts/gen-report.js

.claude/commands/run-test-suite.md:
  - scripts/yaml-test-processor.js → .claude/scripts/yaml-test-processor.js
  - scripts/suite-report-generator.js → .claude/scripts/suite-report-generator.js

CLAUDE.md:
  - scripts/ → .claude/scripts/
```

### 自动化更新脚本
```javascript
// 批量更新路径引用
async function updatePathReferences() {
  const files = await glob('.claude/commands/*.md');
  
  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    
    // 替换脚本路径引用
    content = content.replace(/scripts\//g, '.claude/scripts/');
    
    await fs.writeFile(file, content);
  }
}
```

---

## 错误处理策略

### 错误类型定义
```javascript
class FrameworkError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'FrameworkError';
    this.code = code;
    this.details = details;
  }
}

// 错误代码
const ERROR_CODES = {
  ALREADY_EXISTS: 'FRAMEWORK_ALREADY_EXISTS',
  NOT_FOUND: 'FRAMEWORK_NOT_FOUND',
  VERSION_MISMATCH: 'VERSION_MISMATCH',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR'
};
```

### 错误处理流程
1. 捕获并分类错误
2. 提供用户友好的错误信息
3. 记录详细日志
4. 在可能的情况下提供修复建议
5. 实现自动回滚机制

---

## 测试策略

### 单元测试
- 命令功能测试
- 工具类功能测试
- 错误处理测试

### 集成测试
- 完整命令流程测试
- 文件操作测试
- 版本管理测试

### 端到端测试
- 在临时目录中测试完整流程
- 模拟不同的项目环境
- 测试升级和回滚场景

---

## 发布流程

### 自动化发布
```yaml
# .github/workflows/publish.yml
name: Publish to NPM
on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 发布检查清单
- [ ] 版本号更新
- [ ] 更新日志编写
- [ ] 测试用例通过
- [ ] 文档更新
- [ ] 安全扫描通过

---

## 性能考虑

### 文件操作优化
- 使用流式复制大文件
- 并行处理多个文件操作
- 实现增量更新（只更新变化的文件）

### 网络请求优化
- 缓存版本信息
- 实现请求超时和重试
- 支持离线模式

### 内存使用优化
- 流式处理大文件
- 及时释放不需要的资源
- 避免加载整个框架到内存

---

## 安全考虑

### 文件权限
- 检查目标目录写权限
- 避免覆盖重要文件
- 实现安全的临时文件处理

### 输入验证
- 验证命令行参数
- 检查文件路径安全性
- 防止路径遍历攻击

### 依赖安全
- 定期更新依赖包
- 使用 npm audit 检查漏洞
- 最小化依赖数量

---

## 兼容性

### Node.js 版本支持
- 最低支持 Node.js 14+
- 测试主要 LTS 版本
- 使用兼容的 API

### 操作系统支持
- Windows 10+
- macOS 10.15+
- Linux (Ubuntu 18.04+)

### 文件系统兼容性
- 处理不同的路径分隔符
- 支持符号链接
- 处理文件名大小写敏感性