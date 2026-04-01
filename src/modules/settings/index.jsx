import React, { useState, useCallback, useEffect } from "react";
import { Layout, Button, Modal, Form, Input, Table, Divider, Radio, Icon, message } from "antd";
import LeftPanel from "./components/LeftPanel";
import Canvas from "./components/Canvas";
import RightPanel from "./components/RightPanel";
import DetailEngine from "../render/components/DetailEngine";
import ListEngine from "../render/components/ListEngine";
import { JsonEditor as Editor } from "jsoneditor-react";
import "jsoneditor-react/es/editor.min.css";
import ace from "brace";
import "brace/mode/json";
import "brace/theme/github";
import "./style.less";

const API_BASE = "http://localhost:3000/api/v1";

const { Header, Sider, Content } = Layout;

function SettingsModularEntry({ form }) {
  const { getFieldDecorator } = form;

  const [step, setStep] = useState("list"); // 'list' | 'design'
  const [designMode, setDesignMode] = useState("detail"); // 'list' | 'detail'
  const [schema, setSchema] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [schemaModalVisible, setSchemaModalVisible] = useState(false);
  const [tempSchemaStr, setTempSchemaStr] = useState("");
  const [moduleList, setModuleList] = useState([]);
  const [moduleListLoading, setModuleListLoading] = useState(false);

  // 加载模块列表
  const fetchModuleList = useCallback(async () => {
    setModuleListLoading(true);
    try {
      const res = await fetch(`${API_BASE}/page-config/list`);
      const json = await res.json();
      if (json.code === 200) {
        setModuleList(
          json.data.map((item, i) => ({
            id: item.id || i,
            moduleCode: item.moduleCode,
            moduleName: item.title,
            createTime: item.createTime ? new Date(item.createTime).toLocaleDateString("zh-CN") : "-",
          })),
        );
      }
    } catch (e) {
      // 网络异常时降级为空列表
    } finally {
      setModuleListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModuleList();
  }, [fetchModuleList]);

  // 【关键修复】当切换回列表步骤时，自动刷新数据
  useEffect(() => {
    if (step === "list") {
      fetchModuleList();
    }
  }, [step, fetchModuleList]);

  const updateSchema = useCallback((newSchema) => {
    setSchema(newSchema);
  }, []);

  const handleCreateModule = useCallback(() => {
    form.validateFields(async (err, values) => {
      if (!err) {
        const initialSchema = {
          moduleCode: values.moduleCode,
          header: { title: values.moduleName, showStatus: true },
          sections: [],
          listConfig: { searchFields: [], tableColumns: [] },
          api: {},
          buttons: [
            { label: "删除", code: "delete", type: "default" },
            { label: "保存", code: "save", type: "default" },
            { label: "提交", code: "submit", type: "primary" },
          ],
        };

        // 【关键修复】新增时先执行初次保存，防止列表刷新不到
        try {
          await fetch(`${API_BASE}/page-config/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: values.moduleCode, schema: initialSchema }),
          });
        } catch (e) {
          console.error("Initial save failed", e);
        }

        setSchema(initialSchema);
        setStep("design");
        setDesignMode("detail");
        setShowAddModal(false);
        form.resetFields();
        fetchModuleList();
      }
    });
  }, [form, fetchModuleList]);

  const handleEditModule = useCallback(async (record) => {
    // 先尝试从服务端读取已保存的 schema
    let loadedSchema = null;
    try {
      const res = await fetch(`${API_BASE}/page-config/${record.moduleCode}`);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        loadedSchema = json.data;
      }
    } catch (e) {}

    const fallback = {
      moduleCode: record.moduleCode,
      header: { title: record.moduleName, showStatus: true },
      sections: [],
      listConfig: { searchFields: [], tableColumns: [] },
      api: {},
      buttons: [
        { label: "删除", code: "delete", type: "default" },
        { label: "保存", code: "save", type: "default" },
        { label: "提交", code: "submit", type: "primary" },
      ],
    };
    setSchema(loadedSchema || fallback);
    setStep("design");
    setDesignMode("detail");
  }, []);

  const handleSaveSchema = useCallback(async () => {
    if (!schema || !schema.moduleCode) {
      Modal.error({ title: "保存失败", content: "未找到有效的 moduleCode 业务标识。" });
      return;
    }
    const hide = Modal.info({ title: "保存中", content: "正在将当前 Schema 模型同步至后端节点..." });
    try {
      const response = await fetch(`${API_BASE}/page-config/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schema.moduleCode, schema }),
      });
      const resJson = await response.json();
      hide.destroy();
      if (resJson.code === 200) {
        Modal.success({ title: "保存成功", content: "配置协议已成功持久化至 dcm-api 本地服务库！" });
      } else {
        Modal.error({ title: "保存落盘失败", content: resJson.message || "后端服务异常。" });
      }
    } catch (e) {
      hide.destroy();
      Modal.error({ title: "网络异常", content: "无法连接至 dcm-api，请确保 D 盘 Node 后端服务正在运行。" });
    }
  }, [schema]);

  const handleOpenSchemaEditor = () => {
    // 导出时，将扁平配置转化为标准的 list/detail 双驱结构
    const exportSchema = {
      moduleCode: schema.moduleCode,
      header: schema.header,
      list: schema.listConfig || { searchFields: [], tableColumns: [] },
      detail: {
        sections: schema.sections || [],
        buttons: schema.buttons || [],
        api: schema.api || {},
      },
    };
    setTempSchemaStr(exportSchema);
    setSchemaModalVisible(true);
  };

  const handleApplySchema = () => {
    if (!tempSchemaStr || typeof tempSchemaStr !== "object") {
      message.error("未检测到有效的 Schema 配置");
      return;
    }
    // 导入时，将隔离结构还原回内部状态树兼容的扁平形式
    const importedSchema = {
      moduleCode: tempSchemaStr.moduleCode || schema.moduleCode,
      header: tempSchemaStr.header || schema.header,
      listConfig: tempSchemaStr.list || schema.listConfig,
      sections: tempSchemaStr.detail ? tempSchemaStr.detail.sections : schema.sections,
      buttons: tempSchemaStr.detail ? tempSchemaStr.detail.buttons : schema.buttons,
      api: tempSchemaStr.detail ? tempSchemaStr.detail.api : schema.api,
    };
    setSchema(importedSchema);
    setSchemaModalVisible(false);
    message.success("本地 Schema 已更新并应用渲染");
  };

  // ──────────── 列表管理台 ────────────
  if (step === "list") {
    const columns = [
      { title: "序号", dataIndex: "id", width: 80 },
      { title: "模块编码", dataIndex: "moduleCode" },
      { title: "模块名称", dataIndex: "moduleName" },
      { title: "创建人", dataIndex: "creator" },
      { title: "创建时间", dataIndex: "createTime" },
      {
        title: "操作",
        render: (_, record) => (
          <span>
            <Button type="link" style={{ padding: 0 }} onClick={() => handleEditModule(record)}>
              进入设计器
            </Button>
            <Divider type="vertical" />
            <Button type="link" style={{ padding: 0, color: "#f5222d" }}>
              删除
            </Button>
          </span>
        ),
      },
    ];

    return (
      <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <h2 style={{ margin: 0, color: "#1890ff", fontWeight: 600 }}>低代码管理台</h2>
        </Header>
        <Content style={{ padding: "24px" }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <Form layout="inline">
                <Form.Item label="模块名称">
                  <Input placeholder="输入关键字搜索" prefix={<Icon type="search" />} style={{ width: 200 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" ghost>
                    查询
                  </Button>
                </Form.Item>
              </Form>
              <Button type="primary" icon="plus" onClick={() => setShowAddModal(true)}>
                新增模块
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={moduleList}
              rowKey="id"
              loading={moduleListLoading}
              pagination={{ pageSize: 10 }}
            />
          </div>

          <Modal
            title="新增业务模块"
            visible={showAddModal}
            onOk={handleCreateModule}
            onCancel={() => {
              setShowAddModal(false);
              form.resetFields();
            }}
            okText="下一步：进入设计"
          >
            <Form layout="vertical">
              <Form.Item label="模块编码 (唯一标识)">
                {getFieldDecorator("moduleCode", {
                  rules: [{ required: true, message: "请填写模版编码" }],
                })(<Input placeholder="例如: project_basic" />)}
              </Form.Item>
              <Form.Item label="模块名称 (展示名称)">
                {getFieldDecorator("moduleName", {
                  rules: [{ required: true, message: "请填写模版名称" }],
                })(<Input placeholder="例如: 项目基础信息管理" />)}
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    );
  }

  // ──────────── 设计器主界面 ────────────
  if (step === "preview") {
    return (
      <div style={{ height: "100vh", position: "relative", background: "#f5f6fa" }}>
        {designMode === "detail" ? (
          <DetailEngine schema={schema} onBack={() => setStep("design")} />
        ) : (
          <ListEngine schema={schema} onBack={() => setStep("design")} />
        )}
      </div>
    );
  }

  return (
    <Layout className="lowcode-settings-layout" style={{ height: "100vh", display: "flex" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 24px",
          alignItems: "center",
          background: "#001529",
        }}
      >
        <div
          style={{ cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", fontSize: 15, fontWeight: 500 }}
          onClick={() => setStep("list")}
        >
          <Icon type="left" style={{ marginRight: 8, fontSize: 14 }} />
          Estate LowCode &nbsp;<span style={{ color: "#69c0ff" }}>[{schema && schema.moduleCode}]</span>
        </div>
        <div className="actions" style={{ display: "flex", alignItems: "center" }}>
          <Radio.Group
            value={designMode}
            onChange={(e) => {
              setDesignMode(e.target.value);
              setActiveFieldId(null);
            }}
            buttonStyle="solid"
            style={{ marginRight: 24 }}
          >
            <Radio.Button value="list">
              <Icon type="table" /> 列表页配置
            </Radio.Button>
            <Radio.Button value="detail">
              <Icon type="profile" /> 详情页配置
            </Radio.Button>
          </Radio.Group>

          <Button
            icon="fullscreen"
            style={{ marginRight: 8, background: "#722ed1", borderColor: "#722ed1", color: "#fff" }}
            onClick={() => setStep("preview")}
          >
            全屏预览
          </Button>
          <Button
            icon="eye"
            style={{ marginRight: 8, background: "#13c2c2", borderColor: "#13c2c2", color: "#fff" }}
            onClick={() => setPreviewVisible(true)}
          >
            弹窗预览
          </Button>
          <Button
            ghost
            style={{ marginRight: 8, color: "#fff", borderColor: "rgba(255,255,255,0.35)" }}
            onClick={handleOpenSchemaEditor}
          >
            查看 Schema
          </Button>
          <Button type="primary" onClick={handleSaveSchema}>
            保存同步
          </Button>
        </div>
      </Header>

      <Layout style={{ flex: 1, overflow: "hidden" }}>
        <Sider
          width={280}
          theme="light"
          style={{
            borderRight: "1px solid #e8e8e8",
            boxShadow: "2px 0 8px rgba(0,0,0,0.03)",
            zIndex: 5,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <LeftPanel designMode={designMode} />
        </Sider>

        <Content style={{ padding: "24px", overflowY: "auto" }} className="canvas-container">
          <Canvas
            schema={schema}
            activeFieldId={activeFieldId}
            updateSchema={updateSchema}
            setActiveField={setActiveFieldId}
            designMode={designMode}
          />
        </Content>

        <Sider
          width={320}
          theme="light"
          style={{ borderLeft: "1px solid #e8e8e8", boxShadow: "-2px 0 8px rgba(0,0,0,0.03)", zIndex: 5 }}
        >
          <RightPanel
            schema={schema}
            activeFieldId={activeFieldId}
            designMode={designMode}
            updateSchema={updateSchema}
            setActiveField={setActiveFieldId}
          />
        </Sider>
      </Layout>

      {/* ──────────── 实时预览模态弹窗（列表→详情流） ──────────── */}
      <Modal
        title={`实时预览 — ${schema && schema.header && schema.header.title}`}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width="95vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, minHeight: "80vh", overflowY: "auto" }}
        destroyOnClose
      >
        {previewVisible && schema && <PreviewContainer schema={schema} />}
      </Modal>

      {/* ──────────── Schema 编辑器弹窗 ──────────── */}
      <Modal
        title="Schema 协议编辑器"
        visible={schemaModalVisible}
        onCancel={() => setSchemaModalVisible(false)}
        onOk={handleApplySchema}
        okText="应用修改"
        cancelText="取消"
        width={800}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{ padding: "12px 16px", background: "#f6f8fa", fontSize: 13, color: "#666", borderBottom: "1px solid #e8e8e8" }}
        >
          可以直接在下方修改 JSON 节点，校验通过后点击“应用修改”。
        </div>
        <div style={{ border: "none", minHeight: "550px" }}>
          <Editor
            value={schema}
            onChange={(newData) => {
              setTempSchemaStr(newData);
            }}
            mode="tree"
            allowedModes={["tree", "code", "text"]}
            ace={ace}
            theme="ace/theme/github"
            navigationBar={true}
            search={true}
            history={true}
          />
        </div>
      </Modal>
    </Layout>
  );
}

/** 预览容器：内部管理列表→详情跳转状态 */
function PreviewContainer({ schema }) {
  const [previewStep, setPreviewStep] = useState("list"); // 'list' | 'detail'
  const [activeRecordId, setActiveRecordId] = useState(null);

  const handleEnterDetail = (recordId) => {
    setActiveRecordId(recordId); // null = 新建
    setPreviewStep("detail");
  };

  const handleBack = () => {
    setPreviewStep("list");
    setActiveRecordId(null);
  };

  if (previewStep === "detail") {
    return <DetailEngine schema={schema} recordId={activeRecordId} onBack={handleBack} />;
  }

  return <ListEngine schema={schema} onEnterDetail={handleEnterDetail} />;
}

export default Form.create()(SettingsModularEntry);
