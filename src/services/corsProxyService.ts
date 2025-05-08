/**
 * CORS 代理服务
 * 提供多种方式解决跨域问题
 */
import { getProxyUrl, PROXY_TEMPLATES, loadGlobalSettings } from './settingsService';

// 添加请求缓存
interface CacheEntry {
  data: unknown;
  timestamp: number;
  proxyUsed: string;
}

// 请求缓存映射表 URL -> 缓存数据
const requestCache: Map<string, CacheEntry> = new Map();

// 控制每个代理的请求频率
interface ProxyRateLimit {
  lastRequest: number;
  count: number;
}

// 代理请求频率限制
const proxyRateLimits: Map<string, ProxyRateLimit> = new Map();

// 缓存有效期（毫秒）
const CACHE_TTL = 30000; // 30秒

// 代理服务的请求冷却时间（毫秒）
const PROXY_COOLDOWN = 2000; // 2秒

/**
 * 检查并记录代理服务的使用频率
 * @param proxyName 代理服务名称
 * @returns 是否可以使用此代理
 */
const checkProxyRateLimit = (proxyName: string): boolean => {
  const now = Date.now();
  const limit = proxyRateLimits.get(proxyName) || { lastRequest: 0, count: 0 };

  // 如果距离上次请求超过冷却时间，重置计数
  if (now - limit.lastRequest > PROXY_COOLDOWN) {
    proxyRateLimits.set(proxyName, {
      lastRequest: now,
      count: 1,
    });
    return true;
  }

  // 如果同一时间段内请求过多，拒绝请求
  if (limit.count >= 3) {
    return false;
  }

  // 更新请求计数
  proxyRateLimits.set(proxyName, {
    lastRequest: limit.lastRequest,
    count: limit.count + 1,
  });

  return true;
};

/**
 * 尝试使用配置的 CORS 代理获取数据
 * @param url 原始 URL
 * @returns Promise<Response>
 */
export const fetchWithCorsProxy = async (url: string): Promise<Response> => {
  const settings = loadGlobalSettings();
  const now = Date.now();

  // 检查缓存
  const cached = requestCache.get(url);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`使用缓存数据，来源: ${cached.proxyUsed}`);
    // 构造一个假的Response对象，包含缓存的数据
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  // 如果禁用了代理，直接请求原始 URL
  if (!settings.corsProxy.enabled) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
    });

    if (response.ok) {
      try {
        // 克隆响应以便可以读取两次
        const clone = response.clone();
        const data = await clone.json();
        // 存入缓存
        requestCache.set(url, {
          data,
          timestamp: now,
          proxyUsed: '直接请求',
        });
      } catch (error) {
        console.warn('缓存响应失败:', error);
      }
    }

    return response;
  }

  let lastError: Error | null = null;
  let attemptCount = 0;
  const maxAttempts = 2; // 减少尝试次数，避免过多请求

  // 首先尝试配置的首选代理
  const primaryProxyIndex = settings.corsProxy.selectedProxyIndex;
  const primaryProxyName =
    primaryProxyIndex >= 0 ? PROXY_TEMPLATES[primaryProxyIndex].name : '自定义代理';

  if (checkProxyRateLimit(primaryProxyName)) {
    try {
      const proxyUrl = getProxyUrl(url);

      const response = await fetch(proxyUrl, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        try {
          // 克隆响应以便可以读取两次
          const clone = response.clone();
          const data = await clone.json();
          // 存入缓存
          requestCache.set(url, {
            data,
            timestamp: now,
            proxyUsed: primaryProxyName,
          });
        } catch (error) {
          console.warn('缓存响应失败:', error);
        }
        return response;
      }

      throw new Error(`配置的代理服务请求失败: ${response.status}`);
    } catch (error) {
      console.warn(`配置的代理失败:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      attemptCount++;
    }
  } else {
    console.warn(`${primaryProxyName} 请求过于频繁，跳过`);
    attemptCount++;
  }

  // 如果首选代理失败，尝试其他代理
  if (attemptCount < maxAttempts) {
    // 尝试剩余的预定义代理（跳过已经用过的）
    for (let i = 0; i < PROXY_TEMPLATES.length && attemptCount < maxAttempts; i++) {
      if (i === settings.corsProxy.selectedProxyIndex) continue; // 跳过已经尝试过的首选代理

      const proxyName = PROXY_TEMPLATES[i].name;

      // 检查此代理的请求限制
      if (!checkProxyRateLimit(proxyName)) {
        console.warn(`${proxyName} 请求过于频繁，跳过`);
        continue;
      }

      try {
        const proxyUrl = PROXY_TEMPLATES[i].template.replace('{url}', url);
        console.log(`尝试备用代理 ${proxyName}: ${proxyUrl}`);

        const response = await fetch(proxyUrl, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-cache',
        });

        if (response.ok) {
          console.log(`成功通过备用代理 ${proxyName} 获取数据`);

          try {
            // 克隆响应以便可以读取两次
            const clone = response.clone();
            const data = await clone.json();
            // 存入缓存
            requestCache.set(url, {
              data,
              timestamp: now,
              proxyUsed: proxyName,
            });
          } catch (error) {
            console.warn('缓存响应失败:', error);
          }

          return response;
        }

        throw new Error(`备用代理服务请求失败: ${response.status}`);
      } catch (error) {
        console.warn(`备用代理 ${proxyName} 失败:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        attemptCount++;
      }
    }
  }

  // 所有代理都失败了
  throw lastError || new Error('所有CORS代理都失败');
};
