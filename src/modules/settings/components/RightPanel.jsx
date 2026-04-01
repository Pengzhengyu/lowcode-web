import React, { useCallback } from "react";
import { Form, Input, Collapse, Select, Checkbox, InputNumber, Switch, Button, Icon } from "antd";

const { Panel } = Collapse;

/**
 * 局部选项编辑器，用于取代手写 JSON 从而优化用户体验
 */
function OptionsEditor({ value = [], onChange }) {
  const handleAdd = () => {
    onChange([...value, { label: `选项${value.length + 1}`, value: `opt_${value.length + 1}` }]);
  };
  const handleRemove = (index) => {
    const newOptions = [...value];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };
  const handleChange = (index, field, val) => {
    const newOptions = [...value];
    newOptions[index] = { ...newOptions[index], [field]: val };
    onChange(newOptions);
  };
  return (
    <div>
      {value.map((opt, index) => (
        <div key={index} style={{ display: "flex", marginBottom: 8, gap: 8 }}>
          <Input placeholder="显示名称" value={opt.label} onChange={(e) => handleChange(index, "label", e.target.value)} />
          <Input placeholder="数据值" value={opt.value} onChange={(e) => handleChange(index, "value", e.target.value)} />
          <Button type="danger" icon="minus" onClick={() => handleRemove(index)} />
        </div>
      ))}
      <Button type="dashed" onClick={handleAdd} style={{ width: "100%" }}>
        <Icon type="plus" /> 添加选项
      </Button>
    </div>
  );
}

/**
 * 局部表格列编辑器，代替 JSON 输入框
 */
function ColumnsEditor({ value = [], onChange }) {
  const handleAdd = () => {
    onChange([...value, { title: `列${value.length + 1}`, dataIndex: `col_${value.length + 1}`, type: "input" }]);
  };
  const handleRemove = (index) => {
    const newOptions = [...value];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };
  const handleChange = (index, field, val) => {
    const newOptions = [...value];
    newOptions[index] = { ...newOptions[index], [field]: val };
    onChange(newOptions);
  };
  return (
    <div>
      {value.map((opt, index) => (
        <div key={index} style={{ display: "flex", marginBottom: 8, gap: 4, alignItems: "center" }}>
          <Input
            placeholder="列名"
            value={opt.title}
            onChange={(e) => handleChange(index, "title", e.target.value)}
            style={{ width: 80 }}
          />
          <Input
            placeholder="字段"
            value={opt.dataIndex}
            onChange={(e) => handleChange(index, "dataIndex", e.target.value)}
            style={{ width: 80 }}
          />
          <Select value={opt.type || "input"} onChange={(v) => handleChange(index, "type", v)} style={{ flex: 1 }}>
            <Select.Option value="input">文本</Select.Option>
            <Select.Option value="number">数字</Select.Option>
            <Select.Option value="date">日期</Select.Option>
            <Select.Option value="select">下拉</Select.Option>
          </Select>
          <Button type="danger" icon="minus" onClick={() => handleRemove(index)} style={{ padding: "0 8px" }} />
        </div>
      ))}
      <Button type="dashed" onClick={handleAdd} style={{ width: "100%" }}>
        <Icon type="plus" /> 添加表格列
      </Button>
    </div>
  );
}

/**
 * 属性编辑器表单 (内部组件，由 Form.create 包裹)
 */
function RightPanelForm(props) {
  const { schema, activeFieldId, form, designMode } = props;
  const { getFieldDecorator } = form;

  // 获取当前选中的配置项 (Section 或 Field)
  const getActiveItem = useCallback(() => {
    if (!activeFieldId || !schema) return null;

    if (activeFieldId.startsWith("section_")) {
      return schema.sections?.find((s) => s.id === activeFieldId);
    } else {
      // 详情态搜索
      for (const section of schema.sections || []) {
        const field = section.fields?.find((f) => f.field === activeFieldId);
        if (field) return field;
      }
      // 列表态搜索
      if (schema.listConfig) {
        let field = schema.listConfig.searchFields?.find((f) => f.field === activeFieldId);
        if (field) return field;
        field = schema.listConfig.tableColumns?.find((f) => f.field === activeFieldId);
        if (field) return field;
      }
    }
    return null;
  }, [schema, activeFieldId]);

  // 未选中任何项时的全局配置
  if (!activeFieldId) {
    if (designMode === "list") {
      const listConfig = schema?.listConfig || {};
      return (
        <Form layout="vertical" style={{ padding: 16 }}>
          <Collapse defaultActiveKey={["pagination"]} bordered={false}>
            <Panel header="表格列表全局配置" key="pagination">
              <Form.Item label="开启分页特性">
                {getFieldDecorator("pagination", {
                  valuePropName: "checked",
                  initialValue: listConfig.pagination !== false,
                })(<Switch />)}
              </Form.Item>
              <Form.Item label="每页数据量">
                {getFieldDecorator("pageSize", {
                  initialValue: listConfig.pageSize || 10,
                })(<InputNumber min={5} style={{ width: "100%" }} />)}
              </Form.Item>
            </Panel>
          </Collapse>
        </Form>
      );
    }
    return (
      <Form layout="vertical" style={{ padding: 16 }}>
        <Collapse defaultActiveKey={["detailGlobal"]} bordered={false}>
          <Panel header="详情页全局配置" key="detailGlobal">
            <Form.Item label="布局展示模式">
              {getFieldDecorator("layoutMode", {
                initialValue: schema.layoutMode || "auto",
              })(
                <Select>
                  <Select.Option value="auto">自动判定 (分组 &gt; 5 则用 Tabs)</Select.Option>
                  <Select.Option value="anchor">横向锚点 (全部展开)</Select.Option>
                  <Select.Option value="tabs">页签模式 (强制Tabs)</Select.Option>
                </Select>,
              )}
            </Form.Item>
            <Form.Item label="页面标题">
              {getFieldDecorator("header.title", {
                initialValue: schema.header?.title,
              })(<Input placeholder="控制预览页头标题" />)}
            </Form.Item>
          </Panel>
        </Collapse>
      </Form>
    );
  }

  const item = getActiveItem() || {};
  const isSection = activeFieldId.startsWith("section_");

  return (
    <Form layout="vertical" style={{ padding: 16 }}>
      <Collapse defaultActiveKey={["base", "logic"]} bordered={false}>
        <Panel header="基础属性" key="base">
          <Form.Item label={isSection ? "分组名称" : "字段标签"}>
            {getFieldDecorator(isSection ? "title" : "label", {
              initialValue: isSection ? item.title : item.label,
            })(<Input />)}
          </Form.Item>

          {!isSection && (
            <>
              <Form.Item label="字段变量名 (Field Index)">
                {getFieldDecorator("field", {
                  initialValue: item.field,
                  rules: [{ required: true, message: "必填" }],
                })(<Input placeholder="常用英文标识" />)}
              </Form.Item>
              <Form.Item label="渲染列宽 (%)">
                {getFieldDecorator("width", {
                  initialValue: item.width || 33.33,
                })(
                  <Select>
                    <Select.Option value={25}>25% (一行四列)</Select.Option>
                    <Select.Option value={33.33}>33.3% (一行三列)</Select.Option>
                    <Select.Option value={50}>50% (一行两列)</Select.Option>
                    <Select.Option value={100}>100% (整行铺满)</Select.Option>
                  </Select>,
                )}
              </Form.Item>
              <Form.Item label="组件类型">
                {getFieldDecorator("type", {
                  initialValue: item.type,
                })(
                  <Select>
                    <Select.Option value="input">单行文本 (Input)</Select.Option>
                    <Select.Option value="textarea">多行文本 (Textarea)</Select.Option>
                    <Select.Option value="select">下拉选择 (Select)</Select.Option>
                    <Select.Option value="treeselect">树状选择 (TreeSelect)</Select.Option>
                    <Select.Option value="number">数字输入 (Number)</Select.Option>
                    <Select.Option value="date">日期选择 (DatePicker)</Select.Option>
                    <Select.Option value="rangepicker">日期范围 (RangePicker)</Select.Option>
                    <Select.Option value="radio">单选按钮 (Radio)</Select.Option>
                    <Select.Option value="checkbox">多选按钮 (Checkbox)</Select.Option>
                    <Select.Option value="switch">开关组件 (Switch)</Select.Option>
                    <Select.Option value="cascader">级联选择 (Cascader)</Select.Option>
                    <Select.Option value="upload">文件上传 (Upload)</Select.Option>
                    <Select.Option value="editableTable">可编辑表格 (EditableTable)</Select.Option>
                  </Select>,
                )}
              </Form.Item>
              <Form.Item label="其他交互配置">
                <div style={{ display: "flex", gap: 16 }}>
                  {getFieldDecorator("allowClear", {
                    valuePropName: "checked",
                    initialValue: item.allowClear !== false,
                  })(<Checkbox>允许清除</Checkbox>)}
                  {getFieldDecorator("disabled", {
                    valuePropName: "checked",
                    initialValue: !!item.disabled,
                  })(<Checkbox>静态禁用</Checkbox>)}
                </div>
              </Form.Item>

              {["select", "treeselect", "radio", "checkbox", "cascader"].includes(item.type) && (
                <Form.Item label="选项数据 (Options)">
                  {getFieldDecorator("options", {
                    initialValue: item.options || [],
                  })(<OptionsEditor />)}
                </Form.Item>
              )}

              <Form.Item label="占位提示 (Placeholder)">
                {getFieldDecorator("placeholder", {
                  initialValue: item.placeholder,
                })(<Input placeholder="覆盖默认的 请输入/选择 提示词" />)}
              </Form.Item>

              {item.type === "input" && (
                <>
                  <Form.Item label="前缀 (Prefix)">
                    {getFieldDecorator("prefix", {
                      initialValue: item.prefix,
                    })(<Input placeholder="输入框内前缀文本" />)}
                  </Form.Item>
                  <Form.Item label="后缀 (Suffix)">
                    {getFieldDecorator("suffix", {
                      initialValue: item.suffix,
                    })(<Input placeholder="输入框内后缀文本" />)}
                  </Form.Item>
                  <Form.Item label="内嵌图标 (Icon Type)">
                    {getFieldDecorator("icon", {
                      initialValue: item.icon,
                    })(<Input placeholder="Antd 原生 Icon，如 user" />)}
                  </Form.Item>
                </>
              )}

              {["input", "textarea"].includes(item.type) && (
                <Form.Item label="最大输入长度 (MaxLength)">
                  {getFieldDecorator("maxLength", {
                    initialValue: item.maxLength,
                  })(<InputNumber min={1} style={{ width: "100%" }} />)}
                </Form.Item>
              )}

              {item.type === "number" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Form.Item label="最小值" style={{ flex: 1 }}>
                    {getFieldDecorator("min", {
                      initialValue: item.min,
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </Form.Item>
                  <Form.Item label="最大值" style={{ flex: 1 }}>
                    {getFieldDecorator("max", {
                      initialValue: item.max,
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </Form.Item>
                  <Form.Item label="步长" style={{ flex: 1 }}>
                    {getFieldDecorator("step", {
                      initialValue: item.step || 1,
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </Form.Item>
                </div>
              )}

              {["date", "rangepicker", "timepicker"].includes(item.type) && (
                <Form.Item label="显示格式 (Format)">
                  {getFieldDecorator("format", {
                    initialValue: item.format,
                  })(<Input placeholder="覆盖默认，如 YYYY-MM-DD" />)}
                </Form.Item>
              )}

              {item.type === "editableTable" && (
                <Form.Item label="表格列定义 (Columns)">
                  {getFieldDecorator("columns", {
                    initialValue: item.columns || [],
                  })(<ColumnsEditor />)}
                </Form.Item>
              )}
            </>
          )}
        </Panel>

        {!isSection && (
          <Panel header="高级逻辑" key="logic">
            <Form.Item label="显示条件脚本 (visibleExp)">
              {getFieldDecorator("visibleExp", {
                initialValue: item.visibleExp,
              })(<Input.TextArea rows={2} placeholder="formData.type === 'A'" />)}
            </Form.Item>
            <Form.Item label="必填条件脚本 (requiredExp)">
              {getFieldDecorator("requiredExp", {
                initialValue: item.requiredExp,
              })(<Input.TextArea rows={2} />)}
            </Form.Item>
          </Panel>
        )}
      </Collapse>
    </Form>
  );
}

/**
 * 带有高阶表单特性的 RightPanel
 */
const RightPanel = Form.create({
  onValuesChange: (props, changedValues) => {
    let finalValues = { ...changedValues };

    if (props.onValuesChangeDelegate) {
      props.onValuesChangeDelegate(finalValues);
    }
  },
})(RightPanelForm);

/**
 * 外部封装组件：处理 Schema 更新逻辑
 */
export default function RightPanelWrapper({ schema, activeFieldId, updateSchema, setActiveField, designMode }) {
  const handleValuesChange = useCallback(
    (changedValues) => {
      if (!schema) return;

      // A. 无选中项 (全局配置)
      if (!activeFieldId) {
        if (designMode === "list") {
          const newListConfig = { ...(schema.listConfig || {}), ...changedValues };
          updateSchema({ ...schema, listConfig: newListConfig });
        } else {
          const newSchema = { ...schema };
          Object.keys(changedValues).forEach((key) => {
            if (key.includes(".")) {
              const [p, c] = key.split(".");
              newSchema[p] = { ...newSchema[p], [c]: changedValues[key] };
            } else {
              newSchema[key] = changedValues[key];
            }
          });
          updateSchema(newSchema);
        }
        return;
      }

      // B. 有选中项 (Section 或 Field)
      const newSchema = JSON.parse(JSON.stringify(schema));
      let fieldFound = false;

      if (activeFieldId.startsWith("section_")) {
        const idx = newSchema.sections?.findIndex((s) => s.id === activeFieldId);
        if (idx > -1) newSchema.sections[idx] = { ...newSchema.sections[idx], ...changedValues };
      } else {
        // 遍历详情页字段
        for (const section of newSchema.sections || []) {
          const fIdx = section.fields?.findIndex((f) => f.field === activeFieldId);
          if (fIdx > -1) {
            section.fields[fIdx] = { ...section.fields[fIdx], ...changedValues };
            fieldFound = true;
            break;
          }
        }
        // 遍历列表页配置
        if (!fieldFound && newSchema.listConfig) {
          ["searchFields", "tableColumns"].forEach((key) => {
            const arr = newSchema.listConfig[key];
            const fIdx = arr?.findIndex((f) => f.field === activeFieldId);
            if (fIdx > -1) arr[fIdx] = { ...arr[fIdx], ...changedValues };
          });
        }
      }

      updateSchema(newSchema);

      // 字段更名同步
      if (changedValues.field && changedValues.field !== activeFieldId) {
        setActiveField(changedValues.field);
      }
    },
    [schema, activeFieldId, designMode, updateSchema, setActiveField],
  );

  return (
    <div className="right-panel-wrapper" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", fontWeight: 600 }}>
        属性配置 - {activeFieldId ? (activeFieldId.startsWith("section") ? "分组" : "字段") : "全局"}
      </div>
      <RightPanel
        key={activeFieldId || "global"}
        activeFieldId={activeFieldId}
        schema={schema}
        designMode={designMode}
        onValuesChangeDelegate={handleValuesChange}
      />
    </div>
  );
}
