import Vue from '../src/platforms/web/entry-runtime-with-compiler'
Vue.component('my-component', {
  template: `
    <span>{{text}}</span>
  `,
  data() {
    return {
      text: '我是子组件'
    }
  }
})
new Vue({
  el: '#app',
  template: `
    <div>
      <my-component></my-component>
    </div>
  `
})