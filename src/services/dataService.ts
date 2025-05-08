import { ViewerConfig, ViewerData } from '../types';
import { fetchWithCorsProxy } from './corsProxyService';
import { loadGlobalSettings } from './settingsService';
import { JSONPath } from 'jsonpath-plus';

/**
 * 根据JSONPath表达式从对象中提取数据
 * 使用jsonpath-plus库实现
 */
export const extractValueByPath = (data: Record<string, unknown>, path: string): unknown => {
  try {
    // 使用jsonpath-plus库执行JSONPath查询
    const result = JSONPath({ path, json: data });
    // JSONPath返回的始终是数组，我们通常需要第一个结果
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('JSONPath解析错误:', error);
    return null;
  }
};

/**
 * 从对象中提取多个值，支持多个JSONPath路径（以英文逗号分隔）
 */
export const extractMultipleValuesByPath = (
  data: Record<string, unknown>,
  pathsString: string
): unknown[] => {
  // 按英文逗号分割多个路径
  const paths = pathsString.split(',').map(path => path.trim());

  // 提取每个路径的值
  return paths.map(path => extractValueByPath(data, path));
};

/**
 * 从数据源获取数据
 */
export const fetchData = async (config: ViewerConfig): Promise<ViewerData> => {
  try {
    let response: Response;
    let data: unknown;
    const settings = loadGlobalSettings();

    // 记录开始时间，用于性能监控
    const startTime = Date.now();

    // 如果 URL 是外部 API，则使用 CORS 代理
    if (config.dataUrl.startsWith('http') && !config.dataUrl.includes('localhost')) {
      // 检查代理是否启用
      if (settings.corsProxy.enabled) {
        try {
          response = await fetchWithCorsProxy(config.dataUrl);
          data = await response.json();
        } catch (proxyError) {
          // 代理请求失败，记录详细错误
          console.error(`代理请求失败 (${config.name}):`, proxyError);
          throw new Error(
            `代理请求失败: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`
          );
        }
      } else {
        // 代理禁用，直接请求
        try {
          response = await fetch(config.dataUrl, {
            headers: {
              Accept: 'application/json',
            },
            cache: 'no-cache',
            // 设置超时
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
          }

          data = await response.json();
        } catch (fetchError) {
          console.error(`直接请求失败 (${config.name}):`, fetchError);
          throw new Error(
            `请求失败: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
          );
        }
      }
    } else {
      // 本地 API 直接请求
      try {
        response = await fetch(config.dataUrl, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-cache',
          // 设置超时
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        data = await response.json();
      } catch (localError) {
        console.error(`本地API请求失败 (${config.name}):`, localError);
        throw new Error(
          `本地请求失败: ${localError instanceof Error ? localError.message : String(localError)}`
        );
      }
    }

    // 记录请求完成时间
    const endTime = Date.now();
    console.log(`数据请求完成 (${config.name}): ${endTime - startTime}ms`);

    try {
      // 提取多个值
      const values = extractMultipleValuesByPath(data as Record<string, unknown>, config.jsonPath);

      // 将提取的值格式化为字符串数组
      const stringValues = values.map(value =>
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      );

      return {
        id: config.id,
        value: stringValues,
        lastUpdated: Date.now(),
        rawData: data as Record<string, unknown>, // 保存原始数据
      };
    } catch (extractError) {
      console.error(`数据提取失败 (${config.name}):`, extractError);
      return {
        id: config.id,
        value: null,
        lastUpdated: Date.now(),
        error: `数据提取失败: ${extractError instanceof Error ? extractError.message : String(extractError)}`,
        rawData: data as Record<string, unknown>,
      };
    }
  } catch (error) {
    console.error(`获取数据失败 (${config.name}):`, error);
    return {
      id: config.id,
      value: null,
      lastUpdated: Date.now(),
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
};
