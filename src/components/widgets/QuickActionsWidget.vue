<template>
  <div class="quick-actions-widget">
    <div class="actions-grid">
      <div
        v-for="action in quickActions"
        :key="action.id"
        class="action-item"
        @click="executeAction(action)"
      >
        <div class="action-icon" :class="action.type">
          <el-icon><component :is="action.icon" /></el-icon>
        </div>
        <div class="action-content">
          <div class="action-title">{{ action.title }}</div>
          <div class="action-description">{{ action.description }}</div>
        </div>
        <div class="action-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <div class="widget-footer">
      <el-button size="small" @click="customizeActions">
        <el-icon><Setting /></el-icon>
        自定义操作
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Setting,
  ArrowRight,
} from "@element-plus/icons-vue";

// Props
interface Props {
  widget?: any;
  config?: any;
}

defineProps<Props>();

const router = useRouter();

// 响应式数据
const quickActions = ref([
  {
    id: "add-patent",
    title: "添加专利",
    description: "创建新的专利记录",
    icon: "Plus",
    type: "primary",
    path: "/dashboard/patents/add",
  },
  {
    id: "search-patents",
    title: "搜索专利",
    description: "快速查找专利信息",
    icon: "Search",
    type: "info",
    path: "/dashboard/patents",
  },

  {
    id: "manage-users",
    title: "用户管理",
    description: "管理系统用户权限",
    icon: "User",
    type: "warning",
    path: "/dashboard/users",
  },
  {
    id: "notifications",
    title: "通知中心",
    description: "查看系统通知消息",
    icon: "Bell",
    type: "danger",
    path: "/dashboard/notifications",
  },
  {
    id: "system-settings",
    title: "系统设置",
    description: "配置系统参数",
    icon: "Setting",
    type: "info",
    path: "/dashboard/settings",
  },
]);

// 方法
const executeAction = (action: any) => {
  try {
    // 检查权限
    if (!hasPermission(action.path)) {
      ElMessage.warning("您没有访问此功能的权限");
      return;
    }

    // 导航到指定路径
    router.push(action.path);
    ElMessage.success(`正在跳转到${action.title}`);
  } catch (error) {
    console.error("执行快捷操作失败:", error);
    ElMessage.error("操作执行失败");
  }
};

const customizeActions = () => {
  ElMessage.info("自定义操作功能开发中");
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
</script>

<style scoped>
.quick-actions-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.actions-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.action-icon.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-icon.success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.action-icon.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon.danger {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.2;
}

.action-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
}

.action-arrow {
  color: #c0c4cc;
  font-size: 14px;
  transition: all 0.3s ease;
}

.action-item:hover .action-arrow {
  color: #409eff;
  transform: translateX(2px);
}

.widget-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 深色模式支持 */
:deep(.dark-mode) .action-item {
  background: #1a1a1a;
  border-color: #4c4c4c;
}

:deep(.dark-mode) .action-item:hover {
  border-color: #409eff;
}

:deep(.dark-mode) .action-title {
  color: #ffffff;
}

:deep(.dark-mode) .action-description {
  color: #909399;
}

:deep(.dark-mode) .widget-footer {
  border-color: #4c4c4c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .action-item {
    padding: 12px;
  }

  .action-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .action-title {
    font-size: 13px;
  }

  .action-description {
    font-size: 11px;
  }
}
</style>
