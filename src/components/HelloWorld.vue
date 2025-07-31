<script setup lang="ts">
import { ref, computed } from "vue";
import BlogPost from "./BlogPost.vue";

defineProps<{ msg: string }>();

const count = ref(0);
const nihaonihao = ref("你好你好");
const message = ref("");
const url = ref("https://www.baidu.com/");
const visible = true;

const reversedMessage = computed(() => {
  return message.value.split("").reverse().join("");
});

const 做了一些事 = () => {
  alert("你点击了按钮！");
  count.value++;
};

const greet = () => {
  alert("Hello!");
};
</script>

<template>
  <h1>{{ msg }}</h1>
  <div id="app">
    <button @click="greet">问候</button>
  </div>
  <div id="jisuanshuxing">
    <p>{{ reversedMessage }}</p>
  </div>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
  <div>{{ nihaonihao }}</div>
  <input v-model="message" placeholder="编辑我" />
  <p>信息为:{{ message }}</p>
  <a v-bind:href="url">链接</a>
  <p v-if="visible">内容可见</p>
  <p v-else>内容不可见</p>
  <button v-on:click="做了一些事">点击我</button>

  <!-- 使用自定义组件和 props -->
  <div class="blog-section">
    <h2>博客文章列表</h2>
    <BlogPost
      title="我与VUE的旅程"
      content="这是我学习Vue.js的第一篇文章，Vue真是太棒了！"
    />
    <BlogPost
      title="Vue组件开发心得"
      content="组件化开发让代码更加模块化和可维护。"
    />
    <BlogPost
      title="响应式数据绑定"
      content="Vue的响应式系统让数据变化自动反映到界面上。"
    />
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}

.blog-section {
  margin: 20px 0;
}

.blog-section h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}
</style>
