import { DashboardConfig, ViewerData } from '../types';

const DASHBOARD_CONFIG_KEY = '1view-dashboard-config';
const VIEWER_DATA_CACHE_KEY = '1view-viewer-data-cache';

/**
 * 保存仪表盘配置到localStorage
 */
export const saveDashboardConfig = (config: DashboardConfig): void => {
  localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(config));
};

/**
 * 从localStorage加载仪表盘配置
 */
export const loadDashboardConfig = (): DashboardConfig | null => {
  const stored = localStorage.getItem(DASHBOARD_CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as DashboardConfig;
  } catch (error) {
    console.error('解析配置失败:', error);
    return null;
  }
};

/**
 * 保存数据缓存到localStorage
 */
export const saveViewerDataCache = (dataCache: Record<string, ViewerData>): void => {
  localStorage.setItem(VIEWER_DATA_CACHE_KEY, JSON.stringify(dataCache));
};

/**
 * 从localStorage加载数据缓存
 */
export const loadViewerDataCache = (): Record<string, ViewerData> => {
  const stored = localStorage.getItem(VIEWER_DATA_CACHE_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as Record<string, ViewerData>;
  } catch (error) {
    console.error('解析数据缓存失败:', error);
    return {};
  }
};

/**
 * 导出配置到文件
 */
export const exportConfig = (): void => {
  const config = loadDashboardConfig();
  if (!config) {
    alert('没有可导出的配置');
    return;
  }

  const dataStr = JSON.stringify(config, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const exportLink = document.createElement('a');
  exportLink.setAttribute('href', dataUri);
  exportLink.setAttribute('download', `1view-config-${new Date().toISOString().slice(0, 10)}.json`);
  exportLink.click();
};

/**
 * 从文件导入配置
 */
export const importConfig = (file: File): Promise<DashboardConfig> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        if (!event.target?.result) {
          reject(new Error('无法读取文件'));
          return;
        }

        const config = JSON.parse(event.target.result as string) as DashboardConfig;
        saveDashboardConfig(config);
        resolve(config);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
};
