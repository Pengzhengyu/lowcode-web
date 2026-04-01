import React, { useRef, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Checkbox,
  Radio,
  Cascader,
  Rate,
  Switch,
  Slider,
  Upload,
  Button,
  TreeSelect,
  Icon,
  Table,
} from "antd";
import { LogicEngine } from "../utils/sandbox";

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
    const placeholder = field.placeholder || "请输入/选择";
    const fullWidth = { style: { width: "100%" } };

    switch (field.type) {
      case "input":
        return (
          <Input
            disabled={disabled}
            placeholder={placeholder}
            prefix={field.icon ? <Icon type={field.icon} /> : field.prefix}
            suffix={field.suffix}
            maxLength={field.maxLength}
          />
        );
      case "textarea":
        return <TextArea rows={4} disabled={disabled} placeholder={placeholder} maxLength={field.maxLength} />;
      case "select":
        return (
          <Select disabled={disabled} placeholder={placeholder} {...fullWidth} allowClear>
            {field.options?.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "treeselect":
        return (
          <TreeSelect
            treeData={field.options || []}
            disabled={disabled}
            placeholder={placeholder}
            {...fullWidth}
            treeDefaultExpandAll
            allowClear
          />
        );
      case "number":
        return (
          <InputNumber
            disabled={disabled}
            placeholder={placeholder}
            {...fullWidth}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case "date":
        return <DatePicker disabled={disabled} placeholder={placeholder} {...fullWidth} format={field.format} />;
      case "rangepicker":
        return <RangePicker disabled={disabled} {...fullWidth} format={field.format} />;
      case "timepicker":
        return <Input disabled={disabled} placeholder={placeholder} type="time" format={field.format} />;
      case "checkbox":
        return (
          <div style={{ paddingTop: 6 }}>
            <Checkbox.Group
              disabled={disabled}
              options={
                field.options || [
                  { label: "选项A", value: "A" },
                  { label: "选项B", value: "B" },
                ]
              }
            />
          </div>
        );
      case "radio":
        return (
          <Radio.Group
            disabled={disabled}
            options={
              field.options || [
                { label: "选项A", value: "A" },
                { label: "选项B", value: "B" },
              ]
            }
          />
        );
      case "cascader":
        return <Cascader disabled={disabled} placeholder={placeholder} options={field.options || []} {...fullWidth} />;
      case "rate":
        return <Rate disabled={disabled} />;
      case "switch":
        return <Switch disabled={disabled} />;
      case "slider":
        return <Slider disabled={disabled} {...fullWidth} />;
      case "upload":
        return (
          <Upload disabled={disabled}>
            <Button disabled={disabled}>
              <Icon type="upload" /> 点击上传
            </Button>
          </Upload>
        );
      case "editableTable": {
        const TableComponent = ({ value: dataSource = [], onChange: onTableChange }) => {
          const tableColumns = (field.columns || []).map((col) => ({
            title: col.title,
            dataIndex: col.dataIndex,
            key: col.dataIndex,
            render: (text, record, index) => (
              <Input
                size="small"
                value={text}
                onChange={(e) => {
                  const val = e.target.value;
                  const newData = [...dataSource];
                  newData[index] = { ...newData[index], [col.dataIndex]: val };
                  onTableChange(newData);
                }}
              />
            ),
          }));
          return (
            <Table
              dataSource={dataSource}
              columns={tableColumns}
              size="small"
              pagination={false}
              bordered
              rowKey={(_, idx) => idx}
              footer={() => (
                <Button type="dashed" block icon="plus" onClick={() => onTableChange([...dataSource, {}])}>
                  添加行
                </Button>
              )}
            />
          );
        };
        return <TableComponent />;
      }
      default:
        return <Input disabled={disabled} placeholder={placeholder} />;
    }
  }, []);

  return (
    <div className="lowcode-section" id={section.id}>
      <div className="section-title" style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>
        {section.title}
      </div>
      <div className="section-body" style={{ display: "flex", flexWrap: "wrap", margin: "0 -8px" }}>
        {section.fields?.map((field) => {
          const isVisible = logicEngineRef.current.evaluateVisible(field);
          if (!isVisible) return null;
          const isRequired = logicEngineRef.current.evaluateRequired(field);
          const fieldWidth = field.width || 33.33;
          // 支持上下(vertical)和左右(horizontal)两种 label 布局
          const labelLayout = field.labelLayout || "vertical";
          const isHorizontal = labelLayout === "horizontal";

          return (
            <div key={field.field} style={{ width: `${fieldWidth}%`, padding: "0 8px", marginBottom: 16 }}>
              <Form
                layout={isHorizontal ? "horizontal" : "vertical"}
                {...(isHorizontal ? { labelCol: { span: 8 }, wrapperCol: { span: 16 } } : {})}
              >
                <Form.Item label={field.label} style={{ marginBottom: 0 }}>
                  {getFieldDecorator(field.field, {
                    rules: [{ required: isRequired, message: `请输入${field.label}` }],
                    ...(field.type === "switch" || field.type === "rate"
                      ? { valuePropName: field.type === "switch" ? "checked" : "value" }
                      : {}),
                  })(renderFieldWidget(field))}
                </Form.Item>
              </Form>
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
  },
})(SectionForm);
