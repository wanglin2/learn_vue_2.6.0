/* @flow */

import {
  warn,
  invokeWithErrorHandling
} from '../../../core/util/index'
import {
  cached,
  isUndef,
  isTrue,
  isPlainObject
} from '../../../shared/util'

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 10:55:42 
 * @Desc: 序列化事件 
 */
const normalizeEvent = cached((name) => {
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first最后加前缀，首先选中
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})

export function createFnInvoker (fns, vm) {
  function invoker () {
    const fns = invoker.fns
    if (Array.isArray(fns)) {
      const cloned = fns.slice()
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`)
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`)
    }
  }
  invoker.fns = fns
  return invoker
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 10:53:01 
 * @Desc: 更新事件监听器 
 */
export function updateListeners (
  on,
  oldOn,
  add,
  remove,
  createOnceHandler,
  vm
) {
  let name, cur, old, event
  // 遍历新的事件对象
  for (name in on) {
    cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)// 序列化事件
    if (isUndef(old)) {// 原来没有该事件
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm)
      }
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture)
      }
      add(event.name, cur, event.capture, event.passive, event.params)
    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
