### history
- go/back/forward 会触发 popState 事件，而pushState、reaplceState方法不会触发；
- hash不支持SSR，history支持；

### 路由触发流程
- 前一组件 beforeRouteLeave
- 全局 router.beforeEach
- 【特定条件】若为路由参数变化，比如 about/a、about/b 这种，则触发 beforeRouteUpdate
- 配置文件里，下一组件的 beforeEnter
- 组件内部的 beforeRouteEnter
- 全局 router.afterEach