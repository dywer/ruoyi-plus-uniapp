// PreToolUse Hook - 安全防护层
// 在 AI 执行 Bash 命令或写入文件之前进行拦截和验证

const path = require('path');

// 危险命令黑名单
const DANGEROUS_COMMANDS = {
  // 删除类
  'rm -rf': '危险：递归强制删除文件/目录',
  'rm -fr': '危险：递归强制删除文件/目录',
  'rm -r': '警告：递归删除文件/目录',
  'rm -f': '警告：强制删除文件',
  'del /f': '危险：Windows 强制删除',
  'deltree': '危险：删除目录树',

  // 磁盘/格式化类
  'format': '危险：磁盘格式化命令',
  'mkfs': '危险：创建文件系统',
  'fdisk': '危险：磁盘分区操作',
  'dd': '危险：底层磁盘操作',
  'diskpart': '危险：Windows 磁盘分区',

  // 数据库删除类
  'drop database': '危险：删除数据库',
  'drop table': '危险：删除数据表',
  'truncate': '危险：清空表数据',
  'delete from': '警告：删除表数据',

  // 系统破坏类
  ':(){ :|:& };:': '危险：Fork 炸弹',
  'wget': '警告：下载外部文件',
  'curl': '警告：下载/请求外部资源',
  'chmod 777': '警告：设置完全权限',
  'chown -R': '警告：递归修改所有者',
  'sudo': '警告：提权执行命令',
  'su -': '警告：切换用户',

  // 网络攻击类
  'nmap': '警告：网络扫描工具',
  'hping': '警告：网络包构造工具',
  'tcpdump': '警告：网络抓包',

  // 代码执行类
  'eval': '警告：动态代码执行',
  'exec': '警告：系统命令执行',
  'system': '警告：系统调用',
  'passthru': '警告：直接输出命令结果',

  // 脚本执行
  'bash -c': '警告：执行 Bash 脚本',
  'sh -c': '警告：执行 Shell 脚本',
  'powershell -c': '警告：执行 PowerShell 命令',
  'cmd /c': '警告：执行 CMD 命令'
};

// 需要二次确认的敏感路径
const SENSITIVE_PATHS = [
  '/etc/',
  '/usr/',
  '/var/',
  '/root/',
  '/home/',
  'C:\\Windows\\',
  'C:\\Program Files\\',
  '.env',
  '.git/',
  'node_modules/',
  'target/',
  'build/',
  '.gitignore',
  '.gitconfig',
  'ssh/',
  '.ssh/',
  'id_rsa',
  'id_ed25519',
  '.pem',
  '.key'
];

module.exports = {
  /**
   * 工具调用前拦截
   */
  beforeToolUse: async (toolCall, context) => {
    const toolName = toolCall.name || toolCall.type;
    const args = toolCall.args || toolCall.parameters || {};

    // 1. 验证 RuoYi-Vue-Plus 代码规范
    const codeValidation = validateCodeRules(toolName, args);
    if (!codeValidation.valid) {
      return {
        allowed: false,
        action: 'block',
        message: `代码规范违规：${codeValidation.message}`
      };
    }

    // 2. Bash 命令安全检查
    if (toolName === 'Bash' || toolName === 'bash') {
      const command = args.command || args.cmd || '';
      const securityCheck = validateBashCommand(command);
      if (!securityCheck.allowed) {
        return {
          allowed: false,
          action: securityCheck.severity === 'warning' ? 'confirm' : 'block',
          severity: securityCheck.severity,
          message: securityCheck.message,
          reason: securityCheck.reason
        };
      }
    }

    // 3. 文件写入安全检查
    if (toolName === 'Write' || toolName === 'write' ||
        toolName === 'Edit' || toolName === 'edit') {
      const filePath = args.file_path || args.path || '';
      const fileCheck = validateFilePath(filePath);
      if (!fileCheck.allowed) {
        return {
          allowed: false,
          action: 'confirm',
          severity: 'warning',
          message: fileCheck.message
        };
      }
    }

    // 4. 脚本执行检查
    if (toolName === 'Bash' || toolName === 'bash') {
      const command = args.command || '';
      if (isScriptExecution(command)) {
        return {
          allowed: false,
          action: 'confirm',
          severity: 'warning',
          message: `检测到脚本执行：${command.substring(0, 100)}...`
        };
      }
    }

    // 5. 检查硬编码密钥
    if (toolName === 'Write' || toolName === 'write' ||
        toolName === 'Edit' || toolName === 'edit') {
      const content = args.content || args.new_string || '';
      const secretCheck = detectSecrets(content);
      if (!secretCheck.allowed) {
        return {
          allowed: false,
          action: 'confirm',
          severity: 'warning',
          message: secretCheck.message
        };
      }
    }

    // 检查通过，允许执行
    return {
      allowed: true,
      action: 'allow',
      message: '工具使用验证通过'
    };
  },

  /**
   * 工具调用后处理
   */
  afterToolUse: async (toolResult, context) => {
    // 记录工具使用日志
    logToolUsage(toolResult, context);

    return toolResult;
  }
};

/**
 * 验证 RuoYi-Vue-Plus 代码规范
 */
function validateCodeRules(toolName, args) {
  if (toolName === 'Write' || toolName === 'write' ||
      toolName === 'Edit' || toolName === 'edit') {

    const filePath = args.file_path || args.path || '';
    const content = args.content || args.new_string || '';

    // 验证 Java 包名规范
    if (filePath.endsWith('.java') && content.includes('package ')) {
      const packageMatch = content.match(/package\s+([a-zA-Z0-9_.]+)/);
      if (packageMatch) {
        const packageName = packageMatch[1];
        if (!packageName.startsWith('org.dromara') && !packageName.startsWith('com.ruoyi')) {
          return {
            valid: false,
            message: `Java 包名必须以 'org.dromara' 或 'com.ruoyi' 开头，当前包名：${packageName}`
          };
        }
      }
    }
  }

  return { valid: true, message: '代码规范验证通过' };
}

/**
 * Bash 命令安全验证
 */
function validateBashCommand(command) {
  if (!command) {
    return { allowed: true };
  }

  const cmdLower = command.toLowerCase();

  // 检查危险命令黑名单
  for (const [pattern, description] of Object.entries(DANGEROUS_COMMANDS)) {
    if (cmdLower.includes(pattern)) {
      const severity = pattern.includes('危险') ? 'critical' :
                       pattern.includes('警告') ? 'warning' : 'info';

      return {
        allowed: false,
        severity: severity === 'critical' ? 'critical' : 'warning',
        message: `🚫 ${description}`,
        reason: `命令包含危险模式：${pattern}`,
        command: command
      };
    }
  }

  // 检查管道和重定向
  if (command.includes('|') || command.includes('>') || command.includes('&&')) {
    // 复杂命令，需要额外检查
    const subCommands = command.split(/[|>&]/).filter(Boolean);
    for (const subCmd of subCommands) {
      const check = validateBashCommand(subCmd.trim());
      if (!check.allowed) {
        return check;
      }
    }
  }

  // 检查敏感路径
  const pathCheck = validateFilePath(command);
  if (!pathCheck.allowed) {
    return pathCheck;
  }

  return { allowed: true };
}

/**
 * 文件路径安全验证
 */
function validateFilePath(filePathOrContent) {
  if (!filePathOrContent) {
    return { allowed: true };
  }

  // 检查是否包含敏感路径
  for (const sensitivePath of SENSITIVE_PATHS) {
    if (filePathOrContent.includes(sensitivePath)) {
      return {
        allowed: false,
        severity: 'warning',
        message: `⚠️ 操作涉及敏感路径：${sensitivePath}`
      };
    }
  }

  return { allowed: true };
}

/**
 * 检测是否为脚本执行
 */
function isScriptExecution(command) {
  const scriptPatterns = [
    /\.sh\s/,
    /\.bash\s/,
    /\.ps1\s/,
    /\.bat\s/,
    /\.cmd\s/,
    /\.py\s/,
    /node\s+\w/,
    /python\s+\w/,
    /java\s+-jar/
  ];

  return scriptPatterns.some(pattern => pattern.test(command));
}

/**
 * 检测硬编码密钥
 */
function detectSecrets(content) {
  if (!content) {
    return { allowed: true };
  }

  const secretPatterns = [
    { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI API Key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Token' },
    { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
    { pattern: /password\s*[=:]\s*['"][^'"]+['"]/i, name: '硬编码密码' },
    { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/i, name: '硬编码 API Key' },
    { pattern: /secret\s*[=:]\s*['"][^'"]+['"]/i, name: '硬编码 Secret' },
    { pattern: /-----BEGIN\s+(RSA|DSA|EC)\s+PRIVATE\s+KEY-----/, name: '私钥文件' },
    { pattern: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, name: 'JWT Token' }
  ];

  for (const { pattern, name } of secretPatterns) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        severity: 'warning',
        message: `⚠️ 检测到疑似硬编码密钥：${name}`
      };
    }
  }

  return { allowed: true };
}

/**
 * 记录工具使用日志
 */
function logToolUsage(toolResult, context) {
  // 简化日志记录，可用于审计
  const timestamp = new Date().toISOString();
  const toolName = toolResult?.toolCall?.name || 'unknown';

  console.log(`[${timestamp}] Tool used: ${toolName}`);
}
