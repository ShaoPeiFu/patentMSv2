<template>
  <div class="loading-state" :class="{ 'full-screen': fullScreen }">
    <div v-if="loading" class="loading-content">
      <div class="loading-spinner">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>
      <div v-if="message" class="loading-message">{{ message }}</div>
      <div
        v-if="showProgress && progress !== undefined"
        class="loading-progress"
      >
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="6"
        />
      </div>
    </div>

    <div v-else-if="error" class="error-content">
      <div class="error-icon">
        <el-icon><WarningFilled /></el-icon>
      </div>
      <div class="error-message">{{ error }}</div>
      <div v-if="showRetry" class="error-actions">
        <el-button @click="$emit('retry')" type="primary">重试</el-button>
      </div>
    </div>

    <div v-else-if="empty" class="empty-content">
      <div class="empty-icon">
        <el-icon><DocumentDelete /></el-icon>
      </div>
      <div class="empty-message">{{ emptyMessage || "暂无数据" }}</div>
      <div v-if="showCreate" class="empty-actions">
        <el-button @click="$emit('create')" type="primary">{{
          createText || "创建"
        }}</el-button>
      </div>
    </div>

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import {
  Loading,
  WarningFilled,
  DocumentDelete,
} from "@element-plus/icons-vue";

interface Props {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  message?: string;
  emptyMessage?: string;
  fullScreen?: boolean;
  showRetry?: boolean;
  showCreate?: boolean;
  createText?: string;
  showProgress?: boolean;
  progress?: number;
  progressStatus?: "success" | "exception" | "warning" | undefined;
}

interface Emits {
  (e: "retry"): void;
  (e: "create"): void;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: "",
  empty: false,
  message: "加载中...",
  emptyMessage: "暂无数据",
  fullScreen: false,
  showRetry: true,
  showCreate: false,
  createText: "创建",
  showProgress: false,
  progressStatus: undefined,
});

defineEmits<Emits>();
</script>

<style scoped>
.loading-state {
  width: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  z-index: 1000;
}

.loading-content,
.error-content,
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  margin-bottom: 16px;
}

.loading-spinner .el-icon {
  font-size: 32px;
  color: #409eff;
}

.loading-message {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
}

.loading-progress {
  width: 200px;
  margin-top: 16px;
}

.error-icon {
  margin-bottom: 16px;
}

.error-icon .el-icon {
  font-size: 48px;
  color: #f56c6c;
}

.error-message {
  font-size: 16px;
  color: #f56c6c;
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-icon .el-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.empty-message {
  font-size: 16px;
  color: #909399;
  margin-bottom: 20px;
  max-width: 400px;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 12px;
}

/* 动画效果 */
.loading-spinner .is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-content,
  .error-content,
  .empty-content {
    padding: 20px 16px;
  }

  .loading-progress {
    width: 150px;
  }

  .error-message,
  .empty-message {
    font-size: 14px;
  }
}
</style>
