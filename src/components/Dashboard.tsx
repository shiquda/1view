import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Layout, Button, Modal, Empty, Tooltip, FloatButton, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  DragOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import 'react-grid-layout/css/styles.css';
import { DashboardConfig, LayoutItem, ViewerConfig, ViewerData } from '../types';
import Viewer from './Viewer';
import ViewerConfigForm from './ViewerConfig';
import TemplateSelector from './TemplateSelector';
import TopBar from './TopBar';
import {
  loadDashboardConfig,
  loadViewerDataCache,
  saveDashboardConfig,
  saveViewerDataCache,
} from '../services/storageService';
import './Dashboard.css'; // 我们将添加自定义CSS

const { Content, Footer } = Layout;
const { Text } = Typography;
const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig>({
    viewers: [],
    layout: [],
  });
  const [dataCache, setDataCache] = useState<Record<string, ViewerData>>({});
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [editingViewer, setEditingViewer] = useState<Partial<ViewerConfig> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // 加载保存的配置和数据缓存
  useEffect(() => {
    const savedConfig = loadDashboardConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }

    const savedDataCache = loadViewerDataCache();
    if (savedDataCache) {
      setDataCache(savedDataCache);
    }
  }, []);

  // 保存布局变化
  const handleLayoutChange = (currentLayout: LayoutItem[]) => {
    if (!isConfiguring) return; // 只在配置模式下保存布局

    const newConfig = { ...config, layout: currentLayout };
    setConfig(newConfig);
    saveDashboardConfig(newConfig);
  };

  // 处理数据更新
  const handleDataUpdate = (data: ViewerData) => {
    const newDataCache = { ...dataCache, [data.id]: data };
    setDataCache(newDataCache);
    saveViewerDataCache(newDataCache);
  };

  // 添加或更新Viewer
  const handleSaveViewer = (viewerConfig: ViewerConfig) => {
    const isNew = !config.viewers.some(v => v.id === viewerConfig.id);
    let newViewers = [...config.viewers];
    let newLayout = [...config.layout];

    if (isNew) {
      // 添加新的Viewer
      newViewers.push(viewerConfig);

      // 为新Viewer添加布局信息
      const lastY = newLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
      newLayout.push({
        i: viewerConfig.id,
        x: 0,
        y: lastY,
        w: 4,
        h: 5,
      });
    } else {
      // 更新已有的Viewer
      newViewers = newViewers.map(v => (v.id === viewerConfig.id ? viewerConfig : v));
    }

    const newConfig = {
      ...config,
      viewers: newViewers,
      layout: newLayout,
    };

    setConfig(newConfig);
    saveDashboardConfig(newConfig);
    setEditingViewer(null);
    setShowAddForm(false);
  };

  // 处理从模板创建卡片
  const handleCreateFromTemplate = (viewerConfig: ViewerConfig) => {
    handleSaveViewer(viewerConfig);
    setShowTemplateSelector(false);
  };

  // 删除Viewer
  const handleDeleteViewer = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此卡片吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const newViewers = config.viewers.filter(v => v.id !== id);
        const newLayout = config.layout.filter(item => item.i !== id);

        const newConfig = {
          ...config,
          viewers: newViewers,
          layout: newLayout,
        };

        setConfig(newConfig);
        saveDashboardConfig(newConfig);

        // 清除数据缓存
        const newDataCache = { ...dataCache };
        delete newDataCache[id];
        setDataCache(newDataCache);
        saveViewerDataCache(newDataCache);
      },
    });
  };

  // 配置模式切换
  const toggleConfigMode = () => {
    setIsConfiguring(!isConfiguring);
    if (isConfiguring) {
      setEditingViewer(null);
      setShowAddForm(false);
      setShowTemplateSelector(false);
    }
  };

  // 阻止操作按钮区域的拖拽事件
  const handleButtonAreaMouseDown = (e: React.MouseEvent) => {
    // 阻止事件冒泡，防止触发拖拽
    e.stopPropagation();
  };

  // 渲染创建卡片对话框
  const renderCreateCardDialog = () => {
    if (showAddForm) {
      return (
        <Modal
          open={true}
          footer={null}
          onCancel={() => setShowAddForm(false)}
          width={600}
          bodyStyle={{ padding: '24px' }}
          destroyOnClose
        >
          <ViewerConfigForm
            initialConfig={editingViewer || {}}
            onSave={handleSaveViewer}
            onCancel={() => setShowAddForm(false)}
          />
        </Modal>
      );
    }

    if (showTemplateSelector) {
      return (
        <Modal
          open={true}
          footer={null}
          onCancel={() => setShowTemplateSelector(false)}
          width={800}
          bodyStyle={{ padding: '24px' }}
          destroyOnClose
          title="选择模板"
        >
          <TemplateSelector
            onSelect={handleCreateFromTemplate}
            onCancel={() => setShowTemplateSelector(false)}
          />
        </Modal>
      );
    }

    return null;
  };

  // 渲染添加卡片按钮组
  const renderAddCardButtons = () => {
    if (!isConfiguring) return null;

    return (
      <div style={{ position: 'fixed', right: 24, bottom: 24 }}>
        <FloatButton.Group trigger="hover" icon={<PlusOutlined />} type="primary">
          <FloatButton
            icon={<PlusOutlined />}
            tooltip={{
              title: '从零创建',
              placement: 'left',
            }}
            onClick={() => {
              setEditingViewer(null);
              setShowAddForm(true);
              setShowTemplateSelector(false);
            }}
          />
          <FloatButton
            icon={<AppstoreOutlined />}
            tooltip={{
              title: '从模板创建',
              placement: 'left',
            }}
            onClick={() => {
              setShowTemplateSelector(true);
              setShowAddForm(false);
            }}
          />
        </FloatButton.Group>
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <TopBar appTitle="1View" isConfiguring={isConfiguring} toggleConfigMode={toggleConfigMode} />

      {/* 主内容区域 */}
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {/* 创建卡片对话框 */}
        {renderCreateCardDialog()}

        {/* 仪表盘网格 */}
        {config.viewers.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100vh - 200px)',
            }}
          >
            <Empty
              description={
                <span>
                  还没有数据卡片
                  {isConfiguring && (
                    <Text style={{ marginLeft: 8 }}>
                      点击右下角的 <PlusOutlined /> 按钮开始创建
                    </Text>
                  )}
                </span>
              }
            />
            {isConfiguring && (
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingViewer(null);
                    setShowAddForm(true);
                  }}
                  style={{ marginRight: 8 }}
                >
                  从零创建
                </Button>
                <Button
                  type="primary"
                  icon={<AppstoreOutlined />}
                  onClick={() => setShowTemplateSelector(true)}
                >
                  从模板创建
                </Button>
              </div>
            )}
          </div>
        ) : (
          <ResponsiveGridLayout
            className={`layout ${isConfiguring ? 'edit-mode' : ''}`}
            layouts={{ lg: config.layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            isDraggable={isConfiguring}
            isResizable={isConfiguring}
            onLayoutChange={handleLayoutChange}
            margin={[16, 16] as [number, number]}
          >
            {config.viewers.map(viewer => (
              <div key={viewer.id} style={{ height: '100%' }}>
                <div style={{ height: '100%', position: 'relative' }}>
                  {isConfiguring && (
                    <>
                      {/* 拖动指示器 */}
                      <Tooltip title="拖动卡片" placement="right">
                        <DragOutlined
                          style={{
                            position: 'absolute',
                            left: 8,
                            top: 8,
                            zIndex: 10,
                            cursor: 'move',
                            color: 'rgba(0, 0, 0, 0.45)',
                            padding: 4,
                            background: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: 4,
                          }}
                        />
                      </Tooltip>

                      {/* 操作按钮区域 */}
                      <div
                        className="card-buttons"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          display: 'flex',
                          gap: 4,
                          background: 'rgba(255, 255, 255, 0.9)',
                          padding: 4,
                          borderRadius: 4,
                        }}
                        onMouseDown={handleButtonAreaMouseDown}
                        onTouchStart={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                      >
                        <Tooltip title="编辑" placement="left">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={e => {
                              e.stopPropagation();
                              setEditingViewer(viewer);
                              setShowAddForm(true);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="删除" placement="left">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteViewer(viewer.id);
                            }}
                          />
                        </Tooltip>
                      </div>
                    </>
                  )}
                  <Viewer
                    config={viewer}
                    initialData={dataCache[viewer.id]}
                    onDataUpdate={handleDataUpdate}
                  />
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}

        {/* 添加卡片按钮组 */}
        {renderAddCardButtons()}
      </Content>

      {/* 页脚 */}
      <Footer
        style={{
          background: '#fff',
          height: '40px',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <Text type="secondary">1View Dashboard ©{new Date().getFullYear()}</Text>
        <Button
          type="link"
          icon={<GithubOutlined />}
          href="https://github.com/shiquda/1view"
          target="_blank"
          style={{
            padding: '0px 8px',
            height: '24px',
            position: 'absolute',
            right: '24px',
          }}
        >
          GitHub
        </Button>
      </Footer>
    </Layout>
  );
};

export default Dashboard;
