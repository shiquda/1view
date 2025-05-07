import React from 'react';
import { Form, Input, Button, Select, Space, Typography, Row, Col, Divider } from 'antd';
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
} from '@ant-design/icons';
import { ViewerConfig } from '../types';

const { Title, Text } = Typography;
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

  // 确保styleConfig存在
  const styleConfig = initialConfig.styleConfig || {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontSize: '1.5rem',
  };

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

      <Form form={form} initialValues={initialValues} layout="vertical" onFinish={handleSubmit}>
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
            title: '使用$.data.value格式指定要显示的数据位置',
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
            title: '使用{value}作为数据值的占位符',
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
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ViewerConfigForm;
