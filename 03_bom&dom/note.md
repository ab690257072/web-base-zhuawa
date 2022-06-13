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

### 事件阶段
阶段：捕获 -> 目标 -> 冒泡
形状：方向冲上的抛物线

不同元素监听不同阶段事件的顺序如下（addEventListener方法传第3个参数true的话就是监听捕获事件，默认是冒泡事件）：
![](https://raw.githubusercontent.com/ab690257072/Picture/master/img/20220608105403.png)

**e.target**：当前点击的元素
**e.currentTarget**：监听事件绑定的元素

**e.stopPropagation()**：阻止事件传播，注意，不仅仅是阻止冒泡，捕获也行，就是阻断了传播链。

> 面试题：想禁用用户行为，点击页面任何元素都弹窗？
> 方法：window.addEventListener('click', () => ..., true)，在window捕获事件调用e.stopPropagation()阻止传播并弹窗返回。

**e.preventDefault()**：阻止元素默认行为，比如跳转、提交表单等。

addEventListener() 的兼容性：ie8以下不支持此api及捕获事件，可以封装兼容事件类（正因为ie8只支持冒泡，所以阻止传播属性叫cancelBubble）。

### 事件委托
委托：我的任务转交给别人负责

## 浏览器请求相关Request

### XHR
XMLHttpRequest 类，由于没封装Promise，所以状态需要自己判断，没有then、catch等方法，并且要考虑代码顺序，避免异步执行造成影响：
``` javascript
let xhr = new XMLHttpRequest();
xhr.open(method, url);
xhr.onreadystatechange = () => {
  xhr.readyState == 4 && xhr.status == 200
}
xhr.timeout = 3000;
xhr.ontimeout = () => {}
xhr.upload.onprogress = p => {
  let percent = Math.round((p.loaded / p.total) * 100);
}
xhr.send();
```

### fetch API
``` javascript
fetch(url, {
  method: 'GET',
  credentials: 'same-origin', // 同源请求要携带cookie
}).then(response => {
  if(response.ok) { // 200
    return response.json();
  }
  throw new Error('http error'); // 请求500依然会进入then，需要手动抛错
}).then(json => {

}).catch(error => {
  
});
```

#### 请求超时
fetch不支持超时设置，需要自己用Promise封装，resolve和reject只会执行1个，因此超时后即便有响应也不会执行：
``` javascript
function fetchTimeout(url, init, timeout = 3000) {
  return new Promise((resolve, reject) => {
    fetch(url, init).then(resolve).catch(reject);
    setTimeout(reject, timeout); // 和fetch同步执行，因此到时间就会执行reject
  })；
}
```

#### 请求中断
AbortController类，实例标识传给fetch，用于中断请求：
``` javascript
let controller = new AbortController();

fetch(url, {
  // ...
  signal: controller.signal, // 传给fetch标识
}).then(response => {

}).then(json => {

}).catch(error => {
  
});

controller.abort(); // 在其他地方可以中断请求
```

### HTTP状态码 & 头字段
#### 请求头
method
path

cookie
> 面试题：为何常见的cdn域名和业务域名不同？
> 答：
> 1. 安全问题，cookie携带了用户信息，不想传给cdn厂商
> 2. 速度问题，静态资源携带了无用的cookie，增加了带宽消耗
> 3. http1.1同域名并发请求数限制，避免cdn请求占用业务请求数量

referer：当前页的来源页面
user-agent：设备厂商会加入特殊标识，用来做设备判断

#### 响应头
access-control-allow-origin：限制请求域名，防止跨域
content-encoding：gzip
set-cookie：比如uid=123, 服务器给浏览器种cookie

#### status
200
201
301 永久重定向
302 临时重定向
304 协商缓存，服务器文件未修改

http缓存分为强缓存、协商缓存两大块：
1. 强缓存用 max-age，expired（过期时间，服务器时间改变时，这个字段可能不准确）
2. 携带缓存用 last-modified（上次修改时间，问题是打开文件退出也会变更修改时间），etag（前后两文件做hash比对，准确但耗性能）

> 面试题：vue/react等spa应用的index.html，要是做缓存的话，适合做哪种缓存？
> 协商缓存
> index.html的特性：插入的js和css有hash的，但html本身没hash，不过由于很小，所以一般不做缓存；
> h5业务更改很频繁，所以html只要变更就需要实时生效，不能写死缓存期限，因此要用协商缓存

#### 手动封装ajax
