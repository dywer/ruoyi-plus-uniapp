// Stop Hook - 总结反馈 + 下一步建议
// 任务完成时的清理、通知和智能推荐

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 音效文件路径
const AUDIO_COMPLETED = path.join(__dirname, '..', 'audio', 'completed.wav');

// 下一步推荐规则
const NEXT_STEP_RULES = [
  {
    trigger: ['controller', 'api', '接口'],
    recommendation: '📝 建议下一步：编写单元测试验证 API 功能',
    command: 'mvn test -Dtest=YourControllerTest'
  },
  {
    trigger: ['service', '服务'],
    recommendation: '🔍 建议下一步：检查 Service 层事务注解 @Transactional',
    command: null
  },
  {
    trigger: ['mapper', 'dao', 'repository'],
    recommendation: '💾 建议下一步：验证 SQL 映射文件是否正确',
    command: null
  },
  {
    trigger: ['entity', 'domain', '实体', '表'],
    recommendation: '🏗️ 建议下一步：检查实体类是否继承 TenantEntity（多租户支持）',
    command: null
  },
  {
    trigger: ['vue', 'component', '前端', '页面'],
    recommendation: '🎨 建议下一步：运行 ESLint 检查代码规范',
    command: 'npm run lint'
  },
  {
    trigger: ['test', 'spec', '测试'],
    recommendation: '✅ 建议下一步：执行测试套件',
    command: 'mvn test'
  },
  {
    trigger: ['config', '配置'],
    recommendation: '⚙️ 建议下一步：验证配置是否已添加到版本控制',
    command: 'git status'
  },
  {
    trigger: ['sql', 'migration', '数据库脚本'],
    recommendation: '🗄️ 建议下一步：执行数据库迁移脚本',
    command: null
  }
];

// Windows 下常见的误创建文件
const TEMP_FILES_TO_CLEAN = [
  'nul',
  'nul.txt',
  'con',
  'con.txt',
  'prn',
  'aux',
  '*.tmp',
  '.tmp'
];

module.exports = {
  /**
   * 任务完成时的处理
   */
  onStop: async (context) => {
    console.log('\n' + '='.repeat(70));
    console.log('✅ 任务完成 - 执行清理和总结');
    console.log('='.repeat(70));

    // 1. 播放完成音效
    playCompletedSound();

    // 2. 分析代码变更
    const changeAnalysis = analyzeCodeChanges(context);

    // 3. 生成任务总结
    const summary = generateTaskSummary(context, changeAnalysis);

    // 4. 智能推荐下一步操作
    const nextSteps = recommendNextSteps(context, changeAnalysis);

    // 5. 清理临时文件
    const cleanedFiles = cleanupTempFiles();

    // 6. 输出完整报告
    printCompleteReport(summary, nextSteps, cleanedFiles);

    console.log('='.repeat(70));
    console.log('');

    return context;
  }
};

/**
 * 播放完成音效
 */
function playCompletedSound() {
  try {
    // 检查音效文件是否存在
    if (fs.existsSync(AUDIO_COMPLETED)) {
      // macOS 使用 afplay
      if (process.platform === 'darwin') {
        execSync(`afplay "${AUDIO_COMPLETED}"`, { stdio: 'ignore', detached: true });
        console.log('🔔 完成音效已播放');
      }
      // Windows 使用 powershell
      else if (process.platform === 'win32') {
        execSync(`powershell -c "New-Object System.Media.SoundPlayer('${AUDIO_COMPLETED.replace(/\\/g, '\\\\')}').PlaySync()"`, { stdio: 'ignore', detached: true });
        console.log('🔔 完成音效已播放');
      }
      // Linux 使用 aplay
      else {
        execSync(`aplay "${AUDIO_COMPLETED}"`, { stdio: 'ignore', detached: true });
        console.log('🔔 完成音效已播放');
      }
    } else {
      console.log('📢 音效文件不存在，跳过播放');
    }
  } catch (error) {
    console.log('📢 音效播放失败:', error.message);
  }
}

/**
 * 分析代码变更
 */
function analyzeCodeChanges(context) {
  const analysis = {
    createdFiles: [],
    modifiedFiles: [],
    deletedFiles: [],
    changeType: 'unknown',
    language: [],
    modules: []
  };

  // 从上下文获取文件变更（如果有）
  if (context.createdFiles) {
    analysis.createdFiles = context.createdFiles;
  }

  if (context.modifiedFiles) {
    analysis.modifiedFiles = context.modifiedFiles;
  }

  // 从 Git 获取变更详情
  try {
    const gitStatus = execSync('git status --porcelain', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    const lines = gitStatus.split('\n').filter(Boolean);
    for (const line of lines) {
      const file = line.substring(3).trim();
      const status = line.substring(0, 2).trim();

      if (status === '??' && !analysis.createdFiles.includes(file)) {
        analysis.createdFiles.push(file);
      } else if (status === 'M' && !analysis.modifiedFiles.includes(file)) {
        analysis.modifiedFiles.push(file);
      }
    }
  } catch (error) {
    // 非 Git 仓库或 Git 不可用
  }

  // 分析变更类型
  analysis.changeType = inferChangeType(analysis);

  // 分析涉及的语言和模块
  analysis.language = detectLanguages(analysis);
  analysis.modules = detectModules(analysis);

  return analysis;
}

/**
 * 推断变更类型
 */
function inferChangeType(analysis) {
  const allFiles = [...analysis.createdFiles, ...analysis.modifiedFiles];

  // API/Controller 变更
  if (allFiles.some(f => f.includes('controller') || f.includes('api'))) {
    return 'api-change';
  }

  // 前端变更
  if (allFiles.some(f => f.endsWith('.vue') || f.endsWith('.tsx') || f.endsWith('.jsx'))) {
    return 'frontend-change';
  }

  // 数据库变更
  if (allFiles.some(f => f.endsWith('.sql') || f.includes('migration'))) {
    return 'database-change';
  }

  // 测试变更
  if (allFiles.some(f => f.includes('test') || f.includes('spec'))) {
    return 'test-change';
  }

  // 配置变更
  if (allFiles.some(f => f.endsWith('.yml') || f.endsWith('.yaml') || f.endsWith('.properties'))) {
    return 'config-change';
  }

  // 文档变更
  if (allFiles.some(f => f.endsWith('.md'))) {
    return 'doc-change';
  }

  return 'general-change';
}

/**
 * 检测涉及的开发语言
 */
function detectLanguages(analysis) {
  const languages = new Set();
  const allFiles = [...analysis.createdFiles, ...analysis.modifiedFiles];

  for (const file of allFiles) {
    if (file.endsWith('.java')) languages.add('Java');
    else if (file.endsWith('.vue')) languages.add('Vue');
    else if (file.endsWith('.js')) languages.add('JavaScript');
    else if (file.endsWith('.ts')) languages.add('TypeScript');
    else if (file.endsWith('.sql')) languages.add('SQL');
    else if (file.endsWith('.xml')) languages.add('XML');
    else if (file.endsWith('.yml') || file.endsWith('.yaml')) languages.add('YAML');
    else if (file.endsWith('.md')) languages.add('Markdown');
  }

  return Array.from(languages);
}

/**
 * 检测涉及的模块
 */
function detectModules(analysis) {
  const modules = new Set();
  const allFiles = [...analysis.createdFiles, ...analysis.modifiedFiles];

  for (const file of allFiles) {
    if (file.includes('/controller/')) modules.add('Controller');
    if (file.includes('/service/')) modules.add('Service');
    if (file.includes('/mapper/')) modules.add('Mapper');
    if (file.includes('/domain/') || file.includes('/entity/')) modules.add('Domain');
    if (file.includes('/dto/') || file.includes('/vo/')) modules.add('DTO/VO');
    if (file.includes('ruoyi-system')) modules.add('System');
    if (file.includes('ruoyi-common')) modules.add('Common');
    if (file.includes('ruoyi-framework')) modules.add('Framework');
  }

  return Array.from(modules);
}

/**
 * 生成任务总结
 */
function generateTaskSummary(context, changeAnalysis) {
  const summary = {
    timestamp: new Date().toISOString(),
    status: 'completed',
    filesChanged: changeAnalysis.createdFiles.length + changeAnalysis.modifiedFiles.length,
    created: changeAnalysis.createdFiles,
    modified: changeAnalysis.modifiedFiles,
    changeType: changeAnalysis.changeType,
    languages: changeAnalysis.language,
    modules: changeAnalysis.modules
  };

  return summary;
}

/**
 * 智能推荐下一步操作
 */
function recommendNextSteps(context, changeAnalysis) {
  const recommendations = [];
  const allFiles = [...changeAnalysis.createdFiles, ...changeAnalysis.modifiedFiles];
  const fileContent = getFileContent(allFiles);

  // 基于规则的推荐
  for (const rule of NEXT_STEP_RULES) {
    const matched = rule.trigger.some(keyword =>
      allFiles.some(f => f.toLowerCase().includes(keyword.toLowerCase())) ||
      fileContent.includes(keyword)
    );

    if (matched) {
      recommendations.push({
        text: rule.recommendation,
        command: rule.command,
        priority: 'normal'
      });
    }
  }

  // 基于变更类型的推荐
  switch (changeAnalysis.changeType) {
    case 'api-change':
      recommendations.push({
        text: '🔒 建议：检查是否添加了 @SaCheckPermission 权限注解',
        command: null,
        priority: 'high'
      });
      break;
    case 'database-change':
      recommendations.push({
        text: '💾 建议：备份数据库后执行变更脚本',
        command: 'mysqldump -u root -p database > backup.sql',
        priority: 'high'
      });
      break;
    case 'frontend-change':
      recommendations.push({
        text: '🎨 建议：检查是否符合 Vue 开发规范',
        command: null,
        priority: 'normal'
      });
      break;
  }

  // RuoYi-Vue-Plus 规范检查
  recommendations.push({
    text: '📋 规范检查：确保包名符合 org.dromara.* 或 com.ruoyi.* 规范',
    command: null,
    priority: 'normal'
  });

  // Git 提交建议
  if (allFiles.length > 0) {
    recommendations.push({
      text: '📦 建议：提交代码到 Git',
      command: 'git add . && git commit -m "feat: 描述本次变更"',
      priority: 'normal'
    });
  }

  // 去重并排序
  const unique = [];
  const seen = new Set();
  for (const rec of recommendations) {
    const key = rec.text;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rec);
    }
  }

  // 高优先级优先
  unique.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    return 0;
  });

  return unique.slice(0, 5); // 最多 5 条建议
}

/**
 * 获取文件内容用于关键词匹配
 */
function getFileContent(files) {
  let content = '';
  for (const file of files.slice(0, 5)) { // 限制读取前 5 个文件
    try {
      if (fs.existsSync(file)) {
        content += fs.readFileSync(file, 'utf8').toLowerCase();
      }
    } catch (error) {
      // 忽略读取错误
    }
  }
  return content;
}

/**
 * 清理临时文件
 */
function cleanupTempFiles() {
  const cleaned = [];
  const projectRoot = process.cwd();

  try {
    // 清理 Windows 下误创建的特殊文件
    const specialFiles = ['nul', 'nul.txt', 'con', 'con.txt', 'prn', 'aux'];
    for (const fileName of specialFiles) {
      const filePath = path.join(projectRoot, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleaned.push(filePath);
        console.log(`🗑️  已清理：${filePath}`);
      }
    }

    // 清理 .tmp 临时文件
    const tmpFiles = execSync('find . -name "*.tmp" -type f', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      cwd: projectRoot
    }).split('\n').filter(Boolean);

    for (const tmpFile of tmpFiles.slice(0, 10)) { // 限制清理 10 个
      try {
        fs.unlinkSync(tmpFile);
        cleaned.push(tmpFile);
        console.log(`🗑️  已清理：${tmpFile}`);
      } catch (error) {
        // 忽略删除失败
      }
    }

    if (cleaned.length === 0) {
      console.log('✅ 无需清理临时文件');
    }

  } catch (error) {
    console.log('清理临时文件时出错:', error.message);
  }

  return cleaned;
}

/**
 * 输出完整报告
 */
function printCompleteReport(summary, nextSteps, cleanedFiles) {
  // 1. 任务摘要
  console.log('\n📊 任务执行摘要');
  console.log('-'.repeat(50));
  console.log(`  状态：${summary.status === 'completed' ? '✅ 已完成' : '⚠️ 未完成'}`);
  console.log(`  时间：${new Date(summary.timestamp).toLocaleString('zh-CN')}`);
  console.log(`  变更类型：${formatChangeType(summary.changeType)}`);
  console.log(`  涉及语言：${summary.languages.length > 0 ? summary.languages.join(', ') : '无'}`);
  console.log(`  涉及模块：${summary.modules.length > 0 ? summary.modules.join(', ') : '无'}`);

  // 2. 文件变更详情
  console.log('\n📁 文件变更');
  console.log('-'.repeat(50));
  if (summary.created.length > 0) {
    console.log(`  新增文件：${summary.created.length} 个`);
    summary.created.slice(0, 5).forEach(f => console.log(`    + ${f}`));
    if (summary.created.length > 5) {
      console.log(`    ... 还有 ${summary.created.length - 5} 个文件`);
    }
  } else {
    console.log('  新增文件：无');
  }

  if (summary.modified.length > 0) {
    console.log(`  修改文件：${summary.modified.length} 个`);
    summary.modified.slice(0, 5).forEach(f => console.log(`    ~ ${f}`));
    if (summary.modified.length > 5) {
      console.log(`    ... 还有 ${summary.modified.length - 5} 个文件`);
    }
  } else {
    console.log('  修改文件：无');
  }

  // 3. 下一步建议
  console.log('\n💡 下一步建议');
  console.log('-'.repeat(50));
  nextSteps.forEach((step, index) => {
    const icon = step.priority === 'high' ? '🔴' : '🟢';
    console.log(`  ${icon} ${index + 1}. ${step.text}`);
    if (step.command) {
      console.log(`     命令：${step.command}`);
    }
  });

  // 4. 清理报告
  if (cleanedFiles.length > 0) {
    console.log('\n🗑️ 清理报告');
    console.log('-'.repeat(50));
    console.log(`  已清理 ${cleanedFiles.length} 个临时文件`);
  }
}

/**
 * 格式化变更类型文本
 */
function formatChangeType(type) {
  const types = {
    'api-change': 'API 接口变更',
    'frontend-change': '前端变更',
    'database-change': '数据库变更',
    'test-change': '测试代码',
    'config-change': '配置变更',
    'doc-change': '文档更新',
    'general-change': '一般变更'
  };
  return types[type] || type;
}
