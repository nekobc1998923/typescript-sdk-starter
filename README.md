# typescript-sdk-starter

> 一套无需额外配置的 TypeScript SDK 前端开发模板，能够帮助开发者快速搭建自己的规范工程环境


## 从零开始的搭建教程

[掘金](https://juejin.cn/post/7038967786051207175)

## 技术栈

- 编程语言：[TypeScript 4.x](https://www.typescriptlang.org/zh/) + [JavaScript](https://www.javascript.com/)
- 构建工具：[Webpack](https://webpack.docschina.org/)
- 代码规范：[EditorConfig](http://editorconfig.org/) + [Prettier](https://prettier.io/) + [ESLint](https://eslint.org/) + [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript#translation)
- 提交规范：[Commitlint](https://commitlint.js.org/#/)
- Git Hook 工具：[husky](https://typicode.github.io/husky/#/) + [lint-staged](https://github.com/okonet/lint-staged)
- 接口文档：[Vuepress](https://v2.vuepress.vuejs.org/zh/)
- 单元测试：[Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/)



## 如何使用

### 获取项目

```
git clone https://github.com/nekobc1998923/typescript-sdk-starter.git
```

### 安装依赖

```
npm install
```

### 修改 `package.json` 和 `webpack.common.js` 以适应自身需要

需要修改的部分包括：`webpack.common.js` 里的 `output` 打包后的产物配置、`package.json` 里的 `name` 、 `repository` 等等

### 本地调试

```
npm run dev
```

### 代码打包

```
npm run build
```

## 许可

MIT Copyright © 2021 nekobc1998923