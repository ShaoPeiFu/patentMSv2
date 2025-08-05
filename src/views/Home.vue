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
            <el-icon><DocumentIcon /></el-icon>
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
            <el-icon><Plus /></el-icon>
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
                <el-icon><Plus /></el-icon>
                注册
              </el-button>
              <el-button
                size="large"
                @click="$router.push('/test-auth')"
                type="warning"
                class="hero-btn warning-btn"
              >
                <el-icon><Setting /></el-icon>
                测试认证
              </el-button>
            </div>
          </div>
          <div class="hero-visual">
            <div class="floating-card card-1">
              <div class="card-content">
                <el-icon class="card-icon"><DocumentIcon /></el-icon>
                <h3>专利管理</h3>
                <p>高效管理企业专利资产</p>
              </div>
            </div>
            <div class="floating-card card-2">
              <div class="card-content">
                <el-icon class="card-icon"><DataAnalysis /></el-icon>
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
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  Document,
  User,
  Plus,
  House,
  Setting,
  DataAnalysis,
} from "@element-plus/icons-vue";

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
    icon: "DataAnalysis",
    title: "数据分析",
    description: "直观的数据可视化，深度分析专利趋势和分布",
  },
  {
    icon: "UserFilled",
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

const stats = [
  {
    icon: "Document",
    value: "1,234",
    label: "总专利数",
    percentage: 85,
  },
  {
    icon: "Check",
    value: "856",
    label: "已授权",
    percentage: 70,
  },
  {
    icon: "Clock",
    value: "123",
    label: "待审核",
    percentage: 45,
  },
  {
    icon: "TrendCharts",
    value: "98%",
    label: "满意度",
    percentage: 98,
  },
];

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

.warning-btn {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
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

/* 特性区域 */
.features-section {
  padding: 100px 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 40px 40px 0 0;
  margin-top: -50px;
  position: relative;
  z-index: 10;
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

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
