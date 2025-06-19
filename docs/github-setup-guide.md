# GitHub Issues 设置指南

本指南帮助你快速在 GitHub 仓库中创建所有必要的 Issues、标签和里程碑。

---

## 🚀 快速开始

### 1. 安装 GitHub CLI

**macOS:**
```bash
brew install gh
```

**Windows:**
```bash
winget install --id GitHub.cli
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install gh

# CentOS/RHEL
sudo yum install gh
```

### 2. 登录 GitHub
```bash
gh auth login
```
选择 GitHub.com，选择 HTTPS，按提示完成认证。

### 3. 验证安装
```bash
gh --version
cd /path/to/your/project
gh repo view  # 应该显示你的仓库信息
```

---

## 📋 创建 Issues 和标签

### 自动创建（推荐）

运行我们提供的自动化脚本：

```bash
# 创建所有内容（标签 + 里程碑 + Issues）
node scripts/create-github-issues.js

# 只创建标签
node scripts/create-github-issues.js --labels-only

# 只创建里程碑
node scripts/create-github-issues.js --milestones-only

# 只创建 Issues
node scripts/create-github-issues.js --issues-only
```

### 手动创建

如果你喜欢手动控制，可以按照以下步骤：

#### 1. 创建标签
```bash
# Epic 相关
gh label create "epic" --description "史诗级任务，包含多个相关功能" --color "B60205"

# 功能类型
gh label create "feature" --description "新功能开发" --color "0052CC"
gh label create "enhancement" --description "功能增强或改进" --color "1D76DB"
gh label create "bug" --description "缺陷修复" --color "D93F0B"

# 工作类型
gh label create "documentation" --description "文档相关工作" --color "0E8A16"
gh label create "testing" --description "测试相关工作" --color "FEF2C0"

# 优先级
gh label create "high-priority" --description "高优先级任务" --color "FF0000"
gh label create "medium-priority" --description "中优先级任务" --color "FBCA04"
gh label create "low-priority" --description "低优先级任务" --color "C2E0C6"

# 其他
gh label create "good-first-issue" --description "适合新手的任务" --color "7057FF"
gh label create "help-wanted" --description "需要帮助的任务" --color "C5DEF5"
```

#### 2. 创建里程碑
```bash
# M1: 基础架构
gh api repos/:owner/:repo/milestones -f title="基础架构 (M1)" -f description="项目结构重构" -f due_on="2025-07-01T23:59:59Z"

# M2: 核心 CLI
gh api repos/:owner/:repo/milestones -f title="核心 CLI (M2)" -f description="CLI 工具基础功能" -f due_on="2025-07-15T23:59:59Z"

# M3: 完整功能
gh api repos/:owner/:repo/milestones -f title="完整功能 (M3)" -f description="所有核心命令实现" -f due_on="2025-08-01T23:59:59Z"

# M4: 发布准备
gh api repos/:owner/:repo/milestones -f title="发布准备 (M4)" -f description="文档和发布配置" -f due_on="2025-08-15T23:59:59Z"

# M5: 质量保证
gh api repos/:owner/:repo/milestones -f title="质量保证 (M5)" -f description="测试和优化" -f due_on="2025-09-01T23:59:59Z"
```

#### 3. 创建 Epic Issues

**Epic 1: 项目结构重构**
```bash
gh issue create \\
  --title "[EPIC] 项目结构重构" \\
  --body "$(cat docs/github-issues.md | sed -n '/### Epic 1/,/### Epic 2/p' | head -n -1)" \\
  --label "epic,enhancement,high-priority"
```

**Epic 2: CLI 工具开发**
```bash
gh issue create \\
  --title "[EPIC] CLI 工具开发" \\
  --body "$(cat docs/github-issues.md | sed -n '/### Epic 2/,/## Feature Issues/p' | head -n -1)" \\
  --label "epic,feature,high-priority"
```

---

## 📊 创建的内容概览

### 标签 (11个)
- `epic` - 史诗级任务
- `feature` - 新功能
- `enhancement` - 功能增强  
- `bug` - 缺陷修复
- `documentation` - 文档
- `testing` - 测试
- `high-priority` - 高优先级
- `medium-priority` - 中优先级
- `low-priority` - 低优先级
- `good-first-issue` - 适合新手
- `help-wanted` - 需要帮助

### 里程碑 (5个)
1. **基础架构 (M1)** - 2025-07-01
2. **核心 CLI (M2)** - 2025-07-15  
3. **完整功能 (M3)** - 2025-08-01
4. **发布准备 (M4)** - 2025-08-15
5. **质量保证 (M5)** - 2025-09-01

### Issues (11个)
1. [EPIC] 项目结构重构
2. [EPIC] CLI 工具开发
3. 重组框架文件结构
4. 创建 claude-test NPM 包项目
5. 实现 claude-test init 命令
6. 实现 claude-test update 命令
7. 实现 claude-test check 命令
8. 增强命令文件自描述能力
9. 配置 NPM 包发布
10. 创建使用文档
11. 编写测试用例
12. 性能和兼容性测试

---

## 🔧 使用建议

### 1. 工作流程
1. 从高优先级的 Epic 开始
2. 将 Epic 分解为具体的 Feature Issues
3. 为每个 Issue 分配到相应的里程碑
4. 使用分支开发，关联 Issue 号
5. 创建 PR 时自动关闭相关 Issue

### 2. 分支命名规范
```bash
feature/issue-3-restructure-files     # 功能分支
bugfix/issue-x-fix-path-error        # 缺陷修复
docs/issue-8-create-documentation    # 文档分支
```

### 3. Commit 消息规范
```bash
feat(cli): implement init command (#3)
fix(scripts): update path references (#1)  
docs(readme): add installation guide (#8)
test(cli): add unit tests for commands (#9)
```

### 4. PR 模板
在 `.github/pull_request_template.md` 中添加：
```markdown
## 相关 Issue
Closes #[issue-number]

## 变更说明
- [ ] 功能实现
- [ ] 测试通过
- [ ] 文档更新

## 测试清单
- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动验证
```

---

## 🎯 下一步行动

1. **运行自动化脚本** 创建所有 Issues 和标签
2. **分配 Issues** 给团队成员或自己
3. **设置项目看板** 可视化跟踪进度
4. **开始开发** 从第一个高优先级 Issue 开始

### 设置项目看板
```bash
# 访问你的 GitHub 仓库
# 点击 "Projects" 选项卡
# 创建新项目，选择 "Board" 模板
# 添加列: Backlog, In Progress, In Review, Done
# 将 Issues 拖拽到相应列中
```

---

## 🆘 故障排除

### GitHub CLI 认证问题
```bash
# 重新登录
gh auth logout
gh auth login

# 检查权限
gh auth status
```

### 脚本执行失败
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 14

# 检查文件权限
chmod +x scripts/create-github-issues.js

# 单步执行
node scripts/create-github-issues.js --labels-only
```

### API 限制问题
如果遇到 GitHub API 限制，可以：
1. 等待一段时间后重试
2. 分批创建（使用 `--labels-only` 等选项）
3. 检查 API 限制状态：`gh api rate_limit`

---

## 📞 获取帮助

- GitHub CLI 文档: https://cli.github.com/manual/
- GitHub Issues 指南: https://docs.github.com/en/issues
- 项目维护者: [你的联系方式]