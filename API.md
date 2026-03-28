# estate-dcm-api 接口文档

> **Base URL**：`http://localhost:3000`  
> **协议版本**：v1  
> **统一响应格式**：`{ code: 200, message: "success", data: ... }`

---

## 一、页面配置接口（Page Config）

### 1.1 保存页面配置

- **URL**：`POST /api/v1/page-config/save`
- **描述**：保存或覆盖更新一个低代码页面的 JSON Schema 配置。

**Request Body**（JSON）

| 参数名   | 类型   | 必填 | 说明                          |
|--------|--------|------|-----------------------------|
| id     | string | ✅   | 页面唯一标识，如 `list_01`      |
| schema | object | ✅   | 完整的低代码页面 JSON Schema 对象 |

**请求示例**
```json
{
  "id": "purchase_detail",
  "schema": {
    "pageType": "detail",
    "header": { "title": "采购单详情" },
    "sections": []
  }
}
```

**成功响应**
```json
{ "code": 200, "message": "Schema saved successfully", "data": { "id": "purchase_detail" } }
```

---

### 1.2 获取所有页面配置列表

- **URL**：`GET /api/v1/page-config/list`
- **描述**：获取所有已保存的页面 ID 列表（不返回完整 schema，用于页面目录展示）。

**成功响应**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": "purchase_detail", "updated_at": "2026-03-28T13:00:00.000Z" },
    { "id": "order_list", "updated_at": "2026-03-28T12:00:00.000Z" }
  ]
}
```

---

### 1.3 获取单个页面配置

- **URL**：`GET /api/v1/page-config/:id`
- **描述**：根据页面 ID 获取完整的 JSON Schema 配置。

**Path 参数**

| 参数名 | 类型   | 说明       |
|------|--------|----------|
| id   | string | 页面唯一标识 |

**成功响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "pageType": "detail",
    "header": { "title": "采购单详情" },
    "sections": []
  }
}
```

**404 响应**
```json
{ "code": 404, "message": "Schema not found", "data": null }
```

---

## 二、通用业务数据接口（Form Records）

> `:model` 为动态模型名，对应低代码表单绑定的实体，如 `orders`、`contracts`、`users`。

### 2.1 分页查询列表

- **URL**：`POST /api/v1/records/:model/query`
- **描述**：分页查询某个模型下的业务数据，支持业务字段过滤。

**Path 参数**

| 参数名  | 类型   | 说明           |
|-------|--------|--------------|
| model | string | 模型名，如 orders |

**Request Body**（JSON）

| 参数名      | 类型   | 必填 | 说明                    |
|-----------|--------|------|------------------------|
| current   | number | ❌   | 当前页码，默认 1           |
| pageSize  | number | ❌   | 每页条数，默认 10          |
| ...其他字段 | any    | ❌   | 业务字段，进行模糊过滤匹配     |

**请求示例**
```json
{ "current": 1, "pageSize": 10, "title": "采购" }
```

**成功响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "uuid-xxx",
        "title": "采购单001",
        "amount": 1000,
        "status": "submitted",
        "createTime": "2026-03-28T13:00:00.000Z",
        "updateTime": "2026-03-28T13:00:00.000Z"
      }
    ],
    "total": 1,
    "current": 1,
    "pageSize": 10
  }
}
```

---

### 2.2 获取详情

- **URL**：`GET /api/v1/records/:model/:id`
- **描述**：根据记录 ID 获取单条业务数据详情。

**Path 参数**

| 参数名  | 类型   | 说明        |
|-------|--------|------------|
| model | string | 模型名       |
| id    | string | 记录 UUID   |

**成功响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid-xxx",
    "title": "采购单001",
    "amount": 1000,
    "status": "draft",
    "createTime": "2026-03-28T13:00:00.000Z",
    "updateTime": "2026-03-28T13:00:00.000Z"
  }
}
```

---

### 2.3 暂存（草稿保存）

- **URL**：`POST /api/v1/records/:model/save`
- **描述**：保存或更新业务数据，不强制校验，记录状态标记为 `draft`。有 `id` 则更新，无则新增。

**Path 参数**

| 参数名  | 类型   | 说明  |
|-------|--------|-----|
| model | string | 模型名 |

**Request Body**（JSON）

| 参数名  | 类型   | 必填 | 说明                     |
|------|--------|------|------------------------|
| id   | string | ❌   | 记录 ID；有则更新，无则自动生成 |
| ...  | any    | ❌   | 任意业务字段               |

**请求示例**
```json
{ "title": "采购单001", "amount": 1000 }
```

**成功响应**
```json
{
  "code": 200,
  "message": "Record saved successfully",
  "data": { "id": "uuid-xxx", "title": "采购单001", "status": "draft", ... }
}
```

---

### 2.4 正式提交

- **URL**：`POST /api/v1/records/:model/submit`
- **描述**：保存或更新业务数据，记录状态标记为 `submitted`（已提交）。

参数与返回结构同 **2.3 暂存**，区别在于 `status` 固定为 `"submitted"`。

---

### 2.5 删除记录

- **URL**：`DELETE /api/v1/records/:model/delete`
- **描述**：按 ID 删除一条业务数据记录。

**Path 参数**

| 参数名  | 类型   | 说明  |
|-------|--------|-----|
| model | string | 模型名 |

**Request Body 或 Query 参数**

| 参数名 | 类型   | 必填 | 说明      |
|------|--------|------|---------|
| id   | string | ✅   | 记录 UUID |

**成功响应**
```json
{ "code": 200, "message": "Record deleted successfully", "data": null }
```

**404 响应**
```json
{ "code": 404, "message": "Record not found or already deleted", "data": null }
```

---

## 三、健康检查

- **URL**：`GET /health`
- **描述**：检查 API 服务是否在线。

**响应**
```json
{ "status": "UP", "message": "API server is running." }
```

---

## 四、数据 status 字段说明

| 值          | 说明           |
|------------|--------------|
| `draft`    | 草稿（暂存状态）     |
| `submitted`| 已正式提交        |

---

## 五、错误码规范

| code | 说明               |
|------|--------------------|
| 200  | 成功               |
| 400  | 参数缺失或格式错误   |
| 404  | 资源不存在          |
| 500  | 服务端内部错误       |
