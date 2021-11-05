/* @flow */

import { noop, extend } from '../shared/util'
import { warn as baseWarn, tip } from '../core/util/debug'
import { generateCodeFrame } from './codeframe'

// 创建函数
function createFunction (code) {
  try {
    return new Function(code)
  } catch (err) {
    return noop
  }
}

// 返回一个函数，这个函数会将模板生成渲染函数
export function createCompileToFunctionFn (compile) {
  const cache = Object.create(null)

  return function compileToFunctions (
    template,
    options,
    vm
  ) {
    options = extend({}, options)
    const warn = options.warn || baseWarn
    delete options.warn

    // 检查缓存
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    if (cache[key]) {
      return cache[key]
    }

    // 编译
    const compiled = compile(template, options)

    // 将代码转换为函数
    const res = {}
    res.render = createFunction(compiled.render)
    res.staticRenderFns = compiled.staticRenderFns.map(code => {
      return createFunction(code)
    })

    return (cache[key] = res)
  }
}
