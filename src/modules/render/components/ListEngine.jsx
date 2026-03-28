import React, { Component } from 'react';
import { Form, Row, Col, Input, Select, Button, Table, message } from 'antd';

class SearchForm extends Component {
  handleSearch = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSearch(values);
      }
    });
  }

  handleReset = () => {
    this.props.form.resetFields();
    this.props.onSearch({});
  }

  render() {
    const { schema, form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <Form className="list-search-form" onSubmit={this.handleSearch} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Row gutter={24}>
          {schema.searchFields?.map(field => (
            <Col span={8} key={field.field}>
              <Form.Item label={field.label}>
                {getFieldDecorator(field.field)(
                   field.type === 'select' 
                     ? <Select placeholder="请选择" options={field.options} />
                     : <Input placeholder="请输入" />
                )}
              </Form.Item>
            </Col>
          ))}
          <Col span={8} style={{ textAlign: 'right', paddingTop: 4 }}>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleReset}>重置</Button>
          </Col>
        </Row>
      </Form>
    );
  }
}

const WrappedSearchForm = Form.create()(SearchForm);

export default class ListEngine extends Component {
  state = {
    data: [],
    loading: false,
    pagination: { current: 1, pageSize: 10, total: 0 },
    searchParams: {}
  };

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async (params = {}) => {
    const { schema } = this.props;
    if (!schema?.api?.query) {
      // 若没有配置接口，则采用 mock 数据测试
      this.setState({
        data: [{ id: 1, orderNo: 'ORD-001', type: 1, amount: 500 }],
        pagination: { ...this.state.pagination, total: 1 }
      });
      return;
    }

    try {
      this.setState({ loading: true });
      const { pagination, searchParams } = this.state;
      const payload = {
        ...searchParams,
        ...params,
        pageNo: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize
      };
      
      console.log('列表查询请求 payload:', payload);
      // TODO: const res = await request(schema.api.query.url, payload);
      // 模拟返回
      setTimeout(() => {
        this.setState({
           data: [{ id: 1, orderNo: 'ORD-001', type: 1, amount: 500 }],
           pagination: { ...pagination, total: 100, current: payload.pageNo },
           loading: false
        });
      }, 500);
    } catch (e) {
      message.error('获取列表失败');
      this.setState({ loading: false });
    }
  }

  handleSearch = (values) => {
    this.setState({ searchParams: values }, () => {
      this.fetchData({ current: 1 });
    });
  }

  handleTableChange = (pagination) => {
    this.fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }

  render() {
    const { schema } = this.props;
    if (!schema) return null;

    // 假设 schema 中没有配置表格列（原设计文档中也未细化这部分），这里给个泛用占位
    const fallbackColumns = [
       { title: '业务单号', dataIndex: 'orderNo' },
       { title: '类型', dataIndex: 'type', render: (v) => v === 1 ? '内购' : '外采' },
       { title: '金额', dataIndex: 'amount' },
       { title: '操作', render: () => <a>查看</a> }
    ];

    return (
      <div className="list-engine-container" style={{ padding: '24px', background: '#fff' }}>
        <WrappedSearchForm schema={schema} onSearch={this.handleSearch} />
        <div className="list-toolbar" style={{ margin: '16px 0' }}>
            <Button type="primary" icon="plus">新增</Button>
        </div>
        <Table 
          columns={fallbackColumns}
          rowKey="id"
          dataSource={this.state.data}
          pagination={this.state.pagination}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    );
  }
}

