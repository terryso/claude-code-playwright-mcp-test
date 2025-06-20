# 最佳实践

## 1. 步骤库设计

- **单一职责**: 每个步骤库专注一个功能领域
- **参数化**: 使用环境变量而非硬编码值
- **可复用**: 设计通用的步骤，多个测试用例可复用

```yaml
# ✅ 好的步骤库设计
# steps/form-validation.yml
steps:
  - "Fill {{FIELD_NAME}} field with {{INVALID_VALUE}}"
  - "Click submit button"
  - "Verify page displays error message: {{ERROR_MESSAGE}}"
```

## 2. 测试用例组织

- **标签分类**: 使用合理的标签对测试用例分类
- **逻辑分组**: 按功能模块组织测试用例  
- **环境适配**: 考虑不同环境的差异
- **清理机制**: 每个测试后进行适当清理

```yaml
# ✅ 好的测试用例结构
tags:
  - smoke        # 冒烟测试
  - login        # 登录功能
  - critical     # 关键功能
steps:
  - include: "setup"           # 测试准备
  - include: "login"           # 登录
  - "Execute core test steps"  # 主要测试逻辑
  - include: "cleanup"         # 清理环境
```

## 3. 标签策略

- **功能标签**: 按功能模块分类，如login、user、api
- **优先级标签**: 如critical、high、medium、low
- **类型标签**: 如smoke、regression、integration
- **环境标签**: 如dev-only、prod-safe

## 4. 环境配置

- **敏感信息**: 所有密码、API密钥使用环境变量
- **环境隔离**: 不同环境使用独立的配置文件
- **文档化**: 在.env.example中说明所有必需变量