const FULFILLED = 'fulfilled',
      REJECTED = 'rejected',
      PENDING = 'pending';

function isFunction(param) {
  return typeof param === 'function';
}
class MyPromise {
  constructor(executor) {
    this._status = PENDING;
    this.value = null;
    this.reason = null;
    this.FULFILLED_CALLBACK_LIST = [];
    this.REJECTED_CALLBACK_LIST = [];
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch(e) {
      this.reject(e);
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
    if(this.status == PENDING) {
      this.status = FULFILLED;
      this.value = value;
    }
  }
  reject(reason) {
    if(this.status == PENDING) {
      this.status = REJECTED;
      this.reason = reason;
    }
  }
  then(onFulfilled, onRejected) {
    let realOnFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => {
      return value;
    }
    let realOnRejcted = isFunction(onRjected) ? onRejected : reason => {
      return reason;
    }
    let promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicroTask = () => {
        queueMicrotask(() => {
          try {
            let x = realOnFulfilled(this.value);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch(e) {
            reject(e);
          }
        });
      }
      let rejectedMicroTask = () => {
        queueMicroTask(() => {
          try {
            let x = realOnRejcted(this.reason);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch(e) {
            reject(e);
          }
        })
      }
      switch(this.status) {
        case FULFILLED:
          fulfilledMicroTask();
          break;
        case REJECTED:
          rejectedMicroTask();
          break;
        case PENDING:
          this.FULFILLED_CALLBACK_LIST.push(fulfilledMicroTask);
          this.REJECTED_CALLBACK_LIST.push(rejectedMicroTask);
      }
    });
    return promise2;
  }
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  finally(cb) {
    return this.then(
      (value) => {
        MyPromise.resolve(cb()).then(() => { return value })
      },
      (reason) => {
        MyPromise.resolve(cb()).then(() => { throw reason; })
      }
    )
  }
  resolvePromise(promise2, x, resolve, reject) {
    if(x === promise2) {
      return reject(new TypeError('chaing cycle for x and promise2.'));
    }
    if(x instanceof MyPromise) {
      x.then(y => {
        this.resolvePromise(promise2, y, resolve, reject);
      }, reject);
    } else if(typeof x === 'object' && x !== null || isFunction(x)) {
      let then;
      try {
        then = x.then;
      } catch(e) {
        reject(e);
      }
      if(isFunction(then)) {
        let called = false;
        try {
          then.call(x, y => {
            if(called) return;
            called = true;
            this.resolvePromise(promise2, y, resolve, reject);
          }, r => {
            if(called) return;
            called = true;
            reject(r);
          });
        } catch(e) {
          if(called) return;
          reject(e);
        }
      } else {
        resolve(x);
      }
    } else {
      resolve(x);
    }
  }
  static resolve(x) {
    if(x instanceof MyPromise) {
      return x;
    }
    return new MyPromise((resolve, reject) => {
      resolve(x);
    })
  }
  static reject(x) {
    return new MyPromise((resolve, reject) => {
      reject(x);
    })
  }
  static all(anyList) {
    return new MyPromise((resolve, reject) => {
      if(!anyList || typeof anyList[Symbol.iterator] != 'function') {
        return reject(new TypeError('arguments must be iterable.'));
      }
      let res = [],
          count = 0,
          len = anyList.length;
      for(let i = 0; i < len; i++) {
        MyPromise.resolve(anyList[i]).then(value => {
          count++;
          res[i] = value;
          if(count == len) {
            resolve(res);
          }
        }).catch(e => {
          reject(e);
        })
      }
    })
  }
  static race(anyList) {
    return new MyPromise((resolve, reject) => {
      if(!anyList || typeof anyList[Symbol.iterator] != 'function') {
        return reject(new TypeError('arguments must be iterable.'));
      }
      if(anyList.length == 0) {
        return;
      }
      for(let i = 0, len = anyList.length; i < len; i++) {
        MyPromise.resolve(anyList[i]).then(value => {
          resolve(value);
        }).catch(r => reject(r));
      }
    })
  }
}