// 该文件目前包含渲染模块引擎开发的基准 Mock 数据，用于验证后续引擎的解析能力

export const mockDetailSchema = {
  pageType: 'detail',
  header: {
    title: '物料采购申请单',
    showStatus: true,
  },
  api: {
    init: { url: '/api/v1/order/get/:id', method: 'GET' },
    save: { url: '/api/v1/order/save', method: 'POST' },
    submit: { url: '/api/v1/order/submit', method: 'POST' }
  },
  sections: [
    {
      id: 'base_info',
      title: '基础信息',
      fields: [
        { 
          label: '单据类型', 
          field: 'type', 
          type: 'select', 
          options: [
            { label: '内购', value: 1 }, 
            { label: '外采', value: 2 }
          ] 
        },
        { 
          label: '采购金额(元)', 
          field: 'amount', 
          type: 'number' 
        },
        { 
          label: '备注原因', 
          field: 'reason', 
          type: 'input',
          // 联动：当采购金额大于 1000 时，备注原因为必填
          requiredExp: 'formData.amount > 1000'
        },
        { 
          label: '外采供应商', 
          field: 'supplier', 
          type: 'input',
          // 联动：当类型为外采(2)时显示
          visibleExp: 'formData.type === 2'
        }
      ]
    }
  ],
  buttons: [
    { label: '暂存', code: 'save', type: 'default' },
    { label: '提交', code: 'submit', type: 'primary', validate: true }
  ]
};

export const mockListSchema = {
  pageType: 'list',
  api: {
    query: { url: '/api/v1/order/list', method: 'POST' }
  },
  searchFields: [
    { label: '订单号', field: 'orderNo', type: 'input' },
    { label: '单据类型', field: 'type', type: 'select', options: [{ label: '内购', value: 1 }] }
  ]
};
