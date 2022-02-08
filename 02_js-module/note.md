# 前端模块化简单梳理

## 本篇简介

关于前端模块化的一些知识，如CMD/AMD/Webpack等，之前都进行过专门学习，但经验尚欠，无法从上层理解模块化处于前端工程的哪一层，所以此篇文章暂且抛开之前所学内容，不做细化研究，先单独对模块化大致脉络进行梳理，等待后续工程化、设计模式等学习完成后再进行整体的梳理。

## 整体脉络图



### 1. 无模块化时期

Web初期并没有模块化的工具，且前端在当时相对轻量，甚至后端通过模板就能完全胜任全栈工程师的角色，所以当时并没有前端工程的概念，也就没有模块化。为了组织代码，采用的是不同功能代码通过文件区分：

``` html
<!-- 不同功能代码通过文件区分，导入模板，但作用域并没分离 -->
<script src="layer.js"></script>
<script src="init.js"></script>
<script src="login.js"></script>
```

### 2. 【幼年期】语法层面模块化

由于无模块化会导致全局变量污染问题，不利于团队开发，因此 IIFE 自然成了语法层面模块化的唯一选择；其原理是函数作用域内变量若存在外部引用，则函数产生引用时的执行环境不会销毁，也就是此时函数作用域一直生效，且由于外部无法访问函数内部作用域，因此就形成了即封闭又长效的“模块”。IIFE只是将匿名函数立即执行，是对上述原理的一种语法简化，用它实现模块化的方式是返回一个暴露 api 的对象（模块）：

``` javascript
// IIFE
var moduleA = (() => {
  var count = 0;
  return {
    printCount: function() {
      console.log(count); // 对函数作用域中的count进行引用
    },
    increase: function() {
      count++;
    }
  };
})();
// 调用模块
moduleA.printCount(); // 0
moduleA.increase();
moduleA.printCount(); // 1
```

#### 面试题1：有额外依赖时，如何优化 IIFE？

由于 IIFE 原理是借助函数作用域，所以额外依赖可以通过参数传入函数中供模块使用：

``` javascript
// IIFE
var moduleA = ((dependB, dependC) => {
  var count = dependB.count || dependC.count || 0; // 使用依赖
  return {
    printCount: function() {
      console.log(count); // 对函数作用域中的count进行引用
    },
    increase: function() {
      count++;
    }
  };
})(moduleB, moduleC);
```

#### 面试题2：了解 jQuery早期依赖处理及模块化加载方案吗？

使用了揭示模式（Revealing）写法，原理仍然是 IIFE 传参，匿名函数暴露 api 对象，api 写法是指针形式：

``` javascript
const moduleA = ((dep1, dep2) => {
  var count = dep1.count || dep2.count || 0;
  var getCount = function() {
    return count;
  };
  return {
    getCount, // 揭示模式写法，用指针代替具体函数
  };
})(moduleB, moduleC);
```

### 3. 【成熟期】CommonJS 的出现

Node 作为服务端语言出现后，自然少不了模块化的需求，因此出现了 CommonJS。其特性如下：

- require 引入依赖模块
- module、exports 对象暴露 api

模块组织方式如下：

``` javascript
/* NodeJS模块，基于CommonJS规范 */
// 引入依赖
const dep1 = require('./dep1.js');
// coding
let count = de1.count || 0; // 使用模块
const getCount = () => count;
// 暴露api
exports.getCount = getCount;
// 也可以直接重写module.exports
module.exports = {
  getCount,
}
```

优缺点如下：

- 优点：从框架层面首次实现了真正意义的模块化
- 缺点：为服务端设计，所以起初并未考虑异步依赖问题

#### 面试题：上述CommonJS模块实际执行过程是？

由于对异步依赖支持不足，所以不难想到早期原理是 IIFE 的语法糖：

``` javascript
(function(thisValue, exports, require, module) {
  const dep1 = require('./dep1.js');
  // ...
}).call(thisValue, exports, require, module);
```

### 4. AMD规范

CommonJS 解决了模块化的问题，但又有了如何处理异步依赖的新问题，而 AMD规范应运而生。原理是 “异步加载后，执行回调函数”，经典框架是 `require.js`。示例如下：

``` javascript
/**
 * @function define函数能够定义模块，require函数加载模块
 * @params 模块名，依赖列表，模块工厂函数
 */
// 定义模块
define(id, [...dependList], factory);
// 引入模块
require([...moduleList], callback); // 加载模块，完成后执行callback
```

demo如下：

``` javascript
// 定义moduleA模块
define('moduleA', ['dep1', 'dep2'], (dep1, dep2) => {
  let count = dep1.count || dep2.count || 0;
  const getCount = () => count;
  return {
    getCount,
  };
});
// 引入并使用模块
require(['moduleA'], moduleA => {
  moduleA.getCount(); // 0
});
```

#### 面试题1：若希望AMD兼容之前CommonJS代码，怎么办？

AMD引入依赖的方式除了传入列表，还给工厂函数提供了 require方法，能够兼容CommonJS的写法：

``` javascript
define('moduleA', [], require => {
  let dep1 = require('./dep1.js');
  let dep2 = require('./dep2.js');
  let count = dep1.count || dep2.count || 0;
  const getCount = () => count;
  return {
    getCount,
  };
});
```

#### 面试题2：AMD使用 revealing 写法？

除了返回对象，也可以使用工厂函数的 export 对象挂载指针，虽然是一种设计模式，但其实写法没太大区别：

``` javascript
define('moduleA', [], (require, exports, module) => {
  let dep1 = require('./dep1.js');
  let dep2 = require('./dep2.js');
  let count = dep1.count || dep2.count || 0;
  const getCount = () => count;
  exports.getCount = getCount; // 直接挂载export对象
});
```

AMD的优缺点：

- 优点：可在浏览器中加载模块，且支持异步、并行得加载多个模块
- 缺点：无法按需加载

还有一种能够兼容 AMD 和 CommonJS 的规范叫 UMD，原理就是在工厂函数外包裹一层兼容函数，通过不同传参实现兼容，在这里不过多展开。

### 5. CMD规范

由于AMD无法按需加载，国内团队做了CMD规范进行优化，主流框架是 seaJS，示例如下：

``` javascript
/**
 * @function 省去依赖列表参数，依赖动态引入，与AMD区分是能按需加载
 */
define('moduleA', (require, exports, module) => {
  let $ = require('jquery');
  //...jquery相关逻辑
  let dep1 = require('./dep1');
  // ...dep1相关逻辑
});
```

优缺点：

- 优点：在打包时能够实现按需加载，且依赖就近，方便维护
- 缺点：按需加载会使打包过程变慢，且按需加载逻辑放入每个模块，模块体积反而会增大

#### 面试题：AMD & CMD 的区别？

CMD能够按需加载

### 6. 【新时代】ES模块化

从 ES6 开始，实现了JS模块化的标准语法，且能实现上述旧工具的所有功能，并得到了良好支持。示例如下：

``` javascript
// 引入依赖
import dep1 from './dep1'

let count = 0;
function getCount() {
  return count;
}
// 导出接口
export default {
  getCount,
}
```

浏览器中引入模块的方法是 type=module 的script标签：

``` html
<script type="module" src="./moduleA.js"></script>
```

新版 Node中直接使用 ES6语法引入即可：

``` javascript
// 模块文件一般用 mjs 后缀
import moduleA from './moduleA.mjs'
// 使用模块
moduleA.getCount();
```

#### 面试题：ES6 如何实现动态加载模块？

Webpack 支持使用 CMD写法或 `import('./moduleA')`，不过 ES11 已原生支持该特性：

``` javascript
// 原理就是包一层promise，等模块加载完就引入
import('./moduleA').then(dynamicModule => {
  dynamicModule.getCount();
});
```

ES6模块化的优缺点：

- 优点：通过统一且标准的方式实现了模块化
- 缺点：若不使用Webpack 等工程化工具，其本质仍然是运行时依赖分析

### 7. 【完备方法】工程化

为了解决 ES6 是运行时依赖分析的痛点，使用工程化构建工具，使依赖能够在代码构建阶段就完成。典型工具有 `grunt`、`gulp`、`webpack`，大致原理如下：

``` html
<script>
  // 构建工具的占位符
  // require.config(__FRAME_CONFIG__);
</script>
<script>
  import A from './modA'
  define('B', () => {
    let c = require('C');
    // 业务逻辑
  });
</script>
```

编译时会扫描依赖关系并生成map：

``` javascript
{
  a: [],
  b: ['c'],
}
```

然后会根据依赖关系替换占位符：

``` html
<script>
  require.config({
    a: [],
    b: ['c'],
  })
</script>
```

接着会根据模块化工具的配置处理依赖并生成符合兼容要求的代码：

``` javascript
// 同步方案，加载进C
define('b', ['c'], () => {
  // ...
})
```

完成。

这种方案的优点：

- 构建时分析依赖
- 方便拓展，比如同时使用3种不同的模块化方案

## 总结

大概梳理一下模块化的脉络，有助于理解现在为何Webpack、Vite 等工具流行的原因，因为能解决足够多的问题，将多规范进行统一并且可以拓展。若想研究具体的规范使用，可以参考对应热门框架的实现，每一个都可以讲很多东西，在这里不过多阐述。

