import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Input,
  Typography,
  Empty,
  Tag,
  Divider,
  Space,
  Button,
  Modal,
  Form,
} from 'antd';
import {
  SearchOutlined,
  TagsOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Template, TemplateVariable, ViewerConfig } from '../types';
import { getAllTemplates, createViewerFromTemplate } from '../services/templateService';

const { Text, Paragraph } = Typography;

interface TemplateSelectorProps {
  onSelect: (viewerConfig: ViewerConfig) => void;
  onCancel: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onCancel }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showVariableForm, setShowVariableForm] = useState(false);

  // 加载可用模板
  useEffect(() => {
    const availableTemplates = getAllTemplates();
    setTemplates(availableTemplates);
  }, []);

  // 过滤模板
  const filteredTemplates = templates.filter(
    template =>
      template.name.toLowerCase().includes(searchText.toLowerCase()) ||
      template.description.toLowerCase().includes(searchText.toLowerCase()) ||
      template.category.toLowerCase().includes(searchText.toLowerCase())
  );

  // 根据分类对模板进行分组
  const templatesByCategory: { [key: string]: Template[] } = {};
  filteredTemplates.forEach(template => {
    if (!templatesByCategory[template.category]) {
      templatesByCategory[template.category] = [];
    }
    templatesByCategory[template.category].push(template);
  });

  // 处理选择模板
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowVariableForm(true);
  };

  // 内联定义TemplateVariableForm组件
  const TemplateVariableForm = ({
    template,
    onSubmit,
    onCancel,
  }: {
    template: Template;
    onSubmit: (viewerConfig: ViewerConfig) => void;
    onCancel: () => void;
  }) => {
    const [form] = Form.useForm();

    // 为表单设置初始值
    const initialValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialValues[variable.key] = variable.defaultValue || '';
    });

    const handleSubmit = (values: Record<string, string>) => {
      // 使用模板和变量值创建Viewer配置
      const viewerConfig = createViewerFromTemplate(template.id, values);
      onSubmit(viewerConfig);
    };

    return (
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleSubmit}>
        <Divider orientation="left">模板预览</Divider>
        <div
          style={{
            padding: 16,
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            background: '#fafafa',
            marginBottom: 24,
          }}
        >
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            {template.name}
          </Text>
          <Text type="secondary" style={{ display: 'block' }}>
            {template.description}
          </Text>

          <div style={{ marginTop: 16 }}>
            <Text strong>数据源URL:</Text>
            <div
              style={{
                wordBreak: 'break-all',
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 4,
                marginTop: 4,
              }}
            >
              <Text code>{template.config.dataUrl}</Text>
            </div>
          </div>
        </div>

        <Divider orientation="left">填写变量值</Divider>
        {template.variables.map((variable: TemplateVariable) => (
          <Form.Item
            key={variable.key}
            label={
              <Space>
                <span>{variable.name}</span>
                {variable.description && (
                  <Text type="secondary">
                    <QuestionCircleOutlined /> {variable.description}
                  </Text>
                )}
              </Space>
            }
            name={variable.key}
            rules={[{ required: true, message: `请输入${variable.name}` }]}
          >
            <Input placeholder={`请输入${variable.name}`} />
          </Form.Item>
        ))}

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit">
              创建卡片
            </Button>
          </Space>
        </Form.Item>
      </Form>
    );
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Input
          placeholder="搜索模板..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ flex: 1, marginRight: 16 }}
        />
        <Button onClick={onCancel}>返回</Button>
      </div>

      {Object.keys(templatesByCategory).length === 0 ? (
        <Empty description="没有找到匹配的模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <Divider orientation="left">
              <Space>
                <TagsOutlined />
                <span>{category}</span>
                <Tag color="blue">{categoryTemplates.length}</Tag>
              </Space>
            </Divider>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 3 }}
              dataSource={categoryTemplates}
              renderItem={template => (
                <List.Item>
                  <Card
                    hoverable
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>{template.name}</span>
                      </div>
                    }
                    extra={
                      <Button
                        type="primary"
                        size="small"
                        shape="circle"
                        icon={<EyeOutlined />}
                        onClick={() => handleSelectTemplate(template)}
                      />
                    }
                    style={{ height: '100%' }}
                  >
                    <Paragraph
                      ellipsis={{ rows: 2, expandable: false }}
                      style={{ marginBottom: 16 }}
                    >
                      {template.description}
                    </Paragraph>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        使用
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        ))
      )}

      {/* 变量表单模态框 */}
      {selectedTemplate && (
        <Modal
          title={`配置 "${selectedTemplate.name}" 模板`}
          open={showVariableForm}
          onCancel={() => setShowVariableForm(false)}
          footer={null}
          destroyOnClose
        >
          <TemplateVariableForm
            template={selectedTemplate}
            onSubmit={onSelect}
            onCancel={() => setShowVariableForm(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default TemplateSelector;
