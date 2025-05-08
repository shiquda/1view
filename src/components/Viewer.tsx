import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Spin, Result, Alert, Tooltip, Space } from 'antd';
import {
  SyncOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { ViewerConfig, ViewerData } from '../types';
import { fetchData } from '../services/dataService';

const { Text, Title } = Typography;

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
  const [showSuccess, setShowSuccess] = useState(false); // 新增状态，表示是否显示成功图标

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

    // 如果是多个值
    if (displayFormat.includes('{value}')) {
      // 如果格式中只有{value}占位符，用所有值连接起来
      return displayFormat.replace('{value}', data.value.join(', '));
    } else {
      // 检查是否包含任何形式的{valueN}占位符
      const hasValuePlaceholders = /\{value\d+\}/.test(displayFormat);

      if (hasValuePlaceholders) {
        // 创建一个新的格式化字符串的副本
        let formatted = displayFormat;

        // 首先查找所有的 {valueN} 模式
        const placeholderRegex = /\{value(\d+)\}/g;
        let match;
        let placeholders = [];

        // 收集所有占位符并排序
        while ((match = placeholderRegex.exec(displayFormat)) !== null) {
          const index = parseInt(match[1]);
          placeholders.push({
            placeholder: match[0],
            index: index,
          });
        }

        // 按占位符索引排序，确保从小到大替换
        placeholders.sort((a, b) => a.index - b.index);

        // 逐个替换占位符
        for (const { placeholder, index } of placeholders) {
          // 检查索引是否在数据范围内
          if (index > 0 && index <= data.value.length) {
            // 注意索引从1开始，但数组索引从0开始
            formatted = formatted.replace(placeholder, data.value[index - 1]);
          } else {
            // 超出范围的占位符替换为空字符串
            formatted = formatted.replace(placeholder, '');
          }
        }

        return formatted;
      } else {
        // 默认用逗号连接所有值
        return data.value.join(', ');
      }
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

      // 显示成功图标
      setShowSuccess(true);
      // 3秒后隐藏成功图标
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
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

    // 清除旧的定时器
    let intervalId: number | null = null;

    // 创建一个刷新函数，带有防抖机制
    const debouncedRefresh = () => {
      // 如果已经在刷新中，不要重复刷新
      if (isRefreshing || loading) {
        return;
      }

      refreshData();
    };

    // 如果没有初始数据，立即加载
    if (!initialData) {
      debouncedRefresh();
    }

    // 只有当refreshInterval大于0时才设置定时刷新
    if (refreshInterval > 0) {
      intervalId = window.setInterval(debouncedRefresh, refreshInterval);
    }

    return () => {
      // 清除定时器
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [config.id, refreshInterval, configError, initialData]);

  // 在依赖项变更时手动触发刷新，但不影响定时器
  useEffect(() => {
    // 关键数据源发生变更且不存在错误时，触发一次刷新
    if (!configError && !isRefreshing && !loading) {
      refreshData();
    }
  }, [config.dataUrl, config.jsonPath]);

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

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: textColor }}>{config.name}</Text>
          <Space>
            <Tooltip title="刷新数据" placement="left">
              <Button
                type="text"
                size="small"
                icon={
                  showSuccess ? (
                    <CheckOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                  ) : (
                    <SyncOutlined spin={isRefreshing} style={{ fontSize: '16px' }} />
                  )
                }
                onClick={refreshData}
                disabled={isRefreshing}
                style={{
                  color: showSuccess ? '#52c41a' : textColor,
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
        overflow: 'hidden',
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
        <Tooltip title={formatDisplayValue(data)}>
          <div
            style={{
              width: '100%',
              maxHeight: '100%',
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            <Title
              level={3}
              style={{
                fontSize,
                color: textColor,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3, // 最多显示3行
                lineHeight: '1.4em',
                maxHeight: '4.2em', // 3行的大致高度
                wordBreak: 'break-word', // 允许单词内换行
                whiteSpace: 'pre-wrap', // 保留空格和换行，但允许正常换行
              }}
            >
              {formatDisplayValue(data)}
            </Title>
          </div>
        </Tooltip>
      )}
    </Card>
  );
};

export default Viewer;
