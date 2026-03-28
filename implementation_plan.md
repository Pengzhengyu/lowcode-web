# 前端低代码体系实施计划

基于提供的 [LowCode_System_Design.md](file:///d:/Glodon/estate-lowcode-web/LowCode_System_Design.md)、[readme.md](file:///d:/Glodon/estate-lowcode-web/readme.md) 与 [SKILL.md](file:///d:/Glodon/estate-lowcode-web/.agents/skills/build_lowcode/SKILL.md) 的规范，制定以下开发实施计划。

## User Review Required

> [!IMPORTANT]
> 此项目分为相对独立的两大核心模块：**设置模块 (Settings Modular)** 和 **渲染模块 (Render Modular)**。
> 为保证我们工作顺利推进，我们需要确定第一步的切入点：
> 
> **方案 A (推荐)**：先从 **渲染模块** 起步。我们先利用写死的典型 JSON Schema，把 `DynamicJSONRenderer` 核心表单挂载、Antd 3 双向绑定、以及安全沙箱联动（`visibleExp`等）跑通。这能作为整个业务的心脏保障。
> **方案 B**：先从 **设置模块** 起步。优先搭建可视化布局和拖拉拽画布，形成 UI 感受后再对接渲染引擎。
> 
> 请问我们需要先从哪个模块开始？

## Proposed Changes

整个项目的改造将围绕 `src/modules/` 目录进行独立剥离：

### 基础状态与类型定义
由于低代码非常依赖 JSON 结构的严谨性，我们需要优先定义全局数据结构及其默认值。
#### [NEW] `src/schema/types.js` (或 TS 结构，若后续引入)
- 定义节点的数据接口类型。
#### [NEW] `src/store/schemaStore.js`
- 设置模块使用的简单状态容器或 context 存储。

---

### 渲染模块 (Render Modular)
该模块是核心解析引擎，区分**列表页 (List Mode)** 与 **详情页 (Detail Mode)** 进行多态渲染。须依据 Antd 3.x 规范，由 `Form.create` 去包裹字段。针对大型详情页，采用**“分段表单” (Segmented Form)**策略避免全页重绘。

#### [NEW] `src/modules/render/index.jsx`
- 低代码平台渲染入口，负责套用外层包裹器 (如 `biz-module` 的 `UserProvider`, `AuthProvider` 等) 并分发 `pageType` 渲染 `ListEngine` 或 `DetailEngine`。
#### [NEW] `src/modules/render/components/ListEngine.jsx`
- 列表模式渲染引擎，集成“搜索表单” + “工具栏” + “数据表格”，处理 `api.query` 与分页关联查询。
#### [NEW] `src/modules/render/components/DetailEngine.jsx`
- 详情模式渲染引擎，包含“粘性头部”、“锚点导航”及“分段表单 (Sections)”。
- 负责接口生命周期闭环：`init`（回显）、`save`（暂存，无校验）、`submit`（提交校验）。
#### [NEW] `src/modules/render/components/SectionForm.jsx`
- 分段表单组件，单个区间由 `Form.create()` 隔离包裹。利用局部刷新提升性能，统一监听内部 `onValuesChange`。
#### [NEW] `src/modules/render/utils/sandbox.js`
- 基于 `new Function` 封装的安全沙箱，执行 `visibleExp`, `disabledExp`, `requiredExp`, `valueExp`，传入 `formData` 求值。

---

### 设置器模块 (Settings Modular)
该模块服务于页面可视化的搭建物料。

#### [NEW] `src/modules/settings/index.jsx`
- 主工作台视图组件，使用左右三栏布局（可以利用 antd 的 `Layout` 组件）。
#### [NEW] `src/modules/settings/components/LeftPanel.jsx`
- 组件物料池（输入框、下拉框、表单组等）。
#### [NEW] `src/modules/settings/components/Canvas.jsx`
- 画布视图，响应拖拉拽操作，维护选中态记录，并将操作映射至 JSON Schema 修改。
#### [NEW] `src/modules/settings/components/RightPanel.jsx`
- 提供对画布中选中节点的基础属性、校验属性及联动逻辑（字符串输入框）的配置。

## Verification Plan

### 局部验证阶段一（解析器与联动测试）
1. 准备一份符合配置约定的 `mockSchema.json`。
2. 注入 `DynamicJSONRenderer`，并在输入框中修改具有 `visibleExp` 联动的依赖项。
3. 观察目标字段是否按照公式实现动态隐藏。

### 局部验证阶段二（拖拽与保存测试）
1. 打开设置器面板，从左侧组件仓将各种基础表单拖入。
2. 修改右侧属性。
3. 导出生成的 JSON，将其传入已经写好的渲染器层，看是否可以100%还原预期。
