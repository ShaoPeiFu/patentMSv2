<template>
  <div class="layout">
    <!-- 粒子背景动画 -->
    <div class="particles-container">
      <div
        class="particle"
        v-for="i in 50"
        :key="i"
        :style="getParticleStyle()"
      ></div>
    </div>

    <!-- 动态光效 -->
    <div class="light-effects">
      <div class="light-beam light-1"></div>
      <div class="light-beam light-2"></div>
      <div class="light-beam light-3"></div>
    </div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
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
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isNavActive(item) }"
          @mouseenter="handleNavHover"
          @mouseleave="handleNavLeave"
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
      class="main-content"
      :class="{ 'content-expanded': sidebarCollapsed }"
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
              <div class="user-details">
                <span class="user-name">{{
                  userStore.currentUser?.realName || "用户"
                }}</span>
                <span class="user-role">{{
                  getRoleText(userStore.currentUser?.role)
                }}</span>
              </div>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="modern-dropdown">
                <el-dropdown-item @click="$router.push('/dashboard/profile')">
                  <el-icon><User /></el-icon>
                  个人设置
                </el-dropdown-item>
                <el-dropdown-item
                  @click="$router.push('/dashboard/password/change')"
                >
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item @click="$router.push('/dashboard/settings')">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import { hasPermission } from "@/utils/permissions";
import NotificationCenter from "./NotificationCenter.vue";
import {
  House,
  Plus,
  Folder,
  User,
  DataAnalysis,
  DataBoard,
  Lock,
  SwitchButton,
  Setting,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Files,
  View,
  Money,
  Clock,
  Document as DocumentIcon,
} from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const sidebarCollapsed = ref(false);

// 所有可能的菜单项
const allMenuItems = [
  {
    path: "/dashboard",
    title: "控制台",
    icon: House,
    exact: true,
    permission: null, // 所有用户都可以访问
  },
  {
    path: "/dashboard/patents",
    title: "专利管理",
    icon: Files,
    exact: false,
    permission: "canViewPatents",
  },
  {
    path: "/dashboard/patents/add",
    title: "专利申请",
    icon: Plus,
    exact: true,
    permission: "canAddPatents",
  },
  {
    path: "/dashboard/review",
    title: "审核中心",
    icon: View,
    exact: true,
    permission: "canAccessReviewCenter",
  },
  {
    path: "/dashboard/categories",
    title: "分类管理",
    icon: Folder,
    exact: true,
    permission: "canManageCategories",
  },
  {
    path: "/dashboard/users",
    title: "用户管理",
    icon: User,
    exact: true,
    permission: "canViewUsers",
  },
  {
    path: "/dashboard/reports",
    title: "统计报表",
    icon: DataAnalysis,
    exact: true,
    permission: "canViewReports",
  },

  {
    path: "/dashboard/analytics",
    title: "高级分析",
    icon: DataAnalysis,
    exact: true,
    permission: "canViewReports",
  },
  {
    path: "/dashboard/visualization",
    title: "可视化中心",
    icon: DataBoard,
    exact: true,
    permission: "canViewReports",
  },
  {
    path: "/dashboard/fees",
    title: "费用管理",
    icon: Money,
    exact: true,
    permission: "canViewReports",
  },
  {
    path: "/dashboard/deadlines",
    title: "期限管理",
    icon: Clock,
    exact: true,
    permission: "canViewReports",
  },
  {
    path: "/dashboard/contracts",
    title: "合同管理",
    icon: DocumentIcon,
    exact: true,
    permission: "canViewReports",
  },
];

// 根据用户权限筛选菜单项
const menuItems = computed(() => {
  const userRole = userStore.currentUser?.role || "user";

  return allMenuItems.filter((item) => {
    // 没有权限要求的菜单项（如控制台）对所有用户可见
    if (!item.permission) {
      return true;
    }

    // 检查用户是否有对应权限
    return hasPermission(userRole, item.permission as any);
  });
});

// 获取角色文本
const getRoleText = (role?: string) => {
  const texts: Record<string, string> = {
    user: "普通用户",
    admin: "管理员",
    reviewer: "审核员",
  };
  return texts[role || ""] || "未知";
};

// 判断导航项是否激活
const isNavActive = (item: { path: string; exact: boolean }) => {
  const currentPath = route.path;

  if (item.exact) {
    // 精确匹配
    return currentPath === item.path;
  } else {
    // 对于专利管理，需要特殊处理
    if (item.path === "/dashboard/patents") {
      // 匹配 /dashboard/patents 及其子路径，但排除 /dashboard/patents/add 和 /dashboard/patents/edit
      return (
        currentPath === "/dashboard/patents" ||
        (currentPath.startsWith("/dashboard/patents/") &&
          !currentPath.includes("/add") &&
          !currentPath.includes("/edit"))
      );
    }
    // 其他路径使用精确匹配
    return currentPath === item.path;
  }
};

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 导航悬停效果
const handleNavHover = (event: Event) => {
  const target = event.target as HTMLElement;
  const navItem = target.closest(".nav-item") as HTMLElement | null;
  if (navItem) {
    navItem.style.transform = "translateX(10px) scale(1.05)";
  }
};

const handleNavLeave = (event: Event) => {
  const target = event.target as HTMLElement;
  const navItem = target.closest(".nav-item") as HTMLElement | null;
  if (navItem) {
    navItem.style.transform = "translateX(0) scale(1)";
  }
};

// 粒子样式
const getParticleStyle = () => {
  const size = Math.random() * 4 + 2;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const delay = Math.random() * 5;
  const duration = Math.random() * 10 + 10;

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};

// 退出登录
const logout = () => {
  userStore.logout();
  router.push("/login");
};

// 组件挂载时初始化动画
onMounted(() => {
  // 添加页面加载动画
  document.body.classList.add("page-loaded");
});
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

/* 粒子背景动画 */
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: float-particle linear infinite;
  pointer-events: none;
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* 动态光效 */
.light-effects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.light-beam {
  position: absolute;
  width: 2px;
  height: 100vh;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: light-sweep 8s linear infinite;
}

.light-1 {
  left: 20%;
  animation-delay: 0s;
}

.light-2 {
  left: 50%;
  animation-delay: 2.5s;
}

.light-3 {
  left: 80%;
  animation-delay: 5s;
}

@keyframes light-sweep {
  0% {
    transform: translateY(-100vh);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  margin: 0;
  border: none;
  outline: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  /* 确保完全贴合左侧边缘 */
  transform: translateX(0);
}

.sidebar-collapsed {
  width: 80px;
  /* 确保折叠时有足够空间显示图标 */
  min-width: 80px;
}

.sidebar-header {
  padding: 30px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
  position: relative;
  /* 确保头部正确显示 */
  min-height: 80px;
}

/* 折叠时的头部样式 */
.sidebar-collapsed .sidebar-header {
  padding: 20px 10px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

/* 折叠时的logo容器 */
.sidebar-collapsed .logo-container {
  justify-content: center;
  gap: 0;
}

.logo-container:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.logo-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
  flex-shrink: 0;
  position: relative;
}

/* 确保logo图标正确显示，没有额外元素 */
.logo-icon .el-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.logo-icon .el-icon svg {
  width: 1em;
  height: 1em;
  fill: currentColor;
  stroke: currentColor;
}

/* 隐藏logo图标中的任何额外箭头 */
.logo-icon .el-icon:not(:first-child) {
  display: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.logo-text h2 {
  margin: 0 0 5px 0;
  font-size: 1.4em;
  font-weight: 600;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.logo-text p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.collapse-indicator {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

/* 折叠时的指示器位置 */
.sidebar-collapsed .collapse-indicator {
  position: static;
  transform: translateY(-50%);
  margin: 0 auto;
}

.sidebar-nav {
  padding: 0 15px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  padding-bottom: 100px; /* 为用户卡片留出空间 */
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 折叠时的导航容器 */
.sidebar-collapsed .sidebar-nav {
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: white;
  text-decoration: none;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

/* 折叠时的导航项间距和样式 */
.sidebar-collapsed .nav-item {
  margin-bottom: 4px;
  border-radius: 8px;
  padding: 15px 5px;
  justify-content: flex-start;
  align-items: center;
  min-height: 50px;
  text-align: left;
}

.nav-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.nav-item:hover::before {
  left: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px) scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.nav-item.active {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.nav-icon {
  margin-right: 15px;
  font-size: 20px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.sidebar-collapsed .nav-icon {
  margin-right: 0;
  margin-bottom: 0;
  font-size: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding-left: 8px;
}

/* 确保图标正确显示，没有额外元素 */
.nav-icon-svg {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
}

.nav-icon-svg svg {
  width: 1em;
  height: 1em;
  fill: currentColor;
  stroke: currentColor;
}

/* 确保没有额外的子元素 */
.nav-icon-svg > * {
  display: block;
}

/* 隐藏任何可能的额外箭头 */
.nav-icon-svg .el-icon:not(:first-child) {
  display: none;
}

/* 确保图标在折叠时左对齐 */
.sidebar-collapsed .nav-icon-svg {
  justify-content: flex-start;
  align-items: center;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1) rotate(5deg);
}

.nav-text {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-indicator {
  position: absolute;
  right: 15px;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item.active .nav-indicator {
  opacity: 1;
  animation: pulse 2s ease-in-out infinite;
}

/* 折叠时隐藏指示器 */
.sidebar-collapsed .nav-indicator {
  display: none;
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
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
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s ease-in-out infinite;
}

.user-info h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: white;
}

.user-info p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 折叠时的用户头像 */
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
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s ease-in-out infinite;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  margin-left: 280px;
  width: calc(100vw - 280px);
  min-height: 100vh;
  border-radius: 20px 0 0 20px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 确保内容区域正确定位 */
  position: relative;
}

.content-expanded {
  margin-left: 80px;
  width: calc(100vw - 80px);
  /* 折叠时内容区域稍微往左移动 */
  padding-left: 20px;
}

.top-bar {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px 0 0 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb .el-breadcrumb__item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 15px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
  margin-right: 10px;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  color: #666;
  opacity: 0.8;
}

.dropdown-icon {
  color: #666;
  transition: transform 0.3s ease;
}

.user-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.modern-dropdown {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.modern-dropdown .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  transition: all 0.3s ease;
}

.modern-dropdown .el-dropdown-menu__item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: transparent;
}

/* 页面加载动画 */
.page-loaded .layout {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.show {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
    width: 100vw;
  }
}

/* 确保侧边栏在所有情况下都正确显示 */
@media (min-width: 769px) {
  .sidebar {
    transform: translateX(0) !important;
  }

  .main-content {
    margin-left: 280px !important;
    width: calc(100vw - 280px) !important;
  }

  .content-expanded {
    margin-left: 80px !important;
    width: calc(100vw - 80px) !important;
  }
}
</style>
