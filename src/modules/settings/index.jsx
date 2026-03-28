import React, { Component } from 'react';
import { Layout, Button, Modal, Form, Input, Table, Divider, Tabs, Radio, Icon } from 'antd';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import './style.less';

const { Header, Sider, Content } = Layout;

class SettingsModularEntry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 'list', // 'list' | 'design'
      designMode: 'detail', // 'list' | 'detail' (画板双向视图)
      schema: null,
      activeFieldId: null,
      showAddModal: false,
      moduleList: [
        { id: 1, moduleCode: 'demo_contract', moduleName: '合同签约页面', creator: '系统管理员', createTime: '2026-03-23' },
        { id: 2, moduleCode: 'demo_settlement', moduleName: '结算单管理', creator: '测试人员', createTime: '2026-03-17' },
      ],
    };
  }

  handleOpenAdd = () => {
    this.setState({ showAddModal: true });
  }

  handleCloseAdd = () => {
    this.setState({ showAddModal: false });
    this.props.form.resetFields();
  }

  handleCreateModule = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        // 构建初始 Schema 骨架
        const initialSchema = {
          moduleCode: values.moduleCode,
          header: { title: values.moduleName, showStatus: true },
          sections: [], // 详情页配置
          listConfig: { searchFields: [], tableColumns: [] }, // 列表页配置
          api: {},
        };
        
        this.setState({
          schema: initialSchema,
          step: 'design',
          showAddModal: false,
          designMode: 'detail',
        });
      }
    });
  }

  handleEditModule = (record) => {
    const initialSchema = {
      moduleCode: record.moduleCode,
      header: { title: record.moduleName, showStatus: true },
      sections: [], 
      listConfig: { searchFields: [], tableColumns: [] },
      api: {},
    };
    this.setState({
      schema: initialSchema,
      step: 'design',
      designMode: 'detail',
    });
  }

  updateSchema = (newSchema) => {
    this.setState({ schema: newSchema });
  }

  setActiveField = (id) => {
    this.setState({ activeFieldId: id });
  }

  handleSaveSchema = async () => {
    const { schema } = this.state;
    if (!schema || !schema.moduleCode) {
      Modal.error({ title: '保存失败', content: '未找到有效的 moduleCode 业务标识。' });
      return;
    }
    
    // 给一些视觉反馈提示
    const hide = Modal.info({ title: '保存中', content: '正在将当前 Schema 模型同步至后端节点...' });

    try {
      const response = await fetch('http://localhost:3000/api/v1/page-config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schema.moduleCode, schema: schema })
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
  }

  renderModuleList() {
    const { getFieldDecorator } = this.props.form;
    const { moduleList, showAddModal } = this.state;

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
            <a onClick={() => this.handleEditModule(record)}>进入设计器</a>
            <Divider type="vertical" />
            <a style={{ color: '#f5222d' }}>删除</a>
          </span>
        ) 
      }
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
              <Button type="primary" icon="plus" onClick={this.handleOpenAdd}>新增模块</Button>
            </div>
            
            <Table 
               columns={columns} 
               dataSource={moduleList} 
               rowKey="id" 
               pagination={{ pageSize: 10 }} 
            />
          </div>

          <Modal
            title="新增业务模块"
            visible={showAddModal}
            onOk={this.handleCreateModule}
            onCancel={this.handleCloseAdd}
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

  render() {
    const { step, schema, activeFieldId, designMode } = this.state;

    if (step === 'list') {
      return this.renderModuleList();
    }

    return (
      <Layout className="lowcode-settings-layout" style={{ height: '100vh', display: 'flex' }}>
        <Header style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px', alignItems: 'center' }}>
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => this.setState({ step: 'list' })}>
             <Icon type="left" style={{ marginRight: 8, fontSize: 14 }} />
             Estate LowCode [{schema.moduleCode}]
          </div>
          <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
            <Radio.Group value={designMode} onChange={e => this.setState({ designMode: e.target.value })} buttonStyle="solid" style={{ marginRight: 24 }}>
              <Radio.Button value="list"><Icon type="table" /> 列表页配置</Radio.Button>
              <Radio.Button value="detail"><Icon type="profile" /> 详情页配置</Radio.Button>
            </Radio.Group>

            <Button type="primary" ghost style={{ marginRight: 8 }} onClick={() => console.log('当前 Schema:', JSON.stringify(schema, null, 2))}>
              查看 Schema
            </Button>
            <Button type="primary" onClick={this.handleSaveSchema}>保存同步</Button>
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
              updateSchema={this.updateSchema} 
              setActiveField={this.setActiveField} 
              designMode={designMode}
            />
          </Content>

          <Sider width={320} theme="light" style={{ borderLeft: '1px solid #e8e8e8', boxShadow: '-2px 0 8px rgba(0,0,0,0.03)', zIndex: 5 }}>
            <RightPanel 
              schema={schema} 
              activeFieldId={activeFieldId} 
              designMode={designMode}
              updateSchema={this.updateSchema} 
              setActiveField={this.setActiveField}
            />
          </Sider>
        </Layout>
      </Layout>
    );
  }
}

export default Form.create()(SettingsModularEntry);
