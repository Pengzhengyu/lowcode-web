import React, { useState, useEffect } from "react";
import { Spin, Result, Button } from "antd";
import ModuleAdapter from "../../../loader/ModuleAdapter";
import { UserProvider, AuthProvider, ApproveProvider } from "biz-module";
import DetailEngine from "./DetailEngine";
import ListEngine from "./ListEngine";

const API_BASE = "http://localhost:3000/api/v1";

/**
 * UnifiedRenderEntry - 低代码企业级自动化集成入口
 * 遵循 GEMINI.md 壳层嵌套规范，集成了身份、权限、审批三大业务能力。
 *
 * @param {string} moduleCode - 业务模块标识 (用于远程加载 Schema)
 * @param {string} defaultMode - 初始模式 ('list' | 'detail')
 * @param {string} recordId - 编辑场景下的记录主键
 * @param {object} context - 公司基建上下文 (内含 user)
 * @param {object} params - 路由参数 (内含 tenantId)
 * @param {string} deptId - 核心部门隔离 ID
 */
export default function UnifiedRenderEntry({ moduleCode, defaultMode = "detail", recordId, context = {}, params = {}, deptId }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(defaultMode);

  useEffect(() => {
    if (!moduleCode) {
      setError("Missing moduleCode");
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/page-config/${moduleCode}`);
        const result = await response.json();

        if (result.code === 200 && result.data) {
          setSchema(result.data);
        } else {
          setError(result.message || "Failed to load configuration");
        }
      } catch (err) {
        setError("Network error: Could not reach configuration service");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [moduleCode]);

  // ── 内部业务逻辑渲染 ──
  const renderCore = (authProps = {}) => {
    if (!schema) return null;
    return (
      <div className="unified-render-wrapper" style={{ height: "100vh", position: "relative" }}>
        {viewMode === "detail" ? (
          <DetailEngine schema={schema} recordId={recordId} onBack={() => setViewMode("list")} auth={authProps} />
        ) : (
          <ListEngine
            schema={schema}
            onEdit={(id) => {
              window.location.href = `?mode=detail&id=${id}&moduleCode=${moduleCode}`;
            }}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f5f6fa" }}>
        <Spin size="large" tip={`正在加载模块 [${moduleCode}] 的配置流...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48 }}>
        <Result
          status="error"
          title="配置加载失败"
          subTitle={error}
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              重试
            </Button>,
          ]}
        />
      </div>
    );
  }

  const user = context?.user || {};
  const tenantId = params?.tenantId || "";

  return (
    <ModuleAdapter>
      <UserProvider user={user} tenantId={tenantId}>
        <UserProvider.Consumer>
          {({ user: tenantUser }) => (
            <AuthProvider moduleCode={moduleCode} deptId={deptId}>
              <AuthProvider.Consumer>
                {({ hasRight, isLoading }) => {
                  if (isLoading) return <Spin style={{ margin: "50px auto", display: "block" }} tip="鉴权中..." />;
                  return (
                    <ApproveProvider mgtGroupId={deptId} formId={`flow/${moduleCode}`} user={tenantUser}>
                      {renderCore({ hasRight })}
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
