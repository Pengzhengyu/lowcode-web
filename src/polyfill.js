// 解决第三方库(如 react-json-editor-ajrm)在部分构建环境下 process 未定义的 runtime error
window.process = { env: { NODE_ENV: 'development' } };
