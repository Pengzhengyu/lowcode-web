---
name: 构建低代码核心模块
description: 指导新建仓库如何利用 Antd3 规范搭建低代码的设置器和渲染解析器
---

# 构建前端低代码模块 (estate-lowcode-web)

当用户要求开始搭建低代码的前端结构时，请严格遵守以下步骤执行组件构建：

## 1. 认知模块分工
- **`src/modules/settings`** (设置器)：需搭建左侧物料栏 (LeftPanel)、画布 (Canvas) 和属性中心 (RightPanel)。通过拖拽修改 JSON 并触发热更新。
- **`src/modules/render`** (渲染引擎)：必须挂载到源系统的层级树上，即使用来自 `biz-module` 的 `<UserProvider>`, `<AuthProvider>`, `<ApproveProvider>` 以及业务内的适配器对内部的 `DynamicJSONRenderer` 核心组件进行包裹嵌套。

## 2. DynamicJSONRenderer 渲染规则 (Antd3 特有)
在构建真实解析并出表的渲染引擎时，必须使用 `Form.create()` 高阶组件包装你的 Renderer。
```javascript
import React from 'react';
import { Form, Input, Select } from 'antd';

const DynamicJSONRenderer = ({ form, schema }) => {
  const { getFieldDecorator } = form;
  
  const renderField = (field) => {
    switch(field.type) {
      case 'input': return <Input />;
      case 'select': return <Select options={field.options} />;
      default: return null;
    }
  };

  return (
    <Form layout="vertical">
      {schema.sections.map(section => (
        <div key={section.id}>
          <h3>{section.title}</h3>
          {section.fields.map(field => {
             // 必须使用 getFieldDecorator，切勿使用 name 属性
             return (
               <Form.Item label={field.label} key={field.field}>
                 {getFieldDecorator(field.field, {
                    rules: [{ required: field.requiredExp, message: '必填' }]
                 })(renderField(field))}
               </Form.Item>
             );
          })}
        </div>
      ))}
    </Form>
  )
}

export default Form.create()(DynamicJSONRenderer);
```

## 3. 联动与沙箱 (联动逻辑引擎)
当需要解析源自 JSON 的 `visibleExp`, `disabledExp`, `requiredExp`, `valueExp` 这些联动表达式时：
由于没有 `Form.useWatch`，你需要监听所有的字段变更 (`onValuesChange`)，然后将当前的 `form.getFieldsValue()` 对象和对应的表达式代码传入基于 `new Function('formData', 'return (' + exp + ')')` 所创建的安全沙箱内动态求值，来决定显隐状态并在渲染中反映出来。
