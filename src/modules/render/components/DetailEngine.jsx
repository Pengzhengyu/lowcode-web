import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Row, Col, Anchor, Button, message } from 'antd';
import SectionForm from './SectionForm';

const { Link } = Anchor;

export default function DetailEngine({ schema }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  // 存储所有 SectionForm form 实例引用
  const sectionFormRefs = useRef({});

  const setFormsValue = useCallback((data) => {
    Object.values(sectionFormRefs.current).forEach(formInst => {
      if (formInst) {
        formInst.setFieldsValue(data);
      }
    });
    setFormData(data);
  }, []);

  const fetchInitData = useCallback(async () => {
    if (!schema?.api?.init) return;
    try {
      setLoading(true);
      // TODO: const res = await request(schema.api.init.url);
      const mockRes = { type: 1, amount: 500 };
      setFormsValue(mockRes);
    } catch (e) {
      message.error('初始化数据失败');
    } finally {
      setLoading(false);
    }
  }, [schema, setFormsValue]);

  useEffect(() => {
    fetchInitData();
  }, [fetchInitData]);

  const handleSectionValuesChange = useCallback((sectionId, allValues) => {
    setFormData(prev => ({ ...prev, ...allValues }));
  }, []);

  const gatherAllFormData = useCallback(() => {
    let allData = {};
    Object.values(sectionFormRefs.current).forEach(formInst => {
      if (formInst) {
        allData = { ...allData, ...formInst.getFieldsValue() };
      }
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

  return (
    <div className="detail-engine-container">
      {/* 粘性头部 */}
      <div className="detail-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', padding: '16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
        <h3>{schema.header?.title}</h3>
        <div className="header-actions">
          {schema.buttons?.map(btn => (
            <Button
              key={btn.code}
              type={btn.type}
              loading={loading}
              onClick={btn.code === 'submit' ? doSubmit : doSave}
              style={{ marginLeft: 8 }}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      <Row style={{ padding: '24px' }}>
        {/* 左侧表单内容区 */}
        <Col span={20}>
          {schema.sections?.map(section => (
            <SectionForm
              key={section.id}
              section={section}
              wrappedComponentRef={(inst) => {
                // Antd 3.x Form.create 会把 form prop 注入到内部，
                // wrappedComponentRef 拿到的是包裹后的实例，其 props.form 即是 form 对象
                sectionFormRefs.current[section.id] = inst && inst.props && inst.props.form;
              }}
              onSectionValuesChange={handleSectionValuesChange}
            />
          ))}
        </Col>

        {/* 右侧导航锚点区 */}
        <Col span={4}>
          <Anchor offsetTop={80}>
            {schema.sections?.map(section => (
              <Link key={section.id} href={`#${section.id}`} title={section.title} />
            ))}
          </Anchor>
        </Col>
      </Row>
    </div>
  );
}
