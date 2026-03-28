/**
 * 沙箱工具集，处理来自低代码 JSON schemas 的字符串表达式
 */

/**
 * 核心联动计算引擎
 * 将表单上下文 formData 暴露给表达式环境
 * @param {string} exp 字符串形式的表达式，如: "formData.amount > 1000"
 * @param {object} formData 当前整个表单的所有值
 * @returns {any} 执行结果
 */
export const computeLogic = (exp, formData) => {
  if (!exp || typeof exp !== 'string') return false;
  
  try {
    // 构造沙箱执行环境
    const runner = new Function('formData', `
      try {
        return (${exp});
      } catch (innerError) {
        return false;
      }
    `);
    return runner(formData || {});
  } catch (error) {
    console.warn(`执行表达式 "${exp}" 时发生语法错误:`, error);
    return false;
  }
};

/**
 * 包装联动控制判定
 */
export class LogicEngine {
  constructor(defaultFormData = {}) {
    this.formData = defaultFormData;
  }

  updateData(newData) {
    this.formData = newData;
  }

  evaluateVisible(fieldConfig) {
    if (!fieldConfig.visibleExp) return true; // 默认可见
    return computeLogic(fieldConfig.visibleExp, this.formData);
  }

  evaluateDisabled(fieldConfig) {
    if (!fieldConfig.disabledExp) return false; // 默认不禁用
    return computeLogic(fieldConfig.disabledExp, this.formData);
  }

  evaluateRequired(fieldConfig) {
    if (!fieldConfig.requiredExp) return false; // 默认非必填
    return computeLogic(fieldConfig.requiredExp, this.formData);
  }
  
  evaluateValue(fieldConfig) {
    if (!fieldConfig.valueExp) return undefined;
    return computeLogic(fieldConfig.valueExp, this.formData);
  }
}
