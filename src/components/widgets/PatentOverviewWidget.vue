<template>
  <div class="patent-overview-widget">
    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-icon total">
          <el-icon><Files /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ metrics.total }}</div>
          <div class="metric-label">总专利数</div>
        </div>
      </div>

      <div class="metric-item">
        <div class="metric-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ metrics.pending }}</div>
          <div class="metric-label">待审核</div>
        </div>
      </div>

      <div class="metric-item">
        <div class="metric-icon approved">
          <el-icon><Check /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ metrics.approved }}</div>
          <div class="metric-label">已通过</div>
        </div>
      </div>

      <div class="metric-item">
        <div class="metric-icon rejected">
          <el-icon><Close /></el-icon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ metrics.rejected }}</div>
          <div class="metric-label">已拒绝</div>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-placeholder">
        <el-icon><PieChart /></el-icon>
        <p>专利状态分布图</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Files, Clock, Check, Close, PieChart } from "@element-plus/icons-vue";

// Props
interface Props {
  widget?: any;
  config?: any;
}

defineProps<Props>();

// 响应式数据
const metrics = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});

// 方法
const loadMetrics = async () => {
  try {
    // 从API获取真实数据
    const response = await fetch('/api/patents/statistics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || 'test'}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      metrics.value = {
        total: data.totalPatents || 0,
        pending: data.pendingPatents || 0,
        approved: data.approvedPatents || 0,
        rejected: data.rejectedPatents || 0,
      };
    } else {
      // 如果API失败，使用默认值
      metrics.value = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
    }
  } catch (error) {
    console.error("加载专利概览数据失败:", error);
    // 使用默认值
    metrics.value = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
  }
};

onMounted(() => {
  loadMetrics();
});
</script>

<style scoped>
.patent-overview-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.metric-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-icon.approved {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-icon.rejected {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chart-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 120px;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.chart-placeholder p {
  margin: 0;
  font-size: 14px;
}

/* 深色模式支持 */
:deep(.dark-mode) .metric-item {
  background: #2a2a2a;
}

:deep(.dark-mode) .metric-value {
  color: #ffffff;
}

:deep(.dark-mode) .chart-container {
  background: #2a2a2a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .metric-item {
    padding: 12px;
  }

  .metric-value {
    font-size: 20px;
  }
}
</style>
