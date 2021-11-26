/* @flow */

import { makeMap, isBuiltInTag, cached, no } from '../shared/util'

let isStaticKey
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 * 优化器的目标：遍历生成的模板AST树并检测纯静态的子树，即DOM中不需要更改的部分。
 *
 * Once we detect these sub-trees, we can:
 * 一旦我们检测到这些子树，我们可以：
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 *    将它们提升为常量，这样我们就不再需要在每次重新渲染时为它们创建新节点；
 * 2. Completely skip them in the patching process.
 *    在打补丁过程中完全跳过它们。
 */
export function optimize (root, options) {
  if (!root) return
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  // 判断是否是保留标签，比如html、svg标签
  isPlatformReservedTag = options.isReservedTag || no
  // first pass: mark all non-static nodes.
  // 第一遍处理：标记所有非静态节点。
  markStatic(root)
  // second pass: mark static roots.
  // 第二遍：标记静态根。
  markStaticRoots(root, false)
}

// 返回一个函数，用来判断某个key是否是静态的key
function genStaticKeys (keys) {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

// 标记所有非静态节点
function markStatic (node) {
  node.static = isStatic(node)
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 不要将组件插槽内容设置为静态，用来避免：
    // 1. components not able to mutate slot nodes
    //    组件无法改变插槽节点
    // 2. static slot content fails for hot-reloading
    //    静态插槽内容无法进行热更新加载
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      // 有一个子节点不是静态节点，那么该节点就不是静态节点
      if (!child.static) {
        node.static = false
      }
    }
    // 存在v-if
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

function markStaticRoots (node, isInFor) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }
    // For a node to qualify as a static root, it should have children that
    // 使节点符合静态根的条件，它应该有不仅仅是静态文本的子级，
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    // 否则，花费的成本将超过收益，还不如直接刷新渲染。
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

// 判断ast节点是否是静态节点
function isStatic (node) {
  if (node.type === 2) { // expression表达式
    return false
  }
  if (node.type === 3) { // text文本
    return true
  }
  return !!(node.pre || (
    !node.hasBindings && // no dynamic bindings 没有动态绑定
    !node.if && !node.for && // 没有 v-if 、 v-for 、 v-else
    !isBuiltInTag(node.tag) && // not a built-in 不是内置标签
    isPlatformReservedTag(node.tag) && // not a component 不是组件
    !isDirectChildOfTemplateFor(node) &&
    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor (node) {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}
