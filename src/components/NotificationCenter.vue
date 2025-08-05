<template>
  <el-popover
    :visible="visible"
    placement="bottom-end"
    :width="380"
    trigger="manual"
    popper-class="notification-popover"
  >
    <template #reference>
      <div class="notification-trigger" @click="toggleNotifications">
        <el-badge
          :value="unreadCount"
          :hidden="unreadCount === 0"
          class="notification-badge"
        >
          <el-button circle class="notification-btn">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
      </div>
    </template>

    <div class="notification-center">
      <!-- 头部 -->
      <div class="notification-header">
        <div class="header-title">
          <h3>通知中心</h3>
          <span class="unread-count" v-if="unreadCount > 0"
            >{{ unreadCount }}条未读</span
          >
        </div>
        <div class="header-actions">
          <el-button
            size="small"
            text
            @click="markAllAsRead"
            v-if="unreadCount > 0"
          >
            全部标记为已读
          </el-button>
          <el-button size="small" text @click="clearAll">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="notification-list">
        <div v-if="recentNotifications.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Bell /></el-icon>
          <p>暂无通知</p>
        </div>

        <div
          v-for="notification in recentNotifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon" :class="notification.type">
            <el-icon>
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>

          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-text">{{ notification.content }}</div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>

          <div class="notification-actions">
            <el-button
              size="small"
              text
              @click.stop="deleteNotification(notification.id)"
              class="delete-btn"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="notification-footer" v-if="recentNotifications.length > 0">
        <el-button text @click="viewAllNotifications"> 查看所有通知 </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Bell,
  Delete,
  Close,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
} from "@element-plus/icons-vue";
import type { Notification } from "@/types/notification";

const router = useRouter();
const notificationStore = useNotificationStore();

// 响应式数据
const visible = ref(false);

// 计算属性
const unreadCount = computed(() => notificationStore.unreadCount);
const recentNotifications = computed(
  () => notificationStore.recentNotifications
);

// 切换通知面板显示
const toggleNotifications = () => {
  visible.value = !visible.value;
};

// 关闭通知面板
const closeNotifications = () => {
  visible.value = false;
};

// 处理点击通知
const handleNotificationClick = (notification: Notification) => {
  // 标记为已读
  if (!notification.read) {
    notificationStore.markAsRead(notification.id);
  }

  // 如果有操作链接，导航到对应页面
  if (notification.action?.url) {
    router.push(notification.action.url);
    closeNotifications();
  } else if (notification.action?.callback) {
    notification.action.callback();
  }
};

// 标记所有为已读
const markAllAsRead = () => {
  notificationStore.markAllAsRead();
  ElMessage.success("已全部标记为已读");
};


// 删除单个通知
const deleteNotification = (notificationId: number) => {
  notificationStore.deleteNotification(notificationId);
};

// 清空所有通知
const clearAll = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有通知吗？此操作不可恢复。",
      "确认清空",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    notificationStore.clearAllNotifications();
    ElMessage.success("已清空所有通知");
  } catch {
    // 用户取消操作
  }
};

// 查看所有通知
const viewAllNotifications = () => {
  router.push("/dashboard/notifications");
  closeNotifications();
};

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    info: InfoFilled,
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
  };
  return iconMap[type] || InfoFilled;
};

// 格式化时间
const formatTime = (timeString: string) => {
  const time = new Date(timeString);
  const now = new Date();
  const diff = now.getTime() - time.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return time.toLocaleDateString("zh-CN");
};

// 点击外部关闭
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (
    !target.closest(".notification-center") &&
    !target.closest(".notification-trigger")
  ) {
    closeNotifications();
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  // 初始化示例通知
  notificationStore.initializeExampleNotifications();
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.notification-trigger {
  cursor: pointer;
}

.notification-center {
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.unread-count {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.notification-list {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-item.unread::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #409eff;
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-icon.info {
  background-color: #e6f7ff;
  color: #1890ff;
}

.notification-icon.success {
  background-color: #f6ffed;
  color: #52c41a;
}

.notification-icon.warning {
  background-color: #fffbe6;
  color: #faad14;
}

.notification-icon.error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 11px;
  color: #c0c4cc;
}

.notification-actions {
  display: flex;
  align-items: flex-start;
  margin-left: 8px;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.notification-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
</style>

<style>
.notification-popover {
  padding: 0 !important;
}
</style>
