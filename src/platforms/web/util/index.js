/* @flow */

import { warn } from '../../../core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * 根据dom选择器获取dom元素
 */
export function query (el) {
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
