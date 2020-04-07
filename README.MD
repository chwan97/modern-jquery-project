ruby on rails 6.0 默认使用 Webpacker。

作为js打包的工具，webpack已经成为了现代js应用打包的事实标准。

Webpacker makes it easy to use the JavaScript pre-processor and bundler webpack 4.x.x+ to manage application-like 
JavaScript in Rails. It coexists with the asset pipeline, as the primary purpose for webpack is app-like JavaScript, 
not images, CSS, or even JavaScript Sprinkles (that all continues to live in app/assets).
However, it is possible to use Webpacker for CSS, images and fonts assets as well, in which case you may not even need 
the asset pipeline. This is mostly relevant when exclusively using component-based JavaScript frameworks.

Webpacker使它很容易用于JavaScript预处理和打包， webpack 4.x在Rails中处理重交互的JavaScript应用程序。它与asset pipeline共存，因为
webpack的主要目的是用于打包重交互的JavaScript应用程序，而不是图像、CSS，甚至页面JavaScript片段(它们都继续存在于app/asset路径中)。
但是，也可以将Webpacker用于CSS、图像和字体等静态资源，在这种情况下，您可能不需要 asset pipeline。这种情形在只使用基于组件的JavaScript框架时是有意义的。

如果基于组件化无论是多页还是单页的富应用重交互，只使用webpack是正确的。
但是如果是多页偏展示型网站如果想使用jquery(不使用GatsbyJS等基于组件框架的静态CMS生成框架)，又想利用现代的ES语法，各种前端工具。
基本的分工就是gulp等同于asset pipeline，用于静态资源 images、CSS、字体的处理，而webpack用于JavaScript依赖打包。

这时候我们的构建系统需要实现的功能是 资源定位、文件指纹、源码预处理、压缩资源、CssSprite图片合并、CDN host替换、打包dist、非覆盖发布、开发环境文件监
听、浏览器自动刷新等。

这些需求在现代的开源工具下，都有完善实现的功能。现在开始，你需要做的就是配置他们。

1. 资源定位

截止到今天（2020年）前端标准很多都已经确定。
之前存在的很多模块化标准， CMD、AMD在浏览器环境都已经不再使用，目前使用es的模块语法是最佳实践。

webpack的思想是一切都可以分析依赖并进行打包，JavaScript优先，而样式表、字体、图片、图标等资源都需要手动引入，确定依赖才能被应用程序引用。这
样的处理-即只使用webpack处理一切资源，对于单页应用合适的，但是如果用于这篇文章目的（一个多页偏展示型网站的构建系统）来说，启动多个
HtmlWebpackPlugin，并通过链接跳转实现调试功能，就可能会造成很多页面处理时对内存占用过大，而且重交互不是当前的重点所以就显得得不偿失。

> 多页偏展示型网站如果有重交互组件应该怎么办，gitlab的源码可以参考，通过引用vue实现组件的复用。

相较于webpack，gulp也是流行的构建工具之一，虽然它没办法感知依赖，分割代码，但是对于常见的构建操作gulp都能满足。

既然不用webpack，那gulp什么怎么处理HTML、样式表、字体、图片、图标等资源的定位打包问题呢？

在前后端分离的情形下，html一般都是打包后单独部署在服务器上的静态资源而不是通过后端模板返回生成的动态页面。

此时gulp处理html应该有的能力是，html引用，资源引用。

常见的资源依赖有 HTML引用css js 图片，css中引用字体 背景图片。

常用gulp工具

gulp-inject、gulp-html-replace  指明 html 目标可以将声明的css、js地址标签替换掉html指定的标记代码，实现js、css的引入。

gulp-useref  在html明确引入js、css地址标签，在想要合并的开始和结束位置加入特定标记，插件就会找到地址中对应的js、css合并目标位置中的文件，
同时更新html中的标签地址。

gulp-rev  给所有经过这个插件的js、css通过hash计算更改文件名，并同时返回一个json文件mainfist，描述改名前后文件的对应关系。

gulp-rev-replace  Rev重命名后替换html中源文件的名字。

gulp-htmlmin  压缩html中能够压缩的字符。

gulp-autoprefixer 自动添加厂商前缀

gulp-preprocess 通过配置对文件js html css 中的标记(标记可以比较可以进行简单的判断 引入 输出) 进行预处理

参考gitlab，打包过后的js放在 assets/webpack/，文件名为emoji.de2dcb00f0bc66cae573.chunk.js，由文件夹+.+文件名字 + 十四位hash
 分割+chunk，源文件+bundle + .js。

很多gulp插件处理一个页面都是在示例代码中解释的比较清楚的，但是如果要延展到整个项目，就要定下代码文件放置的位置。约定大于配置，各种文件的位置都要
放在指定位置，如果想自定义，需要在特定位置配置文件中指明，这样gulp才能正确处理依赖。

所有不通过_开头的html都视为html页面，被gulp处理，所有_开头的都默认为引用模块忽略处理。Html中不明确指明css地址、js地址，相关地址通过html放置
猜测注入，之后通过mainfist文件替换为处理后的hash地址。

通过lodash模板配装成 html，随后根据当前html的路径找到对应放置的js，一个页面只有一个entry point。webpack对js进行处理，gulp根据页面路径猜测
插入js标签。
html 根据 ref 标记，合并 html 中的文件，然后通过 rev 压缩 html 中引用的css、img，之后通过 rev-replace替换掉文件中受影响的引用标记。

一个页面的css构成一般是页面css、公用代码css，js构成一般是页面代码(app)、公用代码(common\utils\vendor\polyfill)、页面统计代码(百度统计，
谷歌分析)，代码监控代码（sentry）等。

样式需要 sass 转 css 一下，js 通过 webpack 处理一下（ES6转ES5转换，公用代码合并，分割，压缩等）。
css，js都要在开发环境配置sourceMap，通过浏览器调试代码成为可能。

用于拼装页面的gulp-template，默认使用lodash中的_.template()方法。
基本语法为_.template([string=''], [options={}])
string为模板
模板语法类似ejs有三种
<%= %> 输出
<%- %> 转义输出
<% %> 嵌入js语句
配置项options有
[escape] (RegExp): "escape" 分隔符.
[evaluate=] (RegExp): "evaluate" 分隔符.
[imports] (Object): 导入对象到模板中作为自由变量。
[interpolate] (RegExp): "interpolate" 分隔符。
[sourceURL] (string): 模板编译的来源URL。
[variable] (string): 数据对象的变量名。

gulp-template 模板插件虽然有最多的下载，只有这些简单的语法，不支持include，所以使用gulp-ejs。

gitlab打包后的js为 
/assets/webpack/webpack_runtime.bf993a5b9d06faed3c70.bundle.js
/assets/webpack/common.db159cd75479db13c6a5.bundle.js
/assets/webpack/main.b9fa1bb4b84fda196c23.bundle.js
/assets/webpack/pages.dashboard.activity.ed4eca0603e5e1c0c0cd.bundle.js

这是通过webpack4的optimization.splitChunks配置项拆分出来的模块。
chunk的拆分依据是webpack生成的依赖图分析，gitlab的相关配置项为

optimization: {
    runtimeChunk: 'single', // 单独拆分webpack运行时
    splitChunks: {
      maxInitialRequests: 4, // 初始化时最大并发请求 4
      cacheGroups: {
        default: false, // 不适用默认的拆分配置(common、vector) 
        common: () => ({
          priority: 20, // 优先级 20 优先级高的 相同依赖优先拆入此文件，如果优先级相同，谁在谁权重高
          name: 'main', // 拆分出的chunk名称
          chunks: 'initial',// chunk的性质 是 初始化时引入的 还是通过import()按需引入的
          minChunks: autoEntriesCount * 0.9, //  超过多少entrypoint共同引用时才要拆进此文件
        }),
        vendors: {
          priority: 10, // 优先级  
          chunks: 'async', // chunk的性质
          test: /[\\/](node_modules|vendor[\\/]assets[\\/]javascripts)[\\/]/, // 所有符合正则的路径下的依赖
        },
        commons: {
          chunks: 'all', // chunk的性质
          minChunks: 2, //  超过多少entrypoint共同引用时才要拆进此文件
          reuseExistingChunk: true, // 重用之前的chunk
        },
      },
    },
  },
 
相对路径支持： 
一般出现相对路径的情形为 ejs中相对路径 scss中相对路径，如果支持就不太好处理。
所以可以用一种简易的绝对路径来支持，比如默认替换一些引用路径。

public 为 /app/public 的缩写
stylessheet 为 /app/stylessheets的缩写
fonts icons 同理。

本地开发路径与打包结果对应关系为
ejs 转成 html 直接移动到 dist
scss 转成 css 放到 asset/css 下，原stylesheets下的文件夹结构转化为 文件夹.文件名结构。
fonts icons images 同理。

在资源放到dist前一步，通过正则匹配 gulp-replace插件替换约定的标记值。之后再通过rev加版本。
 
错误处理分为两种情形：
1. 纯前端处理
html如果与静态文件一样同样使用nginx部署，就要配置ngnix配置文件指明404 422 500 502 503 等页面，同时调整html与静态资源不同的缓存策略。如果
部署在第三方托管网站上，则需要专门的适配第三方网站的规则。
2. 后端参与路由
这时候需要写错误处理的转发逻辑以及一些路由规则。


------------
1.使用Webpack打包时的“多页”实践[https://alisec-ued.github.io/2016/12/13/%E4%BD%BF%E7%94%A8Webpack%E6%89%93%E5%8C%85%E6%
97%B6%E7%9A%84%E2%80%9C%E5%A4%9A%E9%A1%B5%E2%80%9D%E5%AE%9E%E8%B7%B5/]

2.html-webpack-plugin[https://webpack.js.org/plugins/html-webpack-plugin/]

3.Rails Rails with Webpacker [https://ruby-china.org/topics/38949 , https://ruby-china.org/topics/38832 , https://
ruby-china.org/topics/38214 , https://ruby-china.org/topics/39025 , https://www.kutu66.com//GitHub/article_148193]

4.[https://www.npmjs.com/package/gulp-inject , ]
