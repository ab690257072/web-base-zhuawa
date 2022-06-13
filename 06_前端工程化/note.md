## 前端工程化的概念

![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220608212444.png)

## wepack.xxx.conf.js
devtool 可以学习一下

![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220608215906.png)

## plugin & loader

### 二者区别
- loader：解决模块编译
- plugin：编译好的模块进行额外的功能拓展

## 性能优化中的代码部分
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220608221736.png)

## 函数式编程
高阶函数HOC
柯里化组合


### 运用函数式编程写loader
loader执行顺序是从下到上的，因为是高阶函数一层套一层的；
若要在从上到下的正常顺序中做些事，则可以在pitch中执行；
``` javascript
// loader
module.exports = function (content, map, meta) {
  //...
  // 同步
  return content;
  // 异步
  this.async(content);
}
module.exports.picth = function () {
  // 从上到下的正常顺序中做一些事
}
```

若想获取loader选项，则按如下方式引入：
``` javascript
const { getOptions } = require('loader-utils');
module.exports = function (content, map, meta) {
  // 获取loader选项
  const options = getOptions(this);
}
```

### 运用函数式编程写plugin
plugin是类
``` javascript
class pluginA {
  apply(compiler) {
    console.log(compiler.hooks);
    // hook代表生命周期集合，emit是发送到assets目录之前触发的钩子函数
    // 可以在钩子函数中做一些事
    compiler.hook.emit.tap('Plugin1', (Compilation, cb) => {
      // cb是用来处理异步的
      setTimeout(() => {
	      //....
	      cb();
      }, 100);
    })
  }
}
```