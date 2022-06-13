## 前言
需要对官方文档有所了解，有一些api比较类似，需用图区分开来。

## 问题
### ref和reactive区别
ref将基础值包装为对象，在template中直接访问变量对应的基础值，而js中用变量的value属性访问原基础值。

### effect和watch区别
effect自动检测函数内部的属性变化，而watch需要主动明示需要监听的变量。

### setup相当于什么生命周期？
相当于Vue2中的 beforeCreate 和 created。