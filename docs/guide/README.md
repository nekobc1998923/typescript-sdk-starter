## 前言

本文主要介绍从零开始配置 TypeScript SDK 项目整体的环境配置，包括了以下几方面的配置

- 使用 **Webpack** 进行 `工程搭建`
- 使用 **EditorConifg、Prettier、ESLint、Airbnb JavaScript Style Guide** 来保证 `团队代码风格规范`
- 使用 **husky、Commitlint** 和 **lint-staged** 来 `构建前端工作流`
- 使用 **standard-version** 生成 `changelog`
- 使用 **TypeDoc** 快速生成 `API文档`。
- 使用 **html-webpack-plugin、webpack-dev-server** 进行 `本地热更新代码调试`
- 使用 **Jest** 进行 `单元测试`，并约束提交 `正确的代码`
- 使用 **Github Actions** 进行 `自动部署发布`

> **温馨提醒**：如果你是想制作一个基于 TypeScript 的简单工具函数库，那么你也使用一些成熟的 "零配置" 脚手架；如果你是需要写一个比较复杂的中间件：监控SDK、中间层SDK等，那么这篇文章可以帮助你进行一个美好的开始。


如果本文对你能够有所帮助，点一个赞就是对我的鼓励，对文内的配置有什么问题也欢迎在评论区留言

## GitHub

相关代码已经上传至 [GitHub仓库](https://github.com/nekobc1998923/typescript-sdk-starter) ，**有兴趣的小伙伴可以 star 一下**

## 项目初始化

### 初始化package.json

**我们先把 Github 上自己的一个仓库 clone 到自己本地**，然后在项目根目录我们直接跑初始化命令即可,里面配置需要的小伙伴初始化完后自行去 `package.json` 中配置

```
npm init -y
```

### 配置.gitignore

`.gitignore` 里配置的是我们提交到git时需要忽略的一文件或者文件夹，比如`node_modules、dist`等

我们在根目录下新建 并新增以下配置：

```
# npm包
/node_modules
package-lock.json

# build产物
/dist
/types

# eslint
.eslintcache

# jest
/coverage
```


### 安装typescript

```
npm install typescript -D
```

在根目录下新建 `tsconfig.json` ，这里贴上我的一个配置，需要自定义的小伙伴可以查看 [*TypeScript*中文网](https://www.tslang.cn/docs/handbook/tsconfig-json.html) 上的完整配置项

```
{
  "compilerOptions": {
    // 指定 ECMAScript 目标版本 "ES3"（默认）， "ES5"， "ES6" / "ES2015"， "ES2016"， "ES2017" 或 "ESNext"。
    "target": "ES5",
    // 构建的目标代码删除所有注释，但是不会删除以 /!* 开头的版权信息
    "removeComments": true,
    // 启用所有严格类型检查选项。启用 --strict 相当于启用 --noImplicitAny, --noImplicitThis, --alwaysStrict， --strictNullChecks, --strictFunctionTypes 和 --strictPropertyInitialization
    "strict": true,
    // 禁止对同一个文件的不一致的引用
    "forceConsistentCasingInFileNames": true,
    // 生成相应的 .d.ts文件
    "declaration": true,
    // 生成的 .d.ts文件路径，这里统一生成到types文件夹下
    "declarationDir": "types",
    // 报错时不生成输出文件
    "noEmitOnError": true,
    // baseUrl来告诉编译器到哪里去查找模块，所有非相对模块导入都会被当做相对于 baseUrl。
    "baseUrl": ".",
    // 非相对模块导入的路径映射配置
    "paths": {
      "@/*": ["src/*"],
      "@docs/*":["docs/*"],
      "@public/*":["public/*"],
      "@test/*":["test/*"],
    }
  },
  // 编译器默认包含的编译文件，src是源代码文件夹，test是jest测试代码文件夹
  "include": ["src/**/*","test/**/*"],
  // 编译器默认排除的编译文件
  "exclude": ["node_modules"]
}

```

> 这里 `path` 配置了非相对模块导入的路径映射配置，跟下面将要提到的 `Webpack` 别名配置都得一起配置使用


## Webpack

开门见山的说，这里选择了 `Webpack` 作为打包工具的原因很简单：`Webpack` 毋庸置疑是功能最为强大完整的；不过如果考虑配置简单之类的因素，也可以自行选择其余的打包工具比如 `rollup` `gulp` 等

这一节里面，我们讲介绍以下三块配置流程：

- 如何使用 **cross-env + webpack-merge** 组合来实现 `开发环境和生产环境的不同配置`。
- 如何使用 **Babel** 进行 `代码的向后兼容`。
- 如何使用 **某些插件** 实现 `一些奇奇怪怪的功能 ` 


### webpack安装

想用webpack，就需要安装两个包

```
npm install webpack webpack-cli -D
```

安装完之后，我们在根目录下新建 `scripts` 文件夹，`scripts` 文件夹内新增 `constants.js` 、  `webpack.common.js` 两个文件

我们再在根目录下新建 `src` 文件夹，用来放我们的源码，并在 `src` 下新建 `index.ts` 入口文件

我们再在根目录下新建 `public` 文件夹，用来放我们的静态资源文件

在根目录新增的文件夹和文件结构如下：


```
├── scripts
│   ├── webpack.common.js
│   └── constants.js
├── src
│   └── index.ts
├── public
```


`constants.js`文件如下：

这里的 PROJECT_PATH 常量，可以让我们不用写不断../../，而从根目录开始找所需文件

![ac7ac05239f346719d442270d51f5fb8.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7ee8581d3304940a499c783df763464~tplv-k3u1fbpfcp-watermark.image?)


`webpack.common.js`如下：

> 这里我们配置 `libraryTarget` 为 `umd` ，因为作为 SDK ，我们希望能够支持多种方式的引用：`import`、`require`、`script`

```
const { resolve, PROJECT_PATH} = require('./constants')

module.exports = {
  // 定义了入口文件路径
  entry: {
    index: resolve(PROJECT_PATH, './src/index.ts'),
  },
  // 定义了编译打包之后的文件名以及所在路径。还有打包的模块类型
  output: {
    // 打包后的产物名
    filename: 'library-starter.js',
    // 在全局变量中增加一个libraryStarter变量
    library: 'libraryStarter',
    // 打包成umd模块
    libraryTarget: 'umd',
    // libraryExport这个属性需要设置，否则导出后，外层会包有一层default
    libraryExport: 'default',
    // 路径
    path: resolve(PROJECT_PATH, './dist'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@docs': resolve(__dirname, '../docs'),
      '@public': resolve(__dirname, '../public'),
      '@test': resolve(__dirname, '../test'),
    },
    extensions: ['.ts', '.tsx', '.js'],
  },
}
```

> 这里设置了一个 `alias 别名` ，需要注意一点，`Webpack` 结合 TypeScript 搭建项目时，使用别名需要在 `tsconfig.json` 和 `webpack.common.js` 里都配置， 配置 `webpack.common.js` 是**为了 build 打包时能够识别路径**，配置 `tsconfig.json` 是**为了让我们在本地开发调试时 `ESLint` 不会报错**

配置别名后，我们就可以使用别名进行文件引入

```
// 使用 src 别名 @ 
import '@/index'
```

### cross-env + webpack-merge

> 在 webpack 中针对开发环境与生产环境我们要分别配置，以适应不同的环境需求，不同环境的需求不同，我们在开发环境下需要的是 `更快的构建速度` 和 `source-map的错误信息` ；而我们在生产环境下需要的是 `更小的打包体积` ；

我们要配置我们的scripts文件夹，用来编写公共的webpack配置以及不同环境下的配置。

我们安装 `cross-env` 可**跨平台设置和使用环境变量**，不同操作系统设置环境变量的方式不一定相同，比如 Mac 电脑上使用 `export NODE_ENV=development `，而 Windows 电脑上使用的是 `set NODE_ENV=development` ，有了这个利器，我们无需在考虑操作系统带来的差异性。

我们先安装 `cross-env` ：

```
npm install cross-env -D
```

然后我们在 `scripts` 文件夹内新建 `webpack.dev.js` 和 `webpack.prod.js` 两个文件：

`webpack.dev` 配置如下：

```
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
})
```

`webpack.prod` 配置如下：

```
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
})
```

`package.json` 里配置如下：考虑本地调试，这里分为开发环境下的 `dev` 和生产环境的 `build`

```
  "scripts": {
    "dev": "cross-env NODE_ENV=development webpack --config ./scripts/webpack.dev.js",
    "build": "cross-env NODE_ENV=production webpack --config ./scripts/webpack.prod.js"
  },
```



### webpackbar

是否经常在某些项目构建的时候，能够看到有打包的进度？

现在我们也可以做到这一点了，我们可以借助 webpackbar 来完成此项任务，安装它：

```
npm install webpackbar -D
```

在 webpack.common.js 增加以下plugins的代码：

```
const WebpackBar = require('webpackbar');

module.exports = {
  // 其他配置...
  plugins: [
    // 其他plugins...
    new WebpackBar({
      name: '正在卖力打包中~',
      color: '#fa8c16',
    }),
  ],
};
```

我们再来看一下实际打包中的效果，这样看起来是不是舒服多了呢？在项目比较大的时候，有时有个反馈还是很舒服的。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0591f74cb9314ac6bcff9cd812512bcc~tplv-k3u1fbpfcp-watermark.image?)
### rimraf

清除构建产物这里建议使用 `rimraf` ，我们先安装它：

```
npm install rimraf -D
```

然后配置 `package.json` 里的 `scripts` ，我们在原本的build之前加上 `rimraf dist types` ：

```
{

  "scripts": {
     "dev": "rimraf dist types && cross-env NODE_ENV=development webpack --config ./scripts/config/webpack.dev.js",
     "build": "rimraf dist types && cross-env NODE_ENV=production webpack --config ./scripts/config/webpack.prod.js",
  },
}
```
这样就可以在每次build之前，就自动把dist文件夹删掉，重新生成新的

### devtool

devtool 中的一些设置，可以帮助我们将编译后的代码映射回原始源代码，即大家经常听到的 source-map ，这对于本地调试代码错误的时候特别重要，而不同的设置会明显影响到构建和重新构建的速度。

在开发环境中，我这边选择了 `eval-source-map`

在生产环境我们不设置，webpack中当mode为production时自动就不会去生成source-map，我们不能把代码映射放到生产环境

所以我们在 `webpack.dev.js` 文件里加上 `devtool` 配置

```
module.exports = merge(common, {
    devtool: 'eval-source-map',
})
```

### babel

> Babel 是一个工具链，主要用于将 ECMAScript 2015+ 版本的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。

我们先安装一些babel的插件

```
npm install @babel/core @babel/preset-env @babel/plugin-transform-runtime babel-loader -D
```

-   **@babel/core**：@babel/core是babel的核心库，所有的核心Api都在这个库里，这些Api供babel-loader调用
-   **@babel/preset-env**：这是一个预设的插件集合，包含了一组相关的插件，Bable中是通过各种插件来指导如何进行代码转换。该插件包含所有es6转化为es5的翻译规则
-   **@babel/plugin-transform-runtime**：transform-runtime的转换是非侵入性的，也就是它不会污染你的原有的方法。遇到需要转换的方法它会另起一个名字，否则会直接影响使用库的业务代码，
-   **babel-loader**：它作为一个中间桥梁，通过调用babel/core中的api来告诉webpack要如何处理js。

安装好后，我们在根目录下新建`.babelrc`文件，配置如下：

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        // 防止babel将任何模块类型都转译成CommonJS类型，导致tree-shaking失效问题
        "modules": false
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": {
          "version": 3,
          "proposals": true
        },
        "useESModules": true
      }
    ]
  ]
}
```

然后我们在`webpack.common.js`中配置 `module`：

```
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
```

> **@babel/polyfill 和 @babel/plugin-transform-runtime的选择**

polyfill的垫片是在全局变量上挂载目标浏览器缺失的功能，因此在开发类库，第三方模块或者组件库时，就不能再使用babel-polyfill了，否则可能会造成全局污染，此时应该使用[transform-runtime](https://www.zhihu.com/search?q=transform-runtime&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra={"sourceType":"article","sourceId":138108118})。transform-runtime的转换是非侵入性的，也就是它不会污染你的原有的方法。遇到需要转换的方法它会另起一个名字，否则会直接影响使用库的业务代码，

故开发类库，第三方模块或者组件库时使用`transform-runtime`，平常的项目使用`babel-polyfill`即可

### browserslistrc

这里提一个非常有意思的配置，也就是browserslistrc

我们考虑浏览器兼容性，当然这里讲的兼容性问题**不是指屏幕大小的变化适配**，而实**针对不同的浏览器（不同的版本）支持的特性**：比如 `css` 特性、`js` 语法之间的兼容性

我们在项目根目录新建 `.browserslistrc` 文件，配置如下：

```
> 5%
last 2 versions
not ie < 11
```
上面这里的意思是，全球超过 5%⼈使⽤的浏览器的最后两个版本都需要兼容，唯独排除 ie11 以下版本不兼容。有了这个之后，我们就可以根据自身的需要进行浏览器兼容，而不是通通全部都转


### ts-loader

安装如下：

```
npm install ts-loader typescript -D
```

然后我们在 `webpack.common.js` 中中配置规则，

```
module: {
  rules: [
    { 
      test: /\.(ts)$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
    }
  ]
}
```

### Tree-shaking

> webpack 默认支持，我们只需要在 .bablerc 里面设置 `model：false`，即可在生产环境下默认开启

**Tree-shaking 作用是剔除没有使用的代码，以降低包的体积**，我们使用 `Webpack` 在生产环境下即 `mode 设置为 production` 时，打包后会将`通过 ES6 语法 import 引入`却未使用的代码去除

而我们这里回忆一点，我们在上文中引入了 `babel` ，babel 的作用是将 ECMAScript 2015+ 版本的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中，同样，它会把 `ES6 语法的 import 转换成 require`，这会导致 `Tree-shaking` 失效。

所以我们在 `.babelrc` 文件有配置这一点: `"modules": false` , 这个就是为了防止babel将任何模块类型都转译成CommonJS类型，导致tree-shaking失效问题

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        // 防止babel将任何模块类型都转译成CommonJS类型，导致tree-shaking失效问题
        "modules": false
      }
    ],
  ],
}
```


### webpack-bundle-analyzer

`webpack-bundle-analyzer` 作为一个打包文件分析工具，可以帮助我们分析我们打包之后的大小都分布在什么文件上

我们先安装它：

```
npm install webpack-bundle-analyzer -D
```

然后我们在 `webpack.dev.js` 中添加 `plugins` 配置如下：

```
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = merge(common, {
  // ...
  plugins: [
    // ...
    new BundleAnalyzerPlugin({
      analyzerMode: 'server', // 开一个本地服务查看报告
      analyzerHost: '127.0.0.1', // host 设置
      analyzerPort: 8888, // 端口号设置
      openAnalyzer: false,//  阻止在默认浏览器中自动打开报告
    }),
  ],
});

```

然后我们浏览器打开 http://127.0.0.1:8888 即可看到打包分析，这里设置 `openAnalyzer` 为 false 是为了防止每次本地build打包时都打开浏览器的分析报告，这样我们只需要有需要的时候自己打开去看即可。


### 其它可能会需要的配置
本文配置的是 TypeScript SDK 项目，如果你不当当是用来写一个SDK，那你可能还需要 `html-loader`、`css-loader`等的其余loader

### terser-webpack-plugin

`terser-webpack-plugin` 是一个压缩 `js` 的 `webpack` 插件。

> **如果你使用的是 `webpack v5` 或以上版本，你不需要安装这个插件。**`webpack v5` 在 `mode` 为 `production` 时自动帮我们做了代码压缩。

如果我们要用的话，在 `webpack.common.js` 里面加上如下配置：

```
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin(
        parallel: true
      )
    ],
  },
};
```


## Api文档和注释

因为是 SDK 项目，意味着我们将主动暴露出很多 `Class` 或者 `Function` 出去给其它开发者使用的，那么作为typescript项目，我们务必就需要一个文档生成的工具，我们可以选择自动生成 API 的 `typedoc`，也可以使用我们自定义文档内容的 `Vuepress`，在这一节里，我们先介绍 `typedoc` 的使用

这一节里面，我们讲介绍以下两块配置流程：

- 如何使用 **typedoc** 快速生成 `API文档`。
- 如何使用 **koroFileHeader** 快速生成 `合理的注释`。

### typedoc

[typedoc](https://typedoc.org/) 是一个非常好用的 TypeScript 项目API文档生成器，它可以根据你的 `源代码`以及`写在源代码里面的合理注释`，自动生成 `API文档`。

首先，我们先安装它

```
npm install typedoc -D
```

然后，我们在根目录下新建 `typedoc.json` 文件来放配置信息，配置如下：

```
{
  "entryPoints" : ["src/index.ts"],
  "out": "docs"
}
```
> 完整的配置信息，可以在官网查看：https://typedoc.org/guides/options/

这里的 `entryPoints` 配置项是你项目的入口文件。

然后我们在 `package.json` 里加上 `scripts` 脚本，如下配置：

```
  "scripts": {
    "typedoc": "rimraf docs && typedoc",
  },
```


> 配置到此为止，我们已经可以直接生成我们的 `API文档` ，让我们来做一个`简单测试`看看实际生成的效果如何：

首先先往 `src/index.ts` 里写入代码：
```
/**
 * 这是一个测试Class,调用方法如下：
 * ```typescript
 * // We can initialize like this
 * const sdk = new frontendSdk();
 * ```
 */
export class frontendSdk {
  /**
   * @description:        用以初始化
   * @param {string} id   传参的ID
   * @param {string} url  建立链接的ID
   * @return {*}
   */
  initConfig(id: string, url: string) {}
}
```

保存后执行上面定义的typedoc脚本

```
npm run typedoc
```
我们可以看到效果如下，自动为我们生成了一个带有我们写入的注释的API文档，还是比较nice的：

![4de98a60a3ff47c7960504542d499c5e.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/76a30847acde44c9b93cc473adb5d2ca~tplv-k3u1fbpfcp-watermark.image?)
![18ae82cb16a04d9bbc6b8423d4840415.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8eae9ba7c0ec4ea6bcd25160984a4579~tplv-k3u1fbpfcp-watermark.image?)


### koroFileHeader

根据上文我们说到，`typedoc` 会根据注释生成文档，但是要我们手动生成这样 `合理的注释` 又很麻烦，所以这时候就需要借助vscode插件：`koroFileHeader` 来帮助我们快速生成注释格式

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e90789e54cba497287aa97a0dcf25998~tplv-k3u1fbpfcp-watermark.image?)

我们在vscode应用商店里搜索 `koroFileHeader` 并安装，安装好之后，我们在 `vscode` 内，按键盘`ctrl+shift+p`打开下图所示的设置文件 `setting.json`

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6307e9d911a24fa1948142f3ec5046af~tplv-k3u1fbpfcp-watermark.image?)

打开 `setting.json` 设置之后，我们在里面加入配置，下图配置目的是`关闭头部注释，开启函数注释`,其中`fileheader.cursorMode` 对象里面的注释类型可以自行定义：

```
  "fileheader.customMade": { 
    // 头部注释
    "autoAdd":false
  },
  "fileheader.cursorMode": {
    // 函数注释
    "description": "",
    "param": "",
    "return": "",
  }
```

配置完之后，我们在打开键盘快捷方式：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/55156e5dd58d4d5597decb124e813758~tplv-k3u1fbpfcp-watermark.image?)

在里面搜索 `cursorTip` ,修改它绑定的快捷键为我们喜欢的快捷键，我这里设置的是 `ctrl+alt+t`

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e20109ffd5ca4639989d2bb67c9fec73~tplv-k3u1fbpfcp-watermark.image?)

好啦，到此配置就完成了，我们就可以快速的生成`函数注释`，生成的函数注释也可以快速的被 `typedoc` 所识别生成`API文档`，下图为用 `koroFileHeader` 快速生成的简单注释

![生成注释.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7e35dc4445804ccfa718673db089ad50~tplv-k3u1fbpfcp-watermark.image?)


## Vuepress 更自由的定制文档

有的时候，使用 typedoc 自动生成的文档，不管是界面还是内容都不是很符合我们的需要，我们需要一个**更加自由可定制化的文档**，我们这里选用 `Vuepress` 

这一节里面，我们讲介绍以下一块内容：

- 如何使用 **Vuepress** 生成`自定义的文档内容`

> PS：如果选用配置 Vuepress 上面的 typedoc 配置就可以跳过

### 移除 typedoc 相关的配置

如果小伙伴按照上面的文章配置了 `typedoc` 这时就需要先把 `typedoc` 相关的配置先移除

### 安装

```
npm install -D vuepress
```


## 代码规范和提交规范

现在的前端项目开发，一般一个项目可能有多人开发，每个人往往使用的代码风格都不统一，长久下去，势必让项目变得难以维护，我们有必要去约束这些问题，而约束这些，通过代码审查、口头约束这些方式沟通成本过高，不够灵活，更关键的是无法把控。我们急需一个工具去帮我们统一这些代码规范；

同时为了规范，也意味着我们也需要一些工具去帮助我们去统一代码的提交规范；

最后，代码风格规范和提交规范都统一了，我们就可以开始做 `ChangeLog` 的更新；

这一节里面，我们讲介绍以下三块配置流程：

- 如何使用 **EditorConfig + Prettier + ESLint** 组合来实现 `代码规范化`。
- 如何使用 **husky + lint-staged + commitlint** 进行 `提交规范的代码`。
- 如何使用 **standard-version** 实现 `生成 ChangeLog ` 

### Prettier

[Prettier](https://prettier.io/) 是非常强大的代码格式化工具，它支持着 JavaScript、TypeScript、CSS、SCSS、Less、JSX、Angular、Vue、JSON、Markdown 等各种语言，我们前端基本上能用到的文件格式它都可以搞定，所以我们这里采用它来约束我们的代码风格规范

```
npm install prettier -D
```

安装完之后在根目录新建 `prettier.config.js` 并配置，这里贴出我的简单配置，完整的配置可以查看文档：[Configuration File · Prettier](https://prettier.io/docs/en/configuration.html)

```
// https://prettier.io/docs/en/configuration.html
module.exports = {
  // 每一行的宽度(显示的字符数)
  printWidth: 120,

  // tab健的空格数
  tabWidth: 2,

  // 是否在对象中的括号之间打印空格，{a:5}格式化为{ a: 5 }
  bracketSpacing: true,

  // 箭头函数的参数无论有几个，都要括号包裹
  arrowParens: "always",

  // 换行符的使用
  endOfLine: "lf",

  // 是否用单引号， 项目中全部使用单引号
  singleQuote: true,

  // 对象或者数组的最后一个元素后面是否要加逗号
  trailingComma: "all",

  // 是否加分号，项目中统一加分号
  semi: true,

  // 是否使用tab格式化： 不使用
  useTabs: false,
};
```

我们再新建一个 `.prettierignore` 文件用来告诉 Prettier 哪些文件**需要忽略**

```
# npm包
/node_modules
package-lock.json

# build产物
/dist
/types

# eslint
.eslintcache

# jest
/coverage

# docs api文档
/docs
```

### ESLint

我们先安装如下几个插件

- eslint
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import)

```
npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-import -D
```

安装成功后执行

```
npx eslint --init
```

**已经执行 npx eslint --init 的小伙伴现在会依次遇到下面几个问题：**

-   How would you like to use ESLint?

> 果断**选择第三条 To check syntax, find problems, and enforce code style** ，检查语法、检测问题并强制代码风格。

-   What type of modules does your project use?

> 项目非配置代码都是采用的 ES6 模块系统导入导出，**选择 JavaScript modules**

-   Which framework does your project use?

> 根据实际需要选择，本文这里**选择都不要**

-   Does your project use TypeScript?

> 因为是TypeScript项目，这里当然**选是**啦

-   Where does your code run?

> **Browser 和 Node 环境都选上**

-   How would you like to define a style for your project?

> 选择 **Use a popular style guide** ，即使用社区已经制定好的代码风格，我们去遵守就行。

-   Which style guide do you want to follow?

> **选择 Airbnb 风格**，都是社区总结出来的最佳实践。

-   What format do you want your config file to be in?

> **选择 JavaScript** ，即生成的配置文件是 js 文件，配置更加灵活。

-   Would you like to install them now with npm?

> 选择YES

然后我们再在 `package.json` 中加上 `scripts` 脚本，然后再在 `build` 指令之前加上 `npm run lint`

```
{
    "lint": "eslint src",
    "build": "npm run lint && rimraf dist types && cross-env NODE_ENV=production webpack --config ./scripts/webpack.prod.js",
}
```

我们之前选择风格的时候，选择了 `Airbnb` 风格，所以很多 rules 规则就不需要我们再自己去定制，直接在 `extends` 里引入即可，`Airbnb github地址`：https://github.com/airbnb/javascript ，**有兴趣的小伙伴可以去看一下里面具体制定的规则**

安装结束后，项目根目录下多出了新的文件 `.eslintrc.js`，修改如下：

```
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // ecmaVersion用来指定你想要使用的 ECMAScript 版本
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
  },
};
```

我们再新建一个 `.eslintignore` 文件用来告诉 ESLint 哪些文件**需要忽略**

```
# npm包
/node_modules
package-lock.json

# build产物
/dist
/types

# eslint
.eslintcache

# jest
/coverage

# docs api文档
/docs

# webpack 配置
/scripts
```


> **这时我们已经同时安装了Prettier和ESLint，它们俩之间会有一些重复冲突的配置，我们还需要一些插件，以便能够和ESLint一起使用**


冲突的本质在于 `eslint` 既负责了代码质量检测，又负责了一部分的格式美化工作,格式化部分的部分规则和 `prettier` 不兼容。 能不能让 `eslint` 只负责代码质量检测而让 `prettier` 负责美化呢? 社区有了非常好的成熟方案，即 `eslint-config-prettier` 加上 `eslint-plugin-prettier`

我们来安装这两个：

```
npm i eslint-plugin-prettier eslint-config-prettier -D
```


-   `eslint-config-prettier` 的作用是关闭 `eslint` 中与 `prettier` 相互冲突的规则。
-   `eslint-plugin-prettier` 的作用是调用 `ESLint` 的时候调用 `Prettier` 的规范进行代码风格校验


在 `.eslintrc.js` 添加 prettier 插件：

```
module.exports = {
  ...
  extends: [
    'plugin:prettier/recommended' // 添加 prettier 插件
  ],
  ...
}
```

这样配置之后，我们的ESLint和Prettier就可以同时使用啦！且让 `eslint` 只负责代码质量检测而让 `prettier` 负责美化。

### vscode插件 EditorConfig

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ab53b85290b54e04b1567920b58a8098~tplv-k3u1fbpfcp-zoom-1.image)

安装之后，在项目左侧列表，直接右键，底下会有 `Generate .editorconfig` ，点击即可快速生成 `.editorconfig` 文件，

我们修改它生成的 `.editorconfig` 文件：

```
# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

[*]                   # 表示所有文件都要遵循
indent_style = space              # 缩进风格，可选配置有space和tab
indent_size = 2                   # 缩进大小
end_of_line = lf                  # 换行符，可选配置有lf、cr和crlf
charset = utf-8                   # 编码格式，通常都是选utf-8
trim_trailing_whitespace = true   # 去除多余的空格
insert_final_newline = true       # 在尾部插入一行

[*.md]                # 表示仅 md 文件适用
insert_final_newline = false      # 在尾部插入一行
trim_trailing_whitespace = false  # 去除多余的空格
```


### vscode插件 Prettier-Code formatter

首先安装扩展

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9231b94e32ec4a9b993f601881f6dbd8~tplv-k3u1fbpfcp-zoom-1.image)

配置这个的目的就是为了让开发者的 `vscode` 配置保持统一，该文件的配置优先于 vscode 全局的settings.json，这样别人下载了你的项目进行开发，也不会因为全局 settings.json的配置不同而导致 `Prettier` 或之 `Eslint` 失效

我们在项目根目录下新建.vscode文件夹，在此文件下再建一个settings.json文件

```
.vscode/
    setting.json
```

setting.json配置如下

```
{
  // 指定哪些文件不参与搜索
  "search.exclude": {
    "**/node_modules": true,
    "dist": true
  },
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

这里配置的效果是：是在我们保存时，会自动执行一次 `Prettier` 代码格式化

### vscode插件 ESLint

我们知道 eslint 由编辑器支持是有自动修复功能的，首先我们需要安装扩展：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f8450c01b7b42ac94bc960d4dd90afc~tplv-k3u1fbpfcp-zoom-1.image)

再到之前创建的 `.vscode/settings.json` 中添加上以下代码：

```
{
  "eslint.validate": [
    "javascript",
    "typescript"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
}
```

这时候我们保存时，就会开启 eslint 的自动修复，帮我们修复一些语法上的写法问题。


### husky + lint-staged 提交规范的代码

> **首先**，使用husky和lint-staged之前，我们先检查一下自己的**node版本是否>=12.20.0**，如果小于，请重装node或者用nvm进行版本切换，见官方要求：https://github.com/okonet/lint-staged#migration 我这边所使用的node版本为**v14.18.2**，

在项目开发过程中，每次提交前我们都要对代码进行格式化以及 eslint 和 stylelint 的规则校验，以此来强制规范我们的代码风格，以及防止隐性 BUG 的产生。

那么有什么办法只对我们 git 缓存区最新改动过的文件进行以上的格式化和 lint 规则校验呢？

答案就是`husky` ，它会提供一些钩子，比如执行 git commit 之前的钩子 `pre-commit` ，借助这个钩子我们就能执行 lint-staged 所提供的代码文件格式化及 lint 规则校验！

我们直接执行官方推荐的安装指令： 

```
npx mrm@2 lint-staged
```

**注意：安装`husky`和`lint-staged`之前，请先安装 `ESLint` + `Prettier` ，否则会检测到没有安装后给你报错：**

```
E:\Code\hrfsh> npx mrm@2 lint-staged
npx: 237 安装成功，用时 17.33 秒
Running lint-staged...

Cannot add lint-staged: only eslint, stylelint, prettier or custom rules are supported.
```

> 官方推荐的安装指令执行时会帮你做这几件事：

- 往 `package.json` 的devDependencies里加上 `husky` 和 `lint-staged` 两个依赖
- 往 `package.json` 里的scripts里加上 `"prepare": "husky install"` 脚本
- 往 `package.json` 里增加 lint-staged 配置项，官方生成的代码如下：
```
  "lint-staged": {
    "*.js": "eslint --cache --fix",
    "*.{js,css,md}": "prettier --write"
  }
```
- 在根目录新建`.husky`文件夹,文件夹里的`pre-commit`文件已经自动帮我们集成了`npx lint-staged`指令

> 这样，到此为止我们已经可以实现：在commit提交时，对暂存区的.js文件都执行`eslint --cache --fix`进行语法自动修正，对.js.css.md文件都进行`prettier --write`写法风格纠正，但是官方给配置的里面没有包含.ts的文件，且我们并不想要自动修正 `--fix`

**所以我们重新配置**我们的`package.json`，修改指令自动生成的lint-staged配置项为我们所需要的

```
{
  "lint-staged": {
    "*.{ts,js}": [
      "eslint"
    ]
  }
}
```

这段话的意思是：当暂存区内的文件后缀为.js或者.ts时，就会进行eslint校验。

如此配置完之后，我们每次进行commit时，都会触发eslint校验，去检测暂存区里的文件是否符合ESLint规范，如果不符合规范，就会抛错出来中止commit


### commitlint 提交规范的 commit

> 在多人参与的项目中，如果 git 的提交说明精准，在后期协作以及 bug 处理时会变得有据可查；

我们的目的只有一个：**只让符合 Angular 规范的 commit message 通过 commit 检查**，为了达成这个目的，我们使用 `commitlint` 可以帮助我们检查 git commit 时的 message 格式是否符合规范


我们首先先安装依赖

```
npm install @commitlint/cli @commitlint/config-conventional -D
```

> 这里，我们使用社区最流行、最知名、最受认可的 `Angular` 团队提交规范。

先看看 [Angular 项目的提交记录](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fangular%2Fangular%2Fcommits%2Fmaster "https://github.com/angular/angular/commits/master")：



![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fbf9fb9ab947497b97653d104050bf73~tplv-k3u1fbpfcp-watermark.image?)

如上图可以清楚看到，每个 commit 都是有着清楚的完整的格式的，commit message 由 Header、Body、Footer 组成。具体的 commit msg 格式文章有很多我这里就不多唠叨了，我们就直接进入配置流程：

我们在根目录新建 `.commitlintrc.js` 文件，这就是我们的 commitlint 配置文件，配置如下：

```
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['build', 'ci', 'chore', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'],
    ],
  },
};
```

其中都是官方推荐的 angular 风格的 commitlint 配置

```
/**

 * build : 改变了build工具 如 webpack
 * ci : 持续集成新增
 * chore : 构建过程或辅助工具的变动
 * feat : 新功能
 * docs : 文档改变
 * fix : 修复bug
 * perf : 性能优化
 * refactor : 某个已有功能重构
 * revert : 撤销上一次的 commit
 * style : 代码格式改变
 * test : 增加测试
 */
```

然后我们要结合上面的 `husky` 增加一个钩子，执行下面这条语句：

```
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit $1'
```

**这样操作完之后，我们在commit的时候，就会触发husky钩子去检查我们的提交信息是否符合规范**


> **注意**：使用windows的小伙伴，在npx husky add时可能会出现无法add的情况，

在github上已经有人提出了这个问题：https://github.com/typicode/husky/issues/1043

我们只需要像这个 `issue` 里提供的方案一样，修改我们的add代码为如下：

```
npx husky add .husky/commit-msg "npx"
```

然后我们再在生成的 `commit-msg` 文件中把npm补全成上述代码中的完整语句即可。

补全后的 `commit-msg` 文件完整配置如下：

```
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no-install commitlint --edit $1
```

### standard-version 生成 changelog

这里选用的是standard-version，安装如下：

```
npm i standard-version -D
```

我们再在package.json中配置如下：

```
  "scripts": {
    "release": "standard-version",
    "release-major": "standard-version --release-as major",
    "release-minor": "standard-version --release-as minor",
    "release-patch": "standard-version --release-as patch",
  },
```

版本号 `major.minor.patch`

`standard-version` 默认的版本更新规则:

-   feature 会更新 minor,

<!---->

-   bug fix 会更新 patch,

<!---->

-   BREAKING CHANGES 会更新 major

我们手动添加了 `release-major` 等的指令，这样子会更方便我们做版本提交

然后我们在根目录新建 `.versionrc.js` 文件，配置如下：

```
module.exports = {
  header: '# Changelog',
  commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
  types: [
    { type: 'feat', section: '✨ Features | 新功能' },
    { type: 'fix', section: '🐛 Bug Fixes | Bug 修复' },
    { type: 'init', section: '🎉 Init | 初始化' },
    { type: 'docs', section: '✏️ Documentation | 文档' },
    { type: 'style', section: '💄 Styles | 风格' },
    { type: 'refactor', section: '♻️ Code Refactoring | 代码重构' },
    { type: 'perf', section: '⚡ Performance Improvements | 性能优化' },
    { type: 'test', section: '✅ Tests | 测试' },
    { type: 'revert', section: '⏪ Revert | 回退' },
    { type: 'build', section: '📦‍ Build System | 打包构建' },
    { type: 'chore', section: '🚀 Chore | 构建/工程依赖/工具' },
    { type: 'ci', section: '👷 Continuous Integration | CI 配置' },
  ],
};
```

想自定义的小伙伴可以自行翻开官方的文档：[conventional-changelog-config-spec/README.md](https://github.com/conventional-changelog/conventional-changelog-config-spec/blob/master/versions/2.1.0/README.md)



> 运行之后，会自动生成changelog并commit，**不过并没有推动到git仓库，所以得我们手动推送，或者在代码里加上推送的指令**，如果我们不想让它自动commit，可以在package.json中设置，除了commit还可设置跳过`bump`, `changelog`, `tag`这几个步骤

```
{
  "standard-version": {
    "skip": {
      "commit": true
    }
  }
}
```
### 配置外的一些话

如同上文所述，我们安装了EditorConfig、Prettier、ESLint来做代码检查，风格检查，那么有的小伙伴可能会疑问：这些的规范校验规则难道不会互相冲突吗？

答案是会的，首先我们先看一下三者的定位：

-   EditorConfig: 跨编辑器和IDE编写代码，保持一致的简单编码风格；

<!---->

-   Prettier: 专注于代码格式化的工具，美化代码；

<!---->

-   ESLint：作代码质量检测、编码风格约束等；

ESLint和Prettier的冲突在前面的ESLint配置

EditorConfig的配置项都是一些不涉及具体语法的，比如 缩进大小、文移除多余空格等。

而 Prettier是一个格式化工具，要根据具体语法格式化，采用单引号还是双引号，是否加分号，在哪里换行等等，当然，肯定也有缩进大小。

即使缩进大小这些共同都有的设置，两者也是不冲突的，假设我们设置 EditorConfig 的 indent_size 为 4 ， Prettier 的 tabWidth 为 2，我们看一下配置后的效果：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7569ad0d49c14627bcaf6ecd627948b5~tplv-k3u1fbpfcp-zoom-1.image)

可以发现，我们声明完对象回车后，根据 .editorconfig中的配置，缩进大小为 4，所以光标直接跳到了此处，但是保存时，因为我们默认的格式化工具已经在 .vscode/settings.json 中设置为了 Prettier，所以这时候读取缩进大小为 2 的配置，并正确格式化了代码。

当然，引入它们俩的本意就是保持代码风格一致，如果我们手动配置了所冲突的选项，那就偏离了本意啦~这种重合的地方还是配置一样的好

## 本地热更新调试代码

简单来说， SDK 项目由于是提供方法出去供外调用的，所以一般我们本地调试时的流程是这样子的：`SDK项目修改代码` -> `手动让SDK进行打包编译生成产物` -> `拷贝打包产物到新的一个项目` -> `在另一个项目内引入打包后的产物` -> `在另一个项目上调试`

这种的调试方式，极为的繁琐且耗费时间，所以我们有必要给项目搞一个`本地热更新的调试环境`，能够随着我们的代码更新直接查看修改效果。


这一节里面，我们讲介绍以下两块配置流程：

- 如何使用 **html-webpack-plugin + webpack-dev-server** 组合来实现 `本地代码调试`。
- 如何使用 **npm-link** 来实现 `运行在目标项目中的调试`。

### html-webpack-plugin

`html-webpack-plugin` 的作用是帮助我们将打包后的 `js` 文件自动引进 `html` 文件中，通过这个插件我们可以省去 `拷贝打包产物到新的一个项目` `在另一个项目引入打包后的产物` 这两个繁琐的步骤。

我们先安装这个插件

```
npm install html-webpack-plugin -D
```

我们先在 `public` 文件夹下 新建 `index.html` 文件，html代码如下：

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>libraryStarter</title>
</head>
<body>
</body>
<script>
  new libraryStarter({id:'GIQE-QWQE-VFFF',url:'localhost'})
</script>
</html>
```

注意看，这里代码里 `new libraryStarter();` 这个 `libraryStarter` ，要和在 `webpack.common.js` 里配置的 `output.library` 字段对应，因为 `output.library` 在全局变量中加了这个变量，我们才可以调用的到

我们再修改 `src/index.ts` 为以下代码做一下简单测试：

```
interface ConfigOptions {
  id: string;
  url: string;
}
class libraryStarter {
  constructor(options: ConfigOptions) {
    console.log('constructor-id-url', options.id, options.url);
  }
}

export default libraryStarter;
```




然后我们来配置开发环境下用的 `webpack.dev.js` 配置文件，我们添加如下配置：

```
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve, PROJECT_PATH } = require('./constants');

module.exports = merge(common, {
  plugins: [
    // ...
    new HtmlWebpackPlugin({
      template: resolve(PROJECT_PATH, './public/index.html'),
      scriptLoading: 'blocking',
    })
  ],
});

```

到此为止，我们执行 `npm run dev` 指令 ，跑完之后我们可以看到，在 `dist` 文件夹内已经自动打进了我们配置的html文件

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cf7b112100494c9ab38e12883e5fff64~tplv-k3u1fbpfcp-watermark.image?)

我们在浏览器打开这个 `html` 文件验证一下看它是不是给我们自动引入`打包后的js文件`，`并正确执行`。


![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c0056da9fdae42e7b79b2e60db447d7c~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/667ac9d8dcb44ce8bdeb2c3ffc70b2e6~tplv-k3u1fbpfcp-watermark.image?)

可以看到如上图所示， `html-webpack-plugin` 已经帮我们自动将打包后的 js 文件自动引进 html 文件中，`并且new` 也正确执行了

> 虽然说这样配置后，我们已经可以在本地搭建html进行调试了，但是我们每次调试代码都得 `build` 后手动刷新页面，懒才是程序员的第一生产力！这种费力的调试方法怎么行呢？解决办法当然有，那就是通过 `webpack-dev-server` 进行热更新。

### webpack-dev-server

`webpack-dev-server` 的作用是可以在本地起一个 http 服务，我们可以指定它的热更新、端口等配置。通过它，我们可以免去我们本地调试SDK中的 `手动让SDK进行打包编译生成产物` 这一步骤，**并且当它监听到代码变化后，会自己重新build并刷新html页面**，可以说是非常cool了。

我们先安装一下它：

```
npm install webpack-dev-server -D
```

然后我们再在 webpack.dev.js 里加上如下配置：

```
module.exports = merge(common, {
  devServer: {
    host: '127.0.0.1', // 指定 host，不设置的话默认是 localhost
    port: 9003, // 指定端口，默认是8080
    compress: true, // 是否启用 压缩
    open: true, // 打开默认浏览器
    hot: true, // 热更新
  },
});
```
然后我们再回到 `package.json` 中修改 `dev` 脚本，修改后如下：

```
{
  "scripts": {
    "dev": "rimraf dist types && cross-env NODE_ENV=development webpack-dev-server --config ./scripts/webpack.dev.js"
  }
}
```

然后我们执行 `npm run dev` 看下配置后的效果

可以发现，它build完之后自动帮我们打开了上文配置 `html-webpack-plugin` 时我们手动打开的 `index.html` 页面，且地址为 http://127.0.0.1:9003/ ，我们看一下控制台的打印：


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a4fbde5d8a7745b5ab7cfbb44215362f~tplv-k3u1fbpfcp-watermark.image?)

嗯！打印也没有什么问题，我们再试试 `热更新` 的效果，我们修改之前的 `index.ts` 文件，新加一条 `console`,打印任意东西都行，这里就不贴代码了，我们直接看下效果：


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fa6f9aab0d5348fb8e94e35a8d27a770~tplv-k3u1fbpfcp-watermark.image?)

嗯非常nice，可以发现它自动帮我们`更新了打包后代码`，并且还帮我们`刷新了页面`，**可以说是非常贴心了~**

### npm link

有了上述的两个插件，我们已经可以实现 `无需手动打包和刷新` 的 `本地热更新代码调试` ；开着个两个大屏幕，左手撸码，右手一杯咖啡，就这么轻松调试代码岂不快哉。但是！还有一个场景调试起来还是非常的繁琐，什么呢？那就是：**实际的项目使用我们的 SDK 出现了 BUG**。

我们先想一下，实际的项目使用我们的 SDK 一般，都由我们发布到 npm 后由项目去安装使用，如果想要在项目上进行调试的话，我们就得手动拷贝 `build产物` 过去到项目中，然后手动引入使用。并且每次改代码也得重新build重新拷贝！这是不能忍受的，所以这里就介绍一个实用的小技巧，**让我们能够在实际的项目上进行本地调试**。

**这个技巧就是使用 `npm link`**

使用方法极其简单，我们先在我们的 SDK 项目中，命令行执行

```
npm link
```

执行命令后，npm-link-module会根据package.json上的配置，被链接到全局

然后我们再到我们要运行 SDK 的实际项目，命令行运行

```
npm link library-starter
```

然后我们在要运行 SDK 的实际i项目，代码中写上：

```
import library-starter from 'library-starter'
new library-starter()
```

这样子下来，我们就可以在具体的项目中进行快乐的调试了~



## 单元测试

单元测试是项目开发中一个非常重要的环节，它可以减少 Bug 的出现。而上文的代码规范和提交规范只能约束提交 `规范的代码` ，但是却不能保证我们提交的是 `正确的代码` ，所以我们有必要为自己做一个基本的单元测试，来保证每次的代码提交都不会影响我们的功能主流程。


这一节里面，我们讲介绍以下两块配置流程：

- 如何使用 **Jest** 来实现 `单元测试`。
- 如何使用 **husky + lint-staged + Jest** 进行 `提交正确的代码`。



### Jest

我们先安装：

```
npm install jest ts-jest @types/jest -D
```

其中这几个插件，jest 我们不必多说，而 `ts-jest` 是 Jes 转换器，可让用 Jest 测试用 TypeScript 编写的项目。而 `@types/jest` 则是**为了让我们的编译器不会一直报一些jest类型未找到的问题**

Jest默认是不会编译`.ts`文件的，所以为了我们的 TypeScript 项目能够正常进行单元测试，我们需要进行配置，让 Jest 明白使用`ts-jest`预设，我们执行指令：

```
npx ts-jest config:init
```

执行完上述 `npx ts-jest config:init` 指令后，它会帮我们在根目录下创建 `jest.config.js` 配置文件，我们修改 `jest.config.js` 为如下：

```
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // 是否显示覆盖率报告
  collectCoverage: true,
  // 让jest明白哪些文件需要通过测试，这里的要求是：src文件夹下的所有.ts文件都需要覆盖到
  collectCoverageFrom: ['src/*.ts'],
  // 这里的意思是：语句覆盖率、分支覆盖率、函数覆盖率、行覆盖率这四项，都得为100%才能通过测试。
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  // 路径映射配置，官文档网地址：https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping
  // 这里的配置要和 TypeScript 路径映射相对应
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@docs/(.*)$': '<rootDir>/docs/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
};
```


然后我们再配置我们的 `package.json` 加入 `scripts` 脚本：


```
"test": "jest"
```

> 好的，到此为止我们已经可以开始编写单元测试了，让我们先来简单的测试一下效果：

我们修改 `src/index.ts` 文件：

```
interface ConfigOptions {
  id: string;
  url: string;
}
class LibraryStarter {
  public id: string;

  public url: string;

  constructor(options: ConfigOptions) {
    this.id = options.id;
    this.url = options.url;
  }

  getConfig() {
    return {
      id: this.id,
      url: this.url,
    };
  }
}

export default LibraryStarter;
```

我们在根目录下新建 `test` 文件夹来存放我们的用例，再在 `test` 文件夹下新建 `init.spec.ts` 文件：

```
import LibraryStarter from '@/index';

describe('src/index.ts', () => {
  it('这里要判断 SDK 的参数初始化是否正确', () => {
    expect(new LibraryStarter({ id: 'GIQE-QWQE-VFFF', url: 'localhost' }).getConfig()).toStrictEqual({
      id: 'GIQE-QWQE-VFFF',
      url: 'localhost',
    });
  });
});
```

好啦，我们来跑一下我们的 单元测试用例 试试看：

```
npm run test
```

按理来说，这段单元测试是要正常通过的，我们来看一下结果：

```
 PASS  test/init.spec.ts
  src/index.ts
    √ 这里要判断 SDK 的参数初始化是否正确 (2 ms)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 | 
 index.ts |     100 |      100 |     100 |     100 | 
----------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        4.927 s
Ran all test suites.
```

先解释一下这几个参数的含义

- % `stmts`  **语句覆盖率**   代码语句的覆盖率
- % `Branch` **分支覆盖率**   代码中的if执行覆盖率   
- % `Funcs`  **函数覆盖率**   代码中的函数覆盖率     
- % `Lines`  **行覆盖率**     代码的行覆盖率

如上述结果所示，我们的测试通过，我们再打开生成的测试覆盖率报告看一下：

文件在 `coverage` 文件夹下，为 `index.html`


![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e8e78217085245cba05b1b85583bceb9~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7bdfddb435df46939b9c5801baf83ae3~tplv-k3u1fbpfcp-watermark.image?)

### Jest 通过 ESLint 校验


> 为了让我们编写的单元测试代码能够进行符合 Jest 推荐规则的 ESLint 校验，我们需要安装支持的插件来进行检验

我们先安装插件：[eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest)


```
npm install eslint-plugin-jest -D
```

安装完之后往 `.eslintrc.js` 中添加 `extends` 配置

```
{
  "extends": ["plugin:jest/recommended"]
}
```

当然我们也得在 `package.json` 中加上对 `test` 文件夹的校验

```
"lint": "eslint src test",
```


### 通过 Jest 来提交正确的代码

上面介绍了 `Jest` 的单元测试，当然我们还得强制约束一下，只要是未通过 `Jest` 单元测试的代码，都不允许上传至我们的代码仓库。

这个需求当然还是得通过我们的老朋友 `husky` 来进行实现啦

配置 `提交正确的代码` 前，我们先在 `构建前` 加上 `Jest` 的校验：

```
{
  "scripts": {
    "build": "npm run lint && npm run test && rimraf dist && cross-env NODE_ENV=production webpack --config ./scripts/webpack.prod.js"
  }
}
```

这样保证了代码构建是正确的代码后，我们去配置 `.husky` 文件夹下的 `pre-push` 文件，我们执行：

```
npx husky add .husky/pre-push "npm run test"
```

这里在widnows下执行不成功时，参照上文的 `commitlint` 那节进行操作https://juejin.cn/post/7038967786051207175/#heading-30

执行后完整的文件如下所示：
```
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test
```

这样子配置完后，每次 push 时都会去跑一遍 `npm run test` ，只要覆盖率没有达到100%或者当中的测试用例有一个不通过，这次推送都不允许通过

## 自动部署发布

我们开发完 SDK 之后，一般都需要发布在 NPM 上提供下载使用，而如果我们不断的手动去发布NPM，还是比较麻烦的，所以本节内容主要包括以下两块：

-   自动更新 `静态资源`（Docs文档）到 `Github` 上
-   自动 `Build构建` 并将产物发布到 `NPM` 上


本节内容在我的另一篇文章中已经描述，这里是链接：

https://juejin.cn/post/7045192507969241125/

## 结尾
好啦，到此为止，一个基本的 TypeScript SDK 工程已经搭建起来了，之后只需要根据自己的业务，在入口的`index.ts` 文件开始撸码就好了！

当然如果小伙伴们是想搞一个 TypeScript 的非SDK项目，也可以像上面这样进行工程配置，之后再加入自己的需要配置即可~