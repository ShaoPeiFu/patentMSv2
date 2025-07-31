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
          </div>
        </template>

        <div class="activity-list">
          <div
            class="activity-item"
            v-for="activity in userActivities"
            :key="activity.id"
          >
            <div class="activity-icon" :class="activity.type">
              <el-icon><component :is="activity.icon" /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ formatTime(activity.time) }}</div>
            </div>
            <div class="activity-status" :class="activity.status">
              {{ activity.statusText }}
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
  UserFilled,
  Lock,
  Bell,
  Setting,
} from "@element-plus/icons-vue";
import type { User } from "@/stores/user";
import { getRoleTagType } from "@/utils/tagTypes";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 响应式数据
const user = ref<User | null>(null);
const loading = ref(false);

// 用户活动记录
const userActivities = ref([
  {
    id: 1,
    icon: "UserFilled",
    title: "用户登录系统",
    time: new Date(Date.now() - 1000 * 60 * 30),
    type: "login",
    status: "success",
    statusText: "成功",
  },
  {
    id: 2,
    icon: "Lock",
    title: "修改密码",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    type: "password",
    status: "success",
    statusText: "已修改",
  },
  {
    id: 3,
    icon: "Bell",
    title: "查看通知",
    time: new Date(Date.now() - 1000 * 60 * 60 * 4),
    type: "notification",
    status: "info",
    statusText: "已查看",
  },
  {
    id: 4,
    icon: "Setting",
    title: "更新个人信息",
    time: new Date(Date.now() - 1000 * 60 * 60 * 6),
    type: "profile",
    status: "success",
    statusText: "已更新",
  },
]);

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

// 使用统一的getRoleTagType函数

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

const formatTime = (time: Date) => {
  const now = new Date();
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

.activity-status.info {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
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
}
</style>
