// 定义状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function isFunction(param) {
  return typeof param === 'function';
}

class MyPromise {
  // ! 写constructor外不加static前缀的也是实例属性，需要用this访问
  _status = PENDING;
  // 状态变更回调函数队列
  FULFILLED_CALLBACK_LIST = [];
  REJECTED_CALLBACK_LIST = [];
  constructor(fn) {
    // 实例属性2：结果/原因
    this.value = null;
    this.reason = null;
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
  get status() {
    return this._status;
  }
  set status(newStatus) {
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
  then(onFulfilled, onRejected) {
    // 若未传入回调，则 promise2 的状态和value/reason 都与 promise1 一致
    // 所以平时写的 catch 方法其实是 promise2 调用的，会将结果透传进去
    const realOnFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => {
      return value;
    };
    const realOnRejected = isFunction(onRejected) ? onRejected : reason => {
      throw reason;
    };
    const promise2 = new MyPromise((resolve, reject) => {
      // 封装微任务
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
      // 根据当前实例状态决定调用then的哪个回调
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
    return promise2;
  }
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
  resolvePromise(promise2, x, resolve, reject) {
    /*********** 情况1：是自己 ***********/
    if(promise2 === x) {
      return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
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
      resolve(x); // 基本类型直接解决
    }
  }
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
}
/* 测试代码 */
/*******************************************************/
// const test = new MyPromise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('解决');
// 	}, 1000);
// }).finally(res => {
//   // throw new Error(1);
//   console.log(res)
//   return new MyPromise((resolve, reject) => {
//     setTimeout(() => {
//       resolve('finally解决')
//     }, 2000)
//   })
// })
// test.then(res => {
//   console.log('then', res)
// })
// test.catch(e => {
//   console.log('catch', e);
// })
/*******************************************************/
// console.log('同步代码');

// setTimeout(() => {
//   console.log('宏任务');
// }, 2000);
// console.log(1, test);
// const test2 = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('解决2');
// 	}, 1000);
// }).finally(res => {
//   return Promise.reject(33);
// })
// test2.then(res => {
//   console.log(55, res)
// })
// test2.catch(e => {
//   console.log(44, e);
// })
/*******************************************************/
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