import React, { useState, useCallback } from 'react';
import { Layout, Button, Modal, Form, Input, Table, Divider, Radio, Icon } from 'antd';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import DetailEngine from '../render/components/DetailEngine';
import ListEngine from '../render/components/ListEngine';
import './style.less';

const { Header, Sider, Content } = Layout;

function SettingsModularEntry({ form }) {
  const { getFieldDecorator } = form;

  const [step, setStep] = useState('list');        // 'list' | 'design'
  const [designMode, setDesignMode] = useState('detail'); // 'list' | 'detail'
  const [schema, setSchema] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [moduleList] = useState([
    { id: 1, moduleCode: 'demo_contract', moduleName: '合同签约页面', creator: '系统管理员', createTime: '2026-03-23' },
    { id: 2, moduleCode: 'demo_settlement', moduleName: '结算单管理', creator: '测试人员', createTime: '2026-03-17' },
  ]);

  const updateSchema = useCallback((newSchema) => {
    setSchema(newSchema);
  }, []);

  const handleCreateModule = useCallback(() => {
    form.validateFields((err, values) => {
      if (!err) {
        const initialSchema = {
          moduleCode: values.moduleCode,
          header: { title: values.moduleName, showStatus: true },
          sections: [],
          listConfig: { searchFields: [], tableColumns: [] },
          api: {},
          // 预置页头操作按鈕（可在设计器内遊辑扩展）
          buttons: [
            { label: '删除', code: 'delete', type: 'default' },
            { label: '保存', code: 'save', type: 'default' },
            { label: '提交', code: 'submit', type: 'primary' },
          ],
        };
        setSchema(initialSchema);
        setStep('design');
        setDesignMode('detail');
        setShowAddModal(false);
        form.resetFields();
      }
    });
  }, [form]);

  const handleEditModule = useCallback((record) => {
    const initialSchema = {
      moduleCode: record.moduleCode,
      header: { title: record.moduleName, showStatus: true },
      sections: [],
      listConfig: { searchFields: [], tableColumns: [] },
      api: {},
      buttons: [
        { label: '删除', code: 'delete', type: 'default' },
        { label: '保存', code: 'save', type: 'default' },
        { label: '提交', code: 'submit', type: 'primary' },
      ],
    };
    setSchema(initialSchema);
    setStep('design');
    setDesignMode('detail');
  }, []);

  const handleSaveSchema = useCallback(async () => {
    if (!schema || !schema.moduleCode) {
      Modal.error({ title: '保存失败', content: '未找到有效的 moduleCode 业务标识。' });
      return;
    }
    const hide = Modal.info({ title: '保存中', content: '正在将当前 Schema 模型同步至后端节点...' });
    try {
      const response = await fetch('http://localhost:3000/api/v1/page-config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schema.moduleCode, schema }),
      });
      const resJson = await response.json();
      hide.destroy();
      if (resJson.code === 200) {
        Modal.success({ title: '保存成功', content: '配置协议已成功持久化至 dcm-api 本地服务库！' });
      } else {
        Modal.error({ title: '保存落盘失败', content: resJson.message || '后端服务异常。' });
      }
    } catch (e) {
      hide.destroy();
      Modal.error({ title: '网络异常', content: '无法连接至 dcm-api，请确保 D 盘 Node 后端服务正在运行。' });
    }
  }, [schema]);

  // ──────────── 列表管理台 ────────────
  if (step === 'list') {
    const columns = [
      { title: '序号', dataIndex: 'id', width: 80 },
      { title: '模块编码', dataIndex: 'moduleCode' },
      { title: '模块名称', dataIndex: 'moduleName' },
      { title: '创建人', dataIndex: 'creator' },
      { title: '创建时间', dataIndex: 'createTime' },
      {
        title: '操作',
        render: (_, record) => (
          <span>
            <a onClick={() => handleEditModule(record)}>进入设计器</a>
            <Divider type="vertical" />
            <a style={{ color: '#f5222d' }}>删除</a>
          </span>
        ),
      },
    ];

    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <h2 style={{ margin: 0, color: '#1890ff', fontWeight: 600 }}>低代码管理台</h2>
        </Header>
        <Content style={{ padding: '24px' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Form layout="inline">
                <Form.Item label="模块名称">
                  <Input placeholder="输入关键字搜索" prefix={<Icon type="search" />} style={{ width: 200 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" ghost>查询</Button>
                </Form.Item>
              </Form>
              <Button type="primary" icon="plus" onClick={() => setShowAddModal(true)}>新增模块</Button>
            </div>
            <Table columns={columns} dataSource={moduleList} rowKey="id" pagination={{ pageSize: 10 }} />
          </div>

          <Modal
            title="新增业务模块"
            visible={showAddModal}
            onOk={handleCreateModule}
            onCancel={() => { setShowAddModal(false); form.resetFields(); }}
            okText="下一步：进入设计"
          >
            <Form layout="vertical">
              <Form.Item label="模块编码 (唯一标识)">
                {getFieldDecorator('moduleCode', {
                  rules: [{ required: true, message: '请填写模版编码' }]
                })(<Input placeholder="例如: project_basic" />)}
              </Form.Item>
              <Form.Item label="模块名称 (展示名称)">
                {getFieldDecorator('moduleName', {
                  rules: [{ required: true, message: '请填写模版名称' }]
                })(<Input placeholder="例如: 项目基础信息管理" />)}
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    );
  }

  // ──────────── 设计器主界面 ────────────
  return (
    <Layout className="lowcode-settings-layout" style={{ height: '100vh', display: 'flex' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px', alignItems: 'center', background: '#001529' }}>
        <div style={{ cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 500 }} onClick={() => setStep('list')}>
          <Icon type="left" style={{ marginRight: 8, fontSize: 14 }} />
          Estate LowCode &nbsp;<span style={{ color: '#69c0ff' }}>[{schema && schema.moduleCode}]</span>
        </div>
        <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
          <Radio.Group
            value={designMode}
            onChange={e => { setDesignMode(e.target.value); setActiveFieldId(null); }}
            buttonStyle="solid"
            style={{ marginRight: 24 }}
          >
            <Radio.Button value="list"><Icon type="table" /> 列表页配置</Radio.Button>
            <Radio.Button value="detail"><Icon type="profile" /> 详情页配置</Radio.Button>
          </Radio.Group>

          <Button
            icon="eye"
            style={{ marginRight: 8, background: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }}
            onClick={() => setPreviewVisible(true)}
          >
            实时预览
          </Button>
          <Button ghost style={{ marginRight: 8, color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }} onClick={() => console.log('当前 Schema:', JSON.stringify(schema, null, 2))}>
            查看 Schema
          </Button>
          <Button type="primary" onClick={handleSaveSchema}>保存同步</Button>
        </div>
      </Header>

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Sider width={280} theme="light" style={{ borderRight: '1px solid #e8e8e8', boxShadow: '2px 0 8px rgba(0,0,0,0.03)', zIndex: 5 }}>
          <LeftPanel designMode={designMode} />
        </Sider>

        <Content style={{ padding: '24px', overflowY: 'auto' }} className="canvas-container">
          <Canvas
            schema={schema}
            activeFieldId={activeFieldId}
            updateSchema={updateSchema}
            setActiveField={setActiveFieldId}
            designMode={designMode}
          />
        </Content>

        <Sider width={320} theme="light" style={{ borderLeft: '1px solid #e8e8e8', boxShadow: '-2px 0 8px rgba(0,0,0,0.03)', zIndex: 5 }}>
          <RightPanel
            schema={schema}
            activeFieldId={activeFieldId}
            designMode={designMode}
            updateSchema={updateSchema}
            setActiveField={setActiveFieldId}
          />
        </Sider>
      </Layout>

      {/* ──────────── 实时预览模态弹窗 ──────────── */}
      <Modal
        title={`实时预览 — ${schema && schema.header && schema.header.title} [${designMode === 'list' ? '列表页' : '详情页'}]`}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width="95vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, minHeight: '80vh', overflowY: 'auto' }}
        destroyOnClose
      >
        {previewVisible && schema && (
          designMode === 'list'
            ? <ListEngine schema={{ ...schema, pageType: 'list' }} />
            : <DetailEngine schema={{ ...schema, pageType: 'detail' }} />
        )}
      </Modal>
    </Layout>
  );
}

export default Form.create()(SettingsModularEntry);
