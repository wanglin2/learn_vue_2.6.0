/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, {
  pushTarget,
  popTarget
} from '../observer/dep'
import {
  isUpdatingChildComponent
} from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 16:01:44 
 * @Desc: 代理，将对target的key属性访问，代理到target的sourceKey的key访问 
 */
export function proxy(target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 14:46:28 
 * @Desc: 初始化状态 
 */
export function initState(vm) {
  vm._watchers = []// 声明了一个存放watcher的数组
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */ )
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 14:48:40 
 * @Desc: 初始化props 
 */
function initProps(vm, propsOptions) {
  // propsData：创建实例时传递 props。主要作用是方便测试，只用于 new 创建的实例中
  const propsData = vm.$options.propsData || {}
  // 存储props
  const props = vm._props = {}
  // 缓存prop的key，这样在后面更新prop时可以通过遍历数组，而不是枚举动态对象的属性
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // 根实例的props需要被观察
  if (!isRoot) {
    toggleObserving(false)
  }
  // 遍历所有prop
  for (const key in propsOptions) {
    keys.push(key)
    // 校验props，返回其默认值
    const value = validateProp(key, propsOptions, propsData, vm)
    defineReactive(props, key, value)
    // 在Vue.extend（）期间，静态prop已在组件的原型上代理。我们只需要在这里代理实例化时定义的prop
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

function initData(vm) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function' ?
    getData(data, vm) :
    data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */ )
}

export function getData(data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

const computedWatcherOptions = {
  lazy: true
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 16:32:04 
 * @Desc: 初始化计算属性 
 */
function initComputed(vm, computed) {
  // 保存用于计算属性的watcher
  const watchers = vm._computedWatchers = Object.create(null)

  for (const key in computed) {
    // 计算属性支持两种写法：普通函数、对象形式：{ get: Function, set: Function }
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get

    // 创建一个内部的 watcher 
    watchers[key] = new Watcher(
      vm,
      getter || noop,
      noop,
      {
        lazy: true
      }
    )

    // 组件定义的计算属性已在组件原型上定义。我们只需要在这里定义实例化时定义的计算属性。
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    }
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 16:47:02 
 * @Desc: 定义计算属性 
 */
export function defineComputed(
  target,
  key,
  userDef
) {
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get ?
      shouldCache && userDef.cache !== false ?
      createComputedGetter(key) :
      createGetterInvoker(userDef.get) :
      noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
    sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this)
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 16:20:35 
 * @Desc: 初始化方法 
 */
function initMethods(vm, methods) {
  for (const key in methods) {
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 16:51:26 
 * @Desc: 初始化watch 
 */
function initWatch(vm, watch) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-19 19:04:01 
 * @Desc: 创建watcher 
 */
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

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-19 19:16:50 
 * @Desc: 代理data和prop数据、定义$set、$delete、$watch方法 
 */
export function stateMixin(Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  // 流在某种程度上与直接声明的定义对象存在问题当使用Object.defineProperty时，我们必须按程序建立这里的物体。
  const dataDef = {}
  dataDef.get = function () {
    return this._data
  }
  const propsDef = {}
  propsDef.get = function () {
    return this._props
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

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
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn() {
      watcher.teardown()
    }
  }
}
