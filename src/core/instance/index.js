import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 给Vue原型上添加_init方法
initMixin(Vue)
// 代理data和prop数据、定义$set、$delete、$watch方法 
stateMixin(Vue)
// 添加$on、$once、$off、$emit方法 
eventsMixin(Vue)
// 添加_update、$forceUpdate、$destroy方法
lifecycleMixin(Vue)
// 添加一些创建VNode的快捷方法、$nextTick、_render方法
renderMixin(Vue)

export default Vue
