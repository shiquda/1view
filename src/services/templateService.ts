import { Template, DashboardConfig, ViewerConfig } from '../types';
import { loadDashboardConfig, saveDashboardConfig } from './storageService';
import predefinedTemplatesJson from '../templates/templates.json';

// 将JSON导入的模板转换为Template类型
const predefinedTemplates: Template[] = predefinedTemplatesJson as Template[];

/**
 * 获取所有可用模板（包括预定义和用户自定义）
 */
export const getAllTemplates = (): Template[] => {
  const dashboardConfig = loadDashboardConfig();
  const userTemplates = dashboardConfig?.templates || [];

  // 合并预定义模板和用户模板，确保ID不重复
  return [...predefinedTemplates, ...userTemplates];
};

/**
 * 根据ID获取模板
 */
export const getTemplateById = (id: string): Template | undefined => {
  const allTemplates = getAllTemplates();
  return allTemplates.find(template => template.id === id);
};

/**
 * 添加用户自定义模板
 */
export const addUserTemplate = (template: Template): void => {
  const dashboardConfig = loadDashboardConfig() || { viewers: [], layout: [], templates: [] };

  if (!dashboardConfig.templates) {
    dashboardConfig.templates = [];
  }

  // 检查是否已存在相同ID的模板
  const existingIndex = dashboardConfig.templates.findIndex(t => t.id === template.id);

  if (existingIndex >= 0) {
    // 更新已有模板
    dashboardConfig.templates[existingIndex] = template;
  } else {
    // 添加新模板
    dashboardConfig.templates.push(template);
  }

  saveDashboardConfig(dashboardConfig);
};

/**
 * 删除用户自定义模板
 */
export const deleteUserTemplate = (id: string): void => {
  const dashboardConfig = loadDashboardConfig();

  if (dashboardConfig?.templates) {
    dashboardConfig.templates = dashboardConfig.templates.filter(t => t.id !== id);
    saveDashboardConfig(dashboardConfig);
  }
};

/**
 * 替换字符串中的变量
 * @param str 要处理的字符串
 * @param variables 变量值的映射
 */
const replaceVariables = (str: string, variables: Record<string, string>): string => {
  if (!str) return str;

  let result = str;
  // 使用正则表达式查找所有的变量占位符
  const placeholderRegex = /<\$(\d+)>/g;
  let match;

  while ((match = placeholderRegex.exec(str)) !== null) {
    const key = `$${match[1]}`;
    const value = variables[key] || '';
    // 替换所有匹配的占位符
    result = result.replace(new RegExp(`<\\$${match[1]}>`, 'g'), value);
  }

  return result;
};

/**
 * 使用模板创建Viewer配置
 * @param templateId 模板ID
 * @param variableValues 变量值的键值对
 */
export const createViewerFromTemplate = (
  templateId: string,
  variableValues: Record<string, string>
): ViewerConfig => {
  const template = getTemplateById(templateId);

  if (!template) {
    throw new Error(`模板 "${templateId}" 不存在`);
  }

  // 复制配置以避免修改原始模板
  const config = JSON.parse(JSON.stringify(template.config)) as ViewerConfig;

  // 设置唯一ID
  config.id = crypto.randomUUID();

  // 替换名称和数据URL中的变量
  config.name = replaceVariables(config.name, variableValues);
  config.dataUrl = replaceVariables(config.dataUrl, variableValues);
  config.displayFormat = replaceVariables(config.displayFormat || '{value}', variableValues);
  config.jsonPath = replaceVariables(config.jsonPath, variableValues);

  // 确保样式配置存在
  if (!config.styleConfig) {
    config.styleConfig = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontSize: '1.5rem',
    };
  } else {
    // 确保样式配置的每个属性都存在
    config.styleConfig.backgroundColor = config.styleConfig.backgroundColor || '#ffffff';
    config.styleConfig.textColor = config.styleConfig.textColor || '#000000';
    config.styleConfig.fontSize = config.styleConfig.fontSize || '1.5rem';
  }

  return config;
};

/**
 * 创建新的用户模板
 */
export const createNewTemplate = (
  viewerConfig: ViewerConfig,
  variables: Template['variables']
): Template => {
  // 复制配置以避免修改原始配置
  const configCopy: Omit<ViewerConfig, 'id'> = {
    type: viewerConfig.type,
    name: viewerConfig.name,
    dataUrl: viewerConfig.dataUrl,
    jsonPath: viewerConfig.jsonPath,
    displayFormat: viewerConfig.displayFormat,
    styleConfig: { ...viewerConfig.styleConfig },
  };

  const id = `user-template-${Date.now()}`;

  // 创建新的模板
  const template: Template = {
    id,
    name: `自定义模板: ${configCopy.name}`,
    description: `用户创建的模板，基于${configCopy.name}`,
    category: '用户模板',
    config: configCopy,
    variables,
  };

  return template;
};
