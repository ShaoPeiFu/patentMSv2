<template>
  <div class="home">
    <!-- 粒子背景动画 -->
    <div class="particles-container">
      <div
        class="particle"
        v-for="i in 100"
        :key="i"
        :style="getParticleStyle(i)"
      ></div>
    </div>

    <!-- 动态光效 -->
    <div class="light-effects">
      <div class="light-beam light-1"></div>
      <div class="light-beam light-2"></div>
      <div class="light-beam light-3"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <div class="logo-icon">
            <el-icon><Document /></el-icon>
          </div>
          <span class="logo-text">专利管理系统</span>
        </div>
        <div class="nav-actions">
          <el-button
            type="primary"
            @click="$router.push('/login')"
            class="nav-btn"
          >
            <el-icon><User /></el-icon>
            登录
          </el-button>
          <el-button
            @click="$router.push('/register')"
            class="nav-btn register-btn"
          >
            注册
          </el-button>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="title-line" data-text="专业的专利管理平台"
                >专业的专利管理平台</span
              >
              <span class="title-line" data-text="助力企业知识产权保护"
                >助力企业知识产权保护</span
              >
            </h1>
            <p class="hero-subtitle">
              基于Vue3 + TypeScript + Element Plus构建的现代化专利管理系统
            </p>
            <div class="hero-actions">
              <el-button
                type="primary"
                size="large"
                @click="$router.push('/dashboard')"
                class="hero-btn primary-btn"
              >
                <el-icon><House /></el-icon>
                进入系统
              </el-button>
              <el-button
                size="large"
                @click="$router.push('/login')"
                class="hero-btn secondary-btn"
              >
                <el-icon><User /></el-icon>
                登录
              </el-button>
              <el-button
                size="large"
                @click="$router.push('/register')"
                type="success"
                class="hero-btn success-btn"
              >
                注册
              </el-button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="floating-card card-1">
              <div class="card-content">
                <el-icon class="card-icon"><Document /></el-icon>
                <h3>专利管理</h3>
                <p>高效管理企业专利资产</p>
              </div>
            </div>
            <div class="floating-card card-2">
              <div class="card-content">
                <el-icon class="card-icon"><TrendCharts /></el-icon>
                <h3>数据分析</h3>
                <p>深度分析专利数据</p>
              </div>
            </div>
            <div class="floating-card card-3">
              <div class="card-content">
                <el-icon class="card-icon"><User /></el-icon>
                <h3>用户管理</h3>
                <p>完善的权限管理</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 功能演示区域 -->
      <section class="demo-section">
        <div class="demo-container">
          <h2 class="section-title">
            <span class="title-text">功能演示</span>
            <div class="title-underline"></div>
          </h2>
          <div class="demo-grid">
            <div class="demo-card" @click="showDemo('patent')">
              <div class="demo-icon">
                <el-icon><Document /></el-icon>
              </div>
              <h3>专利管理演示</h3>
              <p>体验完整的专利生命周期管理流程</p>
              <div class="demo-preview">
                <div class="preview-item">
                  <el-icon><Plus /></el-icon>
                  <span>专利申请</span>
                </div>
                <div class="preview-item">
                  <el-icon><Edit /></el-icon>
                  <span>专利编辑</span>
                </div>
                <div class="preview-item">
                  <el-icon><Search /></el-icon>
                  <span>专利搜索</span>
                </div>
              </div>
            </div>

            <div class="demo-card" @click="showDemo('workflow')">
              <div class="demo-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <h3>工作流演示</h3>
              <p>可视化工作流设计和执行</p>
              <div class="demo-preview">
                <div class="preview-item">
                  <el-icon><Setting /></el-icon>
                  <span>流程设计</span>
                </div>
                <div class="preview-item">
                  <el-icon><VideoPlay /></el-icon>
                  <span>流程执行</span>
                </div>
                <div class="preview-item">
                  <el-icon><View /></el-icon>
                  <span>状态监控</span>
                </div>
              </div>
            </div>

            <div class="demo-card" @click="showDemo('collaboration')">
              <div class="demo-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <h3>协作管理演示</h3>
              <p>团队协作和任务管理功能</p>
              <div class="demo-preview">
                <div class="preview-item">
                  <el-icon><User /></el-icon>
                  <span>团队协作</span>
                </div>
                <div class="preview-item">
                  <el-icon><List /></el-icon>
                  <span>任务管理</span>
                </div>
                <div class="preview-item">
                  <el-icon><Message /></el-icon>
                  <span>实时沟通</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 特性区域 -->
      <section class="features-section">
        <div class="features-container">
          <h2 class="section-title">
            <span class="title-text">核心特性</span>
            <div class="title-underline"></div>
          </h2>
          <div class="features-grid">
            <div
              class="feature-card"
              v-for="(feature, index) in features"
              :key="feature.title"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="feature-icon">
                <el-icon><component :is="feature.icon" /></el-icon>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
              <div class="feature-glow"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 统计区域 -->
      <section class="stats-section">
        <div class="stats-container">
          <h2 class="section-title">
            <span class="title-text">系统统计</span>
            <div class="title-underline"></div>
          </h2>
          <div class="stats-grid">
            <div
              class="stat-card"
              v-for="(stat, index) in stats"
              :key="stat.label"
              :style="{ animationDelay: `${index * 0.2}s` }"
            >
              <div class="stat-icon">
                <el-icon><component :is="stat.icon" /></el-icon>
              </div>
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-progress">
                <div
                  class="progress-bar"
                  :style="{ width: `${stat.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 快速开始区域 -->
      <section class="quickstart-section">
        <div class="quickstart-container">
          <h2 class="section-title">
            <span class="title-text">快速开始</span>
            <div class="title-underline"></div>
          </h2>
          <div class="quickstart-steps">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>注册账户</h3>
                <p>创建您的专属账户，开始专利管理之旅</p>
              </div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>导入专利</h3>
                <p>批量导入现有专利或创建新的专利申请</p>
              </div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>开始管理</h3>
                <p>使用强大的管理工具优化您的专利资产</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 演示弹窗 -->
    <el-dialog
      v-model="demoVisible"
      :title="demoTitle"
      width="80%"
      class="demo-dialog"
    >
      <div class="demo-content">
        <div v-if="currentDemo === 'patent'" class="patent-demo">
          <div class="demo-screenshot">
            <div class="mock-interface">
              <div class="mock-header">
                <div class="mock-nav">
                  <span>专利管理</span>
                  <el-button size="small" type="primary">+ 新增专利</el-button>
                </div>
              </div>
              <div class="mock-content">
                <div class="mock-patent-item">
                  <div class="patent-info">
                    <h4>智能专利管理系统</h4>
                    <p>申请号: CN2023001 | 状态: 审核中</p>
                  </div>
                  <div class="patent-actions">
                    <el-button size="small">查看</el-button>
                    <el-button size="small" type="primary">编辑</el-button>
                  </div>
                </div>
                <div class="mock-patent-item">
                  <div class="patent-info">
                    <h4>区块链专利技术</h4>
                    <p>申请号: CN2023002 | 状态: 已授权</p>
                  </div>
                  <div class="patent-actions">
                    <el-button size="small">查看</el-button>
                    <el-button size="small" type="success">维护</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="demo-description">
            <h3>专利管理功能特点</h3>
            <ul>
              <li>完整的专利生命周期管理</li>
              <li>智能搜索和筛选功能</li>
              <li>批量操作和导入导出</li>
              <li>实时状态跟踪和提醒</li>
            </ul>
          </div>
        </div>

        <div v-if="currentDemo === 'workflow'" class="workflow-demo">
          <div class="demo-screenshot">
            <div class="mock-workflow">
              <div class="workflow-node start">开始</div>
              <div class="workflow-arrow">→</div>
              <div class="workflow-node review">审核</div>
              <div class="workflow-arrow">→</div>
              <div class="workflow-node approve">批准</div>
              <div class="workflow-arrow">→</div>
              <div class="workflow-node end">完成</div>
            </div>
          </div>
          <div class="demo-description">
            <h3>工作流管理功能特点</h3>
            <ul>
              <li>可视化流程设计器</li>
              <li>灵活的审批流程配置</li>
              <li>实时流程状态监控</li>
              <li>自动化任务分配</li>
            </ul>
          </div>
        </div>

        <div v-if="currentDemo === 'collaboration'" class="collaboration-demo">
          <div class="demo-screenshot">
            <div class="mock-collaboration">
              <div class="collab-header">
                <span>团队协作空间</span>
              </div>
              <div class="collab-content">
                <div class="collab-task">
                  <div class="task-info">
                    <h4>专利检索任务</h4>
                    <p>负责人: 张三 | 截止: 2024-01-15</p>
                  </div>
                  <div class="task-status">进行中</div>
                </div>
                <div class="collab-chat">
                  <div class="chat-message">
                    <span class="user">李四:</span>
                    <span class="message">检索结果已整理完成</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="demo-description">
            <h3>协作管理功能特点</h3>
            <ul>
              <li>实时团队协作</li>
              <li>任务分配和跟踪</li>
              <li>即时通讯和讨论</li>
              <li>文件共享和版本控制</li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  User,
  Plus,
  House,
  Document,
  TrendCharts,
  Connection,
  Edit,
  Search,
  Setting,
  VideoPlay,
  View,
  ChatDotRound,
  List,
  Message,
  Bell,
  Star,
  Check,
  Clock,
} from "@element-plus/icons-vue";

// 响应式数据
const demoVisible = ref(false);
const currentDemo = ref("");
const demoTitle = ref("");

// 特性数据
const features = [
  {
    icon: "Document",
    title: "专利管理",
    description: "完整的专利生命周期管理，从申请到维护的全流程跟踪",
  },
  {
    icon: "Search",
    title: "智能搜索",
    description: "强大的搜索功能，支持多维度筛选和快速定位",
  },
  {
    icon: "TrendCharts",
    title: "数据分析",
    description: "直观的数据可视化，深度分析专利趋势和分布",
  },
  {
    icon: "User",
    title: "用户管理",
    description: "完善的用户权限管理，支持多角色和部门管理",
  },
  {
    icon: "Bell",
    title: "提醒系统",
    description: "智能提醒功能，及时通知重要事项和截止日期",
  },
  {
    icon: "Star",
    title: "收藏功能",
    description: "个性化收藏功能，快速访问常用专利和分类",
  },
];

// 统计数据
const stats = ref([
  {
    icon: "Document",
    value: "0",
    label: "总专利数",
    percentage: 0,
  },
  {
    icon: "Check",
    value: "0",
    label: "已授权",
    percentage: 0,
  },
  {
    icon: "Clock",
    value: "0",
    label: "待审核",
    percentage: 0,
  },
  {
    icon: "TrendCharts",
    value: "0%",
    label: "满意度",
    percentage: 0,
  },
]);

// 显示演示
const showDemo = (type: string) => {
  currentDemo.value = type;
  demoVisible.value = true;

  switch (type) {
    case "patent":
      demoTitle.value = "专利管理功能演示";
      break;
    case "workflow":
      demoTitle.value = "工作流管理功能演示";
      break;
    case "collaboration":
      demoTitle.value = "协作管理功能演示";
      break;
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await fetch("/api/patents/statistics", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      stats.value[0].value = (data.totalPatents || 0).toString();
      stats.value[0].percentage = Math.min(100, (data.totalPatents || 0) / 10);
      stats.value[1].value = (data.approvedPatents || 0).toString();
      stats.value[1].percentage = Math.min(
        100,
        (data.approvedPatents || 0) / 10
      );
      stats.value[2].value = (data.pendingPatents || 0).toString();
      stats.value[2].percentage = Math.min(
        100,
        (data.pendingPatents || 0) / 10
      );
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
};

// 组件挂载时加载统计数据
onMounted(() => {
  loadStats();
});

// 粒子样式
const getParticleStyle = (_index: number) => {
  const size = Math.random() * 6 + 2;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const delay = Math.random() * 10;
  const duration = Math.random() * 15 + 10;

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};
</script>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 粒子背景动画 */
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
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
  width: 3px;
  height: 100vh;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: light-sweep 12s linear infinite;
}

.light-1 {
  left: 20%;
  animation-delay: 0s;
}

.light-2 {
  left: 50%;
  animation-delay: 4s;
}

.light-3 {
  left: 80%;
  animation-delay: 8s;
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

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
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

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-actions {
  display: flex;
  gap: 15px;
}

.nav-btn {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.register-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 主要内容 */
.main-content {
  padding-top: 80px;
}

/* 英雄区域 */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
}

.hero-content {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-text {
  color: white;
}

.hero-title {
  font-size: 3.5em;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.title-line {
  display: block;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
  animation: slideInLeft 1s ease-out;
  position: relative;
}

.title-line::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
  opacity: 0;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  100% {
    opacity: 0.3;
    transform: scale(1.02);
  }
}

.title-line:nth-child(2) {
  animation-delay: 0.2s;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.hero-subtitle {
  font-size: 1.2em;
  opacity: 0.9;
  margin-bottom: 40px;
  line-height: 1.6;
  animation: slideInLeft 1s ease-out 0.4s both;
}

.hero-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  animation: slideInLeft 1s ease-out 0.6s both;
}

.hero-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.hero-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.hero-btn:hover::before {
  left: 100%;
}

.hero-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.primary-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.success-btn {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: white;
}

/* 英雄视觉区域 */
.hero-visual {
  position: relative;
  height: 400px;
}

.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: floatCard 4s ease-in-out infinite;
  transform-style: preserve-3d;
  transition: all 0.3s ease;
}

.floating-card:hover {
  transform: translateY(-10px) rotateY(10deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.card-1 {
  top: 0;
  left: 0;
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: 0;
  animation-delay: 1s;
}

.card-3 {
  bottom: 0;
  left: 20%;
  animation-delay: 2s;
}

@keyframes floatCard {
  0%,
  100% {
    transform: translateY(0px) rotateY(0deg);
  }
  50% {
    transform: translateY(-20px) rotateY(5deg);
  }
}

.card-content {
  text-align: center;
  color: white;
}

.card-icon {
  font-size: 40px;
  margin-bottom: 15px;
  color: #667eea;
}

.card-content h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.card-content p {
  margin: 0;
  opacity: 0.8;
  font-size: 14px;
}

/* 功能演示区域 */
.demo-section {
  padding: 100px 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 40px 40px 0 0;
  margin-top: -50px;
  position: relative;
  z-index: 10;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-top: 60px;
}

.demo-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: slideInUp 0.8s ease-out both;
}

.demo-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.demo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.demo-card:hover .demo-icon {
  transform: scale(1.1) rotate(5deg);
}

.demo-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.demo-card p {
  color: #666;
  line-height: 1.6;
  margin: 0 0 25px 0;
}

.demo-preview {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #667eea;
}

.preview-item .el-icon {
  font-size: 16px;
}

/* 特性区域 */
.features-section {
  padding: 100px 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 60px;
  position: relative;
}

.title-text {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
  position: relative;
  z-index: 1;
}

.title-underline {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  animation: expandWidth 1s ease-out 0.5s both;
}

@keyframes expandWidth {
  from {
    width: 0;
  }
  to {
    width: 100px;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s ease-out both;
}

.feature-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(102, 126, 234, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-glow {
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

.feature-card:hover .feature-glow {
  opacity: 1;
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
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

/* 统计区域 */
.stats-section {
  padding: 100px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 60px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s ease-out both;
}

.stat-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 24px;
  color: white;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
}

.stat-label {
  font-size: 1.1em;
  opacity: 0.9;
  margin-bottom: 20px;
}

.stat-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #85ce61);
  border-radius: 3px;
  transition: width 1s ease-out;
  animation: progressFill 2s ease-out 0.5s both;
}

@keyframes progressFill {
  from {
    width: 0;
  }
}

/* 快速开始区域 */
.quickstart-section {
  padding: 100px 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.quickstart-container {
  max-width: 1200px;
  margin: 0 auto;
}

.quickstart-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
  margin-top: 60px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.step-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.1);
}

.step-number {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.step-content p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* 演示弹窗样式 */
.demo-dialog {
  border-radius: 20px;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}

.demo-screenshot {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.mock-interface {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.mock-header {
  background: #667eea;
  color: white;
  padding: 15px 20px;
}

.mock-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mock-content {
  padding: 20px;
}

.mock-patent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
}

.patent-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.patent-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.patent-actions {
  display: flex;
  gap: 8px;
}

.mock-workflow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px 20px;
}

.workflow-node {
  padding: 15px 25px;
  border-radius: 25px;
  color: white;
  font-weight: 600;
  text-align: center;
  min-width: 80px;
}

.workflow-node.start {
  background: #67c23a;
}

.workflow-node.review {
  background: #e6a23c;
}

.workflow-node.approve {
  background: #409eff;
}

.workflow-node.end {
  background: #909399;
}

.workflow-arrow {
  font-size: 24px;
  color: #667eea;
  font-weight: bold;
}

.mock-collaboration {
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.collab-header {
  background: #67c23a;
  color: white;
  padding: 15px 20px;
  text-align: center;
  font-weight: 600;
}

.collab-content {
  padding: 20px;
}

.collab-task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.task-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.task-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.task-status {
  background: #409eff;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
}

.collab-chat {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.chat-message {
  display: flex;
  gap: 8px;
}

.chat-message .user {
  font-weight: 600;
  color: #667eea;
}

.chat-message .message {
  color: #2c3e50;
}

.demo-description h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.demo-description ul {
  list-style: none;
  padding: 0;
}

.demo-description li {
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
  color: #666;
  position: relative;
  padding-left: 25px;
}

.demo-description li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #67c23a;
  font-weight: bold;
}

.demo-description li:last-child {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-title {
    font-size: 2.5em;
  }

  .hero-actions {
    justify-content: center;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quickstart-steps {
    grid-template-columns: 1fr;
  }

  .demo-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .demo-preview {
    flex-direction: column;
    align-items: center;
  }
}
</style>
