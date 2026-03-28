import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Row, Col, Tabs, Button, Tag, message, Tooltip } from 'antd';
import SectionForm from './SectionForm';

const { TabPane } = Tabs;

/**
 * DetailEngine - 企业级详情页渲染引擎 (Preview 版)
 * 参考布局：顶部标题栏 + 操作按钮 + 分组 Tabs + 三列表单内容区
 */
export default function DetailEngine({ schema, previewMode = false }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const sectionFormRefs = useRef({});

  useEffect(() => {
    if (schema?.sections?.length > 0) {
      setActiveTab(schema.sections[0].id);
    }
  }, [schema]);

  const setFormsValue = useCallback((data) => {
    Object.values(sectionFormRefs.current).forEach(formInst => {
      if (formInst) formInst.setFieldsValue(data);
    });
    setFormData(data);
  }, []);

  const fetchInitData = useCallback(async () => {
    if (!schema?.api?.init) return;
    try {
      setLoading(true);
      // TODO: 接入实际接口
      const mockRes = {};
      setFormsValue(mockRes);
    } catch (e) {
      message.error('初始化数据失败');
    } finally {
      setLoading(false);
    }
  }, [schema, setFormsValue]);

  useEffect(() => { fetchInitData(); }, [fetchInitData]);

  const handleSectionValuesChange = useCallback((sectionId, allValues) => {
    setFormData(prev => ({ ...prev, ...allValues }));
  }, []);

  const gatherAllFormData = useCallback(() => {
    let allData = {};
    Object.values(sectionFormRefs.current).forEach(formInst => {
      if (formInst) allData = { ...allData, ...formInst.getFieldsValue() };
    });
    return allData;
  }, []);

  const doSave = useCallback(() => {
    const data = gatherAllFormData();
    console.log('执行保存:', data);
    message.success('暂存成功');
  }, [gatherAllFormData]);

  const doSubmit = useCallback(() => {
    let hasError = false;
    let submitData = {};
    Object.values(sectionFormRefs.current).forEach(formInst => {
      if (formInst) {
        formInst.validateFields((err, values) => {
          if (err) hasError = true;
          submitData = { ...submitData, ...values };
        });
      }
    });
    if (hasError) {
      message.error('表单填写有误，请检查必填项');
      return;
    }
    console.log('校验通过，执行提交:', submitData);
    message.success('提交成功');
  }, []);

  if (!schema) return null;

  const title = schema.header?.title || '详情页面';
  const sections = schema.sections || [];
  const buttons = schema.buttons || [
    { label: '删除', code: 'delete', type: 'default' },
    { label: '保存', code: 'save', type: 'default' },
    { label: '提交', code: 'submit', type: 'primary' },
  ];

  // 根据布局策略决定：sections > 3 用 Tabs 切换，否则全部展开
  const useTabMode = sections.length > 1;

  return (
    <div className="detail-engine-preview" style={{ background: '#f5f6fa', minHeight: '100%' }}>
      {/* ── 顶部标题 + 状态区 + 操作按钮 ── */}
      <div style={{
        background: '#fff',
        padding: '12px 24px',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {/* 左侧：返回文字 + 页面标题 + 状态标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#1890ff', cursor: 'pointer', fontSize: 13 }}>
            ← 返回
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{title}</span>
          <Tag color="blue" style={{ marginLeft: 4 }}>审批中</Tag>
        </div>

        {/* 右侧：操作按钮组 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {buttons.map(btn => (
            <Button
              key={btn.code}
              type={btn.type || 'default'}
              loading={btn.code === 'submit' ? loading : false}
              onClick={btn.code === 'submit' ? doSubmit : doSave}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Tabs 区域（分组标签） ── */}
      {useTabMode ? (
        <>
          <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', paddingLeft: 24 }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabBarStyle={{ marginBottom: 0 }}
            >
              {sections.map(sec => (
                <TabPane tab={sec.title} key={sec.id} />
              ))}
            </Tabs>
          </div>

          {/* 当前选中 Tab 的 Section 内容 */}
          <div style={{ padding: 24 }}>
            {sections.filter(sec => sec.id === activeTab).map(section => (
              <SectionForm
                key={section.id}
                section={section}
                wrappedComponentRef={(inst) => {
                  sectionFormRefs.current[section.id] = inst && inst.props && inst.props.form;
                }}
                onSectionValuesChange={handleSectionValuesChange}
              />
            ))}
          </div>
        </>
      ) : (
        /* 只有一组时：直接展开显示，无需 Tabs */
        <div style={{ padding: 24 }}>
          {sections.map(section => (
            <div key={section.id} style={{ background: '#fff', padding: '20px 24px', marginBottom: 16, borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {/* Section 标题行 */}
              {sections.length > 0 && (
                <div style={{ fontSize: 15, fontWeight: 600, color: '#333', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  {section.title}
                </div>
              )}
              <SectionForm
                key={section.id}
                section={section}
                wrappedComponentRef={(inst) => {
                  sectionFormRefs.current[section.id] = inst && inst.props && inst.props.form;
                }}
                onSectionValuesChange={handleSectionValuesChange}
              />
            </div>
          ))}
          {sections.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf', background: '#fff', borderRadius: 4 }}>
              暂无表单组，请先在设计器中拖入组件
            </div>
          )}
        </div>
      )}
    </div>
  );
}
