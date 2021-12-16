const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve, PROJECT_PATH } = require('./constants');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    host: '127.0.0.1', // 指定 host，不设置的话默认是 localhost
    port: 9003, // 指定端口，默认是8080
    compress: true, // 是否启用 压缩
    open: true, // 打开默认浏览器
    hot: true, // 热更新
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'server', // 开一个本地服务查看报告
      analyzerHost: '127.0.0.1', // host 设置
      analyzerPort: 8888, // 端口号设置
      openAnalyzer: false, //  阻止在默认浏览器中自动打开报告
    }),
    new HtmlWebpackPlugin({
      template: resolve(PROJECT_PATH, './public/index.html'),
      scriptLoading: 'blocking',
    }),
  ],
});
