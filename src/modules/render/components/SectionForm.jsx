import React, { useRef, useCallback } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Checkbox, Radio, Cascader, Rate, Switch, Slider, Upload, Button, TreeSelect, Icon } from 'antd';
import { LogicEngine } from '../utils/sandbox';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

/**
 * 单个区段表单组件 (Hooks 版)
 * Antd 3.x 的 getFieldDecorator 仍需用 Form.create() 包裹才能正常获取 form 对象
 */
function SectionForm({ section, form, onSectionValuesChange }) {
  const { getFieldDecorator } = form;
  // 使用 ref 持有 LogicEngine 实例，避免重复创建
  const logicEngineRef = useRef(new LogicEngine({}));

  const renderFieldWidget = useCallback((field) => {
    const disabled = logicEngineRef.current.evaluateDisabled(field);
    const placeholder = field.placeholder || '请输入/选择';

    switch (field.type) {
      case 'input':
        return <Input disabled={disabled} placeholder={placeholder} />;
      case 'textarea':
        return <TextArea rows={4} disabled={disabled} placeholder={placeholder} />;
      case 'select':
        return (
          <Select disabled={disabled} placeholder={placeholder}>
            {field.options?.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
            ))}
          </Select>
        );
      case 'treeselect':
        return <TreeSelect treeData={field.options || []} disabled={disabled} placeholder={placeholder} treeDefaultExpandAll />;
      case 'number':
        return <InputNumber disabled={disabled} placeholder={placeholder} style={{ width: '100%' }} />;
      case 'date':
        return <DatePicker disabled={disabled} placeholder={placeholder} style={{ width: '100%' }} />;
      case 'rangepicker':
        return <RangePicker disabled={disabled} style={{ width: '100%' }} />;
      case 'timepicker':
        return <Input disabled={disabled} placeholder="请选择时间" type="time" />;
      case 'checkbox':
        return <Checkbox.Group disabled={disabled} options={field.options || []} />;
      case 'radio':
        return <Radio.Group disabled={disabled} options={field.options || []} />;
      case 'cascader':
        return <Cascader disabled={disabled} placeholder={placeholder} options={field.options || []} />;
      case 'rate':
        return <Rate disabled={disabled} />;
      case 'switch':
        return <Switch disabled={disabled} />;
      case 'slider':
        return <Slider disabled={disabled} />;
      case 'upload':
        return (
          <Upload disabled={disabled}>
            <Button disabled={disabled}><Icon type="upload" /> 点击上传</Button>
          </Upload>
        );
      default:
        return <Input disabled={disabled} />;
    }
  }, []);

  return (
    <div className="lowcode-section" id={section.id}>
      <div className="section-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
        {section.title}
      </div>
      <div className="section-body" style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -12px' }}>
        {section.fields?.map(field => {
          const isVisible = logicEngineRef.current.evaluateVisible(field);
          if (!isVisible) return null;
          const isRequired = logicEngineRef.current.evaluateRequired(field);
          const fieldWidth = field.width || 33.33;

          return (
            <div key={field.field} style={{ width: `${fieldWidth}%`, padding: '0 12px', marginBottom: 16 }}>
              <Form.Item label={field.label}>
                {getFieldDecorator(field.field, {
                  rules: [{ required: isRequired, message: `请输入${field.label}` }],
                })(
                  renderFieldWidget(field)
                )}
              </Form.Item>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Form.create({
  onValuesChange: (props, _changed, allValues) => {
    if (props.onSectionValuesChange) {
      props.onSectionValuesChange(props.section.id, allValues);
    }
  }
})(SectionForm);
