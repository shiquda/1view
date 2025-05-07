import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import './App.css';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </ConfigProvider>
  );
};

export default App;
