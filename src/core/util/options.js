/* @flow */

import config from '../config'
import { warn } from './debug'
import { set } from '../observer/index'
import { unicodeLetters } from './lang'
import { nativeWatch, hasSymbol } from './env'

import {
  ASSET_TYPES,
  LIFECYCLE_HOOKS
} from '../../shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from '../../shared/util'

/**
 * 选项覆盖策略是处理如何将父选项值和子选项值合并到最终值的函数
 */
const strats = config.optionMergeStrategies

/**
 * 将两个数据对象递归合并在一起的工具方法
 */
function mergeData (to, from) {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)
  // 遍历from对象的keys
  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // __ob__是代表该对象被观察过了的标志，不需要合并
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    // 如果to对象没有该属性，那么直接添加
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (// 否则如果两个的值不一样，且都是对象{}的时候递归进行合并
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal)
    }
  }
  return to
}

/**
 * Data
 */
export function mergeDataOrFn (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // Vue.extend合并, 必须都是函数
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // 当父选项和子选项都提供了
    // 我们需要返回一个函数，该函数返回两个函数的合并结果
    // 这里不需要检查parentVal是否是函数，因为它必须是一个函数才能传递以前的合并。
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    // 实例化的时候合并
    return function mergedInstanceDataFn () {
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-28 13:53:48 
 * @Desc: 合并data选项 
 */
strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * 钩子和属性都会合并成一个数组
 */
function mergeHook (
  parentVal,
  childVal
) {
  // childVal不存在，返回parentVal
  // childVal存在，且parentVal也存在，那么两个数组进行合并
  //               且parentVal不存在，把childVal格式化成数组类型
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-28 14:45:02 
 * @Desc: 去重 
 */
function dedupeHooks (hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-28 14:41:10 
 * @Desc: 合并生命周期 
 */
LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

/**
 * 资源
 *
 * 当vm存在时（实例创建）, 我们需要在构造函数选项、实例选项和父选项之间进行三方合并。
 */
function mergeAssets (
  parentVal,
  childVal
) {
  const res = Object.create(parentVal || null)
  if (childVal) {
    return extend(res, childVal)
  } else {
    return res
  }
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-08-28 14:55:47 
 * @Desc: 合并资源选项 
 */
ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * 观察者散列不应该相互覆盖，所以我们将它们合并为数组。
 */
strats.watch = function (
  parentVal,
  childVal,
) {
  // 围绕Firefox的Object.prototype.watch展开工作...
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)
  // 遍历子选项对象的属性
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}

/**
 * 其他对象属性合并
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal,
  childVal,
) {
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}
strats.provide = mergeDataOrFn

/**
 * 默认的合并策略
 */
const defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
}

export function validateComponentName (name) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeLetters}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * 确保将所有props选项语法规范化为基于对象的格式。
 */
function normalizeProps (options, vm) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  // 如果是字符串数组形式的话会转成{val:{ type: null }}
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      // val可以是一个类型，比如String、Number，也可以是一个对象，如{type: Number, default: 0}
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  }
  options.props = res
}

/**
 * 将所有注入规范化为基于对象的格式
 */
function normalizeInject (options) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    // 字符串数组类型，转化为{ from: val }
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)// 值也是个对象的话
        : { from: val }// 值是个字符串
    }
  }
}

/**
 * 将原始函数指令规范化为对象格式
 */
function normalizeDirectives (options) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

/**
 * 合并两个选项.
 * 用于实例化和继承的核心工具方法
 */
export function mergeOptions (
  parent,
  child,
  vm
){
  if (typeof child === 'function') {
    child = child.options
  }

  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirectives(child)

  // 在子选项上应用了extends and mixins,
  // 但只有当原始选项对象不是另一个mergeOptions调用的结果时
  // 只有合并的选项具有_base属性
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      // 遍历合并混入选项
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options = {}
  let key
  // 先遍历父选项进行合并
  for (key in parent) {
    mergeField(key)
  }
  // 再遍历子选项里存在父选项里不存在的属性
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  // 合并操作
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 * 处理一个资源
 * 使用此函数是因为子实例需要访问其祖先链中定义的资源
 */
 export function resolveAsset (
  options,
  type,
  id,
  warnMissing
){
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  // 首先检查本地注册
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  // 本地没有，则在原型链上查找
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  return res
}
