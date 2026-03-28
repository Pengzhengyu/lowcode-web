import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Row, Col, Input, Select, Button, Table, DatePicker, message } from 'antd';

const { RangePicker } = DatePicker;

/** 根据 schema 中配置的搜索字段类型，渲染对应的输入控件 */
function renderSearchWidget(field) {
  switch (field.type) {
    case 'select':
      return <Select placeholder="请选择" style={{ width: '100%' }}>
        {field.options?.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
      </Select>;
    case 'date':
      return <DatePicker style={{ width: '100%' }} />;
    case 'rangepicker':
      return <RangePicker style={{ width: '100%' }} />;
    default:
      return <Input placeholder="请输入" />;
  }
}

/** 内联搜索表单 */
function SearchFormComponent({ schema, form, onSearch }) {
  const { getFieldDecorator } = form;

  const handleSearch = (e) => {
    e.preventDefault();
    form.validateFields((err, values) => {
      if (!err) onSearch(values);
    });
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  return (
    <Form className="list-search-form" onSubmit={handleSearch} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      <Row gutter={16}>
        {(schema.listConfig?.searchFields || []).map(field => (
          <Col span={8} key={field.field}>
            <Form.Item label={field.label}>
              {getFieldDecorator(field.field)(renderSearchWidget(field))}
            </Form.Item>
          </Col>
        ))}
        <Col span={8} style={{ textAlign: 'right', paddingTop: 4 }}>
          <Button type="primary" htmlType="submit">查询</Button>
          <Button style={{ marginLeft: 8 }} onClick={handleReset}>重置</Button>
        </Col>
      </Row>
    </Form>
  );
}

const WrappedSearchForm = Form.create()(SearchFormComponent);

/** 列表引擎主体 */
export default function ListEngine({ schema }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: schema?.listConfig?.pageSize || 10, total: 0 });
  const searchParamsRef = useRef({});

  const fetchData = useCallback(async (params = {}) => {
    if (!schema?.api?.query) {
      // 无接口时展示 mock 数据
      setData([{ id: 1, orderNo: 'ORD-001', type: 1, amount: 500 }]);
      setPagination(prev => ({ ...prev, total: 1 }));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...searchParamsRef.current,
        ...params,
        pageNo: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize,
      };
      console.log('列表查询请求 payload:', payload);
      // TODO: const res = await request(schema.api.query.url, payload);
      setTimeout(() => {
        setData([{ id: 1, orderNo: 'ORD-001', type: 1, amount: 500 }]);
        setPagination(prev => ({ ...prev, total: 100, current: payload.pageNo }));
        setLoading(false);
      }, 500);
    } catch (e) {
      message.error('获取列表失败');
      setLoading(false);
    }
  }, [schema, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((values) => {
    searchParamsRef.current = values;
    fetchData({ current: 1 });
  }, [fetchData]);

  const handleTableChange = useCallback((pag) => {
    fetchData({ current: pag.current, pageSize: pag.pageSize });
  }, [fetchData]);

  if (!schema) return null;

  // 优先从 schema.listConfig.tableColumns 读取列配置，否则 fallback
  const schemaColumns = schema.listConfig?.tableColumns?.map(col => ({
    title: col.label,
    dataIndex: col.field,
    key: col.field,
    width: col.columnWidth,
  }));

  const fallbackColumns = [
    { title: '业务单号', dataIndex: 'orderNo' },
    { title: '类型', dataIndex: 'type', render: v => v === 1 ? '内购' : '外采' },
    { title: '金额', dataIndex: 'amount' },
    { title: '操作', render: () => <a>查看</a> },
  ];

  const columns = (schemaColumns && schemaColumns.length > 0) ? schemaColumns : fallbackColumns;
  const paginationEnabled = schema.listConfig?.pagination !== false;

  return (
    <div className="list-engine-container" style={{ padding: '24px', background: '#fff' }}>
      <WrappedSearchForm schema={schema} onSearch={handleSearch} />
      <div className="list-toolbar" style={{ margin: '16px 0' }}>
        <Button type="primary" icon="plus">新增</Button>
      </div>
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data}
        pagination={paginationEnabled ? pagination : false}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
}
