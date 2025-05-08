import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Spin,
  Result,
  Alert,
  Tooltip,
  Modal,
  Space,
  Divider,
} from 'antd';
import { SyncOutlined, InfoCircleOutlined, WarningOutlined, CodeOutlined } from '@ant-design/icons';
import { ViewerConfig, ViewerData } from '../types';
import { fetchData } from '../services/dataService';

const { Text, Title, Paragraph } = Typography;

// 默认样式配置
const DEFAULT_STYLE_CONFIG = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  fontSize: '1.5rem',
};

interface ViewerProps {
  config: ViewerConfig;
  initialData?: ViewerData | null;
  onDataUpdate?: (data: ViewerData) => void;
  refreshInterval?: number; // 刷新间隔，单位毫秒
}

const Viewer: React.FC<ViewerProps> = ({
  config,
  initialData,
  onDataUpdate,
  refreshInterval = 60000, // 默认1分钟刷新一次
}) => {
  const [data, setData] = useState<ViewerData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false); // 新增状态，表示是否正在刷新
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false); // 控制原始数据弹窗显示

  // 验证配置是否完整
  useEffect(() => {
    try {
      // 检查必需字段
      if (!config) {
        throw new Error('卡片配置缺失');
      }

      if (!config.name) {
        throw new Error('卡片名称缺失');
      }

      if (!config.dataUrl) {
        throw new Error('数据URL缺失');
      }

      if (!config.jsonPath) {
        throw new Error('JSON路径缺失');
      }

      // 清除配置错误
      setConfigError(null);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : '配置错误');
      console.error('卡片配置错误:', err);
    }
  }, [config]);

  // 格式化显示数据
  const formatDisplayValue = (data: ViewerData | null): string => {
    if (!data || data.value === null) {
      return '无数据';
    }

    // 处理旧数据格式（字符串类型的value）- 向前兼容
    if (!Array.isArray(data.value)) {
      const value = data.value as unknown as string;
      const displayFormat = config.displayFormat || '{value}';
      return displayFormat.replace('{value}', value);
    }

    // 使用配置中的显示格式（如果配置中没有，则直接显示值）
    const displayFormat = config.displayFormat || '{value}';

    // 如果是单个值，直接替换{value}
    if (data.value.length === 1) {
      return displayFormat.replace('{value}', data.value[0]);
    }

    // 如果是多个值，用逗号连接或格式化显示
    if (displayFormat.includes('{value}')) {
      // 如果格式中只有{value}占位符，用所有值连接起来
      return displayFormat.replace('{value}', data.value.join(', '));
    } else if (displayFormat.includes('{value1}') || displayFormat.includes('{value2}')) {
      // 如果格式中包含{valueN}形式的占位符，占位符从1开始编号，逐个替换
      let formatted = displayFormat;
      data.value.forEach((val, index) => {
        // 占位符从1开始，而不是0
        formatted = formatted.replace(`{value${index + 1}}`, val);
      });
      return formatted;
    } else {
      // 默认用逗号连接所有值
      return data.value.join(', ');
    }
  };

  // 获取并刷新数据
  const refreshData = async () => {
    // 如果配置有错误，不执行数据刷新
    if (configError) {
      return;
    }

    try {
      // 如果已有数据，则使用isRefreshing而不是loading状态
      if (data) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 添加一些最小延迟，确保动画效果可见
      const fetchPromise = fetchData(config);
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 800));

      // 并行执行获取数据和最小延迟
      const [newData] = await Promise.all([fetchPromise, timeoutPromise]);

      setData(newData);
      if (onDataUpdate) {
        onDataUpdate(newData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      console.error('刷新数据失败:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 监听全局刷新事件
  useEffect(() => {
    const handleRefreshAll = () => {
      if (!configError) {
        setIsRefreshing(true);
        refreshData();
      }
    };

    window.addEventListener('refreshAllViewers', handleRefreshAll);
    return () => {
      window.removeEventListener('refreshAllViewers', handleRefreshAll);
    };
  }, [configError]); // eslint-disable-line react-hooks/exhaustive-deps

  // 初始加载和定时刷新
  useEffect(() => {
    // 如果配置有错误，不执行初始加载和定时刷新
    if (configError) {
      return;
    }

    // 如果没有初始数据，立即加载
    if (!initialData) {
      refreshData();
    }

    // 设置定时刷新
    const intervalId = setInterval(refreshData, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [config.id, config.dataUrl, config.jsonPath, refreshInterval, configError, initialData]);

  // 安全地获取样式配置，如果不存在则使用默认值
  const styleConfig = config.styleConfig || DEFAULT_STYLE_CONFIG;
  const {
    backgroundColor = DEFAULT_STYLE_CONFIG.backgroundColor,
    textColor = DEFAULT_STYLE_CONFIG.textColor,
    fontSize = DEFAULT_STYLE_CONFIG.fontSize,
  } = styleConfig;

  // 如果配置有错误，显示错误卡片
  if (configError) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(0, 0, 0, 0.85)' }}>配置错误</Text>
            <WarningOutlined style={{ color: '#faad14' }} />
          </div>
        }
        style={{
          height: '100%',
          backgroundColor: '#fff2e8',
          borderColor: '#ffccc7',
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <Result
          status="warning"
          title="卡片配置有误"
          subTitle={configError}
          style={{ padding: 0 }}
        />
      </Card>
    );
  }

  // 渲染原始数据弹窗
  const renderRawDataModal = () => {
    if (!data || !data.rawData) return null;

    return (
      <Modal
        title="原始数据"
        open={showRawData}
        onCancel={() => setShowRawData(false)}
        footer={[
          <Button key="close" onClick={() => setShowRawData(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <Paragraph>
          <Text type="secondary">数据源URL: </Text>
          <Text code>{config.dataUrl}</Text>
        </Paragraph>
        <Paragraph>
          <Text type="secondary">JSON路径: </Text>
          <Text code>{config.jsonPath}</Text>
        </Paragraph>
        <Paragraph>
          <Text type="secondary">最后更新时间: </Text>
          <Text>{new Date(data.lastUpdated).toLocaleString()}</Text>
        </Paragraph>
        <Divider />
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '500px',
          }}
        >
          {JSON.stringify(data.rawData, null, 2)}
        </pre>
      </Modal>
    );
  };

  return (
    <>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: textColor }}>{config.name}</Text>
            <Space>
              {data && data.rawData && (
                <Tooltip title="查看原始数据" placement="left">
                  <Button
                    type="text"
                    size="small"
                    icon={<CodeOutlined style={{ fontSize: '16px' }} />}
                    onClick={() => setShowRawData(true)}
                    style={{
                      color: textColor,
                      opacity: 0.8,
                      transition: 'all 0.3s',
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip title="刷新数据" placement="left">
                <Button
                  type="text"
                  size="small"
                  icon={<SyncOutlined spin={isRefreshing} style={{ fontSize: '16px' }} />}
                  onClick={refreshData}
                  disabled={isRefreshing}
                  style={{
                    color: textColor,
                    opacity: isRefreshing ? 0.7 : 1,
                    transition: 'all 0.3s',
                  }}
                />
              </Tooltip>
            </Space>
          </div>
        }
        style={{
          height: '100%',
          backgroundColor: backgroundColor,
          color: textColor,
          display: 'flex',
          flexDirection: 'column',
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        {loading ? (
          <Spin tip="加载中" />
        ) : error ? (
          <div style={{ width: '100%' }}>
            <Result
              status="error"
              title="加载失败"
              subTitle={
                <Tooltip title={error} placement="left">
                  <span style={{ cursor: 'help' }}>
                    {error.length > 50 ? `${error.substring(0, 50)}...` : error}
                  </span>
                </Tooltip>
              }
              style={{ padding: 0 }}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Tooltip title="CORS 错误可能是由浏览器安全限制导致的" placement="left">
                {error.includes('CORS') && (
                  <Alert
                    type="warning"
                    showIcon
                    message="跨域访问受限"
                    description={
                      <div>
                        <div>浏览器阻止了跨域请求。</div>
                        <div style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            type="link"
                            icon={<InfoCircleOutlined />}
                            onClick={() =>
                              window.open(
                                'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS',
                                '_blank'
                              )
                            }
                          >
                            了解更多
                          </Button>
                        </div>
                      </div>
                    }
                    style={{ width: '100%' }}
                  />
                )}
              </Tooltip>
            </div>
          </div>
        ) : (
          <Title level={3} style={{ fontSize, color: textColor, margin: 0 }}>
            {formatDisplayValue(data)}
          </Title>
        )}
      </Card>
      {renderRawDataModal()}
    </>
  );
};

export default Viewer;
