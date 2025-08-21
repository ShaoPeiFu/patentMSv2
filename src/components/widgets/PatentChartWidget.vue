<template>
  <div class="patent-chart-widget">
    <div class="chart-header">
      <h3>专利状态分布</h3>
      <el-select v-model="chartType" size="small" @change="updateChart">
        <el-option label="饼图" value="pie" />
        <el-option label="柱状图" value="bar" />
        <el-option label="折线图" value="line" />
      </el-select>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else class="chart-container">
      <div class="chart-placeholder">
        <el-icon><PieChart /></el-icon>
        <p>{{ getChartDescription(chartType) }}</p>
        <div class="chart-legend">
          <div v-for="item in chartData" :key="item.name" class="legend-item">
            <div
              class="legend-color"
              :style="{ backgroundColor: item.color }"
            ></div>
            <span class="legend-label">{{ item.name }}</span>
            <span class="legend-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-footer">
      <el-button size="small" @click="refreshChart" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
      <el-button size="small" @click="exportChart">
        <el-icon><Download /></el-icon>
        导出图表
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PieChart, Refresh, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 响应式数据
const chartType = ref("pie");
const loading = ref(false);
const chartData = ref([
  { name: "已通过", value: 0, color: "#67c23a" },
  { name: "待审核", value: 0, color: "#e6a23c" },
  { name: "已拒绝", value: 0, color: "#f56c6c" },
  { name: "草稿", value: 0, color: "#909399" },
  { name: "已过期", value: 0, color: "#909399" },
  { name: "有效", value: 0, color: "#67c23a" },
]);

// 方法
const loadChartData = async () => {
  try {
    loading.value = true;

    // 从API获取真实数据
    const response = await fetch("/api/patents/statistics", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();

      // 更新图表数据
      chartData.value = [
        {
          name: "已通过",
          value: data.byStatus?.approved || 0,
          color: "#67c23a",
        },
        {
          name: "待审核",
          value: data.byStatus?.pending || 0,
          color: "#e6a23c",
        },
        {
          name: "已拒绝",
          value: data.byStatus?.rejected || 0,
          color: "#f56c6c",
        },
        { name: "草稿", value: data.byStatus?.draft || 0, color: "#909399" },
        {
          name: "已过期",
          value: data.byStatus?.expired || 0,
          color: "#909399",
        },
        { name: "有效", value: data.byStatus?.active || 0, color: "#67c23a" },
      ];

      ElMessage.success("图表数据已更新");
    } else {
      console.error("获取专利统计数据失败:", response.statusText);
      ElMessage.error("获取专利统计数据失败");
    }
  } catch (error) {
    console.error("加载图表数据失败:", error);
    ElMessage.error("加载图表数据失败");
  } finally {
    loading.value = false;
  }
};

const updateChart = () => {
  // 更新图表类型
  console.log("图表类型已更新:", chartType.value);
};

const refreshChart = async () => {
  await loadChartData();
};

const exportChart = () => {
  // 导出图表功能
  ElMessage.info("导出图表功能开发中");
};

const getChartDescription = (chartType: string) => {
  const descriptions: Record<string, string> = {
    pie: "饼图显示专利分类分布",
    bar: "柱状图显示专利数量统计",
    line: "折线图显示专利趋势变化",
  };

  return descriptions[chartType] || "专利数据图表";
};

// 组件挂载时加载数据
onMounted(() => {
  loadChartData();
});
</script>

<style scoped>
.patent-chart-widget {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.loading-state {
  flex: 1;
  padding: 20px 0;
}

.chart-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.chart-placeholder p {
  margin: 16px 0;
  font-size: 14px;
}

.chart-legend {
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 6px;
  background: #f8f9fa;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 12px;
}

.legend-label {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.legend-value {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.chart-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
