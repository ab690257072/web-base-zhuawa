## 语法
### 基础类型
``` javascript
let a: number = 1;
let b = 1; // ts中如果不写类型，会触发断言，识别为数字类型
let c: boolean[] = [true, false];
```

### 特殊类型
any
unknown
never
void

## 接口
描述对象或函数的属性类型
``` javascript
interface User { // 用来描述User对象的属性类型
  name: string,
  age?: number,
  readonly id: number
}
function test(user: User): void {
  //...
}
let user1 = {
  name: 'aa',
  age: 12
};
test(user1);
```

## 类
与es6中的类相似，不过多了一些特性，比如 public，private，protected，static等。

## 泛型
宽泛的类型，即比没有类型强一些，但又不限制于某一类型；
泛型依附于函数或类等，并不是描述它们，而是给他们临时装备个新类型，可供它们使用：
``` javascript
function aaa(arg: string): string {
  return arg;
}
function aaa<T>(arg: T): T { // 这种情况与any作用一样
  return arg;
}
function aaa<T extends User>(arg: T) : T { // 与any不同的是，泛型能扩展或继承
  return arg;
}
```

## 枚举
理解枚举时，看看例子编译后的具体写法。

## 装饰器
对方法或属性的加强，避免多层嵌套

## 多态
父类同一方法，在多个子类中有不同的行为，与重载的区别是，多态是同一方法，重载是不同方法； 
重载是多态的一种，叫特设多态

## 抽象类 & 抽象方法
定义类的方法，不能实现，与接口的区别是，接口描述的是属性和方法的类型，而抽象类描述的是子类的属性和方法。

## TS编译原理
sourceCode -> 扫描仪 -> token流 -> 解析器 -> AST -> 检查器 -> 发射器

