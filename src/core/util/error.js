/* @flow */

import config from '../config'
import { warn } from './debug'
import { inBrowser, inWeex } from './env'
import { isPromise } from '../../shared/util'

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 13:57:16 
 * @Desc: 错误处理 
 */
export function handleError (err, vm, info) {
  if (vm) {
    let cur = vm
    while ((cur = cur.$parent)) {
      const hooks = cur.$options.errorCaptured
      if (hooks) {
        for (let i = 0; i < hooks.length; i++) {
          try {
            const capture = hooks[i].call(cur, err, vm, info) === false
            if (capture) return
          } catch (e) {
            globalHandleError(e, cur, 'errorCaptured hook')
          }
        }
      }
    }
  }
  globalHandleError(err, vm, info)
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 13:42:41 
 * @Desc: 带错误捕捉的执行函数 
 */
export function invokeWithErrorHandling (
  handler,
  context,
  args,
  vm,
  info
) {
  let res
  try {
    res = args ? handler.apply(context, args) : handler.call(context)
    if (res && !res._isVue && isPromise(res)) {
      res.catch(e => handleError(e, vm, info + ` (Promise/async)`))
    }
  } catch (e) {
    handleError(e, vm, info)
  }
  return res
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 13:53:37 
 * @Desc: 全局处理错误 
 */
function globalHandleError (err, vm, info) {
  // 如果用户配置了自定义的错误捕捉函数，则执行用户定义的
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      logError(e, null, 'config.errorHandler')
    }
  }
  logError(err, vm, info)
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 13:55:22 
 * @Desc: 打印错误日志 
 */
function logError (err, vm, info) {
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err)
  } else {
    throw err
  }
}
