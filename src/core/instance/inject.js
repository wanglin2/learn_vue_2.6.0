/* @flow */

import { hasOwn } from '../../shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 14:20:43 
 * @Desc: 初始化依赖提供 
 */
export function initProvide (vm) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 14:07:34 
 * @Desc: 初始化依赖注入 
 */
export function initInjections (vm) {
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      defineReactive(vm, key, result[key])
    })
    toggleObserving(true)
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 14:10:19 
 * @Desc: 处理注入 
 */
export function resolveInject (inject, vm) {
  if (inject) {
    const result = Object.create(null)
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)
    // 遍历inject对象的属性，每个属性代表是注入的一个依赖
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 跳过被观察过的注入对象...
      if (key === '__ob__') continue
      const provideKey = inject[key].from
      let source = vm
      // 从当前实例，依次往上查找，直到某个实例的provide提供了对应的inject
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      // 如果一个实例都没有
      if (!source) {
        // 如果存在default属性，那么使用default的属性值
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        }
      }
    }
    return result
  }
}
