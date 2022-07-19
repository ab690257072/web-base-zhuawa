// 定义状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function isFunction(param) {
  return typeof param === 'function';
}

function queueMicrotask(fn) {
  setTimeout(() => {
    fn()
  }, 100)
}

class MyPromise {
  constructor(fn) {
    this._status = PENDING
    this.value = null
    this.reason = null
    this.FULFILLED_CALLBACK_LIST = [];
    this.REJECTED_CALLBACK_LIST = [];
    // 实例化promise时就会调用执行器
    try {
      fn(
        this.resolve.bind(this),
        this.reject.bind(this)
      );
    } catch(err) {
      this.reject(err); // 非函数的话拒绝期约
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
          callback();
        });
        break;
      case REJECTED:
        this.REJECTED_CALLBACK_LIST.forEach(callback => {
          callback();
        });
        break;
    }
  }
  resolve(value) {
    if(this.status === PENDING) {
      this.status = FULFILLED; // 变更状态
      this.value = value; // 保存值
    }
  }
  reject(reason) {
    if(this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
    }
  }
  then(onFulfilled, onRejected) {
    // 先判断参数是否为函数
    const realOnFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => {
      return value;
    }
    const realOnRejected = isFunction(onRejected) ? onRejected : (reason) => {
      return reason;
    }
    const promise2 = new MyPromise((resolve, reject) => {
      // 封装微任务
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = realOnFulfilled(this.value);
            this.resolvePromise(promise2, x, resolve, reject); // 根据回调值决定期约结果
          } catch(err) {
            reject(err); // then回调报错则返回拒绝的期约
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
      switch(this.status) {
        case FULFILLED:
          fulfilledMicrotask();
          break;
        case REJECTED:
          rejectedMicrotask();
          break;
        case PENDING: // 状态未变更，则缓存微任务
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
    // 1. 函数返回期约
    // 2. 返回的期约要能拿到value或reason
    // 3. cb可不带参数
    // 4. 若cb是期约则需等待其异步执行完才能返回结果
    // 由于需要透传value或reason，并返回期约，所以使用then，因为这就是then的功能
    // 由于cb不可控，但要透传value或reason，所以cb不作为then回调，而是包装一层函数并返回value或reason
    return this.then(
      value => {
        return Promise.resolve(cb()).then(() => value);
      },
      reason => {
        return Promise.resolve(cb()).then(() => { throw reason }); // 新期约仍然是拒绝状态
      }
    );
  }
  resolvePromise(promise2, x, resolve, reject) {
    // 情况1：是自己
    if(promise2 === x) {
      return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
    }
    // 情况2：是promise
    if(x instanceof MyPromise) {
      x.then((y) => {
        // 递归下去，直到不再是期约
        this.resolvePromise(promise2, y, resolve, reject);
      }, reject);
    }
    // 情况3：thenable对象或函数
    if(typeof x === 'object' && x != null || isFunction(x)) {
      let then = null;
      // 尝试拿then方法
      try {
        then = x.then;
      } catch(err) {
        return reject(err);
      }
      // 判断then是否为有效函数
      if(isFunction(then)) {
        let called = false;
        try {
          then.call(
            x,
            y => {
              if(called) return; // thenable的回调只能执行一次
              called = true;
              this.resolvePromise(promise2, y, resolve, reject);
            },
            r => {
              if(called) return;
              called = true;
              reject(r);
            }
          )
        } catch(err) {
          if(called) return; // 加不加都行，先背下来
          reject(err);
        }
      } else { // 情况4：常规引用类型
        resolve(x); // 直接解决
      }
    } else { // 情况5：基本类型
      resolve(x); // 直接解决
    }
  }
  // 静态方法
  static resolve(value) {
    if(value instanceof MyPromise) { // 是期约直接返回
      return value;
    }
    return new MyPromise((resolve) => { // 其他类型返回解决的期约
      resolve(value);
    });
  }
  static reject(reason) {
    return new MyPromise((resolve, reject) => { // 返回一个新的拒绝期约
      reject(reason);
    });
  }
  static all(anyList) {
    // 返回新期约
    return new MyPromise((resolve, reject) => {
      // 判断参数是否为可迭代结构
      if(!anyList || typeof anyList[Symbol.iterator] != 'function') {
        return reject(new TypeError('arguments must be iterable.')); // 参数不对直接返回不用执行下面逻辑
      }
      const len = anyList.length,
            res = [],
            counter = 0;
      for(let i = 0; i < len; i++) {
        MyPromise.resolve(anyList[i]).then(value => {
          counter++;
          res[i] = value; // 不要用push，因为异步结果返回顺序可能不一样
          if(counter === len) { // 不要用res.length判断，因为用索引赋值时数组会扩容
            resolve(res);
          }
        }).catch(reason => {
          reject(reason);
        });
      }
    });
  }
  static race(anyList) {
    // 返回新期约
    return new MyPromise((resolve, reject) => {
      // 判断参数是否为可迭代结构
      if(!anyList || typeof anyList[Symbol.iterator] != 'function') {
        return reject(new TypeError('arguments must be iterable.'));
      }
      const len = anyList.length;
      if(len === 0) { // 无数据时，期约要固定为pending
        return;
      } else {
        for(let i = 0; i < len; i++) {
          MyPromise.resolve(anyList[i]).then(
            value => {
              resolve(value);
            },
            reason => {
              reject(reason);
            }
          );
        }
      }
    });
  }
}
// for test
/**
 * 情况2：promise2 === x
 */
//  const p2 = new MyPromise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(1);
//   }, 1000);
// })
// let promise2 = p2.then(value => {
//   return promise2;
// })
// console.log(111, promise2);
// setTimeout(() => {
//   console.log(222, promise2);
// }, 1100)

// /**
//  * 情况3：thenable
//  */
// let obj1 = {};
// // 访问then出错
// Object.defineProperty(obj1, 'then', {
//   get() {
//     throw new Error('访问then就报错')
//   }
// })
// // 执行then报错
// let obj2 = {
//   then() {
//     throw new Error('执行then就报错')
//   }
// }
// // 正常执行
// let obj3 = {
//   then(onFulfilled, onRejected) {
//     onFulfilled(33)
//   }
// }
// // 测试
// const p3 = new MyPromise((resolve, reject) => {
//   resolve(1);
// })
// let promise3 = p3.then(value => {
//   // return obj1
//   return obj2
//   // return obj3
// })
// setTimeout(() => {
//   console.log(promise3);
// }, 100)
// promise3.then(value => {
//   console.log(1, value);
// }).catch(reason => {
//   console.log(2, reason);
// })
/**
 * 情况4：常规对象或null
 */;
 const p4 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
})
let promise4 = p4.then(value => {
  return {};
})
promise4.then(value => {
  console.log(1, value);
})
// /**
//  * 情况5：基础类型
//  */
//  const p5 = new MyPromise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(1);
//   }, 1000);
// })
// let promise5 = p5.then(value => {
//   return 5;
// })