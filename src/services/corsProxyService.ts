/**
 * CORS 代理服务
 * 提供多种方式解决跨域问题
 */
import { getProxyUrl, PROXY_TEMPLATES, loadGlobalSettings } from './settingsService';

/**
 * 尝试使用配置的 CORS 代理获取数据
 * @param url 原始 URL
 * @returns Promise<Response>
 */
export const fetchWithCorsProxy = async (url: string): Promise<Response> => {
  const settings = loadGlobalSettings();

  // 如果禁用了代理，直接请求原始 URL
  if (!settings.corsProxy.enabled) {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
    });
  }

  let lastError: Error | null = null;
  let attemptCount = 0;
  const maxAttempts = 3; // 最多尝试 3 次

  // 首先尝试配置的首选代理
  try {
    const proxyUrl = getProxyUrl(url);
    // console.log(`尝试通过配置的代理访问: ${proxyUrl}`);

    const response = await fetch(proxyUrl, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
    });

    if (response.ok) {
      //   console.log(`成功通过配置的代理获取数据`);
      return response;
    }

    throw new Error(`配置的代理服务请求失败: ${response.status}`);
  } catch (error) {
    console.warn(`配置的代理失败:`, error);
    lastError = error instanceof Error ? error : new Error(String(error));
    attemptCount++;
  }

  // 如果首选代理失败，尝试其他代理
  if (attemptCount < maxAttempts) {
    // 尝试剩余的预定义代理（跳过已经用过的）
    for (let i = 0; i < PROXY_TEMPLATES.length && attemptCount < maxAttempts; i++) {
      if (i === settings.corsProxy.selectedProxyIndex) continue; // 跳过已经尝试过的首选代理

      try {
        const proxyUrl = PROXY_TEMPLATES[i].template.replace('{url}', url);
        console.log(`尝试备用代理 ${PROXY_TEMPLATES[i].name}: ${proxyUrl}`);

        const response = await fetch(proxyUrl, {
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-cache',
        });

        if (response.ok) {
          console.log(`成功通过备用代理 ${PROXY_TEMPLATES[i].name} 获取数据`);
          return response;
        }

        throw new Error(`备用代理服务请求失败: ${response.status}`);
      } catch (error) {
        console.warn(`备用代理 ${PROXY_TEMPLATES[i].name} 失败:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        attemptCount++;
      }
    }
  }

  // 所有代理都失败了
  throw lastError || new Error('所有CORS代理都失败');
};
