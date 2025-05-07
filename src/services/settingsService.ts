import { GlobalSettings, ProxyServiceTemplate } from '../types';

const GLOBAL_SETTINGS_KEY = '1view-global-settings';

// 预定义的 CORS 代理服务列表
export const PROXY_TEMPLATES: ProxyServiceTemplate[] = [
  {
    name: 'CF Workers',
    description: '个人 Cloudflare Workers CORS 代理',
    template: 'https://cors.bpbpbp.workers.dev/{url}',
  },
  {
    name: 'CORS Anywhere',
    description: '开源的 CORS 代理服务',
    template: 'https://cors-anywhere.herokuapp.com/{url}',
  },
  {
    name: 'CORS Proxy IO',
    description: '可靠的 CORS 代理服务',
    template: 'https://corsproxy.io/?{url}',
  },
  {
    name: 'All Origins',
    description: '支持多种格式的 CORS 代理',
    template: 'https://api.allorigins.win/raw?url={url}',
  },
  {
    name: 'CodeTabs Proxy',
    description: '支持 CORS 的 API 代理',
    template: 'https://api.codetabs.com/v1/proxy?quest={url}',
  },
];

// 默认全局设置
const DEFAULT_SETTINGS: GlobalSettings = {
  corsProxy: {
    selectedProxyIndex: 0, // 默认使用第一个代理
    customProxyTemplate: 'https://your-proxy.com/{url}',
    enabled: true,
  },
};

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
    return JSON.parse(stored) as GlobalSettings;
  } catch (error) {
    console.error('解析全局设置失败:', error);
    return DEFAULT_SETTINGS;
  }
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
