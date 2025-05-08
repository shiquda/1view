export interface ViewerConfig {
  id: string;
  type: 'text' | 'image'; // 暂时只支持文本类型，未来可扩展
  name: string;
  dataUrl: string;
  jsonPath: string;
  displayFormat: string;
  styleConfig: {
    backgroundColor: string;
    textColor: string;
    fontSize: string;
  };
}

// 模板定义接口
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Omit<ViewerConfig, 'id'>;
  variables: TemplateVariable[];
}

// 模板变量接口
export interface TemplateVariable {
  name: string; // 变量名称，用于显示
  key: string; // 变量占位符，例如 $1, $2
  description: string; // 变量说明
  defaultValue?: string; // 可选的默认值
}

export interface LayoutItem {
  i: string; // 对应ViewerConfig的id
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardConfig {
  viewers: ViewerConfig[];
  layout: LayoutItem[];
  templates?: Template[]; // 存储用户自定义的模板
}

export interface ViewerData {
  id: string;
  value: string[] | null;
  lastUpdated: number; // Unix时间戳
  error?: string;
  rawData?: Record<string, unknown>; // 添加原始数据字段，用于存储API返回的完整JSON数据
}

// 全局设置配置
export interface GlobalSettings {
  corsProxy: {
    // 选择的代理服务索引，-1 表示使用自定义代理
    selectedProxyIndex: number;
    // 自定义代理 URL 模板，{url} 将被替换为实际 URL
    customProxyTemplate: string;
    // 是否启用代理
    enabled: boolean;
  };
}

// 预定义的 CORS 代理服务模板
export interface ProxyServiceTemplate {
  name: string;
  description: string;
  template: string;
}
