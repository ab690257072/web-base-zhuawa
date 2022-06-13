## 基础知识

ts中的常见基础类型：number, string, boolean, array, object, undefined, void

1. enum 枚举
2. type interface
3. 联合类型 |（一次只能用一种类型）
4. 交叉类型 &（每次都是多个类型的合并后的新类型）
5. typeof（获取ts类型）
6. keyof（获取对象或接口的key）
7. in（遍历）
8. extends（常用于约束泛型的范围）
9. Partial（将接口所有属性变为可选）Required（将接口所有属性变为必选）

## 常见面试题

1. 你觉得ts的好处是什么？
- 替换语言时，要考虑功能的完整性，ts是js的超集，功能只多不少；
- ts是面向对象编程语言，包括类、接口的概念；
- 编译时就会检查出错误；
- 拥有强类型，明确知道数据的类型

2. type 和 interface 的区别？
用interface描述数据结构，用type描述类型；
相同点：
  都可以描述函数或对象
  都允许extends
不同点：
  type能声明的类型更多，比如基本类型、联合类型等

3. 什么是泛型，具体如何使用？
写代码即可
4. 如何基于一个已有类型，扩展出一个大部分内容类似，但部分区别的类型？
Pick，Omit等高阶组合，或者直接重写出一个新类型。

## 实战
`routerHelper.ts`
用途：vue路由跳转时不知道页面如何传参，只能看代码，routerHelper就是用ts来解决此问题，参数传不对就报错。

`countdown.ts`
若要求在16ms内变化倒计时，则setTimeout不合适，此时可以用requestAnimationFrame，不过要考虑兼容性

## ts流程
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220610104536.png)
