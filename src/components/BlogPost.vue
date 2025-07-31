<template>
  <div class="blog-post">
    <h3 class="blog-title">{{ title }}</h3>
    <p class="blog-content">{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
// 定义 props
defineProps<{
  title: string;
  content?: string;
}>();
</script>

<style scoped>
.blog-post {
  border: 2px solid #42b883;
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.blog-title {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.5em;
}

.blog-content {
  color: #666;
  margin: 0;
  line-height: 1.6;
}
</style>
