import React, { Component } from 'react';
import { Row, Col, Anchor, Button, message } from 'antd';
import SectionForm from './SectionForm';

const { Link } = Anchor;

export default class DetailEngine extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {},
      loading: false,
    };
    // 存储所有的 SectionForm 实例的 ref
    this.sectionRefs = {};
  }

  componentDidMount() {
    this.fetchInitData();
  }

  fetchInitData = async () => {
    const { schema } = this.props;
    if (!schema?.api?.init) return;

    try {
      this.setState({ loading: true });
      // TODO: const res = await request(schema.api.init.url);
      // 模拟请求成功，回显数据
      const mockRes = { type: 1, amount: 500 }; 
      this.setFormsValue(mockRes);
    } catch (e) {
      message.error('初始化数据失败');
    } finally {
      this.setState({ loading: false });
    }
  }

  setFormsValue = (data) => {
    Object.keys(this.sectionRefs).forEach(key => {
      const ref = this.sectionRefs[key];
      if (ref && ref.props.form) {
        ref.props.form.setFieldsValue(data);
        // 通知内部 logicEngine 更新
        if (ref.syncLogicEngine) ref.syncLogicEngine();
      }
    });
    this.setState({ formData: data });
  }

  handleSectionValuesChange = (sectionId, allValues) => {
    // 收集局部的变更合并至顶端
    this.setState(prevState => {
      const newGlobalData = { ...prevState.formData, ...allValues };
      // 为了支持跨段联动，在有跨段字段变更时，应当触发其他 sectionSync (略过当前节以避免死循环)。
      // 此处可做一个优化，遍历除了当前 sectionId 外的其他 ref
      Object.keys(this.sectionRefs).forEach(key => {
         if (key !== sectionId) {
            const ref = this.sectionRefs[key];
            if (ref && ref.logicEngine) {
               ref.logicEngine.updateData(newGlobalData);
               // 可以强制 forceUpdate() 让他重走 evaluate
               ref.forceUpdate();
            }
         }
      });
      return { formData: newGlobalData };
    });
  }

  doSave = () => {
    // 暂存无需校验
    const data = this.gatherAllFormData();
    console.log('执行保存:', data);
    message.success('暂存成功');
  }

  doSubmit = () => {
    // 提交需要遍历所有 SectionForm 触发表单校验
    let hasError = false;
    let submitData = {};

    Object.keys(this.sectionRefs).forEach(key => {
      const ref = this.sectionRefs[key];
      if (ref && ref.props.form) {
        ref.props.form.validateFields((err, values) => {
          if (err) hasError = true;
          submitData = { ...submitData, ...values };
        });
      }
    });

    if (hasError) {
      message.error('表单填写有误，请检查必填项');
      return;
    }

    console.log('校验通过，执行提交 API:', submitData);
    message.success('提交成功');
  }

  gatherAllFormData = () => {
    let allData = {};
    Object.keys(this.sectionRefs).forEach(key => {
      const ref = this.sectionRefs[key];
      if (ref && ref.props.form) {
        allData = { ...allData, ...ref.props.form.getFieldsValue() };
      }
    });
    return allData;
  }

  render() {
    const { schema } = this.props;
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
                onClick={btn.code === 'submit' ? this.doSubmit : this.doSave}
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
                wrappedComponentRef={(inst) => this.sectionRefs[section.id] = inst}
                onSectionValuesChange={this.handleSectionValuesChange}
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
}
