const PENDING = 'pending',
      FULFILLED = 'fulfilled',
      REJECTED = 'rejected';

function isFunction(fn) {
  return typeof fn === 'function';
}
class MyPromise {
  ONFULFILLED_CALLBACK_LIST = [];
  ONREJECTED_CALLBACK_LIST = [];
  constructor(fn) {
    this._status = PENDING;
    this.value = null;
    this.reason = null;
    try {
      fn((this.resolve.bind(this), this.reject.bind(this)));
    } catch(err) {
      // ! this.reject(err);
      // throw err;
      
    }
  }
  get status() {
    return this._status;
  }
  set status(newStatus) {
    this._status = newStatus;
    switch(newStatus) {
      case FULFILLED:
        this.ONFULFILLED_CALLBACK_LIST.forEach(callback => callback());
        break;
      case REJECTED:
        this.ONREJECTED_CALLBACK_LIST.forEach(callback => callback());
        break;
    }
  }
  resolve(value) {
    if(this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
    }
  }
  reject(reason) {
    if(this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
    }
  }
  then(onFulfilled, onRejected) {
    const realOnFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value;
    const realOnRejected = isFunction(onRejected) ? onRejected : reason => {
      throw reason;
    }
    const promise2 = new MyPromise((resolve, reject) => {
      const onFulfilledMicrotask = () => {
        queueMicrotask(() => {
          // ! 执行回调时，要加try-catch
          // let x = realOnFulfilled(this.value);
          // this.resolvePromise(promise2, x, resolve, reject);
          try {
            let x = realOnFulfilled(this.value);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch(err) {
            reject(err);
          }
        });
      }
      const onRejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            let x = realOnRejected(this.reason);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch(err) {
            reject(err);
          }
        });
      }
      switch(this.status) {
        case PENDING:
          this.ONFULFILLED_CALLBACK_LIST.push(onFulfilledMicrotask);
          this.ONREJECTED_CALLBACK_LIST.push(onRejectedMicrotask);
          break;
        case FULFILLED:
          onFulfilledMicrotask();
          break;
        case REJECTED:
          onRejectedMicrotask();
          break;
      }
    });
    return promise2;
  }
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  finally(cb) {
    return this.then(
      value => MyPromise.resolve(cb()).then(() => value),
      reason => MyPromise.resolve(cb()).then(() => {
        throw reason;
      })
    );
  }
  resolvePromise(promise2, x, resolve, reject) {
    if(promise2 === x) {
      return reject(new TypeError('chaining cycle promise'));
    }
    if(x instanceof MyPromise) {
      // ! promise的错误会被处理，所以不用包try-catch
      try {
        // ! then的第二个参数要传入reject
        return x.then(y => {
          this.resolvePromise(promise2, y, resolve, reject);
        });
      } catch(err) {
        return reject(err);
      }
      return x.then(y => {
        this.resolvePromise(promise2, y, resolve, reject);
      }, reject);
    }
    if(typeof x === 'object' && x !== null || isFunction(x)) {
      let then = null;
      try {
        then = x.then;
      } catch(err) {
        return reject(err);
      }
      if(isFunction(then)) {
        // ! 要有called变量，因为thenable中的回调只能调用一次
        try {
          // ! then要在x作用域中执行
          return then.call(x, y => {
            if(called) return;
            called = true;
            this.resolvePromise(promise2, y, resolve, reject);
          });
        } catch(err) {
          if(called) return;
          called = true;
          reject(err);
        }
      } else {
        if(called) return;
        resolve(x);
      }
    } else {
      resolve(x);
    }
  }
  static resolve(value) {
    if(value instanceof MyPromise) {
      return value;
    }
    return new MyPromise((resolve, reject) => {
      resolve(value);
    });
  }
  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
  }
  static all(list) {
    if(!list ||typeof list[Symbol.iterator] !== 'function') {
      throw TypeError('list must be iterable.');
    }
    let res = [],
        count = 0,
        len = list.length;
    for(let i = 0; i < len; i++) {
      MyPromise.resolve(list[i]).then(x => {
        res[i] = x;
        // ! 忘记了count自增
        if(count === len) {
          resolve(res);
        }
      }).catch(err => reject(err));
    }
  }
  static race(list) {
    // ! iterator判断应该为函数
    if(!list || typeof list[Symbol.iterator] !== 'function') {
      throw TypeError('list must be iterable.');
    }
    // ! race应该返回promise
    // ! list长度为0时，应该直接解决
    for(let i = 0; i < list.length; i++) {
      MyPromise.resolve(list[i])
        .then(x => resolve(x))
        .catch(err => reject(err));
    }
  }
}