import React, { Component } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Checkbox, Radio, Cascader, Rate, Switch, Slider, Upload, Button, TreeSelect, Icon } from 'antd';
import { LogicEngine } from '../utils/sandbox';

const { TextArea } = Input;
const { RangePicker, MonthPicker } = DatePicker;

class SectionForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {},
    };
    this.logicEngine = new LogicEngine({});
  }

  componentDidMount() {
    this.syncLogicEngine();
  }

  syncLogicEngine = () => {
    const { form } = this.props;
    const values = form.getFieldsValue();
    this.logicEngine.updateData(values);
    this.setState({ formData: values });
  }

  renderFieldWidget = (field) => {
    const disabled = this.logicEngine.evaluateDisabled(field);
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
        // 为保持简单先用 TimePicker，若是 Antd 3 需要 import TimePicker
        // 既然顶部没有引 TimePicker，我补充一下
        return <Input disabled={disabled} placeholder="时间选择占位" type="time" />;
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
        return <Upload disabled={disabled}><Button disabled={disabled}><Icon type="upload" /> 点击上传</Button></Upload>;
      default:
        return <Input disabled={disabled} />;
    }
  }

  render() {
    const { section, form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div className="lowcode-section" id={section.id}>
        <div className="section-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
          {section.title}
        </div>
        <div className="section-body">
          {section.fields?.map(field => {
            // 联动控制 - 是否显示
            const isVisible = this.logicEngine.evaluateVisible(field);
            if (!isVisible) return null;

            // 联动控制 - 是否必填
            const isRequired = this.logicEngine.evaluateRequired(field);

            return (
              <Form.Item label={field.label} key={field.field} style={{ marginBottom: 16 }}>
                {getFieldDecorator(field.field, {
                  rules: [
                    { required: isRequired, message: `请输入${field.label} (必填)` }
                  ],
                })(
                  this.renderFieldWidget(field)
                )}
              </Form.Item>
            );
          })}
        </div>
      </div>
    );
  }
}

// 采用 onValuesChange 监听所有的变更以触发沙箱重新计算
export default Form.create({
  onValuesChange: (props, changedValues, allValues) => {
    // 调用 SectionForm 实例的方法触发渲染
    if (props.onSectionValuesChange) {
      props.onSectionValuesChange(props.section.id, allValues);
    }
  }
})(SectionForm);
