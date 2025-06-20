# 环境配置

## 环境变量说明

支持的环境变量类型：

```bash
# .env.dev 示例
# 基础配置
BASE_URL=https://dev.myapp.com

# 测试账号
TEST_USERNAME=dev_admin
TEST_PASSWORD=dev123

# 普通用户账号
USER_USERNAME=dev_user@example.com
USER_PASSWORD=devpass123

# 浏览器配置
BROWSER_TIMEOUT=30000

# 文件路径
SCREENSHOT_PATH=screenshots/dev
REPORT_PATH=reports/dev

# 报告配置
GENERATE_REPORT=true
REPORT_FORMAT=html
REPORT_STYLE=detailed
```

## 多环境切换

```bash
# 开发环境
/run-yaml-test file:test-cases/order.yml env:dev

# 测试环境
/run-yaml-test file:test-cases/order.yml env:test

# 生产环境
/run-yaml-test file:test-cases/order.yml env:prod
```