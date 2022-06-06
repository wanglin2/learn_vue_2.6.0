/* @flow */

import * as nodeOps from '../../web/runtime/node-ops'
import { createPatchFunction } from '../../../core/vdom/patch'
import baseModules from '../../../core/vdom/modules/index'
import platformModules from '../../web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
// 指令模块应在应用所有内置模块后最后应用。
const modules = platformModules.concat(baseModules)

export const patch = createPatchFunction({ nodeOps, modules })
