import React, { useState, useEffect, useCallback, useRef } from "react";
import { Form, Row, Col, Input, Select, Button, Table, DatePicker, message, Tag, Divider } from "antd";

const API_BASE = "http://localhost:3000/api/v1";

const { RangePicker } = DatePicker;

/** 根据字段类型渲染对应的搜索控件 */
function renderSearchWidget(field) {
  switch (field.type) {
    case "select":
      return (
        <Select placeholder="请选择" style={{ width: "100%" }} allowClear>
          {field.options?.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      );
    case "date":
      return <DatePicker style={{ width: "100%" }} />;
    case "rangepicker":
      return <RangePicker style={{ width: "100%" }} />;
    default:
      return <Input placeholder="请输入" allowClear />;
  }
}

/** 搜索表单 */
function SearchFormInner({ schema, form, onSearch }) {
  const { getFieldDecorator } = form;
  const searchFields = schema?.listConfig?.searchFields || [];

  const handleSearch = (e) => {
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) {
        // 过滤掉空值
        const params = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== "" && v !== null));
        onSearch(params);
      }
    });
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  if (!searchFields.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        padding: "16px 24px 0",
        marginBottom: 16,
        borderRadius: 4,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <Form onSubmit={handleSearch} layout="vertical">
        <Row gutter={16}>
          {searchFields.map((field) => (
            <Col span={8} key={field.field}>
              <Form.Item label={field.label} style={{ marginBottom: 16 }}>
                {getFieldDecorator(field.field)(renderSearchWidget(field))}
              </Form.Item>
            </Col>
          ))}
          <Col span={24} style={{ textAlign: "right", paddingBottom: 16 }}>
            <Button type="primary" htmlType="submit" icon="search">
              查询
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleReset} icon="reload">
              重置
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
const WrappedSearchForm = Form.create()(SearchFormInner);

/** 可伸缩表头单元格组件 */
const ResizableHeader = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = width;

    const onMouseMove = (moveEvent) => {
      const currentWidth = startWidth + (moveEvent.pageX - startX);
      onResize(currentWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <th {...restProps} style={{ ...restProps.style, position: "relative" }}>
      {restProps.children}
      <div
        className="resizable-handle"
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 5,
          height: "100%",
          cursor: "col-resize",
          zIndex: 1,
        }}
      />
    </th>
  );
};

/** 列表引擎主体 */
export default function ListEngine({ schema, onEnterDetail }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: schema?.listConfig?.pageSize || 10,
    total: 0,
  });
  // 维护列宽状态
  const [columnWidths, setColumnWidths] = useState({});
  const searchParamsRef = useRef({});

  const moduleCode = schema?.moduleCode;

  const fetchData = useCallback(
    async (params = {}) => {
      if (!moduleCode) return;
      setLoading(true);
      try {
        const payload = {
          ...searchParamsRef.current,
          current: params.current || pagination.current,
          pageSize: params.pageSize || pagination.pageSize,
          ...params,
        };
        const res = await fetch(`${API_BASE}/records/${moduleCode}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.code === 200) {
          setData(json.data.list || []);
          setPagination((prev) => ({
            ...prev,
            total: json.data.total,
            current: json.data.current,
          }));
        } else {
          message.error(json.message || "查询失败");
        }
      } catch (e) {
        message.error("网络异常，无法连接至 API 服务");
      } finally {
        setLoading(false);
      }
    },
    [moduleCode],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData({ current: 1 });
  }, [moduleCode]);

  const handleSearch = useCallback(
    (values) => {
      searchParamsRef.current = values;
      fetchData({ current: 1 });
    },
    [fetchData],
  );

  const handleTableChange = useCallback(
    (pag) => {
      fetchData({ current: pag.current, pageSize: pag.pageSize });
    },
    [fetchData],
  );

  const handleDelete = useCallback(
    async (record) => {
      try {
        await fetch(`${API_BASE}/records/${moduleCode}/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: record.id }),
        });
        message.success("删除成功");
        fetchData({ current: pagination.current });
      } catch (e) {
        message.error("删除失败");
      }
    },
    [moduleCode, fetchData],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResize = (index) => (width) => {
    setColumnWidths((prev) => ({
      ...prev,
      [index]: width > 50 ? width : 50, // 最小宽度限制
    }));
  };

  if (!schema) return null;

  const listConfig = schema.listConfig || {};

  // 优先用 tableColumns 配置生成列
  const rawColumns =
    listConfig.tableColumns?.map((col, index) => ({
      title: col.label,
      dataIndex: col.field,
      key: col.field,
      width: columnWidths[index] || col.width || 150,
      align: col.align || "left",
      ellipsis: col.ellipsis !== false,
      onHeaderCell: (column) => ({
        width: column.width,
        onResize: handleResize(index),
      }),
    })) || [];

  const statusColumn = {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: columnWidths["status"] || 100,
    align: "center",
    onHeaderCell: (column) => ({
      width: column.width,
      onResize: handleResize("status"),
    }),
    render: (v) => {
      const map = { draft: ["processing", "草稿"], submitted: ["success", "已提交"] };
      const [color, text] = map[v] || ["default", v || "-"];
      return <Tag color={color}>{text}</Tag>;
    },
  };

  const actionColumn = {
    title: "操作",
    key: "action",
    width: columnWidths["action"] || 160,
    align: "center",
    onHeaderCell: (column) => ({
      width: column.width,
      onResize: handleResize("action"),
    }),
    render: (_, record) => (
      <span>
        <Button type="link" style={{ padding: 0 }} onClick={() => onEnterDetail && onEnterDetail(record.id)}>
          查看详情
        </Button>
        <Divider type="vertical" />
        <Button type="link" style={{ padding: 0, color: "#f5222d" }} onClick={() => handleDelete(record)}>
          删除
        </Button>
      </span>
    ),
  };

  const columns =
    rawColumns.length > 0
      ? [...rawColumns, statusColumn, actionColumn]
      : [
          {
            title: "创建时间",
            dataIndex: "createTime",
            key: "createTime",
            render: (v) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
          },
          {
            title: "更新时间",
            dataIndex: "updateTime",
            key: "updateTime",
            render: (v) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
          },
          statusColumn,
          actionColumn,
        ];

  const paginationEnabled = listConfig.pagination !== false;

  return (
    <div className="list-engine-container" style={{ padding: "16px 24px", background: "#f5f6fa", minHeight: "100%" }}>
      <style>{`
        .ant-table-thead > tr > th {
          position: relative !important;
        }
        .resizable-handle:hover {
          background: #1890ff;
          width: 2px !important;
        }
      `}</style>
      <WrappedSearchForm schema={schema} onSearch={handleSearch} />

      <div style={{ background: "#fff", borderRadius: 4, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", padding: "16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>数据列表</span>
          <Button type="primary" icon="plus" onClick={() => onEnterDetail && onEnterDetail(null)}>
            新增
          </Button>
        </div>
        <Table
          columns={columns}
          rowKey="id"
          dataSource={data}
          pagination={paginationEnabled ? { ...pagination, showTotal: (t) => `共 ${t} 条` } : false}
          loading={loading}
          onChange={handleTableChange}
          size={listConfig.size || "middle"}
          bordered={listConfig.bordered}
          className={listConfig.zebra ? "ant-table-striped" : ""}
          style={{ width: "100%" }}
          components={{
            header: {
              cell: ResizableHeader,
            },
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
}
