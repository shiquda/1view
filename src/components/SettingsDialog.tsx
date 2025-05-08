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
  Tabs,
  ColorPicker,
  Slider,
} from 'antd';
import {
  SettingOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  DatabaseOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  RadiusSettingOutlined,
} from '@ant-design/icons';
import { GlobalSettings } from '../types';
import {
  loadGlobalSettings,
  saveGlobalSettings,
  PROXY_TEMPLATES,
  applyThemeSettings,
  getDefaultTheme,
} from '../services/settingsService';
import { exportConfig, importConfig } from '../services/storageService';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
}

// 定义一些常用颜色供快速选择
const COMMON_COLORS = {
  primaryColors: [
    '#1677ff', // 蓝色 (默认)
    '#722ed1', // 紫色
    '#eb2f96', // 粉色
    '#fa8c16', // 橙色
    '#52c41a', // 绿色
    '#f5222d', // 红色
    '#13c2c2', // 青色
    '#fadb14', // 黄色
  ],
  backgrounds: [
    '#f9fafb', // 浅灰色 (默认)
    '#f0f2f5', // 稍深灰色
    '#ffffff', // 纯白色
    '#e6f7ff', // 淡蓝色
    '#f6ffed', // 淡绿色
    '#fff7e6', // 淡橙色
    '#fff1f0', // 淡红色
    '#f9f0ff', // 淡紫色
  ],
  cardBackgrounds: [
    '#ffffff', // 纯白色 (默认)
    '#fafafa', // 浅灰色
    '#f5f5f5', // 稍深灰色
    '#f0f0f0', // 更深灰色
  ],
  textColors: [
    '#374151', // 深灰色 (默认)
    '#000000', // 黑色
    '#1f2937', // 近黑色
    '#6b7280', // 中灰色
    '#111827', // 深灰近黑
  ],
};

// 字体系列预设
const FONT_FAMILIES = [
  {
    label: '系统默认字体',
    value:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    label: '无衬线字体',
    value: '"Helvetica Neue", Arial, sans-serif',
  },
  {
    label: '衬线字体',
    value: 'Georgia, "Times New Roman", serif',
  },
  {
    label: '等宽字体',
    value: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  },
  {
    label: '中文优化',
    value: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Heiti SC", sans-serif',
  },
];

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

    // 立即应用主题设置
    applyThemeSettings(updatedSettings.theme);

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

  // 更新主题设置的辅助函数
  const updateThemeSetting = (key: keyof GlobalSettings['theme'], value: string) => {
    // 更新状态
    setSettings({
      ...settings,
      theme: {
        ...settings.theme,
        [key]: value,
      },
    });

    // 创建临时主题对象进行实时预览
    const previewTheme = {
      ...settings.theme,
      [key]: value,
    };

    // 立即应用更改，以便用户能看到实时效果
    applyThemeSettings(previewTheme);
  };

  // 重置主题设置为默认值
  const resetThemeToDefault = () => {
    // 使用导出的getDefaultTheme函数获取默认主题
    const defaultTheme = getDefaultTheme();

    // 只重置主题相关设置
    const newSettings = {
      ...settings,
      theme: defaultTheme,
    };

    setSettings(newSettings);

    // 立即应用默认主题
    applyThemeSettings(defaultTheme);

    // 显示提示
    message.success('已重置主题设置为默认值');
  };

  // 预览当前主题设置效果
  const previewTheme = () => {
    applyThemeSettings(settings.theme);
    message.info('已应用主题预览，保存设置后将永久生效');
  };

  // 渲染主题设置部分
  const renderThemeSettings = () => {
    return (
      <>
        <div className="theme-settings-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* 主题色 */}
          <Form.Item
            label={
              <Space>
                <BgColorsOutlined />
                <span>主题色</span>
              </Space>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ColorPicker
                value={settings.theme.primaryColor}
                onChange={color => updateThemeSetting('primaryColor', color.toHexString())}
                presets={[
                  {
                    label: '预设颜色',
                    colors: COMMON_COLORS.primaryColors,
                  },
                ]}
              />
              <div
                style={{
                  width: '100px',
                  height: '32px',
                  backgroundColor: settings.theme.primaryColor,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {settings.theme.primaryColor}
              </div>
            </div>
          </Form.Item>

          {/* 字体设置 */}
          <Form.Item
            label={
              <Space>
                <FontSizeOutlined />
                <span>字体设置</span>
              </Space>
            }
          >
            <Select
              value={settings.theme.fontFamily}
              onChange={value => updateThemeSetting('fontFamily', value)}
              style={{ width: '100%' }}
              placeholder="选择字体系列"
            >
              {FONT_FAMILIES.map((font, index) => (
                <Option key={index} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </Option>
              ))}
            </Select>

            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontFamily: settings.theme.fontFamily,
              }}
            >
              <Text>字体预览：中文汉字 & English Text 123456789</Text>
            </div>
          </Form.Item>

          {/* 卡片圆角 */}
          <Form.Item
            label={
              <Space>
                <RadiusSettingOutlined />
                <span>卡片圆角</span>
              </Space>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Slider
                min={0}
                max={24}
                value={parseFloat(settings.theme.borderRadius) * 16}
                onChange={value => updateThemeSetting('borderRadius', `${value / 16}rem`)}
                style={{ flex: 1 }}
              />
              <Input
                value={settings.theme.borderRadius}
                onChange={e => updateThemeSetting('borderRadius', e.target.value)}
                style={{ width: '80px' }}
              />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
              <div
                style={{
                  width: '120px',
                  height: '80px',
                  background: settings.theme.primaryColor,
                  borderRadius: settings.theme.borderRadius,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                卡片圆角预览
              </div>
            </div>
          </Form.Item>
        </div>

        <Divider />

        {/* 预览和重置按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <Button onClick={resetThemeToDefault}>恢复默认主题</Button>
          <Button type="primary" onClick={previewTheme}>
            预览主题
          </Button>
        </div>
      </>
    );
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
      <Tabs defaultActiveKey="proxy">
        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              配置管理
            </span>
          }
          key="config"
        >
          <div style={{ marginBottom: 24 }}>
            <Space>
              <Button icon={<ExportOutlined />} onClick={exportConfig}>
                导出配置
              </Button>
              <Button icon={<ImportOutlined />} onClick={handleImportConfig}>
                导入配置
              </Button>
              <Text type="secondary">导出/导入包括所有数据视图、布局和设置</Text>
            </Space>
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <GlobalOutlined />
              代理设置
            </span>
          }
          key="proxy"
        >
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
                              {template.description}
                            </Text>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                ) : (
                  <Form.Item
                    label={
                      <Space>
                        <span>自定义代理 URL 模板</span>
                        <Tooltip title="使用 {url} 作为占位符表示要请求的 URL">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Input
                      value={settings.corsProxy.customProxyTemplate}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          corsProxy: {
                            ...settings.corsProxy,
                            customProxyTemplate: e.target.value,
                          },
                        })
                      }
                      placeholder="例如: https://your-proxy.com/{url}"
                    />
                  </Form.Item>
                )}

                <Divider>代理测试</Divider>

                <Form.Item label="测试 URL">
                  <Input
                    value={testUrl}
                    onChange={e => setTestUrl(e.target.value)}
                    placeholder="输入要测试的 URL"
                    addonAfter={
                      <Button
                        type="link"
                        onClick={testProxy}
                        loading={testLoading}
                        style={{ padding: 0, height: 'auto' }}
                      >
                        测试
                      </Button>
                    }
                  />
                </Form.Item>

                {testResults && (
                  <div style={{ marginTop: '16px' }}>
                    {testResults.success ? (
                      <Card
                        size="small"
                        title={
                          <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <span>测试成功</span>
                          </Space>
                        }
                        style={{ borderColor: '#b7eb8f' }}
                      >
                        <Tag color="success">{testResults.message}</Tag>
                      </Card>
                    ) : (
                      <Card
                        size="small"
                        title={
                          <Space>
                            <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                            <span>测试失败</span>
                          </Space>
                        }
                        style={{ borderColor: '#ffccc7' }}
                      >
                        <Tag color="error">{testResults.message}</Tag>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </Form>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BgColorsOutlined />
              主题设置
            </span>
          }
          key="theme"
        >
          {renderThemeSettings()}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default SettingsDialog;
