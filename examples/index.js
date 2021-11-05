import Vue from '../src/platforms/web/entry-runtime-with-compiler'
const app = new Vue({
  el: '#app',
  template: `
    <ul>
      <li v-for="item in list">{{item}}</li>
    </ul>
  `,
  data: {
    list: [1, 2, 3]
  },
  created() {
    setTimeout(() => {
      this.list = [4, 5, 6]
      setTimeout(() => {
        this.list.push(7)
      }, 1000);
    }, 5000);
  }
})