import React from 'react';
import { Icon } from 'antd';

const COMPONENT_MATERIALS = [
  // 布局类
  { type: 'section', label: '表单分组', icon: 'appstore', category: 'layout' },
  // 基础文本
  { type: 'input', label: '单行文本', icon: 'edit', category: 'field' },
  { type: 'textarea', label: '多行文本', icon: 'profile', category: 'field' },
  { type: 'number', label: '数字输入', icon: 'number', category: 'field' },
  // 选项类
  { type: 'select', label: '下拉选择', icon: 'down-square', category: 'field' },
  { type: 'treeselect', label: '树状选择', icon: 'cluster', category: 'field' },
  { type: 'cascader', label: '级联选择', icon: 'apartment', category: 'field' },
  { type: 'radio', label: '单选按钮', icon: 'check-circle', category: 'field' },
  { type: 'checkbox', label: '多选按钮', icon: 'check-square', category: 'field' },
  { type: 'switch', label: '开关组件', icon: 'bulb', category: 'field' },
  // 日期类
  { type: 'date', label: '日期选择', icon: 'calendar', category: 'field' },
  { type: 'rangepicker', label: '日期范围', icon: 'switcher', category: 'field' },
  { type: 'timepicker', label: '时间选择', icon: 'clock-circle', category: 'field' },
  // 特殊件
  { type: 'rate', label: '评分组件', icon: 'star', category: 'field' },
  { type: 'slider', label: '滑块组件', icon: 'sliders', category: 'field' },
  { type: 'upload', label: '文件上传', icon: 'upload', category: 'field' },
];

export default function LeftPanel({ designMode }) {
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('componentParams', JSON.stringify(item));
  };

  // 在列表视图中，屏蔽表单分组、上传等不适合做检索条件且不适合做常规表格骨架的组件
  const layoutItems = COMPONENT_MATERIALS.filter(c => c.category === 'layout' && designMode !== 'list');
  const fieldItems = COMPONENT_MATERIALS.filter(c => c.category === 'field');
  const displayFields = designMode === 'list' 
    ? fieldItems.filter(f => !['upload'].includes(f.type))
    : fieldItems;

  return (
    <div className="left-panel-container" style={{ padding: '20px 12px' }}>
      {layoutItems.length > 0 && (
        <>
          <div style={{ fontWeight: 600, color: '#333', marginBottom: 16, paddingLeft: 8, fontSize: 15 }}>布局组件</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 32 }}>
            {layoutItems.map(item => (
              <div 
                key={item.type}
                draggable 
                className="material-item"
                onDragStart={(e) => handleDragStart(e, item)}
                style={{ width: '45%', margin: '2.5%', padding: '12px 8px', textAlign: 'center', border: '1px dashed #d9d9d9', background: '#fafafa', cursor: 'grab' }}
              >
                <Icon type={item.icon} style={{ display: 'block', fontSize: 24, marginBottom: 8, color: '#595959' }} />
                <span style={{ fontSize: 13, color: '#595959' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontWeight: 600, color: '#333', marginBottom: 16, paddingLeft: 8, fontSize: 15 }}>基础业务字段</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {displayFields.map(item => (
          <div 
            key={item.type}
            draggable 
            className="material-item"
            onDragStart={(e) => handleDragStart(e, item)}
            style={{ width: '45%', margin: '2.5%', padding: '12px 8px', textAlign: 'center', border: '1px dashed #d9d9d9', background: '#fafafa', cursor: 'grab' }}
          >
            <Icon type={item.icon} style={{ display: 'block', fontSize: 24, marginBottom: 8, color: '#595959' }} />
            <span style={{ fontSize: 13, color: '#595959' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

