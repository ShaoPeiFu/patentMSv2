<template>
  <div class="notification-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>通知中心</h1>
      <div class="header-actions">
        <el-button @click="markAllAsRead" v-if="unreadCount > 0">
          <el-icon><Check /></el-icon>
          全部标记为已读
        </el-button>
        <el-button @click="clearAll" type="danger">
          <el-icon><Delete /></el-icon>
          清空所有通知
        </el-button>
      </div>
    </div>

    <!-- 通知统计 -->
    <div class="notification-stats">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ notifications.length }}</div>
          <div class="stat-label">总通知数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ unreadCount }}</div>
          <div class="stat-label">未读通知</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ todayCount }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选器 -->
    <div class="notification-filters">
      <el-card>
        <el-form inline>
          <el-form-item label="状态">
            <el-select v-model="filterStatus" placeholder="选择状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="未读" value="unread" />
              <el-option label="已读" value="read" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filterType" placeholder="选择类型" clearable>
              <el-option label="全部" value="" />
              <el-option label="信息" value="info" />
              <el-option label="成功" value="success" />
              <el-option label="警告" value="warning" />
              <el-option label="错误" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilters">
              <el-icon><Search /></el-icon>
              筛选
            </el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 通知列表 -->
    <div class="notification-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>通知列表 (共 {{ filteredNotifications.length }} 条记录)</span>
            <div class="header-actions">
              <el-button size="small" @click="refreshNotifications">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="filteredNotifications.length === 0" class="empty-state">
          <el-empty description="暂无通知记录" />
        </div>

        <div v-else class="notification-items">
          <div
            v-for="notification in paginatedNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
          >
            <div class="notification-main">
              <div class="notification-icon" :class="notification.type">
                <el-icon>
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>

              <div class="notification-content">
                <div class="notification-header">
                  <h3 class="notification-title">{{ notification.title }}</h3>
                  <div class="notification-meta">
                    <el-tag :type="getTagType(notification.type)" size="small">
                      {{ getTypeText(notification.type) }}
                    </el-tag>
                    <span class="notification-time">{{
                      formatTime(notification.createdAt)
                    }}</span>
                  </div>
                </div>

                <p class="notification-text">{{ notification.content }}</p>

                <div class="notification-actions" v-if="notification.action">
                  <el-button
                    size="small"
                    type="primary"
                    @click="handleAction(notification)"
                  >
                    {{ notification.action.text }}
                  </el-button>
                </div>
              </div>
            </div>

            <div class="notification-controls">
              <el-button
                v-if="!notification.read"
                size="small"
                @click="markAsRead(notification.id)"
              >
                标记已读
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteNotification(notification.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="filteredNotifications.length > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredNotifications.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notification";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Check,
  Delete,
  Search,
  Refresh,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
} from "@element-plus/icons-vue";
import type { Notification } from "@/types/notification";

const router = useRouter();
const notificationStore = useNotificationStore();

// 响应式数据
const currentPage = ref(1);
const pageSize = ref(20);
const filterStatus = ref("");
const filterType = ref("");

// 计算属性
const notifications = computed(() => notificationStore.notifications);
const unreadCount = computed(() => notificationStore.unreadCount);

const todayCount = computed(() => {
  const today = new Date().toDateString();
  return notifications.value.filter(
    (n) => new Date(n.createdAt).toDateString() === today
  ).length;
});

const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  if (filterStatus.value === "unread") {
    filtered = filtered.filter((n) => !n.read);
  } else if (filterStatus.value === "read") {
    filtered = filtered.filter((n) => n.read);
  }

  if (filterType.value) {
    filtered = filtered.filter((n) => n.type === filterType.value);
  }

  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredNotifications.value.slice(start, end);
});

// 方法
const markAsRead = (notificationId: number) => {
  notificationStore.markAsRead(notificationId);
  ElMessage.success("已标记为已读");
};

const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要将所有 ${unreadCount.value} 条未读通知标记为已读吗？`,
      "确认操作",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      }
    );

    notificationStore.markAllAsRead();
    ElMessage.success("已全部标记为已读");
  } catch {
    // 用户取消操作
  }
};

const deleteNotification = async (notificationId: number) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这条通知吗？此操作不可恢复。",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    notificationStore.deleteNotification(notificationId);
    ElMessage.success("通知已删除");
  } catch {
    // 用户取消操作
  }
};

const clearAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清空所有 ${notifications.value.length} 条通知吗？此操作不可恢复。`,
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

const handleAction = (notification: Notification) => {
  if (notification.action?.url) {
    router.push(notification.action.url);
  } else if (notification.action?.callback) {
    notification.action.callback();
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  ElMessage.success(
    `筛选完成，找到 ${filteredNotifications.value.length} 条记录`
  );
};

const resetFilters = () => {
  filterStatus.value = "";
  filterType.value = "";
  currentPage.value = 1;
  ElMessage.success("筛选条件已重置");
};

const refreshNotifications = () => {
  notificationStore.loadFromStorage();
  ElMessage.success("通知数据已刷新");
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    info: InfoFilled,
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
  };
  return iconMap[type] || InfoFilled;
};

const getTagType = (type: string) => {
  const tagMap: Record<string, any> = {
    info: "info",
    success: "success",
    warning: "warning",
    error: "danger",
  };
  return tagMap[type] || "info";
};

const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    info: "信息",
    success: "成功",
    warning: "警告",
    error: "错误",
  };
  return textMap[type] || "未知";
};

const formatTime = (timeString: string) => {
  const time = new Date(timeString);
  return time.toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  notificationStore.loadFromStorage();
});
</script>

<style scoped>
.notification-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.notification-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

.notification-filters {
  margin-bottom: 20px;
}

.notification-list {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.notification-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-main {
  display: flex;
  flex: 1;
  gap: 16px;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-text {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.6;
}

.notification-actions {
  margin-top: 12px;
}

.notification-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-stats {
    grid-template-columns: 1fr;
  }

  .notification-item {
    flex-direction: column;
    gap: 16px;
  }

  .notification-controls {
    flex-direction: row;
    margin-left: 0;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
