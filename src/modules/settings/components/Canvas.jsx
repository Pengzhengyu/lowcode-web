import React, { useCallback } from "react";
import { Icon, Button } from "antd";

/** 根据组件类型渲染占位符预览 */
function renderFieldWidget(field) {
  switch (field.type) {
    case "input":
      return <div style={s.inputBox}>请输入</div>;
    case "textarea":
      return <div style={{ ...s.inputBox, height: 60, color: "#bfbfbf" }}>请输入多行文本...</div>;
    case "select":
      return (
        <div style={s.inputBox}>
          请选择 <Icon type="down" style={s.suffixIcon} />
        </div>
      );
    case "treeselect":
      return (
        <div style={s.inputBox}>
          树状选择 <Icon type="cluster" style={s.suffixIcon} />
        </div>
      );
    case "cascader":
      return (
        <div style={s.inputBox}>
          联级选择 <Icon type="apartment" style={s.suffixIcon} />
        </div>
      );
    case "number":
      return <div style={s.inputBox}>0</div>;
    case "date":
      return (
        <div style={s.inputBox}>
          选择日期 <Icon type="calendar" style={s.suffixIcon} />
        </div>
      );
    case "rangepicker":
      return (
        <div style={{ ...s.inputBox, display: "flex", justifyContent: "space-between" }}>
          <span>开始 ~ 结束</span>
          <Icon type="calendar" style={{ marginTop: 4, color: "#bfbfbf" }} />
        </div>
      );
    case "timepicker":
      return (
        <div style={s.inputBox}>
          选择时间 <Icon type="clock-circle" style={s.suffixIcon} />
        </div>
      );
    case "radio":
      return (
        <div>
          <Icon type="check-circle" theme="twoTone" style={{ marginRight: 4 }} />
          单选A <Icon type="check-circle" style={{ margin: "0 4px 0 12px", color: "#bfbfbf" }} />
          单选B
        </div>
      );
    case "checkbox":
      return (
        <div>
          <Icon type="check-square" theme="twoTone" style={{ marginRight: 4 }} />
          多选A <Icon type="border" style={{ margin: "0 4px 0 12px", color: "#bfbfbf" }} />
          多选B
        </div>
      );
    case "switch":
      return (
        <div style={{ width: 44, height: 22, background: "#bfbfbf", borderRadius: 11, position: "relative" }}>
          <div
            style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", left: 2, top: 2 }}
          />
        </div>
      );
    case "slider":
      return (
        <div style={{ height: 12, marginTop: 10, background: "#f5f5f5", borderRadius: 6, position: "relative" }}>
          <div style={{ width: "40%", height: "100%", background: "#91d5ff", borderRadius: 6 }} />
          <div
            style={{
              width: 14,
              height: 14,
              background: "#fff",
              border: "2px solid #1890ff",
              borderRadius: "50%",
              position: "absolute",
              left: "40%",
              top: -1,
            }}
          />
        </div>
      );
    case "rate":
      return (
        <div>
          <Icon type="star" theme="filled" style={{ color: "#fadb14", marginRight: 4 }} />
          <Icon type="star" theme="filled" style={{ color: "#fadb14", marginRight: 4 }} />
          <Icon type="star" style={{ color: "#d9d9d9" }} />
        </div>
      );
    case "upload":
      return <Button icon="upload">点击上传</Button>;
    case "editableTable":
      return (
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              background: "#fafafa",
              padding: "4px 8px",
              fontSize: 11,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              gap: 8,
            }}
          >
            <span style={{ width: 60 }}>列 A</span>
            <span style={{ width: 60 }}>列 B</span>
            <span>列 C</span>
          </div>
          <div style={{ padding: "8px", color: "#bfbfbf", fontSize: 12, textAlign: "center" }}>数据明细表格预览</div>
        </div>
      );
    default:
      return <div style={s.inputBox}>未知组件</div>;
  }
}

const s = {
  inputBox: { border: "1px solid #d9d9d9", padding: "4px 11px", background: "#fff", borderRadius: 4 },
  suffixIcon: { float: "right", marginTop: 4, color: "#bfbfbf" },
};

export default function Canvas({ schema, activeFieldId, updateSchema, setActiveField, designMode }) {
  const [dragOverPath, setDragOverPath] = React.useState(null); // 'sIdx-fIdx'
  const [dragSource, setDragSource] = React.useState(null); // { sectionIndex, fieldIndex }
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // ─── Detail Mode: Drop onto canvas ───
  const handleDropOnCanvas = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dataStr = e.dataTransfer.getData("componentParams");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);

      if (item.type === "section") {
        const newSection = { id: `section_${generateId()}`, title: "新建表单组", fields: [] };
        updateSchema({ ...schema, sections: [...(schema.sections || []), newSection] });
        setActiveField(newSection.id);
      } else {
        if (!schema.sections || schema.sections.length === 0) {
          const fieldId = `field_${generateId()}`;
          const newSection = {
            id: `section_${generateId()}`,
            title: "新建表单组",
            fields: [{ label: item.label, type: item.type, field: fieldId }],
          };
          updateSchema({ ...schema, sections: [newSection] });
          setActiveField(fieldId);
        } else {
          const lastIdx = schema.sections.length - 1;
          const fieldId = `field_${generateId()}`;
          const newSections = [...schema.sections];
          newSections[lastIdx] = {
            ...newSections[lastIdx],
            fields: [...(newSections[lastIdx].fields || []), { label: item.label, type: item.type, field: fieldId }],
          };
          updateSchema({ ...schema, sections: newSections });
          setActiveField(fieldId);
        }
      }
    },
    [schema, updateSchema, setActiveField],
  );

  const handleDropOnSection = useCallback(
    (e, sectionIndex) => {
      e.preventDefault();
      e.stopPropagation();
      const dataStr = e.dataTransfer.getData("componentParams");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);
      if (item.type === "section") return;

      const fieldId = `field_${generateId()}`;
      const newSections = [...schema.sections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        fields: [...(newSections[sectionIndex].fields || []), { label: item.label, type: item.type, field: fieldId }],
      };
      updateSchema({ ...schema, sections: newSections });
      setActiveField(fieldId);
    },
    [schema, updateSchema, setActiveField],
  );

  // 支持在指定 insertIndex 处插入（splice），区分【新拖入】和【内部平移】
  const handleDropInsertAt = useCallback(
    (e, sectionIndex, insertIndex) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverPath(null);

      const newSections = JSON.parse(JSON.stringify(schema.sections || []));

      // 场景 A: 内部平移 (Internal Re-order)
      if (dragSource) {
        const { sectionIndex: sIdx, fieldIndex: fIdx } = dragSource;
        const [movedItem] = newSections[sIdx].fields.splice(fIdx, 1);

        // 修正插入索引：如果是同一个 Section 且插入点在原点之后，splicing 后索引需要减 1
        let adjustedInsertIdx = insertIndex;
        if (sIdx === sectionIndex && insertIndex > fIdx) {
          adjustedInsertIdx = insertIndex - 1;
        }

        newSections[sectionIndex].fields.splice(adjustedInsertIdx, 0, movedItem);
        updateSchema({ ...schema, sections: newSections });
        setActiveField(movedItem.field);
        setDragSource(null);
        return;
      }

      // 场景 B: 从左侧物料栏新拖入
      const dataStr = e.dataTransfer.getData("componentParams");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);
      if (item.type === "section") return;

      const fieldId = `field_${generateId()}`;
      const fields = newSections[sectionIndex].fields || [];
      fields.splice(insertIndex, 0, { label: item.label, type: item.type, field: fieldId });
      newSections[sectionIndex].fields = fields;
      updateSchema({ ...schema, sections: newSections });
      setActiveField(fieldId);
    },
    [schema, updateSchema, setActiveField, dragSource],
  );

  const handleRemoveField = useCallback(
    (e, sectionIndex, fieldIndex) => {
      e.stopPropagation();
      const newSections = [...schema.sections];
      const fields = [...newSections[sectionIndex].fields];
      fields.splice(fieldIndex, 1);
      newSections[sectionIndex] = { ...newSections[sectionIndex], fields };
      updateSchema({ ...schema, sections: newSections });
    },
    [schema, updateSchema],
  );

  const handleRemoveSection = useCallback(
    (e, sectionIndex) => {
      e.stopPropagation();
      const newSections = [...schema.sections];
      newSections.splice(sectionIndex, 1);
      updateSchema({ ...schema, sections: newSections });
    },
    [schema, updateSchema],
  );

  const handleSectionSort = useCallback(
    (e, targetIndex) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverPath(null);

      const newSections = JSON.parse(JSON.stringify(schema.sections || []));

      // 场景 A: 内部 Section 排序
      if (dragSource && dragSource.type === "section") {
        const sourceIndex = dragSource.index;
        if (sourceIndex === targetIndex) return;

        const [moved] = newSections.splice(sourceIndex, 1);
        // 如果插入位置在原位置之后，计算插入索引需减 1
        const adjustedIdx = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
        newSections.splice(adjustedIdx, 0, moved);
        updateSchema({ ...schema, sections: newSections });
        setActiveField(moved.id);
        setDragSource(null);
        return;
      }

      // 场景 B: 从左侧拖入新 Section
      const dataStr = e.dataTransfer.getData("componentParams");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);
      if (item.type !== "section") return;

      const newSection = { id: `section_${generateId()}`, title: "新建表单组", fields: [] };
      newSections.splice(targetIndex, 0, newSection);
      updateSchema({ ...schema, sections: newSections });
      setActiveField(newSection.id);
    },
    [schema, updateSchema, dragSource, setActiveField],
  );

  // ─── List Mode: Drop onto list config ───
  const handleDropOnListConfig = useCallback(
    (e, targetKey) => {
      e.preventDefault();
      e.stopPropagation();
      const dataStr = e.dataTransfer.getData("componentParams");
      if (!dataStr) return;
      const item = JSON.parse(dataStr);
      if (item.type === "section") return;

      const fieldId = `field_${generateId()}`;
      const newField = { label: item.label, type: item.type, field: fieldId };
      const newListConfig = {
        ...schema.listConfig,
        [targetKey]: [...(schema.listConfig?.[targetKey] || []), newField],
      };
      updateSchema({ ...schema, listConfig: newListConfig });
      setActiveField(fieldId);
    },
    [schema, updateSchema, setActiveField],
  );

  const handleRemoveListField = useCallback(
    (e, targetKey, fieldIndex) => {
      e.stopPropagation();
      const targetArray = [...(schema.listConfig?.[targetKey] || [])];
      targetArray.splice(fieldIndex, 1);
      updateSchema({ ...schema, listConfig: { ...schema.listConfig, [targetKey]: targetArray } });
    },
    [schema, updateSchema],
  );

  // ─── 新型高灵敏度 DND 事件处理 ───
  const handleDragOverSection = (e, sIndex) => {
    e.preventDefault();
    e.stopPropagation();

    // 判断当前正在拖拽的实体是否是 Section（分组自身重排）
    // dragSource 是内部拖拽状态；__DRAGGED_ITEM_TYPE__ 用于跨越 H5 native 数据墙（来自 LeftPanel 的物料）
    const isDraggingSection =
      (dragSource && dragSource.type === "section") || (!dragSource && window.__DRAGGED_ITEM_TYPE__ === "section");

    if (isDraggingSection) {
      // 只有在拖拽的是 Section 时，才计算用于分组排列的感知线 (s-index)
      const rect = e.currentTarget.getBoundingClientRect();
      const isTopHalf = e.clientY - rect.top < rect.height / 2;
      const insertIndex = isTopHalf ? sIndex : sIndex + 1;
      setDragOverPath(`s-${insertIndex}`);
    } else {
      // 此时被拖拽的是业务组件 (Field)。
      // 容错兜底：如果悬浮在了 Section 卡片身上（标题附近），但未精确对准空位或特定排布，默认吸附到该组的最末端
      const fields = schema.sections[sIndex]?.fields || [];
      setDragOverPath(`f-${sIndex}-${fields.length}`);
    }
  };

  const handleDragOverField = (e, sIndex, fIndex) => {
    e.preventDefault();
    e.stopPropagation();
    // 跨分组 Field 或者从外侧拖入的组件
    if (dragSource && dragSource.type === "section") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    const insertIndex = isLeftHalf ? fIndex : fIndex + 1;
    setDragOverPath(`f-${sIndex}-${insertIndex}`);
  };

  const handleDragOverSectionBody = (e, sIndex) => {
    // 处理分组主体拖入兜底：如果没悬浮在任何 Field 上，默认插到该分组最末尾
    e.preventDefault();
    if (dragSource && dragSource.type === "section") return;
    const fields = schema.sections[sIndex]?.fields || [];
    setDragOverPath(`f-${sIndex}-${fields.length}`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleGeneralDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOverPath) {
      // 没有任何命中区的情况下，执行尾部追加
      handleDropOnCanvas(e);
      return;
    }

    if (dragOverPath.startsWith("s-")) {
      const targetIndex = parseInt(dragOverPath.split("-")[1], 10);
      handleSectionSort(e, targetIndex);
    } else if (dragOverPath.startsWith("f-")) {
      const parts = dragOverPath.split("-");
      const sIndex = parseInt(parts[1], 10);
      const insertIndex = parseInt(parts[2], 10);
      handleDropInsertAt(e, sIndex, insertIndex);
    }
    setDragOverPath(null);
  };

  if (!schema) return null;

  return (
    <div
      className="canvas-container-inner"
      style={{ minHeight: 600, paddingBottom: 100 }}
      onDragOver={handleDragOver}
      onDrop={handleGeneralDrop}
      onDragLeave={() => setDragOverPath(null)}
    >
      <div
        className="canvas-header"
        style={{
          background: "#fff",
          padding: "16px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          marginBottom: 24,
          borderRadius: 4,
        }}
      >
        <h2 style={{ margin: 0, color: "#333" }}>
          {schema.header?.title || "页面标题"}
          <span style={{ fontSize: 13, color: "#8c8c8c", marginLeft: 12, fontWeight: "normal" }}>
            ({designMode === "list" ? "列表态视图" : "详情态视图"})
          </span>
        </h2>
      </div>

      {designMode === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 搜索筛选配置区 */}
          <div
            className={`list-drop-zone ${schema.listConfig?.searchFields?.some((f) => f.field === activeFieldId) ? "active" : ""}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnListConfig(e, "searchFields")}
            style={{ background: "#fff", padding: 24, borderRadius: 8, minHeight: 150, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <h3
              style={{
                color: "#1890ff",
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 16,
                marginBottom: 24,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              <Icon type="filter" style={{ marginRight: 8 }} />
              搜索筛选配置区
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", margin: "0 -12px" }}>
              {schema.listConfig?.searchFields?.map((field, fIndex) => {
                const isActive = activeFieldId === field.field;
                return (
                  <div
                    key={field.field}
                    className={`field-card ${isActive ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveField(field.field);
                    }}
                    style={{
                      width: `calc(${field.width || 33.33}% - 24px)`,
                      margin: "0 12px 16px",
                      padding: 20,
                      cursor: "pointer",
                      position: "relative",
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ marginBottom: 12, color: "#595959", fontSize: 13, fontWeight: 500 }}>{field.label}</div>
                    {renderFieldWidget(field)}
                    {isActive && (
                      <div style={s_del} onClick={(e) => handleRemoveListField(e, "searchFields", fIndex)}>
                        <Icon type="close" style={{ fontSize: 10 }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {(!schema.listConfig?.searchFields || schema.listConfig.searchFields.length === 0) && (
                <div style={s_empty}>将【业务字段】拖拽至此作为搜索条件</div>
              )}
            </div>
          </div>

          {/* 表格展示列区 */}
          <div
            className={`list-drop-zone ${schema.listConfig?.tableColumns?.some((f) => f.field === activeFieldId) ? "active" : ""}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnListConfig(e, "tableColumns")}
            style={{ background: "#fff", padding: 24, borderRadius: 8, minHeight: 150, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <h3
              style={{
                color: "#1890ff",
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 16,
                marginBottom: 24,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              <Icon type="table" style={{ marginRight: 8 }} />
              表格展示列区
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", margin: "0 -8px" }}>
              {schema.listConfig?.tableColumns?.map((field, fIndex) => {
                const isActive = activeFieldId === field.field;
                return (
                  <div
                    key={field.field}
                    className={`column-card ${isActive ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveField(field.field);
                    }}
                    style={{
                      minWidth: 180,
                      border: isActive ? "2px solid #1890ff" : "1px solid #f0f0f0",
                      background: isActive ? "#f0f7ff" : "#fafafa",
                      padding: "16px",
                      margin: "0 8px 16px 8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#262626", marginBottom: 8, fontSize: 14 }}>{field.label}</div>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>字段: {field.field}</div>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>组件: {field.type}</div>
                    {isActive && (
                      <div style={s_del} onClick={(e) => handleRemoveListField(e, "tableColumns", fIndex)}>
                        <Icon type="close" style={{ fontSize: 10 }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {(!schema.listConfig?.tableColumns || schema.listConfig.tableColumns.length === 0) && (
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    color: "#bfbfbf",
                    padding: "32px 0",
                    border: "1px dashed #e8e8e8",
                    borderRadius: 8,
                    margin: "0 8px",
                  }}
                >
                  将【业务字段】拖拽至此设定表格默认呈现列
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="detail-canvas-body" style={{ position: "relative" }}>
          {schema.sections?.length > 0 && dragOverPath === "s-0" && (
            <div style={{ height: 4, background: "#1890ff", margin: "-6px 0 6px", borderRadius: 2 }} />
          )}

          {schema.sections?.map((section, sIndex) => {
            const isSectionActive = activeFieldId === section.id;
            return (
              <React.Fragment key={section.id}>
                <div
                  className={`section-card ${isSectionActive ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveField(section.id);
                  }}
                  onDragOver={(e) => handleDragOverSection(e, sIndex)}
                  style={{
                    background: "#fff",
                    padding: "24px 32px",
                    marginBottom: 16,
                    position: "relative",
                    minHeight: 120,
                    border: isSectionActive ? "2px solid #1890ff" : "1px solid #f0f0f0",
                    borderRadius: 8,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <h3
                    draggable={true}
                    onDragStart={() => setDragSource({ type: "section", index: sIndex })}
                    className="section-drag-handle"
                    style={{
                      borderBottom: "1px solid #f5f5f5",
                      paddingBottom: 16,
                      marginBottom: 24,
                      color: "#262626",
                      fontWeight: 600,
                      cursor: "grab",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      <Icon type="drag" style={{ marginRight: 12, color: "#1890ff", fontSize: 18 }} />
                      {section.title}
                    </span>
                    {isSectionActive && (
                      <Button type="danger" size="small" ghost icon="delete" onClick={(e) => handleRemoveSection(e, sIndex)}>
                        删除分组
                      </Button>
                    )}
                  </h3>

                  <div
                    style={{ display: "flex", flexWrap: "wrap", margin: "0 -8px", minHeight: 60 }}
                    onDragOver={(e) => handleDragOverSectionBody(e, sIndex)}
                  >
                    {(!section.fields || section.fields.length === 0) && (
                      <div
                        style={{
                          width: "100%",
                          textAlign: "center",
                          color: "#1890ff",
                          padding: "30px 0",
                          border: dragOverPath === `f-${sIndex}-0` ? "2px dashed #1890ff" : "1px dashed #e8e8e8",
                          borderRadius: 8,
                          margin: "0 12px",
                          background: dragOverPath === `f-${sIndex}-0` ? "#e6f7ff" : "#fafafa",
                          transition: "all 0.3s",
                        }}
                      >
                        <Icon type="plus" style={{ fontSize: 24, marginBottom: 8, display: "block" }} />
                        释放鼠标插入字段
                      </div>
                    )}
                    {section.fields?.map((field, fIndex) => {
                      const isFieldActive = activeFieldId === field.field;

                      // 高频感应判定高亮样式
                      const isBeforeLine = dragOverPath === `f-${sIndex}-${fIndex}`;
                      const isAfterLine = dragOverPath === `f-${sIndex}-${fIndex + 1}`;

                      return (
                        <div
                          key={field.field}
                          className={`field-card ${isFieldActive ? "active" : ""}`}
                          draggable={true}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDragSource({ type: "field", sectionIndex: sIndex, fieldIndex: fIndex });
                          }}
                          onDragEnd={() => {
                            setDragSource(null);
                            setDragOverPath(null);
                          }}
                          onDragOver={(e) => handleDragOverField(e, sIndex, fIndex)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveField(field.field);
                          }}
                          style={{
                            flex: `0 0 calc(${field.width || 33.33}% - 16px)`,
                            maxWidth: `calc(${field.width || 33.33}% - 16px)`,
                            boxSizing: "border-box",
                            margin: "0 8px 16px",
                            padding: "16px 20px",
                            cursor: "grab",
                            position: "relative",
                            border: isFieldActive ? "1px solid #1890ff" : "1px solid #f0f0f0",
                            background: "#fafafa",
                            borderRadius: 6,
                            // 利用 boxShadow 渲染极为精准的落点标尺线
                            boxShadow: isBeforeLine ? "-4px 0 0 #1890ff" : isAfterLine ? "4px 0 0 #1890ff" : "none",
                            transition: "box-shadow 0.1s ease-out",
                          }}
                        >
                          <div style={{ marginBottom: 4, display: "block" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                color: "rgba(0,0,0,0.85)",
                                fontSize: 14,
                                minHeight: 22,
                                lineHeight: "22px",
                              }}
                            >
                              {field.requiredExp && (
                                <span
                                  style={{
                                    margin: "1px 4px 0 0",
                                    color: "#f5222d",
                                    fontSize: 14,
                                    fontFamily: "SimSun, sans-serif",
                                  }}
                                >
                                  *
                                </span>
                              )}
                              {field.label}
                              <span style={{ margin: "0 10px 0 2px", position: "relative", top: "-0.5px" }}>:</span>
                            </span>
                          </div>
                          {renderFieldWidget(field)}
                          {isFieldActive && (
                            <div style={s_del} onClick={(e) => handleRemoveField(e, sIndex, fIndex)}>
                              <Icon type="close" style={{ fontSize: 10 }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 底部边界高亮块 */}
                {dragOverPath === `s-${sIndex + 1}` && (
                  <div style={{ height: 4, background: "#1890ff", margin: "0 0 16px", borderRadius: 2 }} />
                )}
              </React.Fragment>
            );
          })}
          {(!schema.sections || schema.sections.length === 0) && (
            <div
              style={{
                textAlign: "center",
                padding: "100px 0",
                color: "#bfbfbf",
                border: "2px dashed #adc6ff",
                borderRadius: 12,
                background: "#f0f7ff",
              }}
            >
              <Icon type="plus-circle" theme="twoTone" style={{ fontSize: 64, marginBottom: 20 }} />
              <p style={{ fontSize: 18, color: "#8c8c8c", fontWeight: 500 }}>画布空空如也</p>
              <p style={{ color: "#bfbfbf" }}>请将左侧【表单分组】拖拽至此开启设计</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s_del = {
  position: "absolute",
  right: -10,
  top: -10,
  background: "#f5222d",
  color: "#fff",
  borderRadius: "50%",
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 2,
  boxShadow: "0 2px 4px rgba(245,34,45,0.2)",
};

const s_empty = {
  width: "100%",
  textAlign: "center",
  color: "#bfbfbf",
  padding: "24px 0",
  border: "1px dashed #e8e8e8",
  borderRadius: 6,
  margin: "0 12px",
};
