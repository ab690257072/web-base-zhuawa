## 内置对象BOM

window
location：文档信息，导航功能，是window和document的共同引用
navigation：浏览器系统信息
screen：显示器信息
history：用户上网的历史信息

### window

#### 方法
alert()、confirm()、prompt()

open()

onerror()：监控错误
addEventListener('error')

setTimeout()
setInterval()

> 面试题：用 setTimeout() 实现 setInterval() 的功能（用途是严格等待上一次执行完毕后再执行下一次，interval不会管你的状态，它会到时间就直接执行）

#### 属性
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220607213557.png)
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220608103426.png)

### location

#### 属性
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220608103627.png)

### navigation
isOnline：监测是否联网

### history
go()、back()、forward()、length

## 事件模型DOM

### 事件委托
阶段：捕获 -> 目标 -> 冒泡
形状：方向冲上的抛物线

## 浏览器请求相关Request
