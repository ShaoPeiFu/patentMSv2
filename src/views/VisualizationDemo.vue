<template>
  <div class="visualization-demo">
    <!-- 页面头部 -->
    <div class="demo-header">
      <div class="header-content">
        <h1>可视化图表演示</h1>
        <p>体验专利管理系统的全新可视化功能</p>
      </div>
    </div>

    <!-- 功能介绍 -->
    <div class="features-section">
      <div class="container">
        <h2>核心功能</h2>
        <div class="features-grid">
          <div
            class="feature-card"
            @click="navigateTo('/dashboard/visualization')"
          >
            <div class="feature-icon">
              <el-icon><DataBoard /></el-icon>
            </div>
            <h3>交互式仪表板</h3>
            <p>拖拽式组件布局，支持多种图表类型，实时数据展示</p>
            <div class="feature-tags">
              <el-tag size="small">拖拽布局</el-tag>
              <el-tag size="small" type="success">实时更新</el-tag>
              <el-tag size="small" type="warning">多主题</el-tag>
            </div>
          </div>

          <div class="feature-card" @click="openTimeline">
            <div class="feature-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <h3>时间轴视图</h3>
            <p>专利申请、授权、到期等事件的时间序列可视化</p>
            <div class="feature-tags">
              <el-tag size="small">时间序列</el-tag>
              <el-tag size="small" type="success">事件管理</el-tag>
              <el-tag size="small" type="warning">过滤筛选</el-tag>
            </div>
          </div>

          <div class="feature-card" @click="openTechTree">
            <div class="feature-icon">
              <el-icon><Share /></el-icon>
            </div>
            <h3>技术族谱图</h3>
            <p>技术演进关系图谱，专利技术发展脉络</p>
            <div class="feature-tags">
              <el-tag size="small">关系图谱</el-tag>
              <el-tag size="small" type="success">技术演进</el-tag>
              <el-tag size="small" type="warning">交互探索</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 演示数据 -->
    <div class="demo-section">
      <div class="container">
        <h2>演示数据</h2>
        <div class="demo-actions">
          <el-button
            type="primary"
            @click="generateDemoData"
            :loading="generating"
          >
            <el-icon><Refresh /></el-icon>
            生成演示数据
          </el-button>
          <el-button @click="resetData">
            <el-icon><Delete /></el-icon>
            重置数据
          </el-button>
          <el-button @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>

        <div class="data-stats">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.timelines }}</div>
            <div class="stat-label">时间轴事件</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.technologies }}</div>
            <div class="stat-label">技术节点</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ statistics.dashboards }}</div>
            <div class="stat-label">仪表板</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术特点 -->
    <div class="tech-section">
      <div class="container">
        <h2>技术特点</h2>
        <div class="tech-grid">
          <div class="tech-item">
            <el-icon class="tech-icon"><Lightning /></el-icon>
            <h4>高性能渲染</h4>
            <p>基于Canvas和SVG的高效图形渲染，支持大数据量可视化</p>
          </div>

          <div class="tech-item">
            <el-icon class="tech-icon"><Setting /></el-icon>
            <h4>高度可配置</h4>
            <p>丰富的配置选项，支持自定义主题、布局和交互方式</p>
          </div>

          <div class="tech-item">
            <el-icon class="tech-icon"><Monitor /></el-icon>
            <h4>响应式设计</h4>
            <p>适配各种屏幕尺寸，提供最佳的移动端体验</p>
          </div>

          <div class="tech-item">
            <el-icon class="tech-icon"><Connection /></el-icon>
            <h4>实时数据</h4>
            <p>支持数据实时更新，自动刷新图表内容</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南 -->
    <div class="guide-section">
      <div class="container">
        <h2>使用指南</h2>
        <div class="guide-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>创建仪表板</h4>
              <p>在可视化中心创建新的仪表板，选择合适的模板</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>添加组件</h4>
              <p>拖拽添加图表、指标、表格等可视化组件</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>配置数据源</h4>
              <p>连接专利数据，配置图表的数据字段和筛选条件</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>美化图表</h4>
              <p>调整颜色主题、图表样式，优化视觉效果</p>
            </div>
          </div>

          <div class="step-item">
            <div class="step-number">5</div>
            <div class="step-content">
              <h4>分享导出</h4>
              <p>保存仪表板配置，导出图表或生成报告</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>立即开始使用</h2>
          <p>体验全新的数据可视化功能，让专利数据分析更加高效</p>
          <div class="cta-buttons">
            <el-button
              type="primary"
              size="large"
              @click="navigateTo('/dashboard/visualization')"
            >
              <el-icon><DataBoard /></el-icon>
              进入可视化中心
            </el-button>
            <el-button size="large" @click="showHelp">
              <el-icon><QuestionFilled /></el-icon>
              查看帮助文档
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useVisualizationStore } from "@/stores/visualization";
import {
  DataBoard,
  Timer,
  Share,
  Refresh,
  Delete,
  Download,
  Lightning,
  Setting,
  Monitor,
  Connection,
  QuestionFilled,
} from "@element-plus/icons-vue";

const router = useRouter();
const visualizationStore = useVisualizationStore();
const generating = ref(false);

const statistics = reactive({
  timelines: 0,
  regions: 0,
  technologies: 0,
  dashboards: 0,
});

// 计算属性
const updateStatistics = () => {
  statistics.timelines = visualizationStore.timelineEvents.length;
  statistics.technologies = visualizationStore.technologyNodes.length;
  statistics.dashboards = visualizationStore.dashboards.length;
};

// 方法
const navigateTo = (path: string) => {
  router.push(path);
};

const openTimeline = () => {
  router.push("/dashboard/visualization?tab=timeline");
};

const openTechTree = () => {
  router.push("/dashboard/visualization?tab=techtree");
};

const generateDemoData = async () => {
  generating.value = true;

  try {
    // 模拟数据生成过程
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 生成演示数据
    visualizationStore.generateTimelineData();
    visualizationStore.generateTechnologyTree();

    // 创建示例仪表板（如果不存在）
    if (visualizationStore.dashboards.length === 0) {
      const dashboard = visualizationStore.createDashboard(
        "专利数据概览",
        "展示专利数据的综合仪表板"
      );

      // 添加示例组件
      const widgets = [
        {
          type: "metric" as const,
          title: "专利总数",
          position: { x: 0, y: 0, w: 3, h: 2 },
          config: { value: 1234, unit: "件", trend: "up", trendValue: 12 },
        },
        {
          type: "chart" as const,
          title: "申请趋势",
          position: { x: 3, y: 0, w: 9, h: 4 },
          config: { chartType: "line" },
        },
      ];

      widgets.forEach((widget) => {
        visualizationStore.addWidget(dashboard.id, widget);
      });
    }

    updateStatistics();
    ElMessage.success("演示数据生成成功！");
  } catch (error) {
    ElMessage.error("生成演示数据失败");
  } finally {
    generating.value = false;
  }
};

const resetData = () => {
  // 清空所有数据
  visualizationStore.dashboards.length = 0;
  visualizationStore.timelineEvents.length = 0;
  visualizationStore.technologyNodes.length = 0;
  visualizationStore.technologyRelations.length = 0;

  // 保存到本地存储
  visualizationStore.saveToStorage();

  updateStatistics();
  ElMessage.success("数据已重置");
};

const exportData = () => {
  const data = {
    dashboards: visualizationStore.dashboards,
    timelineEvents: visualizationStore.timelineEvents,
    technologyNodes: visualizationStore.technologyNodes,
    technologyRelations: visualizationStore.technologyRelations,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "visualization-data.json";
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("数据导出成功");
};

const showHelp = () => {
  ElMessage.info("帮助文档功能开发中");
};

// 生命周期
onMounted(() => {
  updateStatistics();
});
</script>

<style scoped>
.visualization-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.demo-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 60px 0;
  text-align: center;
}

.header-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  font-size: 1.2rem;
  color: #4a5568;
  margin: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.features-section {
  padding: 80px 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.features-section h2 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 0 50px 0;
  color: #2d3748;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 20px 0;
  font-size: 24px;
  color: white;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2d3748;
}

.feature-card p {
  color: #4a5568;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.feature-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-section {
  padding: 80px 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.demo-section h2 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 0 40px 0;
  color: #2d3748;
}

.demo-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  color: #4a5568;
  font-weight: 500;
}

.tech-section {
  padding: 80px 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.tech-section h2 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 0 50px 0;
  color: #2d3748;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.tech-item {
  text-align: center;
  padding: 30px 20px;
}

.tech-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 20px;
}

.tech-item h4 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2d3748;
}

.tech-item p {
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

.guide-section {
  padding: 80px 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.guide-section h2 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 0 50px 0;
  color: #2d3748;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: 800px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.step-number {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2d3748;
}

.step-content p {
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

.cta-section {
  padding: 80px 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2d3748;
}

.cta-content p {
  font-size: 1.2rem;
  color: #4a5568;
  margin: 0 0 40px 0;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }

  .features-section h2,
  .demo-section h2,
  .tech-section h2,
  .guide-section h2,
  .cta-content h2 {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .demo-actions {
    flex-direction: column;
    align-items: center;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .step-item {
    flex-direction: column;
    text-align: center;
  }
}

/* 动画效果 */
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

.feature-card,
.stat-item,
.tech-item,
.step-item {
  animation: fadeInUp 0.6s ease;
}
</style>
