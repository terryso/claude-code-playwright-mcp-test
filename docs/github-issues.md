# GitHub Issues 创建指南

本文档包含了将用户故事转换为 GitHub Issues 的详细内容。

---

## Issue 模板和标签

### 建议的 GitHub 标签
- `epic` - 史诗级任务
- `feature` - 新功能
- `enhancement` - 功能增强
- `bug` - 缺陷修复
- `documentation` - 文档相关
- `testing` - 测试相关
- `high-priority` - 高优先级
- `medium-priority` - 中优先级
- `low-priority` - 低优先级
- `good-first-issue` - 适合新手

---

## Epic Issues

### Epic 1: 项目结构重构
```
Title: [EPIC] 项目结构重构
Labels: epic, enhancement, high-priority

## 目标
将所有框架文件整理到 `.claude` 目录下，避免与用户项目文件冲突并便于管理。

## 包含的用户故事
- #[issue-number] 重组框架文件结构

## 验收标准
- [ ] 所有框架文件移动到 `.claude/` 目录
- [ ] 更新所有路径引用
- [ ] 确保现有功能正常运行
- [ ] 通过所有测试用例

## 预估时间
2-3 天
```

### Epic 2: CLI 工具开发
```
Title: [EPIC] CLI 工具开发
Labels: epic, feature, high-priority

## 目标
创建 `claude-test` CLI 工具，提供 init/update/check 等核心命令。

## 包含的用户故事
- #[issue-number] 创建 claude-test NPM 包项目
- #[issue-number] 实现 claude-test init 命令
- #[issue-number] 实现 claude-test update 命令
- #[issue-number] 实现 claude-test check 命令

## 验收标准
- [ ] NPM 包项目创建完成
- [ ] 所有核心命令实现并测试通过
- [ ] CLI 工具可以正常安装和使用
- [ ] 用户体验良好

## 预估时间
1-2 周
```

---

## Feature Issues

### Issue 1: 重组框架文件结构
```
Title: 重组框架文件结构
Labels: feature, enhancement, high-priority

## 用户故事
**作为** 框架维护者  
**我希望** 将所有框架文件整理到 `.claude` 目录下  
**以便** 避免与用户项目文件冲突并便于管理

## 验收标准
- [ ] 将 `scripts/` 目录移动到 `.claude/scripts/`
- [ ] 保持 `.claude/commands/` 目录不变
- [ ] 更新所有命令文件中的脚本路径引用 (`scripts/` → `.claude/scripts/`)
- [ ] 确保所有现有功能正常运行

## 任务分解
- [ ] 移动 scripts 目录
- [ ] 批量更新 `.claude/commands/*.md` 文件中的路径
- [ ] 更新 CLAUDE.md 中的路径引用
- [ ] 运行测试确保功能正常

## 预估时间
4-6 小时

## 相关文件
- `scripts/` → `.claude/scripts/`
- `.claude/commands/*.md`
- `CLAUDE.md`
```

### Issue 2: 创建 claude-test NPM 包项目
```
Title: 创建 claude-test NPM 包项目
Labels: feature, high-priority

## 用户故事
**作为** 开发者  
**我希望** 创建一个新的 NPM 包项目  
**以便** 发布和分发测试框架

## 验收标准
- [ ] 创建新的 NPM 包项目 `claude-test`
- [ ] 配置 package.json 和基本项目结构
- [ ] 设置 CLI 入口点和基本命令结构
- [ ] 添加项目文档和使用说明

## 任务分解
- [ ] 初始化 NPM 项目
- [ ] 配置 package.json
- [ ] 创建 CLI 入口文件
- [ ] 设置基本命令框架

## 预估时间
1-2 天

## 技术要求
- Node.js 14+
- Commander.js for CLI
- fs-extra for file operations
```

### Issue 3: 实现 claude-test init 命令
```
Title: 实现 claude-test init 命令
Labels: feature, high-priority

## 用户故事
**作为** 项目使用者  
**我希望** 通过 `claude-test init` 命令  
**以便** 快速在我的项目中初始化测试框架

## 验收标准
- [ ] 复制 `.claude/` 目录到目标项目
- [ ] 创建 `.claude/.framework-version` 文件记录版本
- [ ] 不复制 CLAUDE.md（避免冲突）
- [ ] 提供初始化成功的确认信息

## 任务分解
- [ ] 实现文件复制逻辑
- [ ] 创建版本管理机制
- [ ] 添加错误处理
- [ ] 编写使用文档

## 预估时间
2-3 天

## 测试用例
- [ ] 在空目录中初始化
- [ ] 在已有项目中初始化
- [ ] 重复初始化的处理
- [ ] 权限不足的错误处理
```

### Issue 4: 实现 claude-test update 命令
```
Title: 实现 claude-test update 命令
Labels: feature, medium-priority

## 用户故事
**作为** 项目使用者  
**我希望** 通过 `claude-test update` 命令  
**以便** 更新框架到最新版本

## 验收标准
- [ ] 检查当前框架版本
- [ ] 下载并覆盖框架文件
- [ ] 更新版本记录
- [ ] 提供更新前后的版本对比信息

## 任务分解
- [ ] 实现版本检查逻辑
- [ ] 实现文件更新逻辑
- [ ] 添加备份机制
- [ ] 处理更新冲突

## 预估时间
2-3 天

## 依赖
- 依赖 Issue #[init-issue-number] 完成
```

### Issue 5: 实现 claude-test check 命令
```
Title: 实现 claude-test check 命令
Labels: feature, medium-priority

## 用户故事
**作为** 项目使用者  
**我希望** 通过 `claude-test check` 命令  
**以便** 检查当前框架版本和状态

## 验收标准
- [ ] 显示当前框架版本
- [ ] 检查是否有新版本可用
- [ ] 验证框架文件完整性
- [ ] 提供框架状态报告

## 任务分解
- [ ] 实现版本查询逻辑
- [ ] 实现文件完整性检查
- [ ] 添加远程版本检查
- [ ] 格式化输出信息

## 预估时间
1-2 天
```

---

## Enhancement Issues

### Issue 6: 增强命令文件自描述能力
```
Title: 增强命令文件自描述能力
Labels: enhancement, documentation, medium-priority

## 用户故事
**作为** 框架使用者  
**我希望** 每个命令文件都包含完整的使用说明  
**以便** 不依赖外部文档就能理解和使用命令

## 验收标准
- [ ] 每个 `.claude/commands/*.md` 文件包含完整说明
- [ ] 移除对 CLAUDE.md 的依赖
- [ ] 确保每个命令都是自包含的
- [ ] 统一命令文档格式

## 任务分解
- [ ] 分析现有命令文件
- [ ] 补充缺失的说明内容
- [ ] 统一文档格式
- [ ] 验证命令可用性

## 预估时间
1-2 天

## 影响的文件
- `.claude/commands/run-yaml-test.md`
- `.claude/commands/validate-yaml-test.md`
- `.claude/commands/run-test-suite.md`
- `.claude/commands/validate-test-suite.md`
```

---

## Documentation Issues

### Issue 7: 配置 NPM 包发布
```
Title: 配置 NPM 包发布
Labels: documentation, enhancement, low-priority

## 用户故事
**作为** 框架维护者  
**我希望** 配置自动化发布流程  
**以便** 轻松发布新版本到 NPM

## 验收标准
- [ ] 配置 npm publish 相关设置
- [ ] 设置版本管理策略
- [ ] 添加发布前检查
- [ ] 配置 CI/CD 自动发布

## 任务分解
- [ ] 配置 package.json 发布信息
- [ ] 设置 npm 发布权限
- [ ] 编写发布脚本
- [ ] 测试发布流程

## 预估时间
1 天
```

### Issue 8: 创建使用文档
```
Title: 创建使用文档
Labels: documentation, low-priority

## 用户故事
**作为** 框架使用者  
**我希望** 有清晰的使用文档  
**以便** 快速上手和解决问题

## 验收标准
- [ ] 编写快速开始指南
- [ ] 提供详细的命令参考
- [ ] 添加常见问题解答
- [ ] 包含实际使用示例

## 任务分解
- [ ] 编写 README.md
- [ ] 创建使用示例
- [ ] 编写故障排除指南
- [ ] 添加贡献指南

## 预估时间
2-3 天
```

---

## Testing Issues

### Issue 9: 编写测试用例
```
Title: 编写测试用例
Labels: testing, enhancement, medium-priority

## 用户故事
**作为** 框架维护者  
**我希望** 为 CLI 工具编写完整的测试用例  
**以便** 确保功能稳定性

## 验收标准
- [ ] 为所有命令编写单元测试
- [ ] 添加集成测试
- [ ] 实现测试覆盖率报告
- [ ] 配置持续集成测试

## 任务分解
- [ ] 设置测试框架
- [ ] 编写命令测试用例
- [ ] 添加文件操作测试
- [ ] 配置 CI 测试流程

## 预估时间
3-4 天

## 技术要求
- Jest or Mocha 测试框架
- 测试覆盖率 > 80%
```

### Issue 10: 性能和兼容性测试
```
Title: 性能和兼容性测试
Labels: testing, enhancement, low-priority

## 用户故事
**作为** 框架维护者  
**我希望** 确保 CLI 工具在不同环境下正常工作  
**以便** 提供可靠的用户体验

## 验收标准
- [ ] 测试不同操作系统兼容性
- [ ] 验证 Node.js 版本兼容性
- [ ] 测试大项目的性能表现
- [ ] 验证错误处理机制

## 任务分解
- [ ] 设置多环境测试
- [ ] 性能基准测试
- [ ] 错误场景测试
- [ ] 兼容性验证

## 预估时间
2-3 天
```

---

## 里程碑规划

### Milestone 1: 基础架构 (M1)
- Issue #1: 重组框架文件结构
- 预计完成时间: 1 周

### Milestone 2: 核心 CLI (M2)
- Issue #2: 创建 claude-test NPM 包项目
- Issue #3: 实现 claude-test init 命令
- 预计完成时间: 2 周

### Milestone 3: 完整功能 (M3)
- Issue #4: 实现 claude-test update 命令
- Issue #5: 实现 claude-test check 命令
- Issue #6: 增强命令文件自描述能力
- 预计完成时间: 3 周

### Milestone 4: 发布准备 (M4)
- Issue #7: 配置 NPM 包发布
- Issue #8: 创建使用文档
- 预计完成时间: 4 周

### Milestone 5: 质量保证 (M5)
- Issue #9: 编写测试用例
- Issue #10: 性能和兼容性测试
- 预计完成时间: 5-6 周