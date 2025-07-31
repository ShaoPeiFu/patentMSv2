<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            <span class="greeting">欢迎回来，</span>
            <span class="user-name">{{
              userStore.currentUser?.realName || "用户"
            }}</span>
          </h1>
          <p class="welcome-subtitle">{{ getCurrentTime() }}</p>
        </div>
        <div class="welcome-visual">
          <div class="progress-ring">
            <svg class="progress-svg" width="120" height="120">
              <circle
                class="progress-bg"
                cx="60"
                cy="60"
                r="50"
                stroke-width="8"
              />
              <circle
                class="progress-fill"
                cx="60"
                cy="60"
                r="50"
                stroke-width="8"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="
                  circumference - (progress / 100) * circumference
                "
              />
            </svg>
            <div class="progress-text">
              <span class="progress-number">{{ progress }}%</span>
              <span class="progress-label">完成度</span>
            </div>
          </div>
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
          :key="action.title"
          :style="{ animationDelay: `${index * 0.1}s` }"
          @click="handleQuickAction(action)"
        >
          <div class="action-icon">
            <el-icon><component :is="action.icon" /></el-icon>
          </div>
          <h3>{{ action.title }}</h3>
          <p>{{ action.description }}</p>
          <div class="action-glow"></div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities-section">
      <h2 class="section-title">
        <span class="title-text">最近活动</span>
        <div class="title-underline"></div>
      </h2>
      <div class="section-actions">
        <el-button size="small" @click="testAddActivity"
          >测试添加活动</el-button
        >
        <el-button size="small" @click="refreshActivities">刷新活动</el-button>
      </div>
      <div class="activities-list">
        <div
          class="activity-item"
          v-for="(activity, index) in recentActivities"
          :key="activity.id"
          :style="{ animationDelay: `${index * 0.1}s` }"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { usePatentStore } from "@/stores/patent";
import { useActivityStore } from "@/stores/activity";
import { ElMessage } from "element-plus";
import type { QuickAction } from "@/types/patent";
import {
  Document,
  UserFilled,
  DataAnalysis,
  Plus,
  Check,
  Clock,
  Warning,
  TrendCharts,
  Bell,
  Star,
  Setting,
  Folder,
} from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();
const activityStore = useActivityStore();

// 进度环相关
const progress = ref(75);
const circumference = 2 * Math.PI * 50;

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
const quickActions = ref([
  {
    icon: "Plus",
    title: "添加专利",
    description: "创建新的专利记录",
    action: () => router.push("/dashboard/patents/add"),
  },
  {
    icon: "Document",
    title: "专利管理",
    description: "查看和管理所有专利",
    action: () => router.push("/dashboard/patents"),
  },
  {
    icon: "UserFilled",
    title: "用户管理",
    description: "管理系统用户和权限",
    action: () => router.push("/dashboard/users"),
  },
  {
    icon: "DataAnalysis",
    title: "统计报表",
    description: "查看详细的数据分析",
    action: () => router.push("/dashboard/reports"),
  },
  {
    icon: "Folder",
    title: "分类管理",
    description: "管理专利分类体系",
    action: () => router.push("/dashboard/categories"),
  },
  {
    icon: "Setting",
    title: "系统设置",
    description: "配置系统参数",
    action: () => router.push("/dashboard/settings"),
  },
]);

// 最近活动 - 使用真实数据
const recentActivities = computed(() => {
  console.log("活动store数据:", activityStore.activities);
  console.log("最近活动数据:", activityStore.recentActivities);

  const activities = activityStore.recentActivities.map((activity) => ({
    id: activity.id,
    icon: getActivityIcon(activity.type),
    title: `${activity.title}：${activity.description}`,
    time: new Date(activity.timestamp),
    type: activity.type,
    status: activity.status,
    statusText: activity.statusText,
  }));

  console.log("处理后的活动数据:", activities);
  return activities;
});

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    patent_add: "Plus",
    patent_approve: "Check",
    patent_review: "Clock",
    patent_expire: "Warning",
    user_register: "UserFilled",
    user_login: "UserFilled",
    password_change: "Lock",
    profile_update: "Setting",
  };
  const icon = iconMap[type] || "InfoFilled";
  console.log(`活动类型: ${type}, 图标: ${icon}`);
  return icon;
};

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

// 格式化时间
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

// 处理快速操作
const handleQuickAction = (action: QuickAction) => {
  if (action.action) {
    action.action();
  }
};

// 测试添加活动
const testAddActivity = () => {
  activityStore.addActivity({
    type: "patent_add",
    title: "测试专利",
    description: "这是一个测试专利活动",
    userId: 1,
    userName: "测试用户",
    targetId: Date.now(),
    targetName: "测试专利",
    status: "success",
    statusText: "测试完成",
  });
  ElMessage.success("测试活动添加成功");
};

// 刷新活动
const refreshActivities = () => {
  activityStore.loadActivitiesFromStorage();
  ElMessage.success("活动数据已刷新");
};

// 组件挂载时初始化动画和数据
onMounted(async () => {
  // 模拟进度动画
  setTimeout(() => {
    progress.value = 85;
  }, 1000);

  // 主动加载专利数据，确保统计数据正确显示
  try {
    const patentStore = usePatentStore();
    await patentStore.fetchPatents();
    await patentStore.fetchCategories();

    // 确保活动数据已加载
    console.log("活动数据:", activityStore.activities.length);
    console.log("最近活动:", activityStore.recentActivities.length);
  } catch (error) {
    console.error("加载数据失败:", error);
  }
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 30px;
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
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
  margin-bottom: 10px;
  line-height: 1.2;
}

.greeting {
  opacity: 0.9;
}

.user-name {
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
  font-weight: 800;
}

.welcome-subtitle {
  font-size: 1.1em;
  opacity: 0.8;
  margin: 0;
}

.welcome-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-svg {
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
}

.progress-fill {
  fill: none;
  stroke: #67c23a;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease-in-out;
  filter: drop-shadow(0 0 10px rgba(103, 194, 58, 0.5));
}

.progress-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress-number {
  font-size: 1.8em;
  font-weight: 700;
  color: white;
}

.progress-label {
  font-size: 0.9em;
  opacity: 0.8;
  margin-top: 5px;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s ease-out both;
}

.stat-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.stat-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(102, 126, 234, 0.1) 0%,
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2em;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 10px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8em;
  font-weight: 600;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

/* 快速操作 */
.quick-actions-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.8em;
  font-weight: 600;
  margin-bottom: 30px;
  color: #2c3e50;
  position: relative;
  display: inline-block;
}

.title-text {
  position: relative;
  z-index: 1;
}

.title-underline {
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: slideInUp 0.8s ease-out both;
}

.action-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.action-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(102, 126, 234, 0.1) 0%,
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 24px;
  color: white;
  transition: all 0.3s ease;
}

.action-card:hover .action-icon {
  transform: scale(1.1) rotate(5deg);
}

.action-card h3 {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.action-card p {
  color: #666;
  margin: 0;
  font-size: 0.9em;
  line-height: 1.5;
}

/* 最近活动 */
.recent-activities-section {
  margin-bottom: 30px;
}

.section-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.activities-list {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: slideInUp 0.8s ease-out both;
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
  margin-right: 20px;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
}

.activity-icon.add {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.activity-icon.approve {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.activity-icon.review {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.activity-icon.expire {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.activity-icon.user {
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

.activity-status.pending {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.activity-status.warning {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

@keyframes slideInUp {
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
  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 30px;
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
    padding: 15px 20px;
  }
}
</style>
