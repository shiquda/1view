import { ViewerConfig, ViewerData } from '../types';
import { fetchWithCorsProxy } from './corsProxyService';
import { loadGlobalSettings } from './settingsService';

/**
 * 根据JSONPath表达式从对象中提取数据
 * 实现简化版的JSONPath解析功能
 */
export const extractValueByPath = (data: Record<string, unknown>, path: string): unknown => {
  // 基本的JSONPath解析实现
  if (!path.startsWith('$')) {
    throw new Error('JSONPath必须以$开头');
  }

  // 处理空路径
  if (path === '$') {
    return data;
  }

  // 规范化路径：移除 $ 并分割路径段
  const pathWithoutRoot = path.substring(1);

  // 使用更强大的正则表达式来处理各种形式的路径段
  // 比如 .data[0].name 或 ['data'][0]['name'] 或 .data.0.name
  const segments: { type: 'property' | 'index'; value: string | number }[] = [];

  // 首先，以点号分割路径
  const parts = pathWithoutRoot.split('.');

  // 处理每个部分
  for (let part of parts) {
    if (!part && parts.length > 1) continue; // 跳过空部分，比如连续的点

    // 检查是否有数组索引 [n]
    const indexMatches = Array.from(part.matchAll(/\[(\d+)\]/g));

    if (indexMatches.length > 0) {
      // 有数组索引，先处理属性名
      const propEnd = part.indexOf('[');
      if (propEnd > 0) {
        // 先添加属性
        segments.push({
          type: 'property',
          value: part.substring(0, propEnd),
        });
      }

      // 然后添加所有索引
      for (const match of indexMatches) {
        segments.push({
          type: 'index',
          value: parseInt(match[1], 10),
        });
      }
    } else if (/^\d+$/.test(part)) {
      // 纯数字作为数组索引处理
      segments.push({
        type: 'index',
        value: parseInt(part, 10),
      });
    } else if (part) {
      // 普通属性名
      segments.push({
        type: 'property',
        value: part,
      });
    }
  }

  // 遍历路径段并解析数据
  let current: unknown = data;

  for (const segment of segments) {
    if (current === undefined || current === null) {
      return null;
    }

    if (segment.type === 'property') {
      if (typeof current !== 'object' || current === null) {
        return null;
      }

      current = (current as Record<string, unknown>)[segment.value as string];
    } else if (segment.type === 'index') {
      if (!Array.isArray(current)) {
        return null;
      }

      const index = segment.value as number;
      if (index >= current.length) {
        return null;
      }

      current = current[index];
    }
  }

  return current;
};

/**
 * 从数据源获取数据
 */
export const fetchData = async (config: ViewerConfig): Promise<ViewerData> => {
  try {
    let response: Response;
    let data: unknown;
    const settings = loadGlobalSettings();

    // 如果 URL 是外部 API，则使用 CORS 代理
    if (config.dataUrl.startsWith('http') && !config.dataUrl.includes('localhost')) {
      // 检查代理是否启用
      if (settings.corsProxy.enabled) {
        response = await fetchWithCorsProxy(config.dataUrl);
        data = await response.json();
      } else {
        // 代理禁用，直接请求
        response = await fetch(config.dataUrl, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-cache',
        });

        if (!response.ok) {
          throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        data = await response.json();
      }
    } else {
      // 本地 API 直接请求
      response = await fetch(config.dataUrl, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      data = await response.json();
    }

    const value = extractValueByPath(data as Record<string, unknown>, config.jsonPath);

    // 将提取的值格式化为字符串
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    return {
      id: config.id,
      value: stringValue,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('获取数据失败:', error);
    return {
      id: config.id,
      value: null,
      lastUpdated: Date.now(),
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
};
