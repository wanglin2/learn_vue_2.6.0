import Vue from '../src/platforms/web/entry-runtime-with-compiler'
const app = new Vue({
  el: '#app',
  template: `<h1>{{text}}</h1>`,
  data: {
    text: 'hello2'
  }
})
