<template>
  <div class="analytics-demo">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>高级统计分析演示</h1>
      <p>体验专业级的专利数据分析与智能洞察功能</p>
    </div>

    <!-- 功能导航 -->
    <div class="demo-navigation">
      <el-card>
        <template #header>
          <h3>功能导航</h3>
        </template>
        <div class="nav-grid">
          <div class="nav-item" @click="navigateTo('/dashboard/analytics')">
            <div class="nav-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <h4>完整分析平台</h4>
            <p>访问完整的高级统计分析功能</p>
          </div>

          <div class="nav-item" @click="scrollToSection('trend')">
            <div class="nav-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <h4>专利趋势分析</h4>
            <p>专利申请量、授权量、拒绝量的时间趋势</p>
          </div>

          <div class="nav-item" @click="scrollToSection('tech-field')">
            <div class="nav-icon">
              <el-icon><Operation /></el-icon>
            </div>
            <h4>技术领域分布</h4>
            <p>各技术领域的专利分布与成功率分析</p>
          </div>

          <div class="nav-item" @click="scrollToSection('competitor')">
            <div class="nav-icon">
              <el-icon><Location /></el-icon>
            </div>
            <h4>竞争对手分析</h4>
            <p>市场地位、竞争力对比与SWOT分析</p>
          </div>

          <div class="nav-item" @click="scrollToSection('roi')">
            <div class="nav-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <h4>ROI投资回报</h4>
            <p>投资回报率、专利价值与风险评估</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 专利趋势分析演示 -->
    <div class="demo-section" id="trend">
      <h2>专利趋势分析</h2>
      <PatentTrendAnalysis />
    </div>

    <!-- 技术领域分布演示 -->
    <div class="demo-section" id="tech-field">
      <h2>技术领域分布</h2>
      <TechFieldDistribution />
    </div>

    <!-- 竞争对手分析演示 -->
    <div class="demo-section" id="competitor">
      <h2>竞争对手分析</h2>
      <CompetitorAnalysis />
    </div>

    <!-- ROI投资回报分析演示 -->
    <div class="demo-section" id="roi">
      <h2>ROI投资回报分析</h2>
      <ROIAnalysis />
    </div>

    <!-- 功能特色 -->
    <div class="features-section">
      <el-card>
        <template #header>
          <h3>功能特色</h3>
        </template>

        <div class="features-grid">
          <div class="feature-item">
            <el-icon class="feature-icon"><Lightning /></el-icon>
            <h4>实时数据分析</h4>
            <p>基于最新专利数据进行实时分析，确保分析结果的时效性和准确性</p>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><View /></el-icon>
            <h4>多维度可视化</h4>
            <p>提供趋势图、饼图、雷达图等多种图表类型，直观展示复杂数据</p>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Star /></el-icon>
            <h4>智能洞察</h4>
            <p>AI驱动的数据分析，自动识别关键趋势和潜在机会</p>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Setting /></el-icon>
            <h4>灵活配置</h4>
            <p>支持自定义分析参数、时间范围和对比对象</p>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Download /></el-icon>
            <h4>报告导出</h4>
            <p>支持多种格式的分析报告导出，便于分享和存档</p>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Lock /></el-icon>
            <h4>风险评估</h4>
            <p>综合风险因子分析，提供投资决策参考建议</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 使用指南 -->
    <div class="guide-section">
      <el-card>
        <template #header>
          <h3>使用指南</h3>
        </template>

        <el-steps direction="vertical" :active="4">
          <el-step
            title="数据准备"
            description="确保专利数据已录入系统并保持更新"
          />
          <el-step
            title="选择分析类型"
            description="根据需求选择趋势分析、领域分布、竞争分析或ROI分析"
          />
          <el-step
            title="配置参数"
            description="设置时间范围、数据粒度和分析对象"
          />
          <el-step title="查看结果" description="通过图表和洞察了解分析结果" />
          <el-step title="导出报告" description="生成并导出专业分析报告" />
        </el-steps>
      </el-card>
    </div>

    <!-- 快速开始 -->
    <div class="quick-start">
      <el-card class="start-card">
        <div class="start-content">
          <h3>立即开始使用</h3>
          <p>探索强大的专利数据分析功能，获得深度业务洞察</p>
          <div class="start-actions">
            <el-button
              type="primary"
              size="large"
              @click="navigateTo('/dashboard/analytics')"
            >
              <el-icon><DataAnalysis /></el-icon>
              进入分析平台
            </el-button>
            <el-button size="large" @click="generateDemoReport">
              <el-icon><DocumentIcon /></el-icon>
              生成演示报告
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAnalyticsStore } from "@/stores/analytics";
import { ElMessage } from "element-plus";
import {
  DataAnalysis,
  TrendCharts,
  Operation,
  Location,
  Wallet,
  Lightning,
  View,
  Star,
  Setting,
  Download,
  Lock,
  Document,
} from "@element-plus/icons-vue";

// 导入分析组件
import PatentTrendAnalysis from "@/components/PatentTrendAnalysis.vue";
import TechFieldDistribution from "@/components/TechFieldDistribution.vue";
import CompetitorAnalysis from "@/components/CompetitorAnalysis.vue";
import ROIAnalysis from "@/components/ROIAnalysis.vue";

const router = useRouter();
const analyticsStore = useAnalyticsStore();

// 方法
const navigateTo = (path: string) => {
  router.push(path);
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

const generateDemoReport = async () => {
  try {
    const title = `演示分析报告_${new Date().toLocaleDateString("zh-CN")}`;
    await analyticsStore.generateReport(title);
    ElMessage.success("演示报告生成成功！");
    navigateTo("/dashboard/analytics");
  } catch (error) {
    ElMessage.error("生成报告失败");
  }
};
</script>

<style scoped>
.analytics-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
}

.page-header h1 {
  margin: 0 0 12px 0;
  font-size: 36px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  font-size: 18px;
  opacity: 0.9;
}

.demo-navigation {
  margin-bottom: 40px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.nav-item {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.nav-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
  font-size: 24px;
  color: white;
}

.nav-item h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.nav-item p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.demo-section {
  margin-bottom: 60px;
  scroll-margin-top: 20px;
}

.demo-section h2 {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  padding-left: 16px;
  border-left: 4px solid #667eea;
}

.features-section {
  margin-bottom: 40px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.feature-item {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.feature-icon {
  font-size: 32px;
  color: #667eea;
  margin-bottom: 16px;
}

.feature-item h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.feature-item p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.guide-section {
  margin-bottom: 40px;
}

.quick-start {
  margin-bottom: 40px;
}

.start-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.start-card :deep(.el-card__body) {
  padding: 40px;
}

.start-content {
  text-align: center;
  color: white;
}

.start-content h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
}

.start-content p {
  margin: 0 0 24px 0;
  font-size: 16px;
  opacity: 0.9;
}

.start-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
}

:deep(.el-card__header h3) {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-steps--vertical .el-step__main) {
  padding-left: 16px;
}

:deep(.el-step__title) {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

:deep(.el-step__description) {
  color: #666;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 28px;
  }

  .page-header p {
    font-size: 16px;
  }

  .nav-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .start-actions {
    flex-direction: column;
    align-items: center;
  }

  .start-actions .el-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
