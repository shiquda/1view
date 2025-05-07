import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Switch,
  Button,
  Typography,
  Space,
  Divider,
  Radio,
  Tooltip,
  Card,
  Tag,
  message,
} from 'antd';
import {
  SettingOutlined,
  GlobalOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { GlobalSettings } from '../types';
import {
  loadGlobalSettings,
  saveGlobalSettings,
  PROXY_TEMPLATES,
} from '../services/settingsService';
import { exportConfig, importConfig } from '../services/storageService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ visible, onClose }) => {
  const [settings, setSettings] = useState<GlobalSettings>(loadGlobalSettings());
  const [testUrl, setTestUrl] = useState(
    'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d'
  );
  const [proxyType, setProxyType] = useState<'predefined' | 'custom'>(
    settings.corsProxy.selectedProxyIndex >= 0 ? 'predefined' : 'custom'
  );
  const [testResults, setTestResults] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [testLoading, setTestLoading] = useState(false);

  // 当对话框打开时加载设置
  useEffect(() => {
    if (visible) {
      const loadedSettings = loadGlobalSettings();
      setSettings(loadedSettings);
      setProxyType(loadedSettings.corsProxy.selectedProxyIndex >= 0 ? 'predefined' : 'custom');
    }
  }, [visible]);

  // 测试代理连接
  const testProxy = async () => {
    setTestLoading(true);
    setTestResults(null);

    try {
      let proxyUrl = '';
      if (proxyType === 'predefined' && settings.corsProxy.selectedProxyIndex >= 0) {
        proxyUrl = PROXY_TEMPLATES[settings.corsProxy.selectedProxyIndex].template.replace(
          '{url}',
          testUrl
        );
      } else {
        proxyUrl = settings.corsProxy.customProxyTemplate.replace('{url}', testUrl);
      }

      console.log(`测试代理: ${proxyUrl}`);

      const response = await fetch(proxyUrl, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        setTestResults({
          success: true,
          message: `连接成功 (状态码: ${response.status})`,
        });
      } else {
        setTestResults({
          success: false,
          message: `连接失败 (状态码: ${response.status})`,
        });
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: `错误: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setTestLoading(false);
    }
  };

  // 保存设置
  const saveSettings = () => {
    // 如果选择的是自定义代理，设置 selectedProxyIndex 为 -1
    const updatedSettings = {
      ...settings,
      corsProxy: {
        ...settings.corsProxy,
        selectedProxyIndex: proxyType === 'custom' ? -1 : settings.corsProxy.selectedProxyIndex,
      },
    };

    saveGlobalSettings(updatedSettings);
    onClose();
  };

  // 处理导入配置
  const handleImportConfig = () => {
    // 创建一个隐藏的文件输入框来处理导入
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = e => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        importConfig(file).then(
          () => {
            message.success('配置已成功导入！');
            onClose(); // 关闭设置对话框
            // 刷新页面以应用新配置
            window.location.reload();
          },
          error => {
            message.error(error instanceof Error ? error.message : '导入失败');
          }
        );
      }
    };
    fileInput.click();
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>全局设置</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={saveSettings}>
          保存
        </Button>,
      ]}
    >
      <Divider orientation="left">
        <Space>
          <DatabaseOutlined />
          <span>配置管理</span>
        </Space>
      </Divider>

      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ExportOutlined />} onClick={exportConfig}>
          导出配置
        </Button>
        <Button icon={<ImportOutlined />} onClick={handleImportConfig}>
          导入配置
        </Button>
        <Text type="secondary">导出/导入包括所有数据视图、布局和设置</Text>
      </Space>

      <Divider orientation="left">
        <Space>
          <GlobalOutlined />
          <span>CORS 代理设置</span>
        </Space>
      </Divider>

      <Form layout="vertical">
        <Form.Item
          label={
            <Space>
              <span>启用 CORS 代理</span>
              <Tooltip title="启用后，所有外部 API 请求将通过代理服务器转发，以避免浏览器的跨域限制">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
        >
          <Switch
            checked={settings.corsProxy.enabled}
            onChange={checked =>
              setSettings({
                ...settings,
                corsProxy: { ...settings.corsProxy, enabled: checked },
              })
            }
          />
        </Form.Item>

        {settings.corsProxy.enabled && (
          <>
            <Form.Item label="代理服务类型">
              <Radio.Group
                value={proxyType}
                onChange={e => setProxyType(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="predefined">使用预定义代理</Radio.Button>
                <Radio.Button value="custom">使用自定义代理</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {proxyType === 'predefined' ? (
              <Form.Item label="选择代理服务">
                <Select
                  value={settings.corsProxy.selectedProxyIndex}
                  onChange={value =>
                    setSettings({
                      ...settings,
                      corsProxy: { ...settings.corsProxy, selectedProxyIndex: value as number },
                    })
                  }
                  style={{ width: '100%' }}
                >
                  {PROXY_TEMPLATES.map((template, index) => (
                    <Option key={index} value={index}>
                      <Space>
                        <span>{template.name}</span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({template.description})
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
                {settings.corsProxy.selectedProxyIndex >= 0 && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    URL 模板:{' '}
                    <code>{PROXY_TEMPLATES[settings.corsProxy.selectedProxyIndex].template}</code>
                  </Text>
                )}
              </Form.Item>
            ) : (
              <Form.Item
                label={
                  <Space>
                    <span>自定义代理 URL 模板</span>
                    <Tooltip title="在模板中使用 {url} 作为原始 URL 的占位符，例如 https://your-proxy.com/{url}">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                extra="模板中的 {url} 将被替换为实际请求的 URL"
              >
                <Input
                  value={settings.corsProxy.customProxyTemplate}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      corsProxy: { ...settings.corsProxy, customProxyTemplate: e.target.value },
                    })
                  }
                  placeholder="https://your-proxy.com/{url}"
                  addonBefore={<LinkOutlined />}
                />
              </Form.Item>
            )}

            <Divider orientation="left">测试代理</Divider>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={testUrl}
                  onChange={e => setTestUrl(e.target.value)}
                  placeholder="输入测试 URL"
                  style={{ flex: 1 }}
                />
                <Button type="primary" onClick={testProxy} loading={testLoading}>
                  测试连接
                </Button>
              </Space.Compact>

              {testResults && (
                <Card size="small" style={{ marginTop: 16 }}>
                  <Space>
                    {testResults.success ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <Text>{testResults.message}</Text>
                    <Tag color={testResults.success ? 'success' : 'error'}>
                      {testResults.success ? '成功' : '失败'}
                    </Tag>
                  </Space>
                </Card>
              )}
            </Space>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default SettingsDialog;
