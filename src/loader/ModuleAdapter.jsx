import React from "react";

/**
 * ModuleAdapter - 业务模块底层适配器占位符
 * 负责处理全局样式注入、基建层通信及多端差异抹平。
 */
export default function ModuleAdapter({ children }) {
  return (
    <div className="glodon-module-adapter-wrapper" style={{ height: "100%" }}>
      {children}
    </div>
  );
}
