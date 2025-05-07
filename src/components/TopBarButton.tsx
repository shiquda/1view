import React from 'react';
import { Button } from 'antd';
import { SyncOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';

interface TopBarButtonProps {
  onClick: () => void;
  title?: string;
  icon: string;
  text: string;
  variant?: 'default' | 'primary' | 'success';
  className?: string;
}

const TopBarButton: React.FC<TopBarButtonProps> = ({
  onClick,
  title = '',
  icon,
  text,
  variant = 'default',
  className = '',
}) => {
  // 根据icon字符串选择对应的Ant Design图标
  const getIcon = () => {
    switch (icon) {
      case 'fas fa-sync-alt':
        return <SyncOutlined />;
      case 'fas fa-edit':
        return <EditOutlined />;
      case 'fas fa-check':
        return <CheckOutlined />;
      default:
        return null;
    }
  };

  // 根据variant选择不同的按钮类型
  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'success':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Button
      onClick={onClick}
      type={getButtonType()}
      icon={getIcon()}
      title={title}
      className={className}
      danger={variant === 'success'} // Ant Design 没有成功类型，我们用 danger 属性来表示成功状态
    >
      {text}
    </Button>
  );
};

export default TopBarButton;
