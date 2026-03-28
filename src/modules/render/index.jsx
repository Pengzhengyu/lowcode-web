import React from 'react';
// 根据之前知识项和指南，我们需要包裹业务组件环境
import ModuleAdapter from '../../../loader/ModuleAdapter'; // 假设此处能解析，实际项目中应当有此文件或替换方案
import { UserProvider, AuthProvider, ApproveProvider } from 'biz-module';

import ListEngine from './components/ListEngine';
import DetailEngine from './components/DetailEngine';

/**
 * 低代码渲染引擎入口。
 * 负责接收外部通过可视化构建出来的 JSON Schema 并路由给对应的 Engine 进行渲染。
 */
export default function RenderModularEntry({ context, params, schema, finalModuleCode, deptId }) {
  if (!schema) {
    return <div>无效的页面配置 Schema</div>;
  }

  // 区分渲染分支
  const renderEngine = () => {
    switch (schema.pageType) {
      case 'list':
        return <ListEngine schema={schema} context={context} />;
      case 'detail':
        return <DetailEngine schema={schema} context={context} />;
      default:
        return <div>未知的页面模式: {schema.pageType}</div>;
    }
  };

  // 此处根据用户侧的 SKILL.md/GEMINI.md 中建议的高阶包裹器进行包裹
  // 如果宿主环境不一定传入完整字段，我们需要做非空判断保护
  const tenantId = params?.tenantId || '';
  const user = context?.user || {};

  return (
    <ModuleAdapter>
      <UserProvider user={user} tenantId={tenantId}>
        <UserProvider.Consumer>
          {({ user: tenantUser }) => (
            <AuthProvider moduleCode={finalModuleCode} deptId={deptId}>
              <AuthProvider.Consumer>
                {({ hasRight, isLoading }) => {
                  if (isLoading) return <div>加载权限中...</div>;
                  return (
                    <ApproveProvider mgtGroupId={deptId} formId={`flow/${finalModuleCode}`} user={tenantUser}>
                      {renderEngine()}
                    </ApproveProvider>
                  );
                }}
              </AuthProvider.Consumer>
            </AuthProvider>
          )}
        </UserProvider.Consumer>
      </UserProvider>
    </ModuleAdapter>
  );
}
