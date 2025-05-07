import React, { useState } from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import {
  SyncOutlined,
  EditOutlined,
  CheckOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import SettingsDialog from './SettingsDialog';

const { Header } = Layout;
const { Title } = Typography;

interface TopBarProps {
  appTitle: string;
  isConfiguring: boolean;
  toggleConfigMode: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ appTitle, isConfiguring, toggleConfigMode }) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 处理刷新所有数据
  const handleRefreshAll = () => {
    // 设置按钮的刷新状态
    setRefreshing(true);

    // 广播一个自定义事件，让所有卡片都刷新
    const refreshEvent = new CustomEvent('refreshAllViewers');
    window.dispatchEvent(refreshEvent);

    // 1.5秒后重置刷新状态（给用户足够的视觉反馈）
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <>
      <Header
        style={{
          background: 'linear-gradient(90deg, #1677ff 0%, #4096ff 100%)',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppstoreOutlined style={{ fontSize: 24, marginRight: 12, color: '#fff' }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {appTitle}
          </Title>
        </div>

        <Space size="middle">
          {/* 设置按钮 */}
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          >
            设置
          </Button>

          {/* 刷新数据按钮 */}
          <Button
            type="default"
            icon={<SyncOutlined spin={refreshing} />}
            onClick={handleRefreshAll}
            loading={false}
          >
            刷新
          </Button>

          {/* 编辑布局按钮 */}
          <Button
            type="primary"
            icon={isConfiguring ? <CheckOutlined /> : <EditOutlined />}
            onClick={toggleConfigMode}
            danger={isConfiguring}
          >
            {isConfiguring ? '完成' : '编辑'}
          </Button>
        </Space>
      </Header>

      {/* 全局设置对话框 */}
      <SettingsDialog visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </>
  );
};

export default TopBar;
