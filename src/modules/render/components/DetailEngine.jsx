import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Row, Col, Tabs, Anchor, Button, Tag, message } from 'antd';
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
  // 多 section 时用 Tabs，单/零 section 直接展开并用 Anchor 辅助导航
  const useTabMode = sections.length > 2;

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
    // 若是编辑场景，带上 id
    if (recordId) allData.id = recordId;
    return allData;
  }, [recordId]);

  // ── 全量校验 ──
  const validateAll = useCallback(() => {
    return new Promise((resolve, reject) => {
      let hasError = false;
      let allData = {};
      let pending = Object.keys(sectionFormRefs.current).length;

      if (pending === 0) { resolve({}); return; }

      Object.values(sectionFormRefs.current).forEach(formInst => {
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
      {/* ── 顶部固定操作栏 ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <span style={{ color: '#1890ff', cursor: 'pointer', fontSize: 13 }} onClick={onBack}>
              ← 返回
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{title}</span>
          <Tag color={recordId ? 'processing' : 'orange'}>{recordId ? '编辑' : '新建'}</Tag>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {buttons.map(btn => (
            <Button
              key={btn.code}
              type={btn.type || 'default'}
              loading={saving && (btn.code === 'submit' || btn.code === 'save')}
              disabled={loading}
              onClick={() => handleBtnClick(btn.code)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── 内容区 ── */}
      {useTabMode ? (
        <>
          {/* Tabs 模式（section 超过 2 个） */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', paddingLeft: 24 }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarStyle={{ marginBottom: 0 }}>
              {sections.map(sec => <TabPane tab={sec.title} key={sec.id} />)}
            </Tabs>
          </div>
          <div style={{ padding: 24 }}>
            {sections.filter(sec => sec.id === activeTab).map(section => (
              <div key={section.id} style={{ background: '#fff', padding: '24px', borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {renderSectionForm(section)}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* 展开模式（1~2 个 section）：Anchor 右侧浮动辅助导航 */
        <Row style={{ padding: 24 }}>
          <Col span={sections.length > 1 ? 21 : 24}>
            {sections.map(section => (
              <div key={section.id} id={section.id} style={{ background: '#fff', padding: '20px 24px', marginBottom: 16, borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {sections.length > 1 && (
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                    {section.title}
                  </div>
                )}
                {renderSectionForm(section)}
              </div>
            ))}
            {sections.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf', background: '#fff', borderRadius: 4 }}>
                暂无表单组，请先在设计器中拖入组件
              </div>
            )}
          </Col>
          {sections.length > 1 && (
            <Col span={3}>
              <Anchor offsetTop={80} style={{ paddingTop: 8 }}>
                {sections.map(sec => <Link key={sec.id} href={`#${sec.id}`} title={sec.title} />)}
              </Anchor>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
}
