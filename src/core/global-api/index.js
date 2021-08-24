/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from '../../shared/constants'
import builtInComponents from '../components/index'
import { observe } from '../../core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-23 18:39:31 
 * @Desc: 添加全局api 
 */
export function initGlobalAPI (Vue) {
  // 添加配置项config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // 暴露工具方法
  // NOTE: 除非你完全理解它们，否则不要在你的代码里使用
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6版本起开始暴露响应方法
  Vue.observable = (obj) => {
    observe(obj)
    return obj
  }

  // 添加了一个选项对象，并添加了三个属性，就是我们熟悉的`component`、`directives`、`filters`
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  // 挂载keep-alive组件
  extend(Vue.options.components, builtInComponents)

  // 注册Vue.use、Vue.mixin、Vue.extend、Vue.component、Vue.filter、Vue.directive方法
  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}
