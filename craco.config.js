const CracoLessPlugin = require("craco-less");

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
  devServer: {
    port: 5566,
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // 仅在生产环境构建 (yarn build) 时启用 externals
      // 避免将核心库/UI框架打包进组件束，等待宿主环境统一挂载
      if (env === "production") {
        webpackConfig.externals = {
          "biz-module": "coral_biz_module",
          antd: "coralComponents",
          react: "React",
          "react-dom": "ReactDOM",
          moment: "moment",
        };
      }
      return webpackConfig;
    },
  },
};
