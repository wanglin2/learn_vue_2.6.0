/* @flow */

import { warn } from './debug'
import { observe, toggleObserving, shouldObserve } from '../observer/index'
import {
  hasOwn,
  isObject,
  toRawType,
  hyphenate,
  capitalize,
  isPlainObject
} from '../../shared/util'

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 15:12:12 
 * @Desc: 校验props 
 */
export function validateProp (
  key,
  propOptions,
  propsData,
  vm
){
  const prop = propOptions[key]
  const absent = !hasOwn(propsData, key)
  let value = propsData[key]
  // 判断该prop允许的类型中是否包含布尔类型，比如type为：Boolean，那么返回0，如果是数组类型的：[String, Boolean, Number]，那么返回1，不包含则返回-1
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  // 该属性可以是布尔值
  if (booleanIndex > -1) {
    // 如果propsData中没有该属性，且没有设置默认值，那么将该属性设为false
    if (absent && !hasOwn(prop, 'default')) {
      value = false
    } else if (value === '' || value === hyphenate(key)) {// 当propsData中的该属性的值为空字符串，或者值和key相同
      // 如果该属性允许的类型中没有字符串类型，或者布尔值具有更高的优先级，即出现在前面，如：[Boolean, String]，则将该属性值默认设为true
      const stringIndex = getTypeIndex(String, prop.type)
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
  // 检查默认值
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key)
    // 由于默认值是一个新副本，需要观察它
    const prevShouldObserve = shouldObserve
    toggleObserving(true)
    observe(value)
    toggleObserving(prevShouldObserve)
  }
  return value
}

/**
 * 获取一个prop的默认值
 */
function getPropDefaultValue (vm, prop, key) {
  // 没有设置默认值，那么直接返回 undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  // 原始属性值从上一次渲染中也没有定义
  // 那么返回以前的默认值以避免触发不必要的watcher
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // 对非函数类型调用工厂函数
  // 如果一个值的原型在不同的执行上下文中都是函数，那么它就是函数
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    )
    return
  }
  if (value == null && !prop.required) {
    return
  }
  let type = prop.type
  let valid = !type || type === true
  const expectedTypes = []
  if (type) {
    if (!Array.isArray(type)) {
      type = [type]
    }
    for (let i = 0; i < type.length && !valid; i++) {
      const assertedType = assertType(value, type[i])
      expectedTypes.push(assertedType.expectedType || '')
      valid = assertedType.valid
    }
  }

  if (!valid) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    )
    return
  }
  const validator = prop.validator
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      )
    }
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/

function assertType (value, type) {
  let valid
  const expectedType = getType(type)
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value)
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value)
  } else {
    valid = value instanceof type
  }
  return {
    valid,
    expectedType
  }
}

/**
 * 使用函数字符串名称检查内置类型,
 * 因为在不同vms/iFrame之间运行时，简单的相等性检查将失败。
 */
function getType (fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 15:18:57 
 * @Desc: 检查两个类型是否相同 
 */
function isSameType (a, b) {
  return getType(a) === getType(b)
}

/** 
 * javascript comment 
 * @Author: 王林25 
 * @Date: 2021-09-29 15:17:15 
 * @Desc: 在prop类型数组里找出指定类型所在的索引 
 */
function getTypeIndex (type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

function getInvalidTypeMessage (name, value, expectedTypes) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
  const expectedType = expectedTypes[0]
  const receivedType = toRawType(value)
  const expectedValue = styleValue(value, expectedType)
  const receivedValue = styleValue(value, receivedType)
  // check if we need to specify expected value
  if (expectedTypes.length === 1 &&
      isExplicable(expectedType) &&
      !isBoolean(expectedType, receivedType)) {
    message += ` with value ${expectedValue}`
  }
  message += `, got ${receivedType} `
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${receivedValue}.`
  }
  return message
}

function styleValue (value, type) {
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

function isExplicable (value) {
  const explicitTypes = ['string', 'number', 'boolean']
  return explicitTypes.some(elem => value.toLowerCase() === elem)
}

function isBoolean (...args) {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}
