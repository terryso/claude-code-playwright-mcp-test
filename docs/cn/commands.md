# 命令详解

所有命令都位于 `.claude/` 目录中，并支持参数提示。

## 🚀 执行测试

### `/run-yaml-test`
执行YAML测试用例，支持多环境配置、标签过滤和报告生成。

### `/run-test-suite`
执行YAML测试套件，包含多个有序测试用例，支持套件级配置和报告。

**测试用例参数：**
- `file` (可选): 测试用例文件路径，不传则执行test-cases目录下所有用例
- `env` (可选): 环境名称 (dev/test/prod)，默认为 dev
- `tags` (可选): 标签过滤，支持单个或多个标签组合

**测试套件参数：**
- `suite` (可选): 测试套件文件路径，不传则执行test-suites目录下所有套件
- `env` (可选): 环境名称 (dev/test/prod)，默认为套件配置的环境或 dev
- `tags` (可选): 套件级和测试级标签过滤

**标签过滤语法：**
- 单个标签: `smoke`
- 多个标签AND: `smoke,login` (必须同时包含)
- 多个标签OR: `smoke|login` (包含任一)
- 混合条件: `smoke,login|critical`

**报告生成：**
- 根据环境变量 `GENERATE_REPORT` 自动生成测试报告
- 支持 HTML/JSON 格式（由 `REPORT_FORMAT` 配置）
- 报告样式由 `REPORT_STYLE` 控制（overview/detailed）
- 报告保存到 `REPORT_PATH` 指定目录

**示例：**
```bash
# 执行指定文件
/run-yaml-test file:test-cases/order.yml env:dev

# 执行所有smoke标签的测试
/run-yaml-test tags:smoke env:prod

# 执行包含smoke且包含order的测试
/run-yaml-test tags:smoke,order env:test

# 执行包含order或checkout标签的测试
/run-yaml-test tags:order|checkout env:dev

# 执行所有测试用例
/run-yaml-test env:dev

# 执行指定测试套件
/run-test-suite suite:e-commerce.yml env:test

# 执行所有冒烟测试套件
/run-test-suite tags:smoke env:dev

# 执行所有测试套件
/run-test-suite env:test
```

## ✅ 验证测试

### `/validate-yaml-test`
验证YAML测试用例的语法和引用完整性。

### `/validate-test-suite`
验证YAML测试套件配置和测试用例引用完整性。

**测试用例验证参数：**
- `file` (必需): 要验证的测试用例文件路径
- `env` (可选): 环境名称，用于验证环境变量

**测试套件验证参数：**
- `suite` (必需): 要验证的测试套件文件路径
- `env` (可选): 环境名称，用于验证环境变量

**示例：**
```bash
# 验证测试用例
/validate-yaml-test file:test-cases/complex-test.yml env:test

# 验证测试套件
/validate-test-suite suite:e-commerce.yml env:test
```

## 📊 报告管理

### `/view-reports-index`
启动综合测试报告索引查看器，支持环境切换和报告浏览功能。

**功能特性：**
- 📊 **自动发现**: 自动扫描所有环境的测试报告
- 🎯 **环境切换**: 支持dev/test/prod环境标签页切换
- 📈 **统计信息**: 显示各环境的报告统计数据
- 🔍 **报告详情**: 显示报告类型、大小、生成时间等信息
- 📱 **响应式设计**: 支持桌面和移动设备访问
- 🌐 **本地服务器**: 在localhost:8080运行，自动打开浏览器

**执行过程：**
1. **刷新报告索引**: 扫描所有环境目录，生成最新的报告列表
2. **启动本地服务**: 启动HTTP服务器托管报告索引页面
3. **打开浏览器**: 自动在浏览器中打开报告索引页面

**无需参数** - 自动扫描所有环境。

**支持的报告类型：**
- **套件报告**: 多测试用例套件执行报告
- **单测报告**: 单个测试用例详细执行报告  
- **批量报告**: 批量测试执行的综合报告

**示例：**
```bash
# 启动报告索引查看器（Claude Code命令）
/view-reports-index

# 该命令将：
# 1. 扫描 reports/dev/, reports/test/, reports/prod/ 目录
# 2. 生成 reports/index.json 数据文件
# 3. 在端口8080启动本地HTTP服务器
# 4. 在浏览器中打开 http://localhost:8080/index.html
```

**npm手动启动方式**（替代方法）：
```bash
# 方式1：使用npm脚本（推荐）
npm run view-reports

# 方式2：使用备用npm脚本
npm run reports-server

# 方式3：直接node命令
node scripts/start-report-server.js

# 所有方式都将：
# - 自动扫描所有环境的报告
# - 在localhost:8080启动HTTP服务器
# - 自动打开浏览器
# - 提供实时报告管理界面
```

**服务器功能特性：**
- 🌐 **自动打开浏览器**: 自动打开 http://localhost:8080/index.html
- 🔄 **实时刷新**: 手动刷新按钮更新报告列表
- 📊 **实时统计**: 基于环境的报告计数和统计信息
- 🎯 **环境过滤**: 基于标签页的环境切换（dev/test/prod）
- 📱 **响应式界面**: 支持桌面和移动设备
- 🔍 **报告搜索**: 便捷的测试报告浏览和过滤功能