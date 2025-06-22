#!/usr/bin/env node

/**
 * GitHub Issues 创建脚本
 * 
 * 使用方法:
 * 1. 安装 GitHub CLI: https://cli.github.com/
 * 2. 登录 GitHub: gh auth login
 * 3. 运行脚本: node scripts/create-github-issues.js
 * 
 * 或者手动创建标签: node scripts/create-github-issues.js --labels-only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// GitHub 标签配置
const LABELS = [
  { name: 'epic', color: 'B60205', description: '史诗级任务，包含多个相关功能' },
  { name: 'feature', color: '0052CC', description: '新功能开发' },
  { name: 'enhancement', color: '1D76DB', description: '功能增强或改进' },
  { name: 'bug', color: 'D93F0B', description: '缺陷修复' },
  { name: 'documentation', color: '0E8A16', description: '文档相关工作' },
  { name: 'testing', color: 'FEF2C0', description: '测试相关工作' },
  { name: 'high-priority', color: 'FF0000', description: '高优先级任务' },
  { name: 'medium-priority', color: 'FBCA04', description: '中优先级任务' },
  { name: 'low-priority', color: 'C2E0C6', description: '低优先级任务' },
  { name: 'good-first-issue', color: '7057FF', description: '适合新手的任务' },
  { name: 'help-wanted', color: 'C5DEF5', description: '需要帮助的任务' }
];

// Issues 配置
const ISSUES = [
  // Epic Issues
  {
    title: '[EPIC] 项目结构重构',
    body: `## 目标
将所有框架文件整理到 \`.claude\` 目录下，避免与用户项目文件冲突并便于管理。

## 包含的用户故事
- 重组框架文件结构

## 验收标准
- [ ] 所有框架文件移动到 \`.claude/\` 目录
- [ ] 更新所有路径引用
- [ ] 确保现有功能正常运行
- [ ] 通过所有测试用例

## 预估时间
2-3 天`,
    labels: ['epic', 'enhancement', 'high-priority'],
    milestone: '基础架构 (M1)'
  },
  
  {
    title: '[EPIC] CLI 工具开发',
    body: `## 目标
创建 \`claude-test\` CLI 工具，提供 init/update/check 等核心命令。

## 包含的用户故事
- 创建 claude-test NPM 包项目
- 实现 claude-test init 命令
- 实现 claude-test update 命令
- 实现 claude-test check 命令

## 验收标准
- [ ] NPM 包项目创建完成
- [ ] 所有核心命令实现并测试通过
- [ ] CLI 工具可以正常安装和使用
- [ ] 用户体验良好

## 预估时间
1-2 周`,
    labels: ['epic', 'feature', 'high-priority'],
    milestone: '核心 CLI (M2)'
  },

  // Feature Issues
  {
    title: '重组框架文件结构',
    body: `## 用户故事
**作为** 框架维护者  
**我希望** 将所有框架文件整理到 \`.claude\` 目录下  
**以便** 避免与用户项目文件冲突并便于管理

## 验收标准
- [ ] 将 \`scripts/\` 目录移动到 \`.claude/scripts/\`
- [ ] 保持 \`.claude/commands/\` 目录不变
- [ ] 更新所有命令文件中的脚本路径引用 (\`scripts/\` → \`.claude/scripts/\`)
- [ ] 确保所有现有功能正常运行

## 任务分解
- [ ] 移动 scripts 目录
- [ ] 批量更新 \`.claude/commands/*.md\` 文件中的路径
- [ ] 更新 CLAUDE.md 中的路径引用
- [ ] 运行测试确保功能正常

## 预估时间
4-6 小时

## 相关文件
- \`scripts/\` → \`.claude/scripts/\`
- \`.claude/commands/*.md\`
- \`CLAUDE.md\``,
    labels: ['feature', 'enhancement', 'high-priority'],
    milestone: '基础架构 (M1)'
  },

  {
    title: '创建 claude-test NPM 包项目',
    body: `## 用户故事
**作为** 开发者  
**我希望** 创建一个新的 NPM 包项目  
**以便** 发布和分发测试框架

## 验收标准
- [ ] 创建新的 NPM 包项目 \`claude-test\`
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
- fs-extra for file operations`,
    labels: ['feature', 'high-priority'],
    milestone: '核心 CLI (M2)'
  },

  {
    title: '实现 claude-test init 命令',
    body: `## 用户故事
**作为** 项目使用者  
**我希望** 通过 \`claude-test init\` 命令  
**以便** 快速在我的项目中初始化测试框架

## 验收标准
- [ ] 复制 \`.claude/\` 目录到目标项目
- [ ] 创建 \`.claude/.framework-version\` 文件记录版本
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
- [ ] 权限不足的错误处理`,
    labels: ['feature', 'high-priority'],
    milestone: '核心 CLI (M2)'
  },

  {
    title: '实现 claude-test update 命令',
    body: `## 用户故事
**作为** 项目使用者  
**我希望** 通过 \`claude-test update\` 命令  
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
- 依赖 init 命令完成`,
    labels: ['feature', 'medium-priority'],
    milestone: '完整功能 (M3)'
  },

  {
    title: '实现 claude-test check 命令',
    body: `## 用户故事
**作为** 项目使用者  
**我希望** 通过 \`claude-test check\` 命令  
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
1-2 天`,
    labels: ['feature', 'medium-priority'],
    milestone: '完整功能 (M3)'
  },

  {
    title: '增强命令文件自描述能力',
    body: `## 用户故事
**作为** 框架使用者  
**我希望** 每个命令文件都包含完整的使用说明  
**以便** 不依赖外部文档就能理解和使用命令

## 验收标准
- [ ] 每个 \`.claude/commands/*.md\` 文件包含完整说明
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
- \`.claude/commands/run-yaml-test.md\`
- \`.claude/commands/validate-yaml-test.md\`
- \`.claude/commands/run-test-suite.md\`
- \`.claude/commands/validate-test-suite.md\``,
    labels: ['enhancement', 'documentation', 'medium-priority'],
    milestone: '完整功能 (M3)'
  },

  {
    title: '配置 NPM 包发布',
    body: `## 用户故事
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
1 天`,
    labels: ['documentation', 'enhancement', 'low-priority'],
    milestone: '发布准备 (M4)'
  },

  {
    title: '创建使用文档',
    body: `## 用户故事
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
2-3 天`,
    labels: ['documentation', 'low-priority'],
    milestone: '发布准备 (M4)'
  },

  {
    title: '编写测试用例',
    body: `## 用户故事
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
- 测试覆盖率 > 80%`,
    labels: ['testing', 'enhancement', 'medium-priority'],
    milestone: '质量保证 (M5)'
  },

  {
    title: '性能和兼容性测试',
    body: `## 用户故事
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
2-3 天`,
    labels: ['testing', 'enhancement', 'low-priority'],
    milestone: '质量保证 (M5)'
  }
];

// 检查 GitHub CLI 是否可用
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('❌ GitHub CLI 未安装或未配置');
    console.error('请先安装 GitHub CLI: https://cli.github.com/');
    console.error('然后运行: gh auth login');
    return false;
  }
}

// 创建标签
function createLabels() {
  console.log('🏷️  创建 GitHub 标签...');
  
  for (const label of LABELS) {
    try {
      const command = `gh label create "${label.name}" --description "${label.description}" --color "${label.color}"`;
      execSync(command, { stdio: 'pipe' });
      console.log(`✅ 标签创建成功: ${label.name}`);
    } catch (error) {
      // 标签可能已存在
      console.log(`⚠️  标签可能已存在: ${label.name}`);
    }
  }
}

// 创建里程碑
function createMilestones() {
  console.log('🎯 创建里程碑...');
  
  const milestones = [
    { title: '基础架构 (M1)', description: '项目结构重构', due_date: '2025-07-01' },
    { title: '核心 CLI (M2)', description: 'CLI 工具基础功能', due_date: '2025-07-15' },
    { title: '完整功能 (M3)', description: '所有核心命令实现', due_date: '2025-08-01' },
    { title: '发布准备 (M4)', description: '文档和发布配置', due_date: '2025-08-15' },
    { title: '质量保证 (M5)', description: '测试和优化', due_date: '2025-09-01' }
  ];

  for (const milestone of milestones) {
    try {
      const command = `gh api repos/:owner/:repo/milestones -f title="${milestone.title}" -f description="${milestone.description}" -f due_on="${milestone.due_date}T23:59:59Z"`;
      execSync(command, { stdio: 'pipe' });
      console.log(`✅ 里程碑创建成功: ${milestone.title}`);
    } catch (error) {
      console.log(`⚠️  里程碑可能已存在: ${milestone.title}`);
    }
  }
}

// 创建 Issues
async function createIssues() {
  console.log('📋 创建 GitHub Issues...');
  
  for (let i = 0; i < ISSUES.length; i++) {
    const issue = ISSUES[i];
    const labels = issue.labels.join(',');
    
    try {
      // 创建临时文件存储 issue body
      const tempFile = `/tmp/issue-body-${i}.md`;
      fs.writeFileSync(tempFile, issue.body);
      
      const command = `gh issue create --title "${issue.title}" --body-file "${tempFile}" --label "${labels}"`;
      const result = execSync(command, { encoding: 'utf8' });
      
      console.log(`✅ Issue 创建成功: ${issue.title}`);
      console.log(`   URL: ${result.trim()}`);
      
      // 清理临时文件
      fs.unlinkSync(tempFile);
      
      // 添加延迟避免 API 限制
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Issue 创建失败: ${issue.title}`);
      console.error(error.message);
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const labelsOnly = args.includes('--labels-only');
  const issuesOnly = args.includes('--issues-only');
  const milestonesOnly = args.includes('--milestones-only');

  if (!checkGitHubCLI()) {
    process.exit(1);
  }

  console.log('🚀 开始创建 GitHub Issues 和标签...');
  
  try {
    if (labelsOnly) {
      createLabels();
    } else if (issuesOnly) {
      createIssues();
    } else if (milestonesOnly) {
      createMilestones();
    } else {
      // 创建所有内容
      createLabels();
      console.log('');
      createMilestones();
      console.log('');
      await createIssues();
    }
    
    console.log('');
    console.log('🎉 完成！你可以在 GitHub 仓库中查看创建的 Issues 和标签。');
    console.log('💡 提示: 你可以手动调整 Issues 的里程碑分配。');
    
  } catch (error) {
    console.error('❌ 执行过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 添加 Promise 支持
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  LABELS,
  ISSUES,
  createLabels,
  createMilestones,
  createIssues
};