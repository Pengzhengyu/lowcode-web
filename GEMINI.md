# GEMINI.md：前端低代码平台 (estate-lowcode-web) 规则指南

> [!IMPORTANT]
> 这是当前新前端仓库的最高指导守则。进入此仓库的所有 AI 必须首先载入该文件，认知自身的架构职责和环境约束。

## 1. 核心架构约束

本项目分为两个严格隔离但协同运作的业务模块：

1. **设置模块 (Settings Modular)**：`src/modules/settings/`
   负责前端页面搭建的可视化操作。内含组件物料池、中心画布区域以及右侧的属性编辑与联动配置栏。该模块的最终产出是一份符合标准契约的 JSON 配置文件。
   
2. **渲染模块 (Render Modular)**：`src/modules/render/`
   低代码平台运行时的“心脏”。负责消化和解析 `Settings Modular` 传入的 JSON Schema，并动态生成 React DOM 树进行渲染。在使用时，要在外层包裹必要的内置组件模块。

## 2. Webpack Externals 与模块联邦 (CDN 加载机制)

> **核心预警**：渲染模块 (Render Modular) 在未来打包时，将依赖宿主大系统的全局 CDN（External）环境注入全局依赖库。

在配置或编写代码时，请严格遵循以下 External 映射：
- `biz-module` -> 对应全局变量 `coral_biz_module`
- `antd` -> 对应全局变量 `coralComponents`
- `react` -> 对应全局变量 `React`
- `react-dom` -> 对应全局变量 `ReactDOM`
- `moment` -> 对应全局变量 `moment`

这样你可以使用如 `import { UserProvider } from 'biz-module'` 的标准写法，运行时交由宿主系统加载。

## 3. 内置壳层嵌套参考规范

此处引用源大系统中必须的包裹器：

```javascript
import React from 'react'
import ModuleAdapter from '../../../loader/ModuleAdapter'
import { UserProvider, AuthProvider, ApproveProvider } from 'biz-module'

// 解析器核心组件
import DynamicJSONRenderer from './components/DynamicJSONRenderer'

// 基于公司基建的高度还原渲染环境包裹器
export default function RenderModularEntry({ context, params, schema, finalModuleCode, deptId }) {
  const { user } = context;
  const { tenantId } = params;
  
  return (
    <ModuleAdapter>
      <UserProvider user={user} tenantId={tenantId}>
        <UserProvider.Consumer>
          {({ user: tenantUser }) => (
            <AuthProvider moduleCode={finalModuleCode} deptId={deptId}>
              <AuthProvider.Consumer>
                {({ hasRight, isLoading }) => {
                  if (isLoading) return null;
                  return (
                    <ApproveProvider mgtGroupId={deptId} formId={`flow/${finalModuleCode}`} user={tenantUser}>
                       <DynamicJSONRenderer schema={schema} context={context} auth={{ hasRight }} />
                    </ApproveProvider>
                  );
                }}
              </AuthProvider.Consumer>
            </AuthProvider>
          )}
        </UserProvider.Consumer>
      </UserProvider>
    </ModuleAdapter>
  )
}
```

## 4. 严格技术栈警戒线

- **基础视图层**：`React 16.14.x`。组件一律采用**函数式组件 (Functional Components) + Hooks**。
- **核心组件库**：我们处在重度遗留项目的平行重构之中，**务必只使用 Ant Design 3.x** （不是 4.x，更不是 5.x）!
   - 联动表述和收集的根本逻辑必须依循 Antd 3.x 提供的方式：`Form.create()(YourForm)`
   - 字段绑定语法全部依赖传进来的 `getFieldDecorator(Id, Options)(<Component />)` 方式实现。绝对不要混用 `<Form.Item name="...">`。
- **模块 CSS**：基于 `Less` 开发。

## 5. 如何开始？
读取 `readme.md` 了解核心数据契约，或直接调用 `.agents/skills` 中的智能构建指南开启开发！
