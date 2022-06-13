## ECMA前身今世
ECMAScript 是标准协会针对 js 制定的标准规范。

## 新特性

### const
使用ES5实现常量：
``` javascript
Object.defineProperty(window, 'arg', {
  value: 'zzz',
  writable: false, // 不可改写
})
```

特点：
- 无变量提升
- 块作用域
- 不可重复声明或赋值
- const声明的变量不会挂载到window上

>面试题：const声明引用类型时，依然能改变属性，如何解决？
>答：Object.freeze(obj)，能冻结obj的第1层属性，再深了只能用递归

``` javascript
function deepFreeze(obj) {
  Object.freeze(obj);
  (Object.keys(obj) || []).forEach(key => {
    if(typeof obj[key] == 'object') {
      deepFreeze(obj[key]);
    }
  });
}
```

### 箭头函数
- 箭头函数不能用于new，没有构造函数
- 没有arguments

### class
- 语法糖，本质上还是构造函数，即 typeof 一个类时，显示的是 function；
- 属性可以定义在构造器中，也可以用get、set定义在类结构内；

> 面试题：修改只读变量会报错么？
> 答：不会，修改也不会生效。

私有属性：
- ES5中使用闭包；
- ES6的类可以用如下方法：
``` javascript
class Course {
  #course = 'aaa'; // 新语法，私有属性

  constructor() {
    let course = 'bbb';
    this.getCourse = () => { // 构造器当作闭包，实现私有属性
      return course;
    }
  }
}
```
