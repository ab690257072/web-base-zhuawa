## 状态机

### 对MVVM的理解
1. 区别：
	1. 抛弃了对dom的依赖
	2. 无需对过程进行操作

## vuex
### vue的组件传值
1. 通过父节点
2. eventBus（发布订阅模式）
3. provide inject
4. vuex（状态机，总线机制，单例模式），**管理状态的东西必须全局单例，不然有冲突了就没意义了**

### 多个异步顺序依赖执行
``` javascript
const pipeLine [this.asyncFunc, func2];
// 迭代器模式
setIterator(pipeLine)
// 生成器
function * setGenerator(pipeLine) {
	for(const fn of pipeLine) {
		yield fn();
	}
}
// 配置迭代器
function setIterator(pipeLine) {
  const generator = setGenerator(pipeLine);
  GFC(generator);
}
// 流水线
function GFC(gen) {
	const item = gen.next();
	if(item.done) {
	  return item.value;
	}
	const { value, done } = item;
	if(value instanceof Promise) {
      value.then(e => GFC(gen));
	} else {
	  GFC(gen);
	}
}
```

### 原理
vuex3 用的是mixin混入状态
vuex4 用的是provide传递状态

## SSR
传统CSR
- 优点：首屏快，SEO友好
- 缺点：服务器压力大
