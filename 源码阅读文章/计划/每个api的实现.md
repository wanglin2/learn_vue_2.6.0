[TOC]

# $watch()

`$watch`方法是挂载在`Vue`原型上的一个方法，用来观察实例上的一个表达式或者函数的计算结果的变化，实现很简单，内部就是实例化了一个`Watcher`实例：

```js
  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    const vm = this
    if (isPlainObject(cb)) {
      // createWatcher方法会从对象里解析出cb，options，然后又会重新调用$watch方法
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 如果指定了immediate那么会立即调用一次回调函数
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {}
    }
    // 返回一个解除观察的方法
    return function unwatchFn () {
      watcher.teardown()
    }
  }
```

`$watch`方法第二个参数可以传函数也可以传递一个对象，比如：

```js
{
    deep: true,
    handler: 'method1'
}
```

所以`createWatcher`就是针对这种情况做一下处理，最终调用的还是`$watch`方法：

```js
function createWatcher(
  vm,
  expOrFn,
  handler,
  options
) {
  // {handler: '', deep...}
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  // 回调是字符串的话，那么一般指methods里的方法
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
```



# Vue.set()

`Vue.set`和`vm.$set`是同一个方法，用来在响应式对象中添加一个新的属性，确保该属性也是响应式的，并且会触发视图的更新。

我们都知道在数据响应式处理结束后我们再给对象添加的属性是不带响应性的，数组通过下标来赋值也是一样，所以`Vue`通过该方法来支持让我们动态添加属性。

内部实现上，如果是给数组设置很简单，因为`Vue`已经拦截了数组的所有方法，包括`splice`，这个方法既可以删除元素又可以添加元素，刚好符合要求，对象的话稍微麻烦一点，直接看代码：

```js
export function set (target, key, val) {
  // 数组直接调用splice方法插入元素
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  // 如果该属性已经在目标对象上了那么直接更新它的值即可
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = target.__ob__
  // Vue不允许给Vue实例和实例的data选项动态添加属性，
  /*
    {
      data: {
        a: {}
      }
    }
    直接给data添加属性是不行的，但是给data.a添加是可以的
  */
  if (target._isVue || (ob && ob.vmCount)) {
    return val
  }
  // ob代表该数据的观察者实例，如果没有则代表该对象并不是一个响应式对象，那么直接设置属性即可
  if (!ob) {
    target[key] = val
    return val
  }
  // 否则就是给一个响应式对象设置新属性，那么使用defineReactive方法来观察新属性
  defineReactive(ob.value, key, val)
  // 通知该对象的依赖进行更新
  ob.dep.notify()
  return val
}
```

新添加的属性也需要给它添加响应性，也就是对它进行劫持，使用的是`defineReactive`方法，这个方法会使用`Object.defineProperty`方法给对象的属性设置`get`和`set`拦截，在`get`的时候会收集该属性的依赖，在`set`时通知它的依赖更新：

```js

```



