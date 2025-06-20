# 项目结构

```
├── .claude/                    # Claude Code 项目命令
│   └── commands/              # 命令目录
│       ├── run-yaml-test.md   # 执行测试命令
│       ├── validate-yaml-test.md # 验证测试命令
│       ├── run-test-suite.md  # 执行测试套件命令
│       └── validate-test-suite.md # 验证测试套件命令
├── .env.example               # 环境变量模板
├── .env.dev                   # 开发环境配置
├── .env.test                  # 测试环境配置
├── .env.prod                  # 生产环境配置
├── steps/                     # 可复用步骤库
│   ├── login.yml              # 传统登录步骤库
│   ├── session-persist.yml    # 🆕 持久化会话管理
│   ├── session-check.yml      # 智能会话检查
│   ├── ensure-products-page.yml # 导航到产品页面
│   └── cleanup.yml            # 清理步骤库
├── test-cases/                # 测试用例
│   ├── order.yml              # 订单测试用例
│   ├── sort-optimized.yml     # 会话优化的排序测试
│   └── product-details.yml    # 产品详情测试用例
├── test-suites/               # 测试套件 (新功能)
│   ├── e-commerce.yml         # 电商测试套件
│   ├── smoke-tests.yml        # 冒烟测试套件
│   └── regression.yml         # 回归测试套件
├── screenshots/               # 测试截图（按环境分类）
├── reports/                   # 测试报告（按环境分类）
├── docs/                      # 文档目录
│   ├── en/                    # 英文文档
│   └── cn/                    # 中文文档
├── CLAUDE.md                  # 项目说明和命令索引
└── README.md                  # 主文档
```