<template>
  <div class="user-detail">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>用户详情</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑用户
        </el-button>
        <el-button @click="$router.go(-1)">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <div class="user-info-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>

        <div class="user-profile">
          <div class="avatar-section">
            <el-avatar
              :size="120"
              :src="
                user?.avatar ||
                'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
              "
            />
            <div class="user-status">
              <el-tag :type="getRoleTagType(user?.role)" size="large">
                {{ getRoleText(user?.role) }}
              </el-tag>
            </div>
          </div>

          <div class="info-section">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户ID">
                {{ user?.id }}
              </el-descriptions-item>
              <el-descriptions-item label="用户名">
                {{ user?.username }}
              </el-descriptions-item>
              <el-descriptions-item label="真实姓名">
                {{ user?.realName }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ user?.email }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号码">
                {{ user?.phone }}
              </el-descriptions-item>
              <el-descriptions-item label="部门">
                <el-tag size="small">{{
                  getDepartmentText(user?.department)
                }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">
                {{ formatDate(user?.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="最后登录">
                {{ formatDate(user?.lastLoginAt) || "未登录" }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 用户活动记录 -->
    <div class="user-activity-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
            <el-button
              size="small"
              @click="refreshActivities"
              :loading="loadingActivities"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <div class="activity-list">
          <div v-if="loadingActivities" class="loading-state">
            <el-skeleton :rows="4" animated />
          </div>
          <div v-else-if="userActivities.length === 0" class="no-activities">
            <el-empty description="暂无活动记录" />
          </div>
          <div
            v-else
            class="activity-item"
            v-for="activity in userActivities"
            :key="activity.id"
          >
            <div class="activity-icon" :class="activity.type">
              <el-icon
                ><component :is="getActivityIcon(activity.type)"
              /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">
                {{ formatTime(activity.timestamp) }}
              </div>
            </div>
            <div class="activity-status" :class="activity.status">
              {{ getStatusText(activity.status) }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Edit,
  Refresh,
  UserFilled,
  Lock,
  Bell,
  Setting,
  View,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@element-plus/icons-vue";
import type { User } from "@/types/user";
import { getRoleTagType } from "@/utils/tagTypes";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 响应式数据
const user = ref<User | null>(null);
const loading = ref(false);
const loadingActivities = ref(false);

// 用户活动记录
const userActivities = ref<any[]>([]);

// 方法
const handleEdit = () => {
  router.push(`/dashboard/users/${route.params.id}/edit`);
};

const getRoleText = (role?: string) => {
  const texts: Record<string, string> = {
    user: "普通用户",
    admin: "管理员",
    reviewer: "审核员",
  };
  return texts[role || ""] || role || "未知";
};

const getDepartmentText = (department?: string) => {
  const texts: Record<string, string> = {
    tech: "技术部",
    legal: "法务部",
    admin: "管理部",
    other: "其他",
  };
  return texts[department || ""] || department || "未知";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "未知";
  return new Date(dateString).toLocaleString("zh-CN");
};

const formatTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    return `${days}天前`;
  }
};

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    login: UserFilled,
    password: Lock,
    notification: Bell,
    profile: Setting,
    view: View,
    edit: EditIcon,
    delete: DeleteIcon,
  };
  return iconMap[type] || UserFilled;
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    success: "成功",
    failed: "失败",
    pending: "进行中",
    completed: "已完成",
    viewed: "已查看",
    modified: "已修改",
    updated: "已更新",
    deleted: "已删除",
  };
  return statusMap[status] || status;
};

// 获取用户活动记录
const fetchUserActivities = async () => {
  if (!user.value?.id) return;

  loadingActivities.value = true;
  try {
    // 获取认证令牌
    const token = userStore.token || localStorage.getItem("token");

    if (!token) {
      console.error("❌ 未找到认证令牌");
      userActivities.value = [];
      ElMessage.error("请先登录");
      return;
    }

    // 调用API获取用户活动记录
    const response = await fetch(`/api/users/${user.value.id}/activities`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      userActivities.value = data.activities || [];
      console.log(
        "✅ 成功获取用户活动记录:",
        data.activities?.length || 0,
        "条"
      );
    } else {
      console.error(
        "❌ 获取用户活动记录失败:",
        response.status,
        response.statusText
      );
      userActivities.value = [];
      ElMessage.warning("获取活动记录失败，请稍后重试");
    }
  } catch (error) {
    console.error("❌ 获取用户活动记录异常:", error);
    userActivities.value = [];
    ElMessage.error("网络错误，无法获取活动记录");
  } finally {
    loadingActivities.value = false;
  }
};

// 刷新活动记录
const refreshActivities = () => {
  fetchUserActivities();
};

// 获取用户信息
const fetchUserDetail = async () => {
  const userId = parseInt(route.params.id as string);
  if (isNaN(userId)) {
    ElMessage.error("用户ID无效");
    router.push("/dashboard/users");
    return;
  }

  loading.value = true;
  try {
    // 从用户store获取用户信息
    const allUsers = userStore.getAllUsers();
    const foundUser = allUsers.find((u) => u.id === userId);

    if (!foundUser) {
      ElMessage.error("用户不存在");
      router.push("/dashboard/users");
      return;
    }

    user.value = foundUser;

    // 获取用户活动记录
    await fetchUserActivities();
  } catch (error) {
    ElMessage.error("获取用户信息失败");
    router.push("/dashboard/users");
  } finally {
    loading.value = false;
  }
};

// 生命周期
onMounted(() => {
  fetchUserDetail();
});

// 监听路由参数变化，重新获取用户信息
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchUserDetail();
    }
  }
);

// 监听用户Store中的数据变化
watch(
  () => userStore.getAllUsers(),
  () => {
    // 当用户数据更新时，重新获取当前用户信息
    const userId = parseInt(route.params.id as string);
    if (!isNaN(userId)) {
      const allUsers = userStore.getAllUsers();
      const foundUser = allUsers.find((u) => u.id === userId);
      if (foundUser) {
        user.value = foundUser;
      }
    }
  },
  { deep: true }
);
</script>

<style scoped>
.user-detail {
  padding: 20px;
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
  gap: 10px;
}

.user-info-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
}

.user-profile {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.user-status {
  text-align: center;
}

.info-section {
  flex: 1;
}

.user-activity-section {
  margin-bottom: 20px;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.loading-state {
  padding: 20px;
}

.no-activities {
  text-align: center;
  padding: 40px 0;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(10px);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
}

.activity-icon.login {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.activity-icon.password {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.activity-icon.notification {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.activity-icon.profile {
  background: linear-gradient(135deg, #909399, #c0c4cc);
}

.activity-icon.view {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.activity-icon.edit {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.activity-icon.delete {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 0.9em;
  color: #666;
}

.activity-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
}

.activity-status.success {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.activity-status.failed {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.activity-status.pending {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.activity-status.completed {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.activity-status.viewed {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.activity-status.modified {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.activity-status.updated {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.activity-status.deleted {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
