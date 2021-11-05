/* @flow */

import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * dep是一个可观察对象，可以有多个指令订阅它。
 */
export default class Dep {
  static target;
  id;
  subs;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  /** 
   * javascript comment 
   * @Author: 王林25 
   * @Date: 2021-11-04 15:54:59 
   * @Desc: 添加订阅者 
   */
  addSub (sub) {
    this.subs.push(sub)
  }

  /** 
   * javascript comment 
   * @Author: 王林25 
   * @Date: 2021-11-04 15:55:06 
   * @Desc: 删除订阅者 
   */
  removeSub (sub) {
    remove(this.subs, sub)
  }

  /** 
   * javascript comment 
   * @Author: 王林25 
   * @Date: 2021-11-04 15:56:33 
   * @Desc:  订阅者添加该dep实例
   */
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  /** 
   * javascript comment 
   * @Author: 王林25 
   * @Date: 2021-11-04 15:59:00 
   * @Desc: 通知订阅者更新 
   */
  notify () {
    // 只通知此刻存在的订阅者
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// 当前正在计算执行中的目标watcher
// 这是全局唯一的，因为一次只能同时执行一个观察者。
Dep.target = null
const targetStack = []

export function pushTarget (target) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
