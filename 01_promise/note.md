# 前言

Promise对于前端的重要性自不必多说，网上文章也很多，那我为什么还要重复写这篇呢？因为哪怕总结的不准确不全面，原理这东西还是得自己总结调试，细节太多了，本篇只是简单介绍下规范，并不会全盘照搬，重点还是实现的准确性，供大家参考。

## 本篇介绍
1. 介绍术语和规范，这东西看似不重要，但很容易混淆，影响记忆质量
2. 通过PromiseA+规范自己封装一个Promise类
3. Promise API 的使用和原理
4. Promise常见的问题

## 一、术语和规范

## 术语
1. **thenable**：如果一个对象或函数有一个方法名称是then，那么就说它是“具有调用then方法能力的”，able在英语语境里是具有某能力的意思。
2. **promise**：thenable的对象或函数，是Promise的实例，遵循PromiseA+规范；规范可以理解为产品说明书，promise是产品，Promise类是生产产品的工厂
3. **value**：promise成功解决时，传入resolve回调函数中的参数，规范中写明了各种可能的数据类型，如 undefined、thenable 或一个新的 promise 等
4. **reason**：promise失败时，传入reject回调函数的参数，表明拒绝的原因

## 规范

### Promise States

Promise 应该有三种状态，通过调用 resolve/reject 方法来改变状态，一经改变后不可修改。

| 状态      | 描述                                                         |
| --------- | ------------------------------------------------------------ |
| pending   | - 初始默认状态，表示期约正在等待解决或拒绝<br />- 调用 resolve() 会将其变为 fulfilled 状态<br />- 调用 reject() 会将其变为 rejected 状态 |
| fulfilled | 期约解决的状态，为最终态，后续操作状态均不可改变             |
| rejected  | 期约拒绝的状态，为最终态                                     |

状态流转过程：

![image-20220111141343383](https://s2.loli.net/2022/01/11/MiEdk3mcsCGSXfV.png)

### then

promise 应该有一个then方法，当解决或拒绝时会调用 then 方法来处理结果 x，并返回一个promise，其状态依赖处理结果 x。

``` javascript
promise.then(onFulfilled, onRejected)
```

1. 参数

   1. onFulfilled 和 onRejected 必须为函数，否则会被忽略

2. onFulfilled

   1. promise 状态变为 fulfilled 时，要调用then中的 onFulfilled() 方法，传入参数 value

3. onRejected

   1. promise 状态变为 rejected 时，调用 onRejected() 方法，传入参数 reason

4. onFulfilled 和 onRejected 共性

   1. 状态为 pending 时不可调用；
   2. 只允许调用一次；
   3. 应该是个微任务（通过 queueMicrotask 包装传入的回调实现）；

5. then() 方法可被多次调用

   1. then()方法执行时，会把回调添加到队列中，当状态从 pending 变为解决/拒绝时，会依次执行这些回调

6. then() 的返回值是个 promise

   1. `promise2 = promise1.then(onFulfilled, onRejected)`
   2. 调用 then 时，promise2 就已经创建，接下来有两种情况改变其状态：
      1. 当 onFulfilled 或 onRejected 正常传入，并执行返回结果 x 后，调用一个方法名为 resolvePromise 的处理函数，将结果 x 传参进去，promise2 就会根据结果解决或拒绝；
      2. onFulfilled 或 onRejected 未传入，则 promise2 根据 promise1 的 value/reason 触发状态变更 fulfilled/rejected

7. resolvePromise

   1. `resolvePromise(promise2, x, resolve, reject)`

   2. 情况一：promise2 和 x 是同一引用

      传入 promise2 是为了判断 x 是否就是 promise2，出现原因是 promise2 是 then 执行后立刻返回的，所以 then 中的回调函数是能访问到作用域链上端的该变量的，这种自己的状态等待自己状态变更才能变更的错误逻辑，会直接调用 reject(reason) 将 promise2 变为拒绝，reason 是 TypeError

   3. 情况二：x 是一个新的promise

      此时 promise2 取 x 的最终状态，因为promise可能还会得到promise，而promise2会在最后一个非promise处解决或拒绝

   4. 情况三：x 是一个对象或函数

      首先判断是否有 then 方法，没有直接拒绝，否则将其视为一个未执行 then 的 promise，在 x 环境中执行一下 then，由于其是用户自己实现的 then 方法，onFulfilled 中对结果 y 调用 resolvePromise，用以解决或拒绝 promise2；根据 promise 规范中的 then 方法对用户的 then 方法做判断并处理异常。

## 二、实现 Promise

这里为了看着更符合直觉，直接用 ES6 的类来实现，调用方法形如 `new MyPromise(...)`。

### 1. 先看着规范把实例结构搭出来

``` javascript
// 定义状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
// MyPromise类
class MyPromise {
  // 状态变更回调函数队列
  FULFILLED_CALLBACK_LIST = [];
  REJECTED_CALLBACK_LIST = [];
  constructor(fn) {
    // 实例属性1：状态
    this.status = PENDING; // 初始化是pending状态
    // 实例属性2：结果/原因
    this.value = null;
    this.reason = null;
  }
  resolve(value) {

  }
  reject(reason) {

  }
  then(onFulfilled, onRejected) {

  }
  resolvePromise(promise2, x, resolve, reject) {

  }
}
```

### 2. 实现 resolve 和 reject

这两个 api 调用时就是为了改变状态，状态变更后的逻辑放到 `set status() {}` 中实现，这样做的话 api 的工作更专一。

``` javascript
class MyPromise {
  constructor(fn) {
    // ...
    // 创建实例时就会调用传入的 fn 函数
    try {
      fn(
        this.resolve.bind(this),
        this.reject.bind(this)
      );
    } catch(err) {
      this.reject(err); // 非函数就拒绝
    }
  }
  resolve(value) {
    if(this.status === PENDING) {
      this.status = FULFILLED; // 变更状态
      this.value = value; // 保存值供后续逻辑使用
    }
  }
  reject(reason) {
    if(this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
    }
  }
}
```

### 3. 实现 then 方法

- 对回调进行兼容，透传 value/reason；
- then 方法返回 promise，根据状态决定如果回调处理逻辑；
- 回调要求是微任务，所以要对其封装一层；

``` javascript
function isFunction(param) {
  return typeof param === 'function';
}
class MyPromise {
  then(onFulfilled, onRejected) {
    /************* 1. 兼容回调 *************/
    // 若未传入回调，则 promise2 的状态和value/reason 都与 promise1 一致
    // 所以平时写的 catch 方法其实是 promise2 调用的，会将结果透传进去
    const realOnFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => {
      return value;
    };
    const realOnRejected = isFunction(onRejected) ? onRejected : reason => {
      throw reason;
    };
    /************* 2. 返回值是promise *************/
    const promise2 = new MyPromise((resolve, reject) => {
      /************* 3. 封装微任务，并用resolvePromise处理回调结果 *************/
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnFulfilled(this.value);
            // 根据then回调结果处理promise2
            this.resolvePromise(promise2, x, resolve, reject);
          } catch(err) {
            reject(err); // 若执行过程中报错，则直接拒绝
          }
        });
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnRejected(this.reason);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch(err) {
            reject(err);
          }
        });
      }
      /************* 4. 根据当前实例状态决定调用then的哪个回调 *************/
      switch(this.status) {
        case FULFILLED:
          fulfilledMicrotask(); // 若状态已为最终态，则直接执行回调
          break;
        case REJECTED:
          rejectedMicrotask();
          break;
        case PENDING:
          // 若状态是pending，则先缓存回调
          // 在pending状态变更之前，then可以被多次调用，所以要用队列来维护回调
          this.FULFILLED_CALLBACK_LIST.push(fulfilledMicrotask);
          this.REJECTED_CALLBACK_LIST.push(rejectedMicrotask);
      }
    });
    /************* 5. 返回promise *************/
    return promise2;
  }
}
```

### 4. 状态变更逻辑

当状态改变时，要清空执行回调列表，这里用setter监听变更，所以需要将实例属性status进行改造：

``` javascript
class MyPromise {
  constructor(fn) {
    // ...
    this._status = PENDING; // 原始变量
  }
  get status() { // getter
    return this._status;
  }
  set status(newStatus) { // setter
    this._status = newStatus;
    switch(newStatus) {
      case FULFILLED:
        this.FULFILLED_CALLBACK_LIST.forEach(callback => {
          callback(this.value);
        });
        break;
      case REJECTED:
        this.REJECTED_CALLBACK_LIST.forEach(callback => {
          callback(this.reason);
        });
        break;
    }
  }
}
```

### 5. 实现 resolvePromise

这个函数是对 then 中回调结果 x 分情况讨论，不同情况会解决或拒绝 then 返回的 promise2；情况比较多，所以需要多加练习并记忆：

``` javascript
resolvePromise(promise2, x, resolve, reject) {
  /*********** 情况1：是自己 ***********/
  if(promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }
  /*********** 情况2：是promise ***********/
  if(x instanceof MyPromise) {
    x.then((y) => {
      // 递归下去，直到遇到第一个非promise，promise2就会解决/拒绝
      this.resolvePromise(promise2, y, resolve, reject);
    }, reject);
  } else if (typeof x === 'object' && x !== null || isFunction(x)) {
    /*********** 情况3：引用类型，判断是否为thenable ***********/
    // 获取结果上的then方法
    let then = null;
    try {
      then = x.then;
    } catch(err) {
      return reject(err); // 防止用户写个会抛错的getter
    }
    // 判断是否为thenable
    if(isFunction(then)) {
      let called = false;
      // 由于是thenable，就当 x是其他符合规范的 Promise的实例
      // 所以then要在实例环境进行才能正确拿到this.value等
      try {
        then.call(
          x,
          y => {
            if(called) return; // 方法不能重复调用
            called = true;
            this.resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if(called) return;
            called = true;
            reject(r);
          }
        );
      } catch(err) {
        // 防止then中调用完onFulfilled(value)后抛个错之类的情况
        if(called) return;
        reject(err);
      }
    } else {
      resolve(x); // 普通引用类型直接解决
    }
  } else {
    /*********** 情况4：基础类型 ***********/
    resolve(x); // 基本类型直接解决
  }
}
```

### 6. 补充上实例方法 catch

上述5点，其实已经能跑如下测试了：

``` javascript
const test = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('解决');
	}, 1000);
}).then(console.log);

console.log('同步代码');

setTimeout(() => {
  console.log('宏任务');
}, 2000);
```

结果如图：

![image-20220112102902064](https://s2.loli.net/2022/01/12/laDVdKyjPAtF315.png)

不过，完整的 promise 实例还包括 catch、finally 方法，catch() 其实就是 then() 方法仅传入第二个错误处理回调的包装函数，目的是更加重点关注异步调用的错误而非结果；

而 finally() 方法是不管状态如何都执行回调，需要注意的是，finally 仅表示完成，但状态未知，也就不能给用户提供value 或 reason，因为没法做区分，所以不能给回调带参数；而且 finally 还有另一个特性，就是当回调未报错或者不是一个 rejected 状态的 promise 时，finally 的返回值要求是个能透传原 promise 结果的 promise，具体可见代码注释：

``` javascript
catch(onRejected) {
  return this.then(null, onRejected);
}
finally(cb) {
  // 无论状态如何，都执行回调，且返回值是个 promise，那么自然想到用 then(cb, cb)
  // 但 finally 有两个要求，1. 回调不能带参数，2. 透传原promise结果
  // 所以不难想到封装一层函数
  // 但需要注意的是，若 cb 返回个promise，则需等待promise状态解决才能改变为透传结果
  // 所以这里用Promise.resolve()包一层兼容 cb是 promise的情况
  return this.then(
    value => {
      // cb()解决会透传数据，拒绝会走常规流程，即暴露 cb自己的 reason
      return MyPromise.resolve(cb()).then(() => value);
    },
    reason => {
      // cb()解决才会透传原 promise的 reason，供后续 catch使用
      // 拒绝会走常规流程，即暴露 cb自己的 reason
      return MyPromise.resolve(cb()).then(() => { throw reason });
    });
}
```

### 7. 补充上类静态方法 resolve、reject、race、all

除了实例用法，Promise 类本身有几个常见静态方法：

- `Promise.all(list: iterable)`：all 方法传入可迭代结构如数组，每项可以是任意类型或promise，内部会将所有项转化为期约，返回值是个 promise，当所有结果都正确返回后才会解决，有任意一个期约项为 reject 则返回值的 promise 就是拒绝；若要所有结果，哪怕是某项状态为 rejected，那就用 `Promise.allSettled()`
- `Promise.race(list: iterable)`：传参同 all 方法，返回值也是 promise，区别是当某项期约解决或拒绝后，结果就直接解决或拒绝，其结果就是这个最先完成的期约value或reason
- `Promise.resolve(promise | thenable | any)`：返回一个promise，状态视传入值而定，若传入的是 promise则幂等返回原promise，若为thenable，则执行 then 方法，promise 状态跟随 then 的结果；若是其他类型值，则返回的 promise 的状态直接为 fulfilled，value值就是传入的数据
- `Promise.reject(promise | thenable | any)`：返回一个状态为 rejected 的 promise，reason值就是传入的参数

还有 `Promise.allSettled()`，`Promise.any()` 这两个方法和 Promise.all() 类似，且面试题也会出一些变种，比如任务有优先级的概念等，这个等之后总结面试题专题时再写，因为问原理时一般只会问到 then() 方法，所以这里先简单实现 Promise.all() 和 Promise.race()，另外2个 api 以及变种面试题之后再讨论。

``` javascript
/************* Promise.resolve(value) *************/
static resolve(value) {
  // 若已经是promise，则幂等返回
  if (value instanceof MyPromise) {
    return value;
  }
  // 否则返回一个promise，状态依赖value
  return new MyPromise((resolve) => {
    resolve(value);
  });
}
/************* Promise.reject(reason) *************/
static reject(reason) {
  // 返回一个拒绝的promise，注意是个新的 promise
  return new MyPromise((resolve, reject) => {
    reject(reason);
  });
}
  /************* Promise.race(list) *************/
  static race(anyList) {
    return new MyPromise((resolve, reject) => {
      const len = anyList.length;
      if(len === 0) {
        resolve(); // 无数据时直接返回一个空promise
      } else {
        for(let i = 0; i < len; i++) {
          MyPromise.resolve(anyList).then(
            value => {
              resolve(value); // 只要有某项解决就将结果解决
            },
            reason => {
              reject(reason); // 只要有某项拒绝就将结果拒绝
            }
          );
        }
      }
    })
  }
  /************* Promise.all(list) *************/
  static all(anyList) { // 1. all是静态方法
    // 2. 返回值是promise
    return new MyPromise((resolve, reject) => {
      // 3. 参数类型判断，需要传入可迭代结构
      if(!anyList || typeof anyList[Symbol.iterator] !== 'function') {
        return reject(new TypeError('arguments must be iterable'));
      }
      const len = anyList.length;
      const res = [];
      let counter = 0;

      for(let i = 0; i < len; i++) {
        // 4. 参数类型期约化
        MyPromise.resolve(anyList[i]).then(value => {
          counter++;
          // 5. 不能用push，因为结果顺序与参数一一对应
          res[i] = value;
          // 等待所有结果成功返回后解决期约
          if(counter === len) {
            resolve(res);
          }
        }).catch(reason => {
          reject(reason);
        });
      }
    }); 
  }
```

跑一段测试代码：

``` javascript
const p1 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
})
const p2 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(2);
  }, 2000);
})
const p3 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(3);
  }, 3000);
})
Promise.all([p2, p1, p3]).then(res => {
  console.log('all_成功 ', res);
}).catch(e => {
  console.log('all_失败 ', e);
});
Promise.race([p2, p1, p3]).then(res => {
  console.log('race_成功 ', res);
}).catch(e => {
  console.log('race_失败 ', e);
});
```

![image-20220112145417707](https://s2.loli.net/2022/01/12/SjIFAe4HXN9fuY8.png)

拒绝期约的测试代码可以自己改动，不再赘述。

## 三、总结

至此已初步根据规范实现了一个简单的Promise，细节并没有考究很细，比如参数类型的校验，兼容性的考究，以及全部静态方法的实现等等；因为我想传达的是，Promise原理为何每篇文章实现都不一样，为啥一定要有 then 方法，或为啥有那么多 try-catch，这一切让人难以理解或记忆的原因，就是有一个东西叫PromiseA+规范，规范就像试卷上的题目，要求是啥样，就得实现成啥样；理解了这个大前提，代码实现方式是否严谨优雅，就完全看你自己和面试官要求了。剩下的 allSettled() 和 any() 方法，以及并发请求的变种面试题，会在之后总结，因为大致思路都相似，且 Promise 原理考察也不太会关心这几个类似的api，因此将这一类整理到一起再总结。

我自己用 node 17.3.1 版本跑通了所有测试，可能实现的地方都疏漏之处，望大家帮忙指正，不胜感激。之前看过很多文章，发现我不理解的地方，别人都会一嘴带过，有的博客甚至就是复制粘贴，没经过自己的思考，可想而知我看到这些文章时脑袋是有多大。话虽如此，我自己总结的这篇文章也会有让人不理解的地方，不过准确性还是能保证的，有不理解的地方可以给我评论留言，我会一一解答的，源码放到了下面的参考链接中。

## 四、参考

> [MDN，关于Promise API 的准确描述](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)
>
> [Promise/A+ 规范](https://promisesaplus.com/)

