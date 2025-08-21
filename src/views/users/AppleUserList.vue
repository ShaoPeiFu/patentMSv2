<template>
  <div class="apple-user-management">
    <!-- 动态背景 -->
    <div class="page-background">
      <div class="floating-elements">
        <div class="element element-1"></div>
        <div class="element element-2"></div>
        <div class="element element-3"></div>
      </div>
    </div>

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <span class="breadcrumb-item">首页</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item active">用户管理</span>
        </div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">管理系统用户和权限设置</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <div class="stats-grid">
        <div
          class="stat-card"
          v-for="(stat, index) in userStats"
          :key="stat.label"
          :style="{ animationDelay: `${index * 0.1}s` }"
          ref="statCards"
        >
          <div class="stat-icon">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-trend" :class="stat.trend">
              <el-icon><component :is="stat.trendIcon" /></el-icon>
              <span>{{ stat.trendValue }}</span>
            </div>
          </div>
          <div class="stat-glow"></div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <AppleCard elevated>
        <template #header>
          <h3 class="section-title">搜索和筛选</h3>
        </template>
        <div class="search-form">
          <div class="search-row">
            <div class="search-item">
              <label>关键词</label>
              <el-input
                v-model="searchForm.keyword"
                placeholder="搜索用户名、姓名、邮箱"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="search-item">
              <label>部门</label>
              <el-select
                v-model="searchForm.department"
                placeholder="选择部门"
                clearable
              >
                <el-option label="技术部" value="tech" />
                <el-option label="法务部" value="legal" />
                <el-option label="管理部" value="admin" />
                <el-option label="其他" value="other" />
              </el-select>
            </div>
            <div class="search-item">
              <label>角色</label>
              <el-select
                v-model="searchForm.role"
                placeholder="选择角色"
                clearable
              >
                <el-option label="普通用户" value="user" />
                <el-option label="管理员" value="admin" />
                <el-option label="审核员" value="reviewer" />
              </el-select>
            </div>
            <div class="search-actions">
              <AppleButton variant="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </AppleButton>
              <AppleButton variant="secondary" @click="handleReset">
                重置
              </AppleButton>
            </div>
          </div>
        </div>
      </AppleCard>
    </div>

    <!-- 用户列表 -->
    <div class="user-list-section">
      <AppleCard elevated>
        <template #header>
          <div class="list-header">
            <h3 class="section-title">用户列表</h3>
            <div class="list-actions">
              <AppleButton size="small" @click="handleExport">
                <el-icon><Download /></el-icon>
                导出
              </AppleButton>
              <AppleButton size="small" @click="handleRefresh">
                <el-icon><Refresh /></el-icon>
                刷新
              </AppleButton>
            </div>
          </div>
        </template>

        <div class="table-container">
          <el-table
            :data="filteredUsers"
            v-loading="loading"
            stripe
            class="apple-table"
            ref="userTable"
          >
            <el-table-column prop="id" label="ID" width="80" />

            <el-table-column label="头像" width="80">
              <template #default="{ row }">
                <div class="avatar-container">
                  <el-avatar
                    :src="
                      row.avatar ||
                      'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
                    "
                    :size="40"
                  />
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="username" label="用户名" width="120" />

            <el-table-column prop="realName" label="真实姓名" width="120" />

            <el-table-column prop="email" label="邮箱" min-width="200" />

            <el-table-column prop="phone" label="手机号码" width="130" />

            <el-table-column prop="department" label="部门" width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="getDepartmentTagType(row.department)"
                >
                  {{ getDepartmentText(row.department) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getRoleTagType(row.role)">
                  {{ getRoleText(row.role) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="注册时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>

            <el-table-column prop="lastLoginAt" label="最后登录" width="160">
              <template #default="{ row }">
                {{ formatDate(row.lastLoginAt) }}
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <AppleButton
                    size="small"
                    variant="secondary"
                    @click="handleViewUser(row)"
                  >
                    查看
                  </AppleButton>
                  <AppleButton
                    size="small"
                    variant="primary"
                    @click="handleEditUser(row)"
                    v-if="canEditUsers"
                  >
                    编辑
                  </AppleButton>
                  <AppleButton
                    size="small"
                    variant="danger"
                    @click="handleDeleteUser(row)"
                    v-if="canDeleteUsers"
                  >
                    删除
                  </AppleButton>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalUsers"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </AppleCard>
    </div>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="showUserDialog"
      :title="dialogTitle"
      width="600px"
      class="apple-dialog"
    >
      <UserForm
        v-if="showUserDialog"
        :user="editingUser"
        @submit="handleUserSubmit"
        @cancel="showUserDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import { appleAnimations } from "@/utils/animations";
import AppleButton from "@/components/ui/AppleButton.vue";
import AppleCard from "@/components/ui/AppleCard.vue";
import UserForm from "./UserForm.vue";
import type { User } from "@/types/user";
import { Search, Download, Refresh } from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

// 响应式引用
const statCards = ref<HTMLElement[]>([]);
const addUserBtn = ref<HTMLElement>();
const userTable = ref();

// 搜索表单
const searchForm = ref({
  keyword: "",
  department: "",
  role: "",
});

// 分页
const currentPage = ref(1);
const pageSize = ref(20);
const totalUsers = ref(0);

// 对话框状态
const showUserDialog = ref(false);
const editingUser = ref<User | null>(null);
const dialogTitle = computed(() =>
  editingUser.value ? "编辑用户" : "用户管理"
);

// 加载状态
const loading = ref(false);

// 用户统计数据
const userStats = computed(() => {
  const users = userStore.users || [];
  if (!Array.isArray(users)) {
    console.warn("users不是数组:", users);
    return [
      {
        icon: "UserFilled",
        value: "0",
        label: "总用户数",
        trend: "up",
        trendValue: "+0%",
        trendIcon: "TrendCharts",
      },
      {
        icon: "Check",
        value: "0",
        label: "活跃用户",
        trend: "up",
        trendValue: "+0%",
        trendIcon: "TrendCharts",
      },
      {
        icon: "Setting",
        value: "0",
        label: "管理员",
        trend: "down",
        trendValue: "+0%",
        trendIcon: "TrendCharts",
      },
      {
        icon: "Clock",
        value: "0",
        label: "最近登录",
        trend: "up",
        trendValue: "+0%",
        trendIcon: "TrendCharts",
      },
    ];
  }

  const total = users.length;
  const active = users.filter((u) => u.lastLoginAt).length;
  const admin = users.filter((u) => u.role === "admin").length;
  const recent = users.filter((u) => {
    const lastLogin = new Date(u.lastLoginAt || 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastLogin > weekAgo;
  }).length;

  return [
    {
      icon: "UserFilled",
      value: total.toString(),
      label: "总用户数",
      trend: "up",
      trendValue: "+5%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Check",
      value: active.toString(),
      label: "活跃用户",
      trend: "up",
      trendValue: "+12%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Setting",
      value: admin.toString(),
      label: "管理员",
      trend: "down",
      trendValue: "-2%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Clock",
      value: recent.toString(),
      label: "最近登录",
      trend: "up",
      trendValue: "+8%",
      trendIcon: "TrendCharts",
    },
  ];
});

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let users = userStore.users || [];

  // 确保users是数组
  if (!Array.isArray(users)) {
    console.warn("users不是数组:", users);
    totalUsers.value = 0;
    return [];
  }

  // 关键词搜索
  if (searchForm.value.keyword) {
    const keyword = searchForm.value.keyword.toLowerCase();
    users = users.filter(
      (user) =>
        user.username.toLowerCase().includes(keyword) ||
        user.realName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );
  }

  // 部门筛选
  if (searchForm.value.department) {
    users = users.filter(
      (user) => user.department === searchForm.value.department
    );
  }

  // 角色筛选
  if (searchForm.value.role) {
    users = users.filter((user) => user.role === searchForm.value.role);
  }

  totalUsers.value = users.length;
  return users;
});

// 权限检查

const canEditUsers = computed(() => userStore.hasPermission("user:edit"));
const canDeleteUsers = computed(() => userStore.hasPermission("user:delete"));

// 部门标签类型
const getDepartmentTagType = (department: string) => {
  const typeMap: Record<string, string> = {
    tech: "primary",
    legal: "success",
    admin: "warning",
    other: "info",
  };
  return typeMap[department] || "info";
};

// 角色标签类型
const getRoleTagType = (role: string) => {
  const typeMap: Record<string, string> = {
    admin: "danger",
    reviewer: "warning",
    user: "info",
  };
  return typeMap[role] || "info";
};

// 部门文本
const getDepartmentText = (department: string) => {
  const textMap: Record<string, string> = {
    tech: "技术部",
    legal: "法务部",
    admin: "管理部",
    other: "其他",
  };
  return textMap[department] || "未知";
};

// 角色文本
const getRoleText = (role: string) => {
  const textMap: Record<string, string> = {
    admin: "管理员",
    reviewer: "审核员",
    user: "普通用户",
  };
  return textMap[role] || "未知";
};

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  ElMessage.success("搜索完成");
};

// 处理重置
const handleReset = () => {
  searchForm.value = {
    keyword: "",
    department: "",
    role: "",
  };
  currentPage.value = 1;
  ElMessage.success("筛选条件已重置");
};

// 处理查看用户
const handleViewUser = (user: User) => {
  router.push(`/dashboard/users/${user.id}`);
};

// 处理编辑用户
const handleEditUser = (user: User) => {
  editingUser.value = { ...user };
  showUserDialog.value = true;
};

// 处理删除用户
const handleDeleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.realName}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await userStore.deleteUser(user.id);
    ElMessage.success("用户删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除用户失败");
    }
  }
};

// 处理用户提交
const handleUserSubmit = async (userData: Partial<User>) => {
  try {
    if (editingUser.value) {
      await userStore.updateUser(editingUser.value.id, userData);
      ElMessage.success("用户更新成功");
    } else {
      // 添加用户功能已删除
      ElMessage.error("添加用户功能已删除");
      ElMessage.success("用户添加成功");
    }
    showUserDialog.value = false;
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 处理导出
const handleExport = () => {
  ElMessage.success("导出功能开发中");
};

// 处理刷新
const handleRefresh = () => {
  // 重新加载用户数据
  userStore.fetchUsers();
  ElMessage.success("数据已刷新");
};

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 组件挂载时初始化
onMounted(async () => {
  // 加载用户数据
  try {
    // 重新加载用户数据
    await userStore.fetchUsers();

    // 获取用户列表
    await userStore.fetchUsers();
  } catch (error) {
    console.error("加载用户数据失败:", error);
    // 确保用户列表是数组，防止后续错误
    if (!Array.isArray(userStore.users)) {
      userStore.users = [];
    }
  }

  // 等待DOM渲染完成
  await nextTick();

  // 为统计卡片添加动画
  statCards.value.forEach((card, index) => {
    if (card) {
      setTimeout(() => {
        appleAnimations.slideUp(card, 0.6);
      }, index * 100);
    }
  });

  // 为添加按钮添加动画
  if (addUserBtn.value) {
    setTimeout(() => {
      appleAnimations.scaleIn(addUserBtn.value!, 0.5);
    }, 500);
  }
});
</script>

<style scoped>
.apple-user-management {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

/* 动态背景 */
.page-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.floating-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.element {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
  animation: float 25s ease-in-out infinite;
}

.element-1 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #007aff, #5856d6);
  top: 15%;
  left: 15%;
  animation-delay: 0s;
}

.element-2 {
  width: 120px;
  height: 120px;
  background: linear-gradient(45deg, #34c759, #30d158);
  top: 70%;
  right: 25%;
  animation-delay: -8s;
}

.element-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #ff9500, #ff2d55);
  bottom: 25%;
  left: 40%;
  animation-delay: -16s;
}

/* 页面标题区域 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--apple-shadow-soft);
}

.header-content {
  flex: 1;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9em;
  color: var(--apple-text-secondary);
}

.breadcrumb-item {
  transition: color 0.3s ease;
}

.breadcrumb-item.active {
  color: var(--apple-accent);
  font-weight: 600;
}

.breadcrumb-separator {
  opacity: 0.5;
}

.page-title {
  font-size: 2.5em;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.1em;
  color: var(--apple-text-secondary);
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
}

/* 统计卡片 */
.statistics-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--apple-shadow-soft);
  opacity: 0;
  transform: translateY(30px);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--apple-shadow-medium);
}

.stat-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(0, 122, 255, 0.1) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.8em;
  font-weight: 700;
  color: var(--apple-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9em;
  color: var(--apple-text-secondary);
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.stat-trend.up {
  color: var(--apple-success);
}

.stat-trend.down {
  color: var(--apple-danger);
}

/* 搜索区域 */
.search-section {
  margin-bottom: 32px;
}

.search-form {
  padding: 0;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 20px;
  align-items: end;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-item label {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--apple-text-primary);
}

.search-actions {
  display: flex;
  gap: 12px;
  align-items: end;
}

/* 用户列表区域 */
.user-list-section {
  margin-bottom: 32px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-actions {
  display: flex;
  gap: 12px;
}

.table-container {
  margin: 0 -24px;
}

.apple-table {
  width: 100%;
}

.apple-table :deep(.el-table__header) {
  background: rgba(0, 122, 255, 0.05);
}

.apple-table :deep(.el-table__row:hover) {
  background: rgba(0, 122, 255, 0.05);
}

.avatar-container {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 对话框样式 */
.apple-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--apple-shadow-medium);
}

.apple-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  color: white;
  padding: 24px;
}

.apple-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

/* 动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-15px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-header {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    border-color: rgba(255, 255, 255, 0.1);
  }

  .stat-card {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .pagination-container {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .search-row {
    grid-template-columns: 1fr 1fr;
  }

  .search-actions {
    grid-column: span 2;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .apple-user-management {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .page-title {
    font-size: 2em;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .search-row {
    grid-template-columns: 1fr;
  }

  .search-actions {
    grid-column: 1;
  }

  .list-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
