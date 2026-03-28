# 可视化低代码配置系统产品设计文档 (Ant Design 3.x 版)

## 1. 项目背景

本系统旨在通过可视化拖拽方式，快速构建基于 **Ant Design 3.x** 的企业级后台管理页面。系统通过生成结构化的 JSON 配置，由通用的渲染引擎（Render Engine）在 React 函数组件环境下实时解析并展示。

---

## 2. 核心功能模块

### 2.1 页面分类配置

系统支持两种核心页面模式，配置项根据模式自动切换：

| 模式                | 核心组成部分                               | 右侧特有配置项                                        |
| :------------------ | :----------------------------------------- | :---------------------------------------------------- |
| **列表页 (List)**   | 查询表单 + 工具栏 + 数据表格               | 接口地址、分页配置、表格列渲染 (Render)、查询参数映射 |
| **详情页 (Detail)** | 顶部操作栏 + 锚点导航 + 多表单组 (Section) | 锚点 ID、表单组栅格 (Col)、多表单数据合并规则         |

### 2.2 编辑器布局

1. **左侧：物料仓 (Components)**
   - **布局类**：表单分组 (Section)、栅格行 (Row)、分割线。
   - **基础类**：Input, Select, DatePicker, Number, Radio, Switch。
   - **高级类**：子表单表格 (Editable Table)、文件上传、自定义组件占位符。
2. **中间：画布区 (Canvas)**
   - 支持实时拖拽排序 (Drag & Drop)。
   - 组件选中态高亮，支持一键复制/删除。
3. **右侧：属性面板 (Settings)**
   - **基础属性**：标题 (Label)、字段名 (FieldKey)、默认值、占位符。
   - **校验规则**：必填 (Required)、正则校验、自定义错误信息。
   - **联动逻辑**：高级表达式配置。

---

## 3. 联动逻辑引擎设计 (Logic Engine)

为了处理复杂的业务逻辑，系统支持在 JSON 中植入“动态脚本”。由于 Antd 3 函数组件中没有 `Form.useWatch`，我们将通过统一的 `onValuesChange` 触发引擎解析。

### 3.1 表达式支持

系统支持以下三种形式的联动定义：

- **简单布尔表达式**：`formData.status === 'published'`
- **计算公式**：`formData.price * formData.count`
- **复杂逻辑函数**：支持传入一段 JS 代码片段。

### 3.2 联动维度 (Actions)

| 维度                | 配置字段      | 实现原理                                           |
| :------------------ | :------------ | :------------------------------------------------- |
| **显隐 (Visible)**  | `visibleExp`  | 解析结果为 `false` 时，不渲染该 `Form.Item`        |
| **禁用 (Disabled)** | `disabledExp` | 解析结果为 `true` 时，为组件注入 `disabled` 属性   |
| **必填 (Required)** | `requiredExp` | 动态修改 `rules` 中的 `required` 属性              |
| **值联动 (Value)**  | `valueExp`    | 监听到依赖项变化时，通过 `setFieldsValue` 自动更新 |

---

## 4. 详细配置 JSON 结构示例 (详情页)

```json
{
  "pageType": "detail",
  "header": {
    "title": "采购单详情",
    "actions": [
      { "label": "提交", "type": "primary", "onClick": "submit" },
      { "label": "删除", "type": "danger", "confirm": "确定删除吗？" }
    ]
  },
  "sections": [
    {
      "id": "base_info",
      "title": "基础信息",
      "columns": 3,
      "fields": [
        {
          "label": "单据类型",
          "field": "type",
          "type": "select",
          "options": [{ "label": "内购", "value": 1 }, { "label": "外采", "value": 2 }]
        },
        {
          "label": "供应商",
          "field": "supplier",
          "type": "input",
          "visibleExp": "formData.type === 2",
          "requiredExp": "formData.type === 2"
        }
      ]
    },
    {
      "id": "item_list",
      "title": "明细表格",
      "type": "table",
      "columns": [
        { "title": "物料名称", "dataIndex": "name" },
        { "title": "数量", "dataIndex": "num", "editable": true }
      ]
    }
  ]
}
```

---

## 5. 技术实现细节 (Antd 3 特有)

### 5.1 函数组件与 Form.create()

由于 Antd 3 必须通过 `Form.create()` 注入 form 属性，渲染器将采用以下结构：

- **容器层**：负责拖拽状态管理、JSON 维护。
- **渲染层**：使用 `Form.create()` 包装的函数组件。
- **通信层**：通过 `forwardRef` 或 `wrappedComponentRef` 获取表单实例，进行全量校验。

### 5.2 安全性处理

针对 `eval()` 的安全性问题，系统将使用 `new Function` 进行沙箱包装：

```javascript
const executeExpression = (exp, formData) => {
  try {
    const fn = new Function('formData', `return (${exp})`);
    return fn(formData);
  } catch (e) {
    console.error('表达式执行错误:', e);
    return false;
  }
}
```

---

## 6. 交互说明

1. **拖入组件**：从左侧将“表单组”拖入中间，再将“输入框”拖入表单组。
2. **配置联动**：选中“输入框”，在右侧“显隐控制”栏输入 `formData.amount > 100`。
3. **预览测试**：点击“预览”，修改金额字段，观察目标字段是否实时消失。
4. **保存发布**：点击“保存”，系统将 JSON 字符串提交至后端数据库。

---

## 7. 后续规划

- [ ] 支持自定义远程搜索 (Select Remote Load)。
- [ ] 增加多表单 Tabs 切换模式。
- [ ] 支持移动端样式预览适配。

---

## 8. 接口集成与数据流规范 (前后端契约)

为支持 Node.js 等服务端进行接口对接，前端与后端的交互应遵循统一的 Restful 规范与 JSON 结构。以下是核心数据流规约。

### 8.1 列表页：分页与查询集成

列表页的 JSON 配置需包含 `request` 定义，渲染器内部通过 `axios` 或 `fetch` 驱动。

#### JSON 配置示例 (List)

```json
{
  "api": {
    "list": {
      "url": "/api/v1/orders/query",
      "method": "POST",
      "paramsMapping": {
        "current": "pageNo",
        "pageSize": "limit"
      }
    },
    "delete": { "url": "/api/v1/orders/delete", "method": "DELETE" }
  },
  "searchFields": [
    { "label": "订单号", "field": "orderNo", "type": "input" }
  ]
}
```

**逻辑细化：**
- **初始化加载**：组件挂载时自动触发 `api.list`。
- **参数合并**：发送请求前，自动合并 `SearchForm` 的值与 `Table` 的分页参数。
- **格式转换**：支持通过 `responsePath` 配置（如 `data.list`）定位接口返回的数据位置。

### 8.2 详情页：加载、保存与提交

详情页涉及“回显”和“操作”两个核心动作。

#### JSON 配置示例 (Detail)

```json
{
  "api": {
    "detail": { "url": "/api/v1/orders/:id", "method": "GET" },
    "save": { "url": "/api/v1/orders/save", "method": "POST" },
    "submit": { "url": "/api/v1/orders/submit", "method": "POST" }
  },
  "buttons": [
    { "label": "暂存", "code": "save", "type": "default" },
    { "label": "正式提交", "code": "submit", "type": "primary", "validate": true }
  ]
}
```

**操作逻辑 (Actions)：**
- **数据回显**：若 URL 存在 `id` 参数，渲染器先调用 `detail` 接口。返回的 JSON 对象需与表单 field 键名一一对应，通过 `form.setFieldsValue` 灌入。
- **校验逻辑**：
  - **暂存 (Save)**：通常跳过表单必填校验，直接获取当前 `formData` 发送请求。
  - **提交 (Submit)**：先调用 `form.validateFields`，校验通过后才发起请求。
- **动态路径**：支持 URL 占位符转换，例如 `/api/:id` 自动替换为当前页面 ID。

### 8.3 标准接口响应格式

后端返回的所有接口需遵循以下标准 HTTP 响应体格式：

```json
{
  "code": 200,          // 响应状态码，200 表示成功，非 200 表示业务异常
  "message": "success", // 响应描述或错误提示
  "data": {             // 具体的业务数据
    "id": "xxx",
    "name": "xxx"
  }
}
```

对于分页列表数据的返回，`data` 层结构建议如下：

```json
{
  "code": 200,
  "data": {
    "list": [{...}, {...}],
    "total": 100,
    "current": 1,
    "pageSize": 10
  }
}
```

---

## 9. 开发协作规范 (Development Workflow)

### 9.1 Git 提交规范

本仓库遵循以下轻量协作约定：每次功能开发或 BUG 修复完成后，立即提交并推送至远端。

```bash
# 提交当前所有改动
git add .
git commit -m "feat: 简要描述本次改动"

# 直接推送（已绑定 origin/main，无需携带额外参数）
git push
```

commit 消息建议前缀：

| 前缀 | 适用场景 |
|---|---|
| `feat:` | 新增功能 |
| `fix:` | 修复 BUG |
| `style:` | 样式调整 |
| `refactor:` | 代码重构 |
| `chore:` | 配置/文档调整 |

### 9.2 本地启动

```bash
# 前端低代码管理台（端口 3001）
npm run start

# 后端 Node API（端口 3000，位于 D:\Glodon\estate-dcm-api）
cd D:\Glodon\estate-dcm-api && node src/index.js
```
