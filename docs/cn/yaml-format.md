# YAML格式说明

## 步骤库格式

步骤库使用简洁的自然语言描述：

```yaml
# steps/login.yml
# 支持的环境变量: BASE_URL, TEST_USERNAME, TEST_PASSWORD
steps:
  - "Open {{BASE_URL}} page"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Verify page displays Swag Labs"
```

## 测试用例格式

测试用例包含标签和步骤，可以引用步骤库或直接定义步骤：

```yaml
# test-cases/order.yml
# 环境变量将从 .env.{environment} 文件自动加载
tags:
  - smoke
  - order  
  - checkout
steps:
  - include: "login"                           # 引用登录步骤库
  - "Click Add to Cart button for first product"      # 直接定义步骤
  - "Click Add to Cart button for second product"
  - "Click shopping cart icon in top right"
  - "Enter First Name"
  - "Enter Last Name"
  - "Enter Postal Code"
  - "Click Continue button"
  - "Click Finish button"
  - "Verify page displays Thank you for your order!"
  - include: "cleanup"                         # 引用清理步骤库
```

## 测试套件格式

测试套件用简洁、清晰的配置组织多个测试用例：

```yaml
# test-suites/e-commerce.yml
name: "电商测试套件"
description: "完整的电商工作流测试，涵盖用户注册、产品浏览、购物车操作和结账流程"
tags:
  - e-commerce
  - integration
  - critical
  - smoke

# 按顺序执行的测试用例
test-cases:
  - "test-cases/order.yml"
  - "test-cases/product-details.yml"
  - "test-cases/sort-optimized.yml"
```

**简化格式的关键特性**:
- **清晰配置**: 只包含必要字段 - name、description、tags 和 test-cases
- **简单测试用例列表**: 直接的文件路径，无需额外元数据
- **通过.env配置环境**: 所有环境配置通过标准.env文件
- **最小复杂性**: 易于阅读、编写和维护