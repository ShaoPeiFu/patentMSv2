<template>
  <div
    v-if="enabledQuickActions.length > 0"
    class="quick-actions-bar"
    :class="`position-${position}`"
  >
    <div class="quick-actions-container">
      <div
        v-for="action in enabledQuickActions"
        :key="action.id"
        class="quick-action-item"
        @click="handleQuickAction(action)"
        :title="action.name"
      >
        <el-icon><component :is="action.icon" /></el-icon>
        <span v-if="true" class="action-label">{{ action.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePersonalizationStore } from "@/stores/personalization";
import { ElMessage } from "element-plus";

// Props
// interface Props {
//   showLabels?: boolean;
//   compact?: boolean;
// }

// const props = withDefaults(defineProps<Props>(), {
//   showLabels: true,
//   compact: false,
// });

// 使用个性化设置状态
const personalizationStore = usePersonalizationStore();
const router = useRouter();

// 计算属性
const enabledQuickActions = computed(
  () => personalizationStore.enabledQuickActions
);
const position = computed(
  () => personalizationStore.settings.quickActions.position
);

// 方法
const handleQuickAction = (action: any) => {
  try {
    router.push(action.path);
    ElMessage.success(`跳转到${action.name}`);
  } catch (error) {
    ElMessage.error("页面跳转失败");
  }
};
</script>

<style scoped>
.quick-actions-bar {
  position: fixed;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.quick-actions-bar:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.quick-actions-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.quick-action-item:hover {
  background: #f5f7fa;
  color: #409eff;
  transform: translateY(-1px);
}

.quick-action-item:active {
  transform: translateY(0);
}

.action-label {
  font-size: 12px;
  font-weight: 500;
}

/* 位置样式 */
.position-top {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.position-bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.position-left {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.position-right {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-actions-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .quick-actions-container {
    flex-direction: row;
    gap: 4px;
    padding: 6px 8px;
  }

  .quick-action-item {
    padding: 6px 8px;
    font-size: 12px;
  }

  .action-label {
    display: none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .quick-actions-bar {
    background: rgba(30, 30, 30, 0.95);
    border-color: #4c4c4c;
  }

  .quick-action-item {
    color: #e0e0e0;
  }

  .quick-action-item:hover {
    background: #404040;
    color: #409eff;
  }
}

/* 动画效果 */
.quick-actions-bar {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}

.position-left .quick-actions-bar {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px) translateY(-50%);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
}

.position-right .quick-actions-bar {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px) translateY(-50%);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
}
</style>
