<template>
  <div class="apple-dashboard">
    <!-- 动态背景 -->
    <div class="dashboard-background">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            <span class="greeting">欢迎回来，</span>
            <span class="user-name">{{
              userStore?.currentUser?.realName || "用户"
            }}</span>
          </h1>
          <p class="welcome-subtitle">{{ getCurrentTime() }}</p>
        </div>
        <div class="welcome-illustration">
          <div class="illustration-circle"></div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div
          class="stat-card"
          v-for="(stat, index) in stats"
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

    <!-- 快速操作 -->
    <div class="quick-actions-section">
      <h2 class="section-title">
        <span class="title-text">快速操作</span>
        <div class="title-underline"></div>
      </h2>
      <div class="actions-grid">
        <div
          class="action-card"
          v-for="(action, index) in quickActions"
          :key="action.name"
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="handleQuickAction(action)"
          ref="actionCards"
        >
          <div class="action-icon">
            <el-icon><component :is="action.icon" /></el-icon>
          </div>
          <h3>{{ action.name }}</h3>
          <p>{{ action.description }}</p>
          <div class="action-glow"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { usePatentStore } from "@/stores/patent";
import { appleAnimations } from "@/utils/animations";
// @ts-ignore
import {
  // Document,
  Check,
  Clock,
  Warning,
  TrendCharts,
  Plus,
  // UserFilled,
  // Setting,
} from "@element-plus/icons-vue";

interface QuickAction {
  id: string;
  name: string;
  icon: string;
  path: string;
  description: string;
  action?: () => void;
}

const router = useRouter();
const userStore = useUserStore();

// 响应式引用
const statCards = ref<HTMLElement[]>([]);
const actionCards = ref<HTMLElement[]>([]);

// 统计数据
const stats = computed(() => {
  const patentStore = usePatentStore();
  const statistics = patentStore.statistics;

  return [
    {
      icon: "Document",
      value: statistics.total.toString(),
      label: "总专利数",
      trend: "up",
      trendValue: "+12%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Check",
      value: (statistics.byStatus.approved || 0).toString(),
      label: "已授权",
      trend: "up",
      trendValue: "+8%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Clock",
      value: (statistics.byStatus.pending || 0).toString(),
      label: "待审核",
      trend: "down",
      trendValue: "-5%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Warning",
      value: statistics.expiringSoon.toString(),
      label: "即将过期",
      trend: "up",
      trendValue: "+3%",
      trendIcon: "TrendCharts",
    },
  ];
});

// 快速操作
const quickActions = ref<QuickAction[]>([
  {
    id: "dashboard",
    name: "仪表板",
    icon: "House",
    path: "/dashboard",
    description: "查看系统概览",
    action: () => router.push("/dashboard"),
  },
  {
    id: "patents",
    name: "专利管理",
    icon: "Document",
    path: "/dashboard/patents",
    description: "管理专利信息",
    action: () => router.push("/dashboard/patents"),
  },
  {
    id: "users",
    name: "用户管理",
    icon: "User",
    path: "/dashboard/users",
    description: "管理系统用户",
    action: () => router.push("/dashboard/users"),
  },
  {
    id: "settings",
    name: "系统设置",
    icon: "Setting",
    path: "/dashboard/settings",
    description: "配置系统参数",
    action: () => router.push("/dashboard/settings"),
  },
]);

// 获取当前时间
const getCurrentTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return now.toLocaleDateString("zh-CN", options);
};

// 处理快速操作
const handleQuickAction = (action: QuickAction) => {
  if (action.action) {
    action.action();
  }
};

// 组件挂载时初始化动画和数据
onMounted(async () => {
  // 主动加载专利数据，确保统计数据正确显示
  try {
    const patentStore = usePatentStore();
    await patentStore.fetchPatents();
  } catch (error) {
    console.error("加载数据失败:", error);
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

  // 为操作卡片添加动画
  actionCards.value.forEach((card, index) => {
    if (card) {
      setTimeout(() => {
        appleAnimations.scaleIn(card, 0.5);
      }, index * 150);
    }
  });
});
</script>

<style scoped>
.apple-dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

/* 动态背景 */
.dashboard-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.floating-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #007aff, #5856d6);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #34c759, #30d158);
  top: 60%;
  right: 20%;
  animation-delay: -7s;
}

.shape-3 {
  width: 180px;
  height: 180px;
  background: linear-gradient(45deg, #ff9500, #ff2d55);
  bottom: 20%;
  left: 30%;
  animation-delay: -14s;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 32px;
  color: var(--apple-text-primary);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--apple-shadow-soft);
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-text {
  flex: 1;
}

.welcome-title {
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.2;
  color: var(--apple-text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.greeting {
  opacity: 0.8;
  font-weight: 600;
}

.user-name {
  font-weight: 800;
}

.welcome-subtitle {
  font-size: 1.1em;
  opacity: 0.7;
  margin: 0;
  color: var(--apple-text-secondary);
}

.welcome-illustration {
  flex-shrink: 0;
  margin-left: 40px;
}

.illustration-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: 50%;
  position: relative;
  animation: pulse 3s ease-in-out infinite;
}

.illustration-circle::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
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
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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
  font-size: 2.2em;
  font-weight: 700;
  color: var(--apple-text-primary);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.95em;
  color: var(--apple-text-secondary);
  margin-bottom: 12px;
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  font-weight: 600;
}

.stat-trend.up {
  color: var(--apple-success);
}

.stat-trend.down {
  color: var(--apple-danger);
}

/* 快速操作 */
.quick-actions-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.8em;
  font-weight: 600;
  margin-bottom: 32px;
  color: var(--apple-text-primary);
  position: relative;
  display: inline-block;
}

.title-text {
  position: relative;
  z-index: 1;
}

.title-underline {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--apple-accent), #5856d6);
  border-radius: 2px;
  animation: expandWidth 1s ease-out 0.5s both;
}

@keyframes expandWidth {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.action-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--apple-shadow-soft);
  opacity: 0;
  transform: scale(0.9);
}

.action-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--apple-shadow-medium);
}

.action-glow {
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

.action-card:hover .action-glow {
  opacity: 1;
}

.action-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 24px;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.action-card:hover .action-icon {
  transform: scale(1.1) rotate(5deg);
}

.action-card h3 {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--apple-text-primary);
}

.action-card p {
  color: var(--apple-text-secondary);
  margin: 0;
  font-size: 0.9em;
  line-height: 1.5;
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
    transform: scale(1.05);
    opacity: 0.8;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .welcome-section {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    border-color: rgba(255, 255, 255, 0.1);
  }

  .stat-card,
  .action-card,
  .activities-list {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apple-dashboard {
    padding: 16px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }

  .welcome-title {
    font-size: 2em;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .activity-item {
    padding: 16px 20px;
  }
}
</style>
