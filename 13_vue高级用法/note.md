## 模板化
### 插槽
#### 具名插槽
内部用 `<slot name="zzz">`，外部用 `v-slot:zzz`，旧版本外部是 `slot="zzz"`

#### 作用域插槽
新版本是 `v-slot:zzz="innerStates"`，2.6以前，`slot-scope="innterStates"`

### 模板数据的二次加工
1. watch、computed => 这么做有个问题，流程复杂，且computed特性和业务耦合可能会出问题
2. 函数 => 独立，问题是无法自动响应
3. v-html
4. 过滤器（纯函数，无vue实例）

### react中如何实现插槽？
直接通过props传个组件就行，因为react中组件就是js一部分，vue插槽是针对模板的子组件传递设计的，react能直接传递所以就不需要插槽了。

## 组件化
### mixins混入
mixins是逻辑合并：
- 递归合并，data数据若是相同对象，则会合并对象内属性
- 合并冲突时，以组件为优先
- 生命周期合并时，先mixin执行，后组件

### extends继承
功能和mixins一样，区别是mixins以数组形式传入，而extends是对象；
它存在的原因是为了实现其他功能附带的，凑巧实现了mixins效果而已。

### Vue.extend() 拓展一个更具体的构造器
`let Func = Vue.extend(opts)`

### Vue.use()
1. 注册外部插件
2. 不会重复注册
3. 调用的是插件的 install(Vue) 方法

### 组件的高级应用
- 异步组件
- 递归组件
- 动态组件