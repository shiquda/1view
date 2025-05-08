import { GlobalSettings, ProxyServiceTemplate } from '../types';

const GLOBAL_SETTINGS_KEY = '1view-global-settings';

// 预定义的 CORS 代理服务列表
export const PROXY_TEMPLATES: ProxyServiceTemplate[] = [
  {
    name: 'All Origins',
    description: '支持多种格式的 CORS 代理（免过墙）',
    template: 'https://api.allorigins.win/raw?url={url}',
  },
  {
    name: 'CodeTabs Proxy',
    description: '支持 CORS 的 API 代理（免过墙）',
    template: 'https://api.codetabs.com/v1/proxy?quest={url}',
  },
  {
    name: 'CF Workers',
    description: '个人 Cloudflare Workers CORS 代理（可能需要过墙）',
    template: 'https://cors.bpbpbp.workers.dev/{url}',
  },
  {
    name: 'CORS Proxy IO',
    description: 'CORS Proxy IO（需要过墙）',
    template: 'https://corsproxy.io/?{url}',
  },
];

// 默认全局设置
const DEFAULT_SETTINGS: GlobalSettings = {
  corsProxy: {
    selectedProxyIndex: 0, // 默认使用第一个代理
    customProxyTemplate: 'https://your-proxy.com/{url}',
    enabled: true,
  },
  // 简化后的主题设置
  theme: {
    // 主题色
    primaryColor: '#3b82f6', // blue-500

    // 字体设置
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // 卡片圆角设置
    borderRadius: '0.5rem',
  },
};

// 导出默认主题，便于其他模块直接使用
export const DEFAULT_THEME = DEFAULT_SETTINGS.theme;

/**
 * 保存全局设置到 localStorage
 */
export const saveGlobalSettings = (settings: GlobalSettings): void => {
  localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
};

/**
 * 从 localStorage 加载全局设置
 */
export const loadGlobalSettings = (): GlobalSettings => {
  const stored = localStorage.getItem(GLOBAL_SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;

  try {
    const parsedSettings = JSON.parse(stored) as GlobalSettings;

    // 确保旧版设置能够兼容新版主题设置
    if (!parsedSettings.theme) {
      parsedSettings.theme = DEFAULT_SETTINGS.theme;
    }

    return parsedSettings;
  } catch (error) {
    console.error('解析全局设置失败:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * 重置为默认主题
 * 返回默认主题的拷贝，以便使用
 */
export const getDefaultTheme = (): GlobalSettings['theme'] => {
  // 返回一个深拷贝，避免修改原始对象
  return JSON.parse(JSON.stringify(DEFAULT_THEME));
};

/**
 * 根据当前设置获取 CORS 代理 URL
 * @param originalUrl 原始 URL
 * @returns 代理后的 URL 或原始 URL（如果禁用了代理）
 */
export const getProxyUrl = (originalUrl: string): string => {
  const settings = loadGlobalSettings();

  // 如果禁用了代理，直接返回原始 URL
  if (!settings.corsProxy.enabled) {
    return originalUrl;
  }

  // 如果是使用预定义代理
  if (
    settings.corsProxy.selectedProxyIndex >= 0 &&
    settings.corsProxy.selectedProxyIndex < PROXY_TEMPLATES.length
  ) {
    const template = PROXY_TEMPLATES[settings.corsProxy.selectedProxyIndex].template;
    return template.replace('{url}', originalUrl);
  }

  // 使用自定义代理
  return settings.corsProxy.customProxyTemplate.replace('{url}', originalUrl);
};

/**
 * 应用主题设置到CSS变量
 */
export const applyThemeSettings = (theme: GlobalSettings['theme']): void => {
  // 获取:root元素
  const root = document.documentElement;

  try {
    // 设置CSS变量
    root.style.setProperty('--color-primary', theme.primaryColor);

    // 设置派生的颜色
    const primaryColorDarker = adjustColor(theme.primaryColor, -20); // 深色版本用于悬停
    root.style.setProperty('--color-primary-hover', primaryColorDarker);

    // 设置圆角变量
    root.style.setProperty('--radius-card', theme.borderRadius);

    // 设置字体
    root.style.setProperty('--font-family', theme.fontFamily);

    // 添加字体到body
    document.body.style.fontFamily = 'var(--font-family)';

    console.log('主题已成功应用:', {
      primaryColor: theme.primaryColor,
      borderRadius: theme.borderRadius,
      fontFamily: theme.fontFamily.substring(0, 30) + '...', // 截断显示
    });
  } catch (error) {
    console.error('应用主题设置时出错:', error);
  }
};

/**
 * 辅助函数：调整颜色亮度
 * @param color 16进制颜色
 * @param percent 百分比变化（正数变亮，负数变暗）
 */
function adjustColor(color: string, percent: number): string {
  // 移除可能的 # 前缀
  color = color.replace('#', '');

  // 解析RGB值
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // 调整亮度
  const adjustValue = (value: number): number => {
    const adjusted = value + Math.floor((percent / 100) * 255);
    return Math.min(255, Math.max(0, adjusted));
  };

  // 新的RGB值
  const newR = adjustValue(r).toString(16).padStart(2, '0');
  const newG = adjustValue(g).toString(16).padStart(2, '0');
  const newB = adjustValue(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}
