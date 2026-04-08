// SessionStart Hook - 开工先看项目状态
// 在每次启动 Claude Code 会话时自动触发

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  onSessionStart: async (context) => {
    // 收集项目状态信息
    const projectStatus = await collectProjectStatus(context);

    // 生成状态报告并输出
    const report = generateStatusReport(projectStatus);

    console.log('\n' + '='.repeat(60));
    console.log('📋 项目状态面板 - Session Start');
    console.log('='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    console.log('💡 提示：使用 /start 查看项目概览，/progress 查看进度分析');
    console.log('');

    return context;
  }
};

/**
 * 收集项目状态信息
 */
async function collectProjectStatus(context) {
  const projectRoot = context.workingDirectory || process.cwd();
  const status = {
    git: null,
    todos: [],
    timestamp: new Date().toISOString()
  };

  // 1. 收集 Git 状态
  try {
    status.git = collectGitStatus(projectRoot);
  } catch (error) {
    status.git = { error: '非 Git 仓库或 Git 不可用' };
  }

  // 2. 加载待办事项
  status.todos = loadTodoItems(projectRoot);

  return status;
}

/**
 * 收集 Git 状态信息
 */
function collectGitStatus(projectRoot) {
  const gitStatus = {
    branch: 'unknown',
    changedFiles: [],
    uncommittedCount: 0
  };

  try {
    // 获取当前分支
    gitStatus.branch = execSync('git branch --show-current', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    // 获取仓库状态
    const statusOutput = execSync('git status --porcelain', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    // 解析变更文件
    const lines = statusOutput.split('\n').filter(line => line.trim());
    gitStatus.uncommittedCount = lines.length;

    gitStatus.changedFiles = lines.map(line => {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3).trim();

      let statusText = '';
      if (status === 'M') statusText = '修改';
      else if (status === 'A') statusText = '新增';
      else if (status === 'D') statusText = '删除';
      else if (status === 'R') statusText = '重命名';
      else if (status === '??') statusText = '未跟踪';
      else statusText = status;

      return { file, status: statusText };
    });

    // 获取最近提交
    try {
      const lastCommit = execSync('git log -1 --format="%h %s"', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
      gitStatus.lastCommit = lastCommit;
    } catch (e) {
      // 忽略
    }

  } catch (error) {
    gitStatus.error = error.message;
  }

  return gitStatus;
}

/**
 * 加载待办事项
 */
function loadTodoItems(projectRoot) {
  const todos = [];
  const todoPaths = [
    path.join(projectRoot, '.claude', 'todos.md'),
    path.join(projectRoot, 'TODO.md'),
    path.join(projectRoot, 'docs', '待办清单.md'),
    path.join(projectRoot, '.claude', 'templates', '待办清单模板.md')
  ];

  for (const todoPath of todoPaths) {
    if (fs.existsSync(todoPath)) {
      try {
        const content = fs.readFileSync(todoPath, 'utf8');
        // 解析 Markdown 中的待办事项 [-] 或 [ ]
        const todoLines = content.split('\n').filter(line => {
          return line.match(/[-*]\s*\[[-x ]\]/i);
        });

        todoLines.slice(0, 10).forEach(line => {
          const isDone = line.match(/\[x\]/i);
          const isPending = line.match(/\[-\]/i) || line.match(/\[ \]/i);

          if (isPending || !isDone) {
            todos.push({
              text: line.replace(/^[-*]\s*\[[-x ]\]\s*/i, '').trim(),
              done: !!isDone
            });
          }
        });

        if (todos.length > 0) {
          todos.source = todoPath;
          break;
        }
      } catch (error) {
        // 忽略读取错误
      }
    }
  }

  // 如果没有找到待办文件，尝试从代码中扫描 TODO/FIXME
  if (todos.length === 0) {
    try {
      const codeTodos = scanCodeForTodos(projectRoot);
      if (codeTodos.length > 0) {
        todos.push(...codeTodos.slice(0, 5));
        todos.source = '代码扫描';
      }
    } catch (error) {
      // 忽略
    }
  }

  return todos;
}

/**
 * 扫描代码中的 TODO/FIXME 注释
 */
function scanCodeForTodos(projectRoot) {
  const todos = [];
  const excludeDirs = ['node_modules', '.git', 'target', 'dist', 'build'];
  const includeExtensions = ['.java', '.js', '.ts', '.vue', '.py', '.go', '.rs'];

  function scanDir(dir) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      return;
    }

    for (const file of files) {
      const fullPath = path.join(dir, file);

      // 跳过排除目录
      if (fs.statSync(fullPath).isDirectory()) {
        if (!excludeDirs.includes(file)) {
          scanDir(fullPath);
        }
        continue;
      }

      // 检查扩展名
      const ext = path.extname(file);
      if (!includeExtensions.includes(ext)) continue;

      // 读取文件内容
      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (e) {
        continue;
      }

      // 查找 TODO/FIXME
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const todoMatch = line.match(/\/\/\s*(TODO|FIXME|XXX|HACK):\s*(.+)/i);
        if (todoMatch) {
          todos.push({
            text: `${todoMatch[2]} (${path.relative(projectRoot, fullPath)}:${i + 1})`,
            done: false
          });
          if (todos.length >= 10) return todos;
        }
      }
    }
  }

  scanDir(projectRoot);
  return todos;
}

/**
 * 生成状态报告
 */
function generateStatusReport(status) {
  const lines = [];

  // Git 状态
  lines.push('\n📦 Git 状态');
  lines.push('-'.repeat(40));
  if (status.git && !status.git.error) {
    lines.push(`  分支：${status.git.branch || 'HEAD'}`);
    if (status.git.lastCommit) {
      lines.push(`  最近提交：${status.git.lastCommit}`);
    }
    lines.push(`  未提交变更：${status.git.uncommittedCount} 个文件`);

    if (status.git.changedFiles.length > 0) {
      lines.push('  变更文件:');
      status.git.changedFiles.slice(0, 8).forEach(f => {
        lines.push(`    [${f.status}] ${f.file}`);
      });
      if (status.git.changedFiles.length > 8) {
        lines.push(`    ... 还有 ${status.git.changedFiles.length - 8} 个文件`);
      }
    }
  } else {
    lines.push(`  ${status.git?.error || '无法获取 Git 状态'}`);
  }

  // 待办事项
  lines.push('\n📝 待办事项');
  lines.push('-'.repeat(40));
  if (status.todos.length > 0) {
    const source = status.todos.source || '未知';
    lines.push(`  来源：${source}`);
    lines.push('');
    status.todos.slice(0, 5).forEach((todo, idx) => {
      const prefix = todo.done ? '  ✓' : '  ○';
      lines.push(`${prefix} ${todo.text}`);
    });
    if (status.todos.length > 5) {
      lines.push(`  ... 还有 ${status.todos.length - 5} 项待办`);
    }
  } else {
    lines.push('  暂无待办事项');
    lines.push('  💡 使用 /add-todo 添加新任务');
  }

  // 快捷命令菜单
  lines.push('\n⚡ 快捷命令菜单');
  lines.push('-'.repeat(40));
  lines.push('  /start        - 项目快速了解');
  lines.push('  /dev          - 完整功能开发');
  lines.push('  /crud         - 快速 CRUD 生成');
  lines.push('  /check        - 代码规范检查');
  lines.push('  /progress     - 项目进度分析');
  lines.push('  /next         - 下一步建议');
  lines.push('  /sync         - 全量状态同步');
  lines.push('  /update-status - 增量状态更新');
  lines.push('  /add-todo     - 添加待办事项');
  lines.push('  /init-docs    - 文档初始化');

  return lines.join('\n');
}
