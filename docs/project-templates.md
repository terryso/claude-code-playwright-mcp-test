# GitHub 项目模板

本文档提供了在创建 Issues 时可以复制粘贴的模板内容。

---

## Issue 模板

### Epic Issue 模板
```markdown
## 目标
[描述这个 Epic 要达成的主要目标]

## 包含的用户故事
- [ ] [用户故事1]
- [ ] [用户故事2]
- [ ] [用户故事3]

## 验收标准
- [ ] [验收标准1]
- [ ] [验收标准2]
- [ ] [验收标准3]

## 预估时间
[时间估算]

## 依赖
[列出依赖的其他 Epic 或 Issue]
```

### Feature Issue 模板
```markdown
## 用户故事
**作为** [用户角色]  
**我希望** [功能描述]  
**以便** [价值说明]

## 验收标准
- [ ] [验收标准1]
- [ ] [验收标准2]
- [ ] [验收标准3]

## 任务分解
- [ ] [任务1]
- [ ] [任务2]
- [ ] [任务3]

## 预估时间
[时间估算]

## 技术要求
- [技术要求1]
- [技术要求2]

## 测试用例
- [ ] [测试场景1]
- [ ] [测试场景2]

## 相关文件
- [文件路径1]
- [文件路径2]
```

### Bug Issue 模板
```markdown
## 问题描述
[简要描述问题]

## 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 预期行为
[描述预期的正确行为]

## 实际行为
[描述实际发生的错误行为]

## 环境信息
- 操作系统: [Windows/macOS/Linux]
- Node.js 版本: [版本号]
- 项目版本: [版本号]

## 错误日志
```
[粘贴错误日志]
```

## 可能的解决方案
[如果有想法，可以描述可能的解决方案]
```

---

## Pull Request 模板

### 功能 PR 模板
```markdown
## 相关 Issue
Closes #[issue-number]

## 变更说明
[描述这次变更的内容和原因]

## 变更类型
- [ ] 新功能 (feature)
- [ ] 缺陷修复 (bugfix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)

## 测试清单
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试验证
- [ ] 文档已更新

## 截图/演示
[如果有 UI 变更，请提供截图或 GIF]

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自我 Code Review 完成
- [ ] 相关文档已更新
- [ ] 没有引入新的警告
```

---

## 项目看板配置

### 推荐的看板列配置

1. **📋 Backlog** - 待开发的 Issues
2. **🏗️ In Progress** - 正在开发中
3. **👀 In Review** - 代码审查中
4. **✅ Done** - 已完成

### 自动化规则建议

```yaml
# .github/workflows/project-automation.yml
name: Project Automation
on:
  issues:
    types: [opened, assigned]
  pull_request:
    types: [opened, closed]

jobs:
  automate_project:
    runs-on: ubuntu-latest
    steps:
      - name: Move new issues to Backlog
        if: github.event.action == 'opened'
        run: |
          # 使用 GitHub API 将新 Issue 移动到 Backlog 列
          
      - name: Move assigned issues to In Progress
        if: github.event.action == 'assigned'
        run: |
          # 将分配的 Issue 移动到 In Progress 列
          
      - name: Move PR to In Review
        if: github.event.pull_request.action == 'opened'
        run: |
          # 将 PR 对应的 Issue 移动到 In Review 列
```

---

## Milestone 描述模板

### M1: 基础架构
```
项目结构重构阶段，为后续开发奠定基础。

主要目标:
- 重组文件结构
- 统一路径引用
- 确保现有功能正常

交付成果:
- scripts 目录移动到 .claude 下
- 所有路径引用更新完成
- 功能验证通过
```

### M2: 核心 CLI
```
开发 claude-test CLI 工具的核心功能。

主要目标:
- 创建 NPM 包项目
- 实现 init 命令
- 建立基础架构

交付成果:
- 可安装的 NPM 包
- 功能完整的 init 命令
- 基础 CLI 框架
```

---

## 标签使用指南

### 标签组合建议

**Epic 相关:**
- `epic` + `high-priority` + `feature/enhancement`

**高优先级功能:**
- `feature` + `high-priority`

**中等优先级增强:**
- `enhancement` + `medium-priority`

**文档任务:**
- `documentation` + `low-priority` + `good-first-issue`

**测试任务:**
- `testing` + `medium-priority`

**紧急修复:**
- `bug` + `high-priority`

### 标签含义说明

| 标签 | 含义 | 使用场景 |
|------|------|----------|
| `epic` | 大型任务，包含多个子任务 | 重大功能开发 |
| `feature` | 新功能开发 | 添加新能力 |
| `enhancement` | 现有功能改进 | 优化体验 |
| `bug` | 缺陷修复 | 解决问题 |
| `documentation` | 文档相关 | 写作任务 |
| `testing` | 测试相关 | 质量保证 |
| `good-first-issue` | 适合新手 | 入门任务 |
| `help-wanted` | 需要帮助 | 寻求协助 |

---

## 工作流程模板

### 开发流程

1. **选择 Issue**
   ```bash
   # 查看可用的 Issues
   gh issue list --label "good-first-issue"
   
   # 分配给自己
   gh issue edit [issue-number] --add-assignee @me
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/issue-[number]-[brief-description]
   ```

3. **开发和提交**
   ```bash
   git add .
   git commit -m "feat(cli): implement init command (#3)"
   ```

4. **创建 PR**
   ```bash
   gh pr create --title "feat(cli): implement init command" --body "Closes #3"
   ```

5. **合并后清理**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/issue-3-init-command
   ```

### Code Review 检查清单

**功能检查:**
- [ ] 功能按预期工作
- [ ] 错误处理适当
- [ ] 用户体验良好

**代码质量:**
- [ ] 代码清晰易读
- [ ] 遵循项目规范
- [ ] 没有重复代码

**测试覆盖:**
- [ ] 关键路径有测试
- [ ] 边界情况考虑
- [ ] 测试用例通过

**文档更新:**
- [ ] README 更新
- [ ] API 文档更新
- [ ] 变更日志记录