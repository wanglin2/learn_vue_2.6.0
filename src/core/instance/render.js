/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 11:04:13 
 * @Desc: 初始化渲染 
 */
export function initRender (vm) {
  vm._vnode = null // 子树的根节点
  vm._staticTrees = null // v-once 缓存树
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree父树中的占位符节点
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // 给当前实例绑定一个createElement方法
  // 这样我们就可以在其中获得适当的渲染上下文。
  // 参数列表: tag, data, children, normalizationType, alwaysNormalize
  // 内部版本由从模板编译的渲染函数使用
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // 公开版本，用于用户编写渲染函数时使用
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

   // $attrs 和 $listeners 是用于更方便的创建高阶组件 HOC .
  // 它们需要是响应性的，这样使用它们的HOC才会始终得到更新
  const parentData = parentVnode && parentVnode.data
  defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
  defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-23 17:53:55 
 * @Desc: 给原型添加$nextTick、_render方法
 */
export function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  }

  Vue.prototype._render = function () {
    const vm = this
    const { render, _parentVnode } = vm.$options

    // 存在父VNode
    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots
      )
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    // 设置父vnode。这允许渲染函数访问占位符节点上的数据。
    vm.$vnode = _parentVnode
    // render self
    // 执行render方法生成虚拟DOM
    let vnode = render.call(vm._renderProxy, vm.$createElement)
    // if the returned array contains only a single node, allow it
    // 如果返回的数组只包含一个节点，请允许它
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
}
