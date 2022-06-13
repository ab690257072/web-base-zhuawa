## babel
babel翻译流程如下：
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220609153422.png)

### AST
AST如下：
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220609153854.png)

> 可以使用 [esprima](https://esprima.org/demo/parse.html) 网站来看解析后的语法树，以及单词token流，这也就是为什么语法报错会报“Unexpected token xxx”，因为是在解析ast时发现错误的，直接就报对应的token了。

## 实战
- demo在项目中的 `src/index.js` 文件，babel 转换后的代码在 `dist/index.js` 中查看；
- 转换命令：`babel ./src -w -d ./dist`

## tree组件
tree.vue
item.vue

