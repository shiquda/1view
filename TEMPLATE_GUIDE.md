# 1View 模板创建指南

本文档提供如何为1View创建数据卡片模板的详细指南。通过创建模板，您可以帮助其他用户更轻松地配置常用的数据源。

## 什么是模板？

在1View中，模板是一种预定义的数据卡片配置，包含了数据源URL、数据提取路径（JSONPath）、显示格式和样式设置。模板可以包含变量占位符，允许用户在使用模板时自定义某些参数（如API密钥、用户名等）。

## 模板结构

每个模板都是一个JSON对象，包含以下字段：

```json
{
  "id": "unique-template-id",
  "name": "模板名称",
  "description": "模板功能的简要描述",
  "category": "模板分类",
  "config": {
    "type": "text",
    "name": "卡片名称 - <$1>",
    "dataUrl": "https://api.example.com/data/<$1>",
    "jsonPath": "$.data.value",
    "displayFormat": "{value} 单位",
    "styleConfig": {
      "backgroundColor": "#ffffff",
      "textColor": "#000000",
      "fontSize": "1.5rem"
    }
  },
  "variables": [
    {
      "name": "变量显示名称",
      "key": "$1",
      "description": "变量的用途说明",
      "defaultValue": "默认值"
    }
  ]
}
```

### 字段说明

- **id**: 唯一标识符，建议使用英文和连字符
- **name**: 模板名称，简洁明了
- **description**: 对模板功能的简要描述
- **category**: 模板分类，用于在模板选择器中组织模板
- **config**: 卡片配置对象
  - **type**: 目前支持 "text"（未来会扩展支持更多类型）
  - **name**: 卡片标题，可以包含变量占位符
  - **dataUrl**: 数据源URL，可以包含变量占位符
  - **jsonPath**: 数据提取路径（使用JSONPath语法）
    - 支持使用英文逗号分隔多个路径，如 `$.data.value1, $.data.value2`
    - 每个路径需以 `$` 开头
  - **displayFormat**: 显示格式
    - 使用 `{value}` 作为数据值的占位符(单个值)或所有值的连接(多个值)
    - 对于多个值，可以使用 `{value1}`, `{value2}`, `{value3}` 等单独引用（从1开始编号）
  - **styleConfig**: 样式配置
    - **backgroundColor**: 背景颜色（十六进制颜色代码）
    - **textColor**: 文本颜色（十六进制颜色代码）
    - **fontSize**: 字体大小（CSS值，如 "0.875rem"（小），"1rem"（中），"1.5rem"（大），"2rem"（特大），"3rem"（超大））
- **variables**: 变量定义数组
  - **name**: 变量的显示名称
  - **key**: 变量的占位符，在config中使用（如 "$1", "$2"）
  - **description**: 变量用途的说明
  - **defaultValue**: 变量的默认值（可选）

## 变量占位符

变量占位符使用 `<$n>` 格式（如 `<$1>`, `<$2>`），可以放在以下字段中：

- `config.name`
- `config.dataUrl`
- `config.jsonPath`
- `config.displayFormat`

当用户使用模板时，系统会提示用户为每个变量提供值，然后将这些值替换到相应的位置。

## 多值数据查询

1View 支持在一个卡片中查询和显示多个数据值：

1. **多路径查询**：在 `jsonPath` 中使用英文逗号分隔多个路径

   ```
   $.data.temperature, $.data.humidity
   ```

2. **显示格式**：对于多个值，有两种显示方式：
   - 使用 `{value}` 将所有值以逗号连接显示
   - 使用索引形式 `{value1}`, `{value2}` 引用特定的值（从1开始编号）

   ```
   温度: {value1}°C, 湿度: {value2}%
   ```

## 模板设计最佳实践

1. **明确的命名和描述**：为您的模板提供清晰、具体的名称和描述
2. **合适的分类**：选择合适的分类帮助用户快速找到您的模板
3. **有意义的变量名**：为变量提供直观的名称和详细的描述
4. **合理的默认值**：为变量提供有用的默认值，让用户可以直接测试
5. **美观的样式**：为模板设置美观且易读的样式
6. **可访问的API**：确保您使用的API是公开可访问的，不需要复杂的认证
7. **稳定的数据结构**：选择结构稳定的API，避免频繁变化的数据格式
8. **有意义的多值显示**：当使用多值查询时，提供清晰的显示格式

## 示例模板

### GitHub 用户星星数

```json
{
  "id": "github-stars",
  "name": "GitHub 用户星星数",
  "description": "显示指定GitHub用户的获得的总星星数",
  "category": "平台数据",
  "config": {
    "type": "text",
    "name": "GitHub Stars - <$1>",
    "dataUrl": "https://api.github-star-counter.workers.dev/user/<$1>",
    "jsonPath": "$.stars",
    "displayFormat": "{value} ⭐",
    "styleConfig": {
      "backgroundColor": "#000000",
      "textColor": "#ffffff",
      "fontSize": "2rem"
    }
  },
  "variables": [
    {
      "name": "GitHub 用户名",
      "key": "$1",
      "description": "请输入GitHub用户名",
      "defaultValue": "microsoft"
    }
  ]
}
```

### 当前天气

```json
{
  "id": "weather-current",
  "name": "当前天气",
  "description": "显示指定城市的当前天气状况",
  "category": "生活",
  "config": {
    "type": "text",
    "name": "<$1>天气",
    "dataUrl": "https://wttr.in/<$1>?format=j1",
    "jsonPath": "$.current_condition[0].temp_C",
    "displayFormat": "{value}°C",
    "styleConfig": {
      "backgroundColor": "#e6f7ff",
      "textColor": "#096dd9",
      "fontSize": "2rem"
    }
  },
  "variables": [
    {
      "name": "城市名称",
      "key": "$1",
      "description": "请输入城市名称（英文）",
      "defaultValue": "Beijing"
    }
  ]
}
```

## 如何贡献模板

如果您想贡献模板，可以按照以下步骤操作：

1. Fork 本项目
2. 在 `src/templates/templates.json` 文件中添加您的模板
3. 确保您的模板遵循上述结构和最佳实践
4. 测试您的模板，确保它能正常工作
5. 提交 Pull Request，在描述中简要说明您的模板功能
