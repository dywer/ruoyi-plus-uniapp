// 技能强制评估钩子
// 在用户提问时自动匹配技能，确保规范遵循

module.exports = {
  before: async (context) => {
    // 分析用户输入，匹配最适合的技能
    const userInput = context.prompt;

    // 检测关键词并推荐技能
    const skillRecommendations = analyzeSkills(userInput);

    if (skillRecommendations.length > 0) {
      // 在响应前注入技能提示
      context.inject(`请优先考虑使用以下技能: ${skillRecommendations.join(', ')}`);
    }

    return context;
  }
};

function analyzeSkills(input) {
  const skills = [];

  // CRUD相关
  if (input.toLowerCase().includes('crud') || input.toLowerCase().includes('增删改查')) {
    skills.push('crud-development');
  }

  // API相关
  if (input.toLowerCase().includes('api') || input.toLowerCase().includes('接口')) {
    skills.push('api-development');
  }

  // 数据库相关
  if (input.toLowerCase().includes('数据库') || input.toLowerCase().includes('sql')) {
    skills.push('database-ops');
  }

  // 安全相关
  if (input.toLowerCase().includes('安全') || input.toLowerCase().includes('权限')) {
    skills.push('security-guard');
  }

  // 缓存相关
  if (input.toLowerCase().includes('redis') || input.toLowerCase().includes('缓存')) {
    skills.push('redis-cache');
  }

  // 工作流相关
  if (input.toLowerCase().includes('流程') || input.toLowerCase().includes('工作流')) {
    skills.push('workflow-engine');
  }

  // 多租户相关
  if (input.toLowerCase().includes('租户') || input.toLowerCase().includes('saas')) {
    skills.push('tenant-management');
  }

  return skills;
}