import React, { useCallback } from 'react';
import { Icon, Button } from 'antd';

/** 根据组件类型渲染占位符预览 */
function renderFieldWidget(field) {
  switch (field.type) {
    case 'input':
      return <div style={s.inputBox}>请输入</div>;
    case 'textarea':
      return <div style={{ ...s.inputBox, height: 60, color: '#bfbfbf' }}>请输入多行文本...</div>;
    case 'select':
      return <div style={s.inputBox}>请选择 <Icon type="down" style={s.suffixIcon} /></div>;
    case 'treeselect':
      return <div style={s.inputBox}>树状选择 <Icon type="cluster" style={s.suffixIcon} /></div>;
    case 'cascader':
      return <div style={s.inputBox}>联级选择 <Icon type="apartment" style={s.suffixIcon} /></div>;
    case 'number':
      return <div style={s.inputBox}>0</div>;
    case 'date':
      return <div style={s.inputBox}>选择日期 <Icon type="calendar" style={s.suffixIcon} /></div>;
    case 'rangepicker':
      return <div style={{ ...s.inputBox, display: 'flex', justifyContent: 'space-between' }}><span>开始 ~ 结束</span><Icon type="calendar" style={{ marginTop: 4, color: '#bfbfbf' }} /></div>;
    case 'timepicker':
      return <div style={s.inputBox}>选择时间 <Icon type="clock-circle" style={s.suffixIcon} /></div>;
    case 'radio':
      return <div><Icon type="check-circle" theme="twoTone" style={{ marginRight: 4 }} />单选A <Icon type="check-circle" style={{ margin: '0 4px 0 12px', color: '#bfbfbf' }} />单选B</div>;
    case 'checkbox':
      return <div><Icon type="check-square" theme="twoTone" style={{ marginRight: 4 }} />多选A <Icon type="border" style={{ margin: '0 4px 0 12px', color: '#bfbfbf' }} />多选B</div>;
    case 'switch':
      return <div style={{ width: 44, height: 22, background: '#bfbfbf', borderRadius: 11, position: 'relative' }}><div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', left: 2, top: 2 }} /></div>;
    case 'slider':
      return <div style={{ height: 12, marginTop: 10, background: '#f5f5f5', borderRadius: 6, position: 'relative' }}><div style={{ width: '40%', height: '100%', background: '#91d5ff', borderRadius: 6 }} /><div style={{ width: 14, height: 14, background: '#fff', border: '2px solid #1890ff', borderRadius: '50%', position: 'absolute', left: '40%', top: -1 }} /></div>;
    case 'rate':
      return <div><Icon type="star" theme="filled" style={{ color: '#fadb14', marginRight: 4 }} /><Icon type="star" theme="filled" style={{ color: '#fadb14', marginRight: 4 }} /><Icon type="star" style={{ color: '#d9d9d9' }} /></div>;
    case 'upload':
      return <Button icon="upload">点击上传</Button>;
    default:
      return <div style={s.inputBox}>未知组件</div>;
  }
}

const s = {
  inputBox: { border: '1px solid #d9d9d9', padding: '4px 11px', background: '#fff', borderRadius: 4 },
  suffixIcon: { float: 'right', marginTop: 4, color: '#bfbfbf' },
};

export default function Canvas({ schema, activeFieldId, updateSchema, setActiveField, designMode }) {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // ─── Detail Mode: Drop onto canvas ───
  const handleDropOnCanvas = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('componentParams');
    if (!dataStr) return;
    const item = JSON.parse(dataStr);

    if (item.type === 'section') {
      const newSection = { id: `section_${generateId()}`, title: '新建表单组', fields: [] };
      updateSchema({ ...schema, sections: [...(schema.sections || []), newSection] });
      setActiveField(newSection.id);
    } else {
      if (!schema.sections || schema.sections.length === 0) {
        const fieldId = `field_${generateId()}`;
        const newSection = {
          id: `section_${generateId()}`, title: '新建表单组',
          fields: [{ label: item.label, type: item.type, field: fieldId }]
        };
        updateSchema({ ...schema, sections: [newSection] });
        setActiveField(fieldId);
      } else {
        const lastIdx = schema.sections.length - 1;
        const fieldId = `field_${generateId()}`;
        const newSections = [...schema.sections];
        newSections[lastIdx] = {
          ...newSections[lastIdx],
          fields: [...(newSections[lastIdx].fields || []), { label: item.label, type: item.type, field: fieldId }]
        };
        updateSchema({ ...schema, sections: newSections });
        setActiveField(fieldId);
      }
    }
  }, [schema, updateSchema, setActiveField]);

  const handleDropOnSection = useCallback((e, sectionIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('componentParams');
    if (!dataStr) return;
    const item = JSON.parse(dataStr);
    if (item.type === 'section') return;

    const fieldId = `field_${generateId()}`;
    const newSections = [...schema.sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      fields: [...(newSections[sectionIndex].fields || []), { label: item.label, type: item.type, field: fieldId }]
    };
    updateSchema({ ...schema, sections: newSections });
    setActiveField(fieldId);
  }, [schema, updateSchema, setActiveField]);

  // 支持在指定 insertIndex 处插入（splice），而不是 push 到末尾
  const handleDropInsertAt = useCallback((e, sectionIndex, insertIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('componentParams');
    if (!dataStr) return;
    const item = JSON.parse(dataStr);
    if (item.type === 'section') return;

    const fieldId = `field_${generateId()}`;
    const newSections = [...schema.sections];
    const fields = [...(newSections[sectionIndex].fields || [])];
    fields.splice(insertIndex, 0, { label: item.label, type: item.type, field: fieldId });
    newSections[sectionIndex] = { ...newSections[sectionIndex], fields };
    updateSchema({ ...schema, sections: newSections });
    setActiveField(fieldId);
  }, [schema, updateSchema, setActiveField]);

  const handleRemoveField = useCallback((e, sectionIndex, fieldIndex) => {
    e.stopPropagation();
    const newSections = [...schema.sections];
    const fields = [...newSections[sectionIndex].fields];
    fields.splice(fieldIndex, 1);
    newSections[sectionIndex] = { ...newSections[sectionIndex], fields };
    updateSchema({ ...schema, sections: newSections });
  }, [schema, updateSchema]);

  const handleRemoveSection = useCallback((e, sectionIndex) => {
    e.stopPropagation();
    const newSections = [...schema.sections];
    newSections.splice(sectionIndex, 1);
    updateSchema({ ...schema, sections: newSections });
  }, [schema, updateSchema]);

  // ─── List Mode: Drop onto list config ───
  const handleDropOnListConfig = useCallback((e, targetKey) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('componentParams');
    if (!dataStr) return;
    const item = JSON.parse(dataStr);
    if (item.type === 'section') return;

    const fieldId = `field_${generateId()}`;
    const newField = { label: item.label, type: item.type, field: fieldId };
    const newListConfig = {
      ...schema.listConfig,
      [targetKey]: [...(schema.listConfig?.[targetKey] || []), newField]
    };
    updateSchema({ ...schema, listConfig: newListConfig });
    setActiveField(fieldId);
  }, [schema, updateSchema, setActiveField]);

  const handleRemoveListField = useCallback((e, targetKey, fieldIndex) => {
    e.stopPropagation();
    const targetArray = [...(schema.listConfig?.[targetKey] || [])];
    targetArray.splice(fieldIndex, 1);
    updateSchema({ ...schema, listConfig: { ...schema.listConfig, [targetKey]: targetArray } });
  }, [schema, updateSchema]);

  const handleDragOver = (e) => e.preventDefault();

  if (!schema) return null;

  return (
    <div
      className="canvas-container-inner"
      style={{ minHeight: 600, paddingBottom: 100 }}
      onDragOver={handleDragOver}
      onDrop={handleDropOnCanvas}
    >
      <div className="canvas-header" style={{ background: '#fff', padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 24, borderRadius: 4 }}>
        <h2 style={{ margin: 0, color: '#333' }}>
          {schema.header?.title || '页面标题'}
          <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 12, fontWeight: 'normal' }}>
            ({designMode === 'list' ? '列表态视图' : '详情态视图'})
          </span>
        </h2>
      </div>

      {designMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 搜索筛选配置区 */}
          <div
            className={`list-drop-zone ${schema.listConfig?.searchFields?.some(f => f.field === activeFieldId) ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnListConfig(e, 'searchFields')}
            style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: 150 }}
          >
            <h3 style={{ color: '#1890ff', borderBottom: '1px solid #e8e8e8', paddingBottom: 16, marginBottom: 24 }}>
              <Icon type="filter" style={{ marginRight: 8 }} />搜索筛选配置区
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -12px' }}>
              {schema.listConfig?.searchFields?.map((field, fIndex) => {
                const isActive = activeFieldId === field.field;
                return (
                  <div
                    key={field.field}
                    className={`field-card ${isActive ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveField(field.field); }}
                    style={{ width: `calc(${field.width || 33.33}% - 24px)`, margin: '0 12px 16px', padding: 16, cursor: 'pointer', position: 'relative' }}
                  >
                    <div style={{ marginBottom: 10, color: '#595959', fontSize: 14 }}>{field.label}</div>
                    {renderFieldWidget(field)}
                    {isActive && (
                      <div style={s_del} onClick={(e) => handleRemoveListField(e, 'searchFields', fIndex)}>
                        <Icon type="close" style={{ fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {(!schema.listConfig?.searchFields || schema.listConfig.searchFields.length === 0) && (
                <div style={s_empty}>将【业务字段】拖拽至此作为搜索条件</div>
              )}
            </div>
          </div>

          {/* 表格展示列区 */}
          <div
            className={`list-drop-zone ${schema.listConfig?.tableColumns?.some(f => f.field === activeFieldId) ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnListConfig(e, 'tableColumns')}
            style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: 150 }}
          >
            <h3 style={{ color: '#1890ff', borderBottom: '1px solid #e8e8e8', paddingBottom: 16, marginBottom: 24 }}>
              <Icon type="table" style={{ marginRight: 8 }} />表格展示列区
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', paddingBottom: 16 }}>
              {schema.listConfig?.tableColumns?.map((field, fIndex) => {
                const isActive = activeFieldId === field.field;
                return (
                  <div
                    key={field.field}
                    className={`column-card ${isActive ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveField(field.field); }}
                    style={{ minWidth: 160, border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9', background: isActive ? '#e6f7ff' : '#fafafa', padding: '12px 16px', margin: '0 16px 16px 0', borderRadius: 4, cursor: 'pointer', position: 'relative' }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#333', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.label}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>字段: {field.field}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>组件: {field.type}</div>
                    {isActive && (
                      <div style={s_del} onClick={(e) => handleRemoveListField(e, 'tableColumns', fIndex)}>
                        <Icon type="close" style={{ fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {(!schema.listConfig?.tableColumns || schema.listConfig.tableColumns.length === 0) && (
                <div style={{ flex: 1, textAlign: 'center', color: '#bfbfbf', padding: '24px 0', border: '1px dashed #e8e8e8', borderRadius: 6 }}>
                  将【业务字段】拖拽至此设定表格默认呈现列
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {schema.sections?.map((section, sIndex) => {
            const isSectionActive = activeFieldId === section.id;
            return (
              <div
                key={section.id}
                className={`section-card ${isSectionActive ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveField(section.id); }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSection(e, sIndex)}
                style={{ background: '#fff', padding: 24, marginBottom: 24, position: 'relative', minHeight: 120 }}
              >
                <h3 style={{ borderBottom: '1px solid #e8e8e8', paddingBottom: 16, marginBottom: 24, color: '#1890ff', fontWeight: 'bold' }}>
                  <Icon type="appstore" style={{ marginRight: 8 }} />{section.title}
                </h3>
                {isSectionActive && (
                  <Button type="danger" size="small" icon="delete" style={{ position: 'absolute', right: 8, top: 8 }} onClick={(e) => handleRemoveSection(e, sIndex)}>删除区段</Button>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -12px' }}>
                  {(!section.fields || section.fields.length === 0) && (
                    <div style={{ width: '100%', textAlign: 'center', color: '#bfbfbf', padding: '24px 0', border: '1px dashed #e8e8e8', borderRadius: 6, margin: '0 12px' }}>
                      将组件拖拽至此表单组内
                    </div>
                  )}
                  {section.fields?.map((field, fIndex) => {
                    const isFieldActive = activeFieldId === field.field;
                    return (
                      <React.Fragment key={field.field}>
                        {/* 字段前的插入落点区：悬停时显示蓝色竖线提示 */}
                        <div
                          className="field-insert-zone"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropInsertAt(e, sIndex, fIndex)}
                          style={{ width: 8, margin: '0 4px 16px', cursor: 'col-resize', position: 'relative', alignSelf: 'stretch', minHeight: 80 }}
                          title={`插入到第${fIndex + 1}个字段之前`}
                        />
                        <div
                          className={`field-card ${isFieldActive ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setActiveField(field.field); }}
                          style={{ width: `calc(${field.width || 33.33}% - 28px)`, margin: '0 4px 16px', padding: 16, cursor: 'pointer', position: 'relative' }}
                        >
                          <div style={{ marginBottom: 10, color: '#595959', fontSize: 14, fontWeight: 500 }}>
                            {field.requiredExp && <span style={{ color: '#f5222d', marginRight: 4 }}>*</span>}
                            {field.label}
                          </div>
                          {renderFieldWidget(field)}
                          {isFieldActive && (
                            <div style={s_del} onClick={(e) => handleRemoveField(e, sIndex, fIndex)}>
                              <Icon type="close" style={{ fontSize: 12 }} />
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {/* 末尾追加落点区 */}
                  {section.fields && section.fields.length > 0 && (
                    <div
                      className="field-insert-zone field-insert-tail"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropInsertAt(e, sIndex, section.fields.length)}
                      style={{ width: 8, margin: '0 4px 16px', cursor: 'col-resize', alignSelf: 'stretch', minHeight: 80 }}
                      title="追加到末尾"
                    />
                  )}
                </div>
              </div>
            );
          })}
          {(!schema.sections || schema.sections.length === 0) && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf', border: '2px dashed #adc6ff', borderRadius: 8, background: '#fff' }}>
              <Icon type="build" style={{ fontSize: 48, marginBottom: 16, color: '#91d5ff' }} />
              <p style={{ fontSize: 16, color: '#8c8c8c' }}>拖入左侧【表单分组】或基础组件开始搭建页面</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s_del = {
  position: 'absolute', right: -10, top: -10,
  background: '#f5222d', color: '#fff',
  borderRadius: '50%', width: 22, height: 22,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', zIndex: 2,
  boxShadow: '0 2px 4px rgba(245,34,45,0.2)'
};

const s_empty = {
  width: '100%', textAlign: 'center', color: '#bfbfbf',
  padding: '24px 0', border: '1px dashed #e8e8e8',
  borderRadius: 6, margin: '0 12px'
};
