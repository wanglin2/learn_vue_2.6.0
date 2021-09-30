/* @flow */

import Vue from '../../../core/index'
import config from '../../../core/config'
import { extend, noop } from '../../../shared/util'
import { mountComponent } from '../../../core/instance/lifecycle'
import { devtools, inBrowser } from '../../../core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from '../../web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

// 添加特定平台的工具方法
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// 添加平台运行时指令(v-model、v-show)和组件（Transition、TransitionGroup）
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// 添加平台的patch方法
Vue.prototype.__patch__ = inBrowser ? patch : noop

// 公共的mount方法
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

export default Vue
