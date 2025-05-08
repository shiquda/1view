import React, { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import './App.css';
import Dashboard from './components/Dashboard';
import { loadGlobalSettings, applyThemeSettings } from './services/settingsService';

const App: React.FC = () => {
  // 应用启动时应用主题设置
  useEffect(() => {
    // 记录开始加载时间（调试用）
    const startTime = new Date().getTime();

    // 加载设置并应用主题
    try {
      const settings = loadGlobalSettings();
      console.log('应用启动时加载全局主题设置:', settings.theme);

      // 立即应用主题
      applyThemeSettings(settings.theme);

      const endTime = new Date().getTime();
      console.log(`主题应用完成，耗时: ${endTime - startTime}ms`);
    } catch (error) {
      console.error('应用主题设置时出错:', error);
    }
  }, []);

  return (
    // 使用antd的ConfigProvider提供全局配置
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: 'var(--color-primary)',
          borderRadius:
            parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue('--radius-card')
            ) * 16 || 8,
          fontFamily: 'var(--font-family)',
        },
      }}
    >
      <div className="min-h-screen">
        <Dashboard />
      </div>
    </ConfigProvider>
  );
};

export default App;
