# 可视化低代码配置系统产品设计文档 (Ant Design 3.x)

## 1. 项目概述
本系统是一套基于 React 函数组件与 Ant Design 3.x 的低代码解决方案。通过 JSON 配置驱动，支持列表页（搜索+表格）与详情页（表单组+锚点）的快速渲染，并集成了复杂的表单联动逻辑与接口调用流程。

---

## 2. 页面模式设计

### 2.1 列表页模式 (List Mode)
* **组件构成**：
    * **搜索表单**：支持配置查询字段、类型（Input/Select/Date等）、默认值。
    * **工具栏**：支持自定义按钮（新增、导出、批量操作）。
    * **数据表格**：支持分页配置、列定义（width, fixed, render）、行操作。
* **接口集成**：配置 `api.query`，自动处理分页参数映射与搜索条件合并。

### 2.2 详情页模式 (Detail Mode)
* **组件构成**：
    * **粘性头部 (Sticky Header)**：展示标题、当前单据状态、操作按钮组（保存、提交、撤回）。
    * **锚点导航 (Anchor)**：根据底部表单组的 `title` 和 `id` 自动生成导航链路。
    * **表单组容器 (Sections)**：支持多组平铺，每组可配置列数（Grid Layout）。
* **接口集成**：支持 `api.init`（数据回显）、`api.save`（暂存）、`api.submit`（提交）。

---

## 3. 核心联动逻辑引擎 (Logic Engine)

为了在 Antd 3.x 的环境（非受控增强）下实现灵活交互，系统引入了基于表达式的逻辑引擎。

### 3.1 表达式变量
渲染器执行环境内置 `formData` 对象，代表当前表单的所有实时值。

### 3.2 联动属性 (Logic Props)

| 属性名 | JSON 字段 | 逻辑示例 | 功能描述 |
| :--- | :--- | :--- | :--- |
| **显示隐藏** | `visibleExp` | `formData.status === '1'` | 表达式为假时，不挂载 Form.Item |
| **禁用状态** | `disabledExp` | `!!formData.id` | 表达式为真时，组件设为 readOnly |
| **必填控制** | `requiredExp` | `formData.amount > 1000` | 动态切换 rules 中的 required 状态 |
| **值联动** | `valueExp` | `formData.price * formData.count` | 依赖项变化时自动计算结果 |

### 3.3 技术实现
使用 `new Function` 构造沙箱环境，在 `onValuesChange` 生命周期中触发重新计算：

```javascript
const computeLogic = (expression, formData) => {
  try {
    const runner = new Function('formData', `return (${expression})`);
    return runner(formData);
  } catch (e) {
    return true; 
  }
};
```

---

## 4. 可视化编辑器布局 (Editor Layout)

### 4.1 左侧：物料面板
* 提供所有支持的 Antd 组件、布局容器及自定义扩展组件。

### 4.2 中间：画布区域
* **交互**：支持拖拽排序、点击选中、一键复制/删除。
* **预览**：支持“设计模式”与“真实渲染模式”实时切换。

### 4.3 右侧：配置面板
* **基础页签**：配置 Label、FieldKey、数据类型。
* **校验页签**：配置正则、必填、错误提示。
* **高级页签**：配置上述 3.2 节提到的各类联动表达式及接口回调脚本。

---

## 5. 接口集成与数据流规范

### 5.1 接口配置示例

```json
"api": {
  "init": { "url": "/api/v1/order/get/:id", "method": "GET" },
  "save": { "url": "/api/v1/order/save", "method": "POST" },
  "submit": { "url": "/api/v1/order/submit", "method": "POST" },
  "query": { "url": "/api/v1/order/list", "method": "POST" }
}
```

### 5.2 数据处理生命周期
1. **Fetch (回显)**：进入页面 -> 解析 URL ID -> 调用 init -> `form.setFieldsValue`。
2. **Validate (校验)**：点击提交 -> `form.validateFields` -> 收集错误。
3. **Request (发送)**：校验通过 -> 转换数据格式 -> 调用 API -> 处理成功/失败回调。

---

## 6. Antd 3.x 适配技术要点

1. **Form 绑定**：由于 Antd 3.x 必须使用 `Form.create()`，渲染器组件将作为被包装的 `WrappedComponent`，通过 `props.form` 与底层通信。
2. **函数组件通讯**：使用 `useImperativeHandle` 暴露 `validate` 方法，供外部工具栏按钮调用。
3. **性能隔离**：针对大型详情页，采用“分段表单”策略，确保单个 Section 的联动不引发全页组件的重绘。

---

## 7. 完整配置 JSON 范例 (详情页)

```json
{
  "pageType": "detail",
  "header": { "title": "物料申请单", "showStatus": true },
  "sections": [
    {
      "id": "base_info",
      "title": "基本信息",
      "fields": [
        { "label": "申请人", "field": "applicant", "type": "input", "disabled": true },
        { "label": "申请部门", "field": "dept", "type": "select", "options": [] }
      ]
    },
    {
      "id": "detail_table",
      "title": "申请明细",
      "type": "editableTable",
      "columns": [
        { "title": "物料名称", "dataIndex": "name", "type": "input" },
        { "title": "单价", "dataIndex": "price", "type": "number" }
      ]
    }
  ]
}
```