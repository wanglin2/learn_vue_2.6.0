/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import {
  arrayMethods
} from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * 在某些情况下，我们可能希望禁用组件更新计算中的观察。
 */
export let shouldObserve = true

export function toggleObserving(value) {
  shouldObserve = value
}

/**
 * 附加到每个观察对象的观察者类，一旦观察成功，那么会把目标对象的属性key转换成getter/setter的形式，用于收集依赖和派发更新。
 */
export class Observer {
  value;
  dep;
  vmCount; // 使用该对象作为根数据的vm数量

  constructor(value) {
    // 目标对象
    this.value = value
    // 实例化一个依赖收集对象
    this.dep = new Dep()
    // vm数量
    this.vmCount = 0
    // 给目标对象添加一个被观察过了的标志
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      // 如果浏览器支持使用__proto__属性
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * 遍历所有属性，将它们转换成getter/setters，只有在值是对象时才调用该方法
   */
  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * 观察数组项的列表项
   */
  observeArray(items ) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// 工具函数

/**
 * 通过使用__proto__拦截原型链来扩充目标对象或数组
 */
function protoAugment(target, src) {
  target.__proto__ = src
}

/**
 * 通过定义隐藏属性来扩充目标对象或数组。
 */
function copyAugment(target, src, keys ) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * 尝试给一个值创建一个观察者实例，如果观察成功，则返回新的观察者，或者返回现有的观察者（如果该值已经观察过）
 */
export function observe(value, asRootData) {
  // 如果不是对象或者是虚拟dom对象则返回
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob
  // 存在__ob__属性则代表该对象之前已经观察过了
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&// 当前允许进行观察
    (Array.isArray(value) || isPlainObject(value)) &&// 只允许对数组和简单对象进行观察
    Object.isExtensible(value) &&// 并且该对象是可开展的，即可以给它添加新属性
    !value._isVue// 最后它不能是Vue实例
  ) {
    ob = new Observer(value)
  }
  // 统计有多少个Vue实例对象将该对象作为根数据
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-20 09:37:09 
 * @Desc: 给一个对象添加响应式属性 
 */
export function defineReactive(
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  // 实例化一个dep，用来收集依赖，通过闭包保存
  const dep = new Dep()
  // 获取该属性原来的属性描述符
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果该属性是不可配置的，那么直接返回
  if (property && property.configurable === false) {
    return
  }
  // 保存属性原有的set和get
  const getter = property && property.get
  const setter = property && property.set
  // 如果没有传递val，且getter不存在或setter存在，那么val取当前对象上的值
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  // 如果该属性的值又是一个对象或数组，那么也需要递归进行观察
  let childOb = !shallow && observe(val)
  // 定义get和set
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      console.log('get',key)
      const value = getter ? getter.call(obj) : val
      // 依赖收集
      if (Dep.target) {
        // 该属性的依赖收集
        dep.depend()
        if (childOb) {
          // 对属性值的observer实例的dep也进行依赖收集
          childOb.dep.depend()
          // 值为数组的话遍历数组项进行依赖收集
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      console.log('set',key)
      const value = getter ? getter.call(obj) : val
      // 值没有变化则直接返回
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      // #7981: 对于不带setter的访问器属性
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 观察新的值
      childOb = !shallow && observe(newVal)
      // 触发更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set(target, key, val) {
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

/**
 * Delete a property and trigger change if necessary.
 */
export function del(target, key) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 * 在接触数组时收集对数组元素的依赖关系，因为我们不能像属性获取程序那样拦截数组元素访问。
 */
function dependArray(value) {
  console.log('dependArray函数已注释')
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
