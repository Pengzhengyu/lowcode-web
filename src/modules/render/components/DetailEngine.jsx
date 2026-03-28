import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Row, Col, Tabs, Anchor, Button, Tag, message, Divider } from 'antd';
import SectionForm from './SectionForm';

const { TabPane } = Tabs;
const { Link } = Anchor;

const API_BASE = 'http://localhost:3000/api/v1';

/**
 * DetailEngine - 企业级详情页渲染引擎（对接真实 API）
 * 布局：顶部固定操作栏 + Tabs 标签（> 1 个 section）+ 三列表单区
 */
export default function DetailEngine({ schema, recordId, onBack }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const sectionFormRefs = useRef({});

  const moduleCode = schema?.moduleCode;
  const sections = schema?.sections || [];
  // 核心逻辑修正：优先读取 layoutMode。如果是 auto，则根据分组数量自动切换，否则严格遵循用户手动选择。
  const rawLayoutMode = schema?.layoutMode || 'auto';
  const useTabMode = rawLayoutMode === 'tabs' || (rawLayoutMode === 'auto' && sections.length > 5);

  useEffect(() => {
    if (sections.length > 0) {
      setActiveTab(sections[0].id);
    }
  }, [schema]);

  // ── 回显：获取详情数据 ──
  useEffect(() => {
    if (!recordId || !moduleCode) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/records/${moduleCode}/${recordId}`);
        const json = await res.json();
        if (json.code === 200 && json.data) {
          // 将数据回填到所有 SectionForm
          Object.values(sectionFormRefs.current).forEach(formInst => {
            if (formInst) formInst.setFieldsValue(json.data);
          });
        } else {
          message.error('获取详情失败: ' + json.message);
        }
      } catch (e) {
        message.error('网络异常，无法连接至 API 服务');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recordId, moduleCode]);

  // ── 收集所有 Section 表单数据 ──
  const gatherAllFormData = useCallback(() => {
    let allData = {};
    Object.values(sectionFormRefs.current).forEach(formInst => {
      if (formInst) allData = { ...allData, ...formInst.getFieldsValue() };
    });
    // 如果是编辑场景，带入 id
    if (recordId) allData.id = recordId;
    return allData;
  }, [recordId]);

  // ── 全量校验 ──
  const validateAll = useCallback(() => {
    return new Promise((resolve, reject) => {
      let hasError = false;
      let allData = {};
      const sectionIds = Object.keys(sectionFormRefs.current);
      let pending = sectionIds.length;

      if (pending === 0) { resolve({}); return; }

      sectionIds.forEach(id => {
        const formInst = sectionFormRefs.current[id];
        if (!formInst) { pending--; if (pending === 0) resolve(allData); return; }
        formInst.validateFields((err, values) => {
          if (err) hasError = true;
          allData = { ...allData, ...values };
          pending--;
          if (pending === 0) {
            hasError ? reject(allData) : resolve(allData);
          }
        });
      });
    });
  }, []);

  const doSave = useCallback(async () => {
    setSaving(true);
    try {
      const data = gatherAllFormData();
      const res = await fetch(`${API_BASE}/records/${moduleCode}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.code === 200) {
        message.success('暂存成功');
      } else {
        message.error('保存失败: ' + json.message);
      }
    } catch (e) {
      message.error('网络异常');
    } finally {
      setSaving(false);
    }
  }, [moduleCode, gatherAllFormData]);

  const doSubmit = useCallback(async () => {
    setSaving(true);
    try {
      const data = await validateAll();
      const res = await fetch(`${API_BASE}/records/${moduleCode}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.code === 200) {
        message.success('提交成功');
        if (onBack) onBack();
      } else {
        message.error('提交失败: ' + json.message);
      }
    } catch (partialData) {
      message.error('表单填写有误，请检查必填项');
    } finally {
      setSaving(false);
    }
  }, [moduleCode, validateAll, onBack]);

  if (!schema) return null;

  const title = schema.header?.title || '详情页面';
  const buttons = schema.buttons || [
    { label: '保存', code: 'save', type: 'default' },
    { label: '提交', code: 'submit', type: 'primary' },
  ];

  const handleBtnClick = (code) => {
    if (code === 'submit') doSubmit();
    else doSave();
  };

  const renderSectionForm = (section) => (
    <SectionForm
      key={section.id}
      section={section}
      wrappedComponentRef={(inst) => {
        sectionFormRefs.current[section.id] = inst && inst.props && inst.props.form;
      }}
      onSectionValuesChange={() => {}}
    />
  );

  return (
    <div className="detail-engine-preview" style={{ background: '#f5f6fa', minHeight: '100%' }}>
      {/* ── 顶部吸顶区域：包含页头与锚点 ── */}
      <div style={{
        background: '#fff',
        position: 'sticky', top: 0, zIndex: 1000,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {/* 页头行 */}
        <div style={{
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {onBack && (
              <Button 
                type="link" 
                icon="left-circle" 
                onClick={onBack}
                style={{ padding: 0, fontSize: 18, color: '#1890ff', display: 'flex', alignItems: 'center' }}
              >
                <span style={{ fontSize: 14, marginLeft: 4 }}>返回</span>
              </Button>
            )}
            <Divider type="vertical" style={{ height: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{title}</span>
            <Tag color={recordId ? 'blue' : 'green'}>{recordId ? '编辑记录' : '新增记录'}</Tag>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {buttons.map(btn => (
              <Button
                key={btn.code}
                type={btn.type === 'primary' ? 'primary' : 'default'}
                loading={saving && (btn.code === 'submit' || btn.code === 'save')}
                disabled={loading}
                icon={btn.code === 'save' ? 'save' : (btn.code === 'submit' ? 'check' : undefined)}
                onClick={() => handleBtnClick(btn.code)}
                style={btn.type !== 'primary' ? { borderColor: '#d9d9d9', color: '#595959' } : {}}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 锚点行 (仅当模式为 anchor 且有多于 1 个 section 时显示) */}
        {!useTabMode && sections.length > 1 && (
          <div style={{ padding: '0 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <Anchor offsetTop={120} style={{ background: 'transparent' }} className="horizontal-anchor">
              <div style={{ display: 'flex', gap: 24 }}>
                {sections.map(sec => (
                  <Link
                    key={sec.id}
                    href={`#${sec.id}`}
                    title={
                      <span style={{ padding: '10px 0', fontSize: 14, fontWeight: 500 }}>{sec.title}</span>
                    }
                  />
                ))}
              </div>
            </Anchor>
          </div>
        )}

        {/* Tabs 行 (仅当模式为 tabs 时显示) */}
        {useTabMode && (
          <div style={{ padding: '0 24px', background: '#fafafa' }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarStyle={{ marginBottom: 0 }}>
              {sections.map(sec => <TabPane tab={sec.title} key={sec.id} />)}
            </Tabs>
          </div>
        )}
      </div>

      {/* ── 内容区 ── */}
      <div style={{ padding: 24 }}>
        {useTabMode ? (
          sections.filter(sec => sec.id === activeTab).map(section => (
            <div key={section.id} style={{ background: '#fff', padding: '24px', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              {renderSectionForm(section)}
            </div>
          ))
        ) : (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {sections.map(section => (
              <div key={section.id} id={section.id} style={{ background: '#fff', padding: '24px', marginBottom: 24, borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333', paddingBottom: 16, marginBottom: 24, borderBottom: '2px solid #1890ff', display: 'inline-block' }}>
                  {section.title}
                </div>
                {renderSectionForm(section)}
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

      <style dangerouslySetInnerHTML={{ __html: `
        .horizontal-anchor .ant-anchor { display: flex !important; padding: 0 !important; border: none !important; }
        .horizontal-anchor .ant-anchor-ink { display: none !important; }
        .horizontal-anchor .ant-anchor-link { padding: 0 !important; margin: 0 !important; border: none !important; }
        .horizontal-anchor .ant-anchor-link-title { color: #595959 !important; transition: all 0.3s; position: relative; }
        .horizontal-anchor .ant-anchor-link-active > .ant-anchor-link-title { color: #1890ff !important; font-weight: 600; }
        .horizontal-anchor .ant-anchor-link-active > .ant-anchor-link-title::after {
          content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: #1890ff;
        }
      `}} />
    </div>
  );
}
