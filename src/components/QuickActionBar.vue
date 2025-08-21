<template>
  <div
    v-if="personalizationStore.settings.quickActions.enabled"
    class="quick-action-bar"
    :class="[
      `position-${personalizationStore.settings.quickActions.position}`,
      { 'compact-mode': personalizationStore.settings.interface.compactMode },
    ]"
  >
    <div class="quick-actions-container">
      <div
        v-for="action in enabledQuickActions"
        :key="action.id"
        class="quick-action-item"
        :class="{ active: isActiveAction(action.path) }"
        @click="handleQuickAction(action)"
        @mouseenter="showTooltip(action)"
        @mouseleave="hideTooltip"
      >
        <el-icon>
          <component :is="action.icon" />
        </el-icon>
        <span v-if="!isCompact" class="action-label">{{ action.name }}</span>

        <!-- 工具提示 -->
        <div
          v-if="tooltip.show && tooltip.action?.id === action.id"
          class="action-tooltip"
          :style="tooltipStyle"
        >
          {{ action.name }}
        </div>
      </div>
    </div>

    <!-- 展开/收起按钮 -->
    <div v-if="hasMoreActions" class="expand-button" @click="toggleExpanded">
      <el-icon>
        <component :is="isExpanded ? 'ArrowUp' : 'ArrowDown'" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePersonalizationStore } from "@/stores/personalization";
import { ElMessage } from "element-plus";
// @ts-ignore
import {
  House,
  Files,
  Plus,
  DataAnalysis,
  Setting,
  User,
  Bell,
  Search,
  Edit,
  Delete,
  Download,
  Upload,
  Refresh,
  ArrowUp,
  ArrowDown,
  More,
} from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const personalizationStore = usePersonalizationStore();

// 响应式数据
const isExpanded = ref(false);
const tooltip = ref({
  show: false,
  action: null as any,
  x: 0,
  y: 0,
});

// 计算属性
const enabledQuickActions = computed(() => {
  const actions = personalizationStore.enabledQuickActions;
  const maxVisible = personalizationStore.settings.quickActions.maxVisible;

  if (isExpanded.value) {
    return actions;
  }

  return actions.slice(0, maxVisible);
});

const hasMoreActions = computed(() => {
  return (
    personalizationStore.enabledQuickActions.length >
    personalizationStore.settings.quickActions.maxVisible
  );
});

const isCompact = computed(() => {
  return personalizationStore.settings.interface.compactMode;
});

const tooltipStyle = computed(() => {
  return {
    left: `${tooltip.value.x}px`,
    top: `${tooltip.value.y}px`,
  };
});

// 方法
const handleQuickAction = (action: any) => {
  try {
    // 检查权限
    if (!hasPermission(action.path)) {
      ElMessage.warning("您没有访问此功能的权限");
      return;
    }

    // 导航到指定路径
    router.push(action.path);

    // 记录使用统计
    recordActionUsage(action);

    ElMessage.success(`已跳转到${action.name}`);
  } catch (error) {
    console.error("快捷操作执行失败:", error);
    ElMessage.error("操作执行失败");
  }
};

const isActiveAction = (path: string) => {
  return route.path === path || route.path.startsWith(path + "/");
};

const showTooltip = (action: any) => {
  if (isCompact.value) {
    tooltip.value = {
      show: true,
      action,
      x: 0,
      y: 0,
    };
  }
};

const hideTooltip = () => {
  tooltip.value.show = false;
};

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const hasPermission = (path: string) => {
  // 简单的权限检查逻辑
  const userRole = "admin"; // 这里应该从用户store获取
  const restrictedPaths = ["/dashboard/settings", "/dashboard/users"];

  if (restrictedPaths.includes(path) && userRole !== "admin") {
    return false;
  }

  return true;
};

const recordActionUsage = (action: any) => {
  // 记录快捷操作使用统计
  const usageData = {
    actionId: action.id,
    actionName: action.name,
    timestamp: new Date().toISOString(),
    path: action.path,
  };

  // 这里可以发送到后端或存储在本地
  console.log("快捷操作使用记录:", usageData);
};

// 生命周期
onMounted(() => {
  // 初始化快捷操作栏
  console.log("快捷操作栏已加载");
});

onUnmounted(() => {
  // 清理工作
  tooltip.value.show = false;
});
</script>

<style scoped>
.quick-action-bar {
  position: fixed;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.quick-action-bar:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
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

.quick-actions-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.position-top .quick-actions-container,
.position-bottom .quick-actions-container {
  flex-direction: row;
}

.position-left .quick-actions-container,
.position-right .quick-actions-container {
  flex-direction: column;
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-width: 40px;
  justify-content: center;
}

.quick-action-item:hover {
  background: #f0f9ff;
  color: #409eff;
  transform: translateY(-1px);
}

.quick-action-item.active {
  background: #409eff;
  color: white;
}

.quick-action-item .el-icon {
  font-size: 16px;
}

.action-label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* 紧凑模式 */
.compact-mode .quick-action-item {
  padding: 6px;
  min-width: 32px;
}

.compact-mode .action-label {
  display: none;
}

/* 工具提示 */
.action-tooltip {
  position: absolute;
  background: #303133;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1001;
  pointer-events: none;
}

.position-top .action-tooltip {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 4px;
}

.position-bottom .action-tooltip {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4px;
}

.position-left .action-tooltip {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 4px;
}

.position-right .action-tooltip {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 4px;
}

/* 展开按钮 */
.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-top: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-button:hover {
  background: #f0f9ff;
  color: #409eff;
}

.position-top .expand-button,
.position-bottom .expand-button {
  width: 100%;
  height: 24px;
}

.position-left .expand-button,
.position-right .expand-button {
  width: 24px;
  height: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-action-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .quick-actions-container {
    flex-direction: row;
  }

  .action-label {
    display: none;
  }

  .quick-action-item {
    padding: 8px;
    min-width: 40px;
  }
}

/* 深色模式支持 */
:deep(.dark-mode) .quick-action-bar {
  background: rgba(26, 26, 26, 0.95);
  border-color: #4c4c4c;
}

:deep(.dark-mode) .quick-action-item:hover {
  background: #1a1a1a;
  color: #409eff;
}

:deep(.dark-mode) .expand-button:hover {
  background: #1a1a1a;
  color: #409eff;
}

:deep(.dark-mode) .action-tooltip {
  background: #1a1a1a;
  color: white;
}
</style>
