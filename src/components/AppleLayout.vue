<template>
  <div class="apple-layout">
    <!-- 动态背景 -->
    <div class="dynamic-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 侧边栏 -->
    <aside
      class="apple-sidebar"
      :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      ref="sidebarRef"
    >
      <div class="sidebar-header">
        <div class="logo-container" @click="toggleSidebar">
          <div class="logo-icon" v-show="!sidebarCollapsed">
            <el-icon><Files /></el-icon>
          </div>
          <div class="logo-text" v-show="!sidebarCollapsed">
            <h2>专利管理系统</h2>
            <p>新浪科技</p>
          </div>
          <div class="collapse-indicator">
            <el-icon v-if="!sidebarCollapsed"><ArrowLeft /></el-icon>
            <el-icon v-else><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="(item, index) in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isNavActive(item) }"
          @mouseenter="handleNavHover"
          @mouseleave="handleNavLeave"
          :ref="
            (el) => {
              if (el) navItemRefs[index] = el as HTMLElement;
            }
          "
        >
          <div class="nav-icon">
            <el-icon class="nav-icon-svg">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <span class="nav-text" v-show="!sidebarCollapsed">{{
            item.title
          }}</span>
          <div class="nav-indicator"></div>
          <div class="nav-glow"></div>
        </router-link>
      </nav>

      <!-- 用户信息卡片 -->
      <div class="user-card" v-show="!sidebarCollapsed">
        <div class="user-avatar">
          <el-avatar
            :size="50"
            :src="
              userStore.currentUser?.avatar ||
              'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
            "
          />
          <div class="online-indicator"></div>
        </div>
        <div class="user-info">
          <h4>{{ userStore.currentUser?.realName || "用户" }}</h4>
          <p>{{ getRoleText(userStore.currentUser?.role) }}</p>
        </div>
      </div>

      <!-- 折叠时的用户头像 -->
      <div class="user-card-collapsed" v-show="sidebarCollapsed">
        <div class="user-avatar-small">
          <el-avatar
            :size="40"
            :src="
              userStore.currentUser?.avatar ||
              'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
            "
          />
          <div class="online-indicator-small"></div>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <main
      class="apple-main-content"
      :class="{ 'content-expanded': sidebarCollapsed }"
      ref="mainContentRef"
    >
      <!-- 顶部导航栏 -->
      <header class="top-bar">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">
              <el-icon><House /></el-icon>
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">
              {{ $route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="top-actions">
          <!-- 通知中心 -->
          <NotificationCenter />

          <!-- 用户下拉菜单 -->
          <el-dropdown>
            <span class="user-dropdown">
              <div class="user-avatar">
                <el-avatar
                  :size="40"
                  :src="
                    userStore.currentUser?.avatar ||
                    'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
                  "
                />
                <div class="online-indicator"></div>
              </div>
              <div class="user-info">
                <span class="user-name">{{
                  userStore.currentUser?.realName || "用户"
                }}</span>
                <span class="user-role">{{
                  getRoleText(userStore.currentUser?.role)
                }}</span>
              </div>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item @click="goToSettings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="page-content" ref="pageContentRef">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 快捷操作栏 -->
    <QuickActionsBar />

    <!-- 个人工作台 -->
    <PersonalWorkspace v-if="showPersonalWorkspace" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/stores/user";
import { appleAnimations } from "@/utils/animations";
import {
  House,
  Files,
  // Plus,
  // Folder,
  User,
  // DataBoard,
  // TrendCharts,
  // DataAnalysis,
  // Money,
  // Clock,
  // Document as DocumentIcon,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Setting,
  SwitchButton,
  // MagicStick,
  // Connection,
  // ChatDotRound,
  // List,
  // Calendar,
  // Lock,
} from "@element-plus/icons-vue";
import NotificationCenter from "./NotificationCenter.vue";
import QuickActionsBar from "./QuickActionsBar.vue";
import PersonalWorkspace from "./PersonalWorkspace.vue";

const router = useRouter();
const userStore = useUserStore();

// 响应式数据
const sidebarCollapsed = ref(false);
const sidebarRef = ref<HTMLElement>();
const mainContentRef = ref<HTMLElement>();
const pageContentRef = ref<HTMLElement>();
const navItemRefs = ref<HTMLElement[]>([]);
const showPersonalWorkspace = ref(false);

// 个性化设置（如需使用可恢复）
// const currentTheme = computed(() => personalizationStore.currentTheme);
// const interfaceSettings = computed(() => personalizationStore.settings.interface);

// 菜单项配置
const menuItems = computed(() => {
  const baseItems = [
    {
      path: "/dashboard",
      title: "控制台",
      icon: "House",
      exact: true,
      permission: "canViewDashboard",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/patents",
      title: "专利管理",
      icon: "Files",
      exact: true,
      permission: "canViewPatents",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/patents/add",
      title: "专利申请",
      icon: "Plus",
      exact: true,
      permission: "canAddPatents",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/disclosures",
      title: "交底书管理",
      icon: "Document",
      exact: true,
      permission: "canViewDisclosures",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/review",
      title: "审核专利",
      icon: "Check",
      exact: true,
      permission: "canReviewPatents",
      show: ["admin", "reviewer"].includes(userStore.currentUser?.role || ""), // 只有admin和reviewer可见
    },
    {
      path: "/dashboard/users",
      title: "用户管理",
      icon: "User",
      exact: true,
      permission: "canViewUsers",
      show: userStore.currentUser?.role === "admin", // 只有admin可见
    },

    {
      path: "/dashboard/fees",
      title: "费用管理",
      icon: "Money",
      exact: true,
      permission: "canViewFees",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/deadlines",
      title: "期限管理",
      icon: "Clock",
      exact: true,
      permission: "canViewDeadlines",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/contracts",
      title: "合同管理",
      icon: "Document",
      exact: true,
      permission: "canViewContracts",
      show: true, // 所有用户都可见
    },

    {
      path: "/dashboard/data-security",
      title: "数据安全管理",
      icon: "Lock",
      exact: true,
      permission: "canManageSecurity",
      show: userStore.currentUser?.role === "admin", // 只有admin可见
    },

    {
      path: "/dashboard/collaboration",
      title: "协作空间",
      icon: "ChatDotRound",
      exact: true,
      permission: "canCollaborate",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/tasks",
      title: "任务管理",
      icon: "List",
      exact: true,
      permission: "canManageTasks",
      show: true, // 所有用户都可见
    },
    {
      path: "/dashboard/workflows",
      title: "工作流管理",
      icon: "Share",
      exact: true,
      permission: "canManageWorkflows",
      show: userStore.currentUser?.role === "admin", // 只有admin可见
    },
  ];

  // 根据用户角色过滤菜单项
  // admin 用户可以看到所有功能
  if (userStore.currentUser?.role === "admin") {
    return baseItems;
  }

  // 其他用户根据权限过滤
  return baseItems.filter((item) => item.show);
});

// 计算属性
const isNavActive = (item: any) => {
  if (item.exact) {
    return router.currentRoute.value.path === item.path;
  }
  return router.currentRoute.value.path.startsWith(item.path);
};

const getRoleText = (role?: string) => {
  const roleMap: Record<string, string> = {
    admin: "管理员",
    reviewer: "审核员",
    user: "用户",
  };
  return roleMap[role || "user"] || "用户";
};

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;

  // 添加动画效果
  if (sidebarRef.value) {
    if (sidebarCollapsed.value) {
      appleAnimations.slideUp(sidebarRef.value, 0.3);
    } else {
      appleAnimations.fadeIn(sidebarRef.value, 0.3);
    }
  }
};

const handleNavHover = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target) {
    appleAnimations.scaleIn(target, 0.2);
  }
};

const handleNavLeave = () => {
  // 鼠标离开时的处理
};

const goToProfile = () => {
  router.push("/dashboard/profile");
};

const goToSettings = () => {
  router.push("/dashboard/settings");
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "确认退出", {
      type: "warning",
    });

    userStore.logout();
    router.push("/login");
    ElMessage.success("已安全退出");
  } catch (error) {
    // 用户取消退出
  }
};

// 生命周期
onMounted(async () => {
  // 初始化动画
  await nextTick();

  if (sidebarRef.value) {
    appleAnimations.fadeIn(sidebarRef.value, 0.6);
  }

  if (mainContentRef.value) {
    appleAnimations.slideUp(mainContentRef.value, 0.6);
  }

  // 为导航项添加交错动画
  navItemRefs.value.forEach((item, index) => {
    if (item) {
      setTimeout(() => {
        appleAnimations.fadeIn(item, 0.3);
      }, index * 100);
    }
  });
});

// 组件卸载前清理
onBeforeUnmount(() => {
  try {
    // 清理所有定时器
    navItemRefs.value.forEach((item, index) => {
      if (item) {
        clearTimeout(index * 100);
      }
    });

    // 清理引用
    navItemRefs.value = [];
    sidebarRef.value = undefined;
    mainContentRef.value = undefined;
    pageContentRef.value = undefined;
  } catch (error) {
    console.warn("组件卸载清理时出现错误:", error);
  }
});

// 添加额外的错误边界
</script>

<style scoped>
.apple-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background: var(--background-color, var(--apple-bg-primary));
  color: var(--text-color, #303133);
}

/* 动态背景 */
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.1;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #007aff, #5856d6);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #34c759, #30d158);
  top: 60%;
  right: 20%;
  animation-delay: -7s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(45deg, #ff9500, #ff2d55);
  bottom: 20%;
  left: 30%;
  animation-delay: -14s;
}

/* 侧边栏 */
.apple-sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--apple-border-light);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--apple-shadow-soft);
  z-index: 10;
}

.apple-sidebar.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--apple-border-light);
  position: relative;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 12px;
  border-radius: var(--apple-radius);
  transition: all 0.3s ease;
  position: relative;
}

.logo-container:hover {
  background: rgba(0, 122, 255, 0.1);
  transform: scale(1.02);
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: var(--apple-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  animation: pulse 3s ease-in-out infinite;
}

.logo-text h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--apple-text-primary);
}

.logo-text p {
  margin: 0;
  font-size: 12px;
  color: var(--apple-text-secondary);
}

.collapse-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--apple-text-secondary);
  transition: all 0.3s ease;
}

/* 导航 */
.sidebar-nav {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 100px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--apple-text-primary);
  text-decoration: none;
  border-radius: var(--apple-radius);
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(0, 122, 255, 0.1);
  transform: translateX(4px);
}

.nav-item.active {
  background: var(--apple-accent);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.nav-icon {
  margin-right: 12px;
  font-size: 20px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.nav-text {
  font-weight: 500;
  font-size: 14px;
}

.nav-indicator {
  position: absolute;
  right: 12px;
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item.active .nav-indicator {
  opacity: 1;
}

.nav-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item:hover .nav-glow {
  opacity: 1;
}

/* 用户卡片 */
.user-card {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--apple-radius-large);
  padding: 16px;
  border: 1px solid var(--apple-border-light);
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--apple-shadow-soft);
}

.user-avatar {
  position: relative;
  flex-shrink: 0;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: var(--apple-success);
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s ease-in-out infinite;
}

.user-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--apple-text-primary);
}

.user-info p {
  margin: 0;
  font-size: 12px;
  color: var(--apple-text-secondary);
}

.user-card-collapsed {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-avatar-small {
  position: relative;
  flex-shrink: 0;
}

.online-indicator-small {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: var(--apple-success);
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s ease-in-out infinite;
}

/* 主内容区域 */
.apple-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--apple-bg-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-expanded {
  margin-left: 0;
}

/* 顶部导航栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--apple-border-light);
  box-shadow: var(--apple-shadow-soft);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--apple-text-secondary);
  font-size: 14px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: var(--apple-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--apple-border-light);
}

.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
  box-shadow: var(--apple-shadow-soft);
}

.user-name {
  font-weight: 500;
  color: var(--apple-text-primary);
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  color: var(--apple-text-secondary);
}

.dropdown-arrow {
  color: var(--apple-text-secondary);
  transition: transform 0.3s ease;
}

.user-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

/* 页面内容 */
.page-content {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .apple-sidebar {
    background: rgba(0, 0, 0, 0.8);
    border-right-color: var(--apple-border);
  }

  .top-bar {
    background: rgba(0, 0, 0, 0.8);
    border-bottom-color: var(--apple-border);
  }

  .user-dropdown {
    background: rgba(0, 0, 0, 0.5);
    border-color: var(--apple-border);
  }

  .user-dropdown:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .user-card {
    background: rgba(0, 0, 0, 0.8);
    border-color: var(--apple-border);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apple-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
  }

  .apple-sidebar.sidebar-collapsed {
    transform: translateX(0);
  }

  .apple-main-content {
    margin-left: 0;
  }

  .page-content {
    padding: 16px;
  }
}
</style>
