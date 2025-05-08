import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
  Spin,
  Modal,
} from 'antd';
import {
  TagOutlined,
  LinkOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  FormOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  FontSizeOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { ViewerConfig, ViewerData } from '../types';
import { fetchData } from '../services/dataService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ViewerConfigProps {
  initialConfig?: Partial<ViewerConfig>;
  onSave: (config: ViewerConfig) => void;
  onCancel: () => void;
}

const ViewerConfigForm: React.FC<ViewerConfigProps> = ({
  initialConfig = {},
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [previewData, setPreviewData] = useState<ViewerData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRawDataModal, setShowRawDataModal] = useState(false);
  const [previewFormValues, setPreviewFormValues] = useState<Record<string, unknown> | null>(null);

  // 确保styleConfig存在
  const styleConfig = initialConfig.styleConfig || {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontSize: '1.5rem',
  };

  // 在组件挂载时填充表单
  useEffect(() => {
    // 创建初始值对象
    const initialValues = {
      id: initialConfig.id || crypto.randomUUID(),
      type: initialConfig.type || 'text',
      name: initialConfig.name || '',
      dataUrl: initialConfig.dataUrl || '',
      jsonPath: initialConfig.jsonPath || '',
      displayFormat: initialConfig.displayFormat || '{value}',
      'styleConfig.backgroundColor': styleConfig.backgroundColor || '#ffffff',
      'styleConfig.textColor': styleConfig.textColor || '#000000',
      'styleConfig.fontSize': styleConfig.fontSize || '1.5rem',
    };

    // 确保表单字段正确填充
    form.setFieldsValue(initialValues);

    // 在组件卸载时重置表单
    return () => {
      form.resetFields();
    };
  }, []); // 仅在组件初始挂载时执行

  // 预览数据
  const handlePreview = async () => {
    try {
      // 获取当前表单值并保存到状态中
      const values = form.getFieldsValue(true);
      setPreviewFormValues(values);

      // 验证必要的字段
      if (!values.dataUrl || !values.jsonPath) {
        setPreviewError('请填写数据源URL和JSON Path');
        setShowPreviewModal(true);
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);
      setShowPreviewModal(true);

      // 构建临时配置用于预览
      const previewConfig: ViewerConfig = {
        id: values.id || crypto.randomUUID(),
        type: values.type as 'text' | 'image',
        name: values.name || '预览',
        dataUrl: values.dataUrl,
        jsonPath: values.jsonPath,
        displayFormat: values.displayFormat || '{value}',
        styleConfig: {
          backgroundColor: values['styleConfig.backgroundColor'] || '#ffffff',
          textColor: values['styleConfig.textColor'] || '#000000',
          fontSize: values['styleConfig.fontSize'] || '1.5rem',
        },
      };

      // 请求数据
      const data = await fetchData(previewConfig);
      setPreviewData(data);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : '预览失败');
      console.error('预览失败:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 更新formatDisplayValue函数，使用预览时的表单值
  const formatDisplayValue = (data: ViewerData | null): string => {
    if (!data || data.value === null) {
      return '无数据';
    }

    // 使用预览时保存的表单值或当前表单值
    const currentValues = previewFormValues || form.getFieldsValue(true);
    const displayFormat = currentValues.displayFormat || '{value}';

    // 处理旧数据格式（字符串类型的value）- 向前兼容
    if (!Array.isArray(data.value)) {
      const value = data.value as unknown as string;
      return displayFormat.replace('{value}', value);
    }

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

  const handleSubmit = (values: Record<string, string>) => {
    // 构建完整的配置对象
    const completeConfig: ViewerConfig = {
      id: values.id,
      type: values.type as 'text' | 'image',
      name: values.name,
      dataUrl: values.dataUrl,
      jsonPath: values.jsonPath,
      displayFormat: values.displayFormat || '{value}', // 提供默认值
      styleConfig: {
        backgroundColor: values['styleConfig.backgroundColor'] || '#ffffff', // 提供默认值
        textColor: values['styleConfig.textColor'] || '#000000', // 提供默认值
        fontSize: values['styleConfig.fontSize'] || '1.5rem', // 提供默认值
      },
    };

    onSave(completeConfig);
  };

  // 修改renderRawDataModal函数，使用预览时保存的数据URL
  const renderRawDataModal = () => {
    if (!previewData || !previewData.rawData) return null;

    return (
      <Modal
        title="原始数据"
        open={showRawDataModal}
        onCancel={() => setShowRawDataModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowRawDataModal(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <Paragraph>
          <Text type="secondary">数据源URL: </Text>
          <Text code>{previewFormValues?.dataUrl || form.getFieldValue('dataUrl')}</Text>
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
          {JSON.stringify(previewData.rawData, null, 2)}
        </pre>
      </Modal>
    );
  };

  // 添加重置预览状态的函数
  const resetPreviewState = () => {
    // 不清除 previewFormValues，以保持最后一次预览的表单值
    // setPreviewFormValues(null);
    setPreviewData(null);
    setPreviewError(null);
    setShowPreviewModal(false);
    setShowRawDataModal(false);
  };

  // 修改关闭预览模态框的处理逻辑
  const renderPreviewModal = () => {
    const handleModalClose = () => {
      // 只关闭模态框，不重置表单值
      setShowPreviewModal(false);
    };

    return (
      <Modal
        title="预览结果"
        open={showPreviewModal}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            关闭
          </Button>,
        ]}
        width={700}
        afterClose={resetPreviewState}
      >
        {previewLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <Spin tip="数据加载中..." />
          </div>
        ) : previewError ? (
          <Alert
            type="error"
            showIcon
            message="预览失败"
            description={previewError}
            style={{ marginBottom: 16 }}
          />
        ) : previewData && previewData.error ? (
          <Alert
            type="warning"
            showIcon
            message="数据获取失败"
            description={previewData.error}
            style={{ marginBottom: 16 }}
          />
        ) : previewData && previewData.value ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                {previewData.rawData && (
                  <Button
                    type="primary"
                    ghost
                    icon={<SearchOutlined />}
                    onClick={() => {
                      setShowRawDataModal(true);
                    }}
                  >
                    查看原始数据
                  </Button>
                )}
                <Button
                  type="primary"
                  ghost
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    // 在刷新预览时先保存当前表单值
                    const currentValues = form.getFieldsValue(true);
                    console.log('刷新预览前的表单值:', currentValues);
                    handlePreview();
                  }}
                  loading={previewLoading}
                >
                  刷新预览
                </Button>
              </Space>
            </div>

            <Paragraph>
              <Text strong>提取的数据：</Text>
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '8px',
                }}
              >
                {Array.isArray(previewData.value) ? (
                  previewData.value.map((v, i) => (
                    <div key={i}>
                      <Text code>{`{value${i + 1}}`}</Text>: {v}
                    </div>
                  ))
                ) : (
                  <div>
                    <Text code>{'{value}'}</Text>: {previewData.value}
                  </div>
                )}
              </div>
            </Paragraph>
            <Paragraph>
              <Text strong>格式化后：</Text>
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px',
                  background: '#fafafa',
                }}
              >
                {formatDisplayValue(previewData)}
              </div>
            </Paragraph>
          </div>
        ) : (
          <Alert
            type="info"
            showIcon
            message="没有数据"
            description="未能获取到数据，请检查URL和JSONPath配置"
            style={{ marginBottom: 16 }}
          />
        )}
      </Modal>
    );
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <FormOutlined style={{ marginRight: 8 }} />
          配置数据视图
        </Title>
        <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: '100%' }}
        initialValues={{
          id: initialConfig.id || crypto.randomUUID(),
          type: initialConfig.type || 'text',
          name: initialConfig.name || '',
          dataUrl: initialConfig.dataUrl || '',
          jsonPath: initialConfig.jsonPath || '',
          displayFormat: initialConfig.displayFormat || '{value}',
          'styleConfig.backgroundColor': styleConfig.backgroundColor || '#ffffff',
          'styleConfig.textColor': styleConfig.textColor || '#000000',
          'styleConfig.fontSize': styleConfig.fontSize || '1.5rem',
        }}
      >
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入数据视图名称' }]}
        >
          <Input prefix={<TagOutlined />} placeholder="输入卡片显示的名称" />
        </Form.Item>

        <Form.Item
          label="数据源URL"
          name="dataUrl"
          rules={[{ required: true, message: '请输入数据源URL' }]}
        >
          <Input prefix={<LinkOutlined />} placeholder="https://api.example.com/data" />
        </Form.Item>

        <Form.Item
          label="JSON Path"
          name="jsonPath"
          rules={[
            { required: true, message: '请输入JSON Path' },
            { pattern: /^\$/, message: 'JSON Path必须以$开头' },
          ]}
          tooltip={{
            title:
              '使用$.data.value格式指定要显示的数据位置。支持使用英文逗号分隔多个路径，如$.data.value1, $.data.value2',
            icon: <InfoCircleOutlined />,
          }}
        >
          <Input prefix={<CodeOutlined />} placeholder="$.data.value" />
        </Form.Item>

        <Form.Item
          label="显示格式"
          name="displayFormat"
          rules={[{ required: true, message: '请输入显示格式' }]}
          tooltip={{
            title:
              '使用{value}作为数据值的占位符。对于多个值，可以使用{value1}, {value2}等单独引用特定值（从1开始编号）。',
            icon: <InfoCircleOutlined />,
          }}
        >
          <Input placeholder="值: {value}" />
        </Form.Item>

        <Divider orientation="left">样式设置</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space>
                  <BgColorsOutlined />
                  <span>背景色</span>
                </Space>
              }
              name="styleConfig.backgroundColor"
              rules={[{ required: true, message: '请选择背景色' }]}
            >
              <Input type="color" style={{ width: '100%', height: 32 }} placeholder="#ffffff" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label={
                <Space>
                  <FontColorsOutlined />
                  <span>文字颜色</span>
                </Space>
              }
              name="styleConfig.textColor"
              rules={[{ required: true, message: '请选择文字颜色' }]}
            >
              <Input type="color" style={{ width: '100%', height: 32 }} placeholder="#000000" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label={
                <Space>
                  <FontSizeOutlined />
                  <span>字体大小</span>
                </Space>
              }
              name="styleConfig.fontSize"
              rules={[{ required: true, message: '请选择字体大小' }]}
            >
              <Select>
                <Option value="0.875rem">小</Option>
                <Option value="1rem">中</Option>
                <Option value="1.5rem">大</Option>
                <Option value="2rem">特大</Option>
                <Option value="3rem">超大</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Form.Item style={{ marginBottom: 0 }}>
          <Row justify="end" gutter={16}>
            <Col>
              <Button onClick={onCancel}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handlePreview()}>
                预览
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
      {renderPreviewModal()}
      {showRawDataModal && renderRawDataModal()}
    </div>
  );
};

export default ViewerConfigForm;
