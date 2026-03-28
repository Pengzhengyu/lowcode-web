import React, { Component } from 'react';
import { Form, Input, Collapse, Select, Switch, InputNumber } from 'antd';

const { Panel } = Collapse;

class RightPanelForm extends Component {
  handleValueChange = (changedValues) => {
    const { schema, activeFieldId, updateSchema } = this.props;
    if (!activeFieldId || !schema) return;

    // 拷贝并更新 schema
    const newSchema = { ...schema, sections: [...schema.sections] };
    
    // 如果选中的是区段
    if (activeFieldId.startsWith('section_')) {
      const sIndex = newSchema.sections.findIndex(s => s.id === activeFieldId);
      if (sIndex > -1) {
        newSchema.sections[sIndex] = { ...newSchema.sections[sIndex], ...changedValues };
      }
    } 
    // 如果选中的是字段
    else if (activeFieldId.startsWith('field_')) {
      for (let sIndex = 0; sIndex < newSchema.sections.length; sIndex++) {
        const section = newSchema.sections[sIndex];
        const fIndex = section.fields?.findIndex(f => f.field === activeFieldId);
        if (fIndex > -1) {
          const newFields = [...section.fields];
          
          // 若变动包含 optionsStr，应当尝试将其安全解析还原回对象形式
          let parsedValues = { ...changedValues };
          if (changedValues.optionsStr !== undefined) {
             try {
                parsedValues.options = JSON.parse(changedValues.optionsStr);
             } catch(e) { /* 解析失败则先无视 */ }
             delete parsedValues.optionsStr;
          }

          newFields[fIndex] = { ...newFields[fIndex], ...parsedValues };
          newSchema.sections[sIndex] = { ...section, fields: newFields };
          break;
        }
      }
    }

    updateSchema(newSchema);
  }

  getActiveItem = () => {
    const { schema, activeFieldId } = this.props;
    if (!activeFieldId || !schema) return null;
    
    if (activeFieldId.startsWith('section_')) {
       return schema.sections?.find(s => s.id === activeFieldId);
    } else {
       // Search in Detail Mode (sections)
       for (const section of (schema.sections || [])) {
          const field = section.fields?.find(f => f.field === activeFieldId);
          if (field) return field;
       }
       // Search in List Mode (searchFields & tableColumns)
       if (schema.listConfig) {
          let field = schema.listConfig.searchFields?.find(f => f.field === activeFieldId);
          if (field) return field;
          field = schema.listConfig.tableColumns?.find(f => f.field === activeFieldId);
          if (field) return field;
       }
    }
    return null;
  }

  render() {
    const { activeFieldId, form, designMode, schema } = this.props;
    const { getFieldDecorator } = form;
    
    if (!activeFieldId) {
      if (designMode === 'list') {
         const listConfig = schema?.listConfig || {};
         return (
           <Form layout="vertical" style={{ padding: 16 }}>
             <Collapse defaultActiveKey={['pagination']} bordered={false}>
               <Panel header="表格列表全局配置" key="pagination">
                 <Form.Item label="开启分页特性 (Pagination)">
                   {getFieldDecorator('pagination', {
                     valuePropName: 'checked',
                     initialValue: listConfig.pagination !== false,
                   })(<Switch />)}
                 </Form.Item>
                 <Form.Item label="默认每页数据量 (PageSize)">
                   {getFieldDecorator('pageSize', {
                     initialValue: listConfig.pageSize || 10,
                   })(<InputNumber min={5} max={500} style={{ width: '100%' }} />)}
                 </Form.Item>
               </Panel>
             </Collapse>
           </Form>
         );
      }
      return (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#bfbfbf' }}>
          请在画布中选中一个组件以进行配置
        </div>
      );
    }

    const item = this.getActiveItem() || {};
    const isSection = activeFieldId.startsWith('section_');

    return (
      <Form layout="vertical" style={{ padding: 16 }}>
        <Collapse defaultActiveKey={['base', 'logic']} bordered={false}>
          <Panel header="基础属性" key="base">
            <Form.Item label={isSection ? '表单组标题' : '字段标签 (Label)'}>
              {getFieldDecorator(isSection ? 'title' : 'label', {
                initialValue: isSection ? item.title : item.label,
              })(<Input />)}
            </Form.Item>
            
            {!isSection && (
              <>
                <Form.Item label="字段内部名 (Name/Field)">
                  {getFieldDecorator('field', {
                    initialValue: item.field,
                    rules: [{ required: true, message: '必填' }]
                  })(<Input placeholder="请填写如: name, projectName" />)}
                </Form.Item>
                <Form.Item label="组件宽度 (%)">
                  {getFieldDecorator('width', {
                    initialValue: item.width || 33.33,
                  })(
                    <Select>
                      <Select.Option value={25}>25% (一行四列)</Select.Option>
                      <Select.Option value={33.33}>33.3% (一行三列)</Select.Option>
                      <Select.Option value={50}>50% (一行两列)</Select.Option>
                      <Select.Option value={100}>100% (整行铺满)</Select.Option>
                    </Select>
                  )}
                </Form.Item>
                <Form.Item label="组件类型">
                  {getFieldDecorator('type', {
                    initialValue: item.type,
                  })(
                    <Select>
                      <Select.Option value="input">单行文本 (Input)</Select.Option>
                      <Select.Option value="select">下拉选择 (Select)</Select.Option>
                      <Select.Option value="number">数字输入 (Number)</Select.Option>
                      <Select.Option value="date">日期选择 (DatePicker)</Select.Option>
                      <Select.Option value="radio">单选按钮 (Radio)</Select.Option>
                      <Select.Option value="checkbox">多选按钮 (Checkbox)</Select.Option>
                      <Select.Option value="cascader">级联选择 (Cascader)</Select.Option>
                      <Select.Option value="rate">评分组件 (Rate)</Select.Option>
                    </Select>
                  )}
                </Form.Item>
                <Form.Item label="占位提示 (Placeholder)">
                  {getFieldDecorator('placeholder', {
                    initialValue: item.placeholder,
                  })(<Input allowClear />)}
                </Form.Item>

                {/* 如果是包含选项的组件类型，显示静态数据源配置区 */}
                {['select', 'radio', 'checkbox', 'cascader'].includes(item.type) && (
                  <Form.Item label="选项数据源 (Options JSON)">
                     <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4, marginTop: -8 }}>
                       {'例: [{"label":"是","value":1}, {"label":"否","value":0}]'}
                     </div>
                     {getFieldDecorator('optionsStr', {
                       // 我们在组件内存的 options 可能直接是对象数组，右侧面板简单化用 Text 承接 JSON
                       initialValue: item.options ? JSON.stringify(item.options) : '[]',
                     })(<Input.TextArea rows={4} />)}
                  </Form.Item>
                )}
              </>
            )}
          </Panel>
          
          {!isSection && (
            <Panel header="高级联动逻辑 (表达式)" key="logic">
              <Form.Item label="显示条件 (visibleExp)" extra="例: formData.type === 1">
                {getFieldDecorator('visibleExp', {
                  initialValue: item.visibleExp,
                })(<Input.TextArea rows={2} placeholder="返回 false 则不渲染" />)}
              </Form.Item>
              <Form.Item label="禁用条件 (disabledExp)">
                {getFieldDecorator('disabledExp', {
                  initialValue: item.disabledExp,
                })(<Input.TextArea rows={2} placeholder="返回 true 则禁用" />)}
              </Form.Item>
              <Form.Item label="必填条件 (requiredExp)">
                {getFieldDecorator('requiredExp', {
                  initialValue: item.requiredExp,
                })(<Input.TextArea rows={2} placeholder="返回 true 则必填" />)}
              </Form.Item>
            </Panel>
          )}
        </Collapse>
      </Form>
    );
  }
}

const RightPanel = Form.create({
  onValuesChange: (props, changedValues) => {
    // 每次变更通过 ref 上的方法回传给顶层（这只是个简单桥接包装）
    // 实际更优雅的是用 forwardRef 或在 class 内直接调 prop，但 Antd3 Form.create 会劫持。
    // 这里将其桥接到 form 组件内部的 handleValueChange
    if (props.onValuesChangeDelegate) {
       props.onValuesChangeDelegate(changedValues);
    }
  }
})(RightPanelForm);

export default class RightPanelWrapper extends Component {
  handleValuesChange = (changedValues) => {
     const { schema, activeFieldId, updateSchema, setActiveField, designMode } = this.props;
     if (!schema) return;

     if (!activeFieldId) {
        if (designMode === 'list') {
           updateSchema({
             ...schema,
             listConfig: { ...(schema.listConfig || {}), ...changedValues }
           });
        }
        return;
     }

     const newSchema = { ...schema, sections: [...(schema.sections||[])] };
     let fieldFound = false;

     if (activeFieldId.startsWith('section_')) {
       const sIndex = newSchema.sections.findIndex(s => s.id === activeFieldId);
       if (sIndex > -1) {
         newSchema.sections[sIndex] = { ...newSchema.sections[sIndex], ...changedValues };
       }
     } else {
       // Search sections
       for (let sIndex = 0; sIndex < newSchema.sections.length; sIndex++) {
         const section = newSchema.sections[sIndex];
         const fIndex = section.fields?.findIndex(f => f.field === activeFieldId);
         if (fIndex > -1) {
           const newFields = [...section.fields];
           newFields[fIndex] = { ...newFields[fIndex], ...changedValues };
           newSchema.sections[sIndex] = { ...section, fields: newFields };
           fieldFound = true;
           break;
         }
       }
       
       // If not in sections, search listConfig
       if (!fieldFound && newSchema.listConfig) {
         newSchema.listConfig = { ...newSchema.listConfig };
         ['searchFields', 'tableColumns'].forEach(key => {
            const arr = newSchema.listConfig[key];
            if (!arr) return;
            const fIndex = arr.findIndex(f => f.field === activeFieldId);
            if (fIndex > -1) {
               const newArr = [...arr];
               newArr[fIndex] = { ...newArr[fIndex], ...changedValues };
               newSchema.listConfig[key] = newArr;
            }
         });
       }
     }

     updateSchema(newSchema);
     
     // 若用户修改了底层唯一标识 Field 名，需要即刻刷新焦点 ID 以防面板重置导致失焦
     if (changedValues.field && changedValues.field !== activeFieldId) {
        if (setActiveField) {
           setActiveField(changedValues.field);
        }
     }
  }

  // 避免 Form 的 initialState 缓存，当 activeFieldId 变动时必须强刷 key
  render() {
    return (
      <div className="right-panel-container" style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8e8e8', fontWeight: 'bold' }}>
          属性配置
        </div>
        <RightPanel 
          key={this.props.activeFieldId || 'empty'}
          {...this.props} 
          onValuesChangeDelegate={this.handleValuesChange}
        />
      </div>
    );
  }
}
