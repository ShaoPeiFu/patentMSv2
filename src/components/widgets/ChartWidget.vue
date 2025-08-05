<template>
  <div class="chart-widget">
    <div class="widget-header">
      <h3 class="widget-title">{{ widget.title }}</h3>
      <div class="widget-actions">
        <el-button-group size="small">
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="exportChart">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { Refresh, Download } from "@element-plus/icons-vue";
import type {
  DashboardWidget,
  VisualizationTheme,
} from "@/types/visualization";

interface Props {
  widget: DashboardWidget;
  theme: VisualizationTheme;
  editMode: boolean;
}

interface Emits {
  (e: "update", widgetId: string, data: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const chartRef = ref<HTMLDivElement>();
// const chartInstance = ref<any>(null);

// 模拟图表数据
const generateChartData = () => {
  const chartType = props.widget.config?.chartType || "line";
  const dataPoints = 12;

  const data = [];
  for (let i = 0; i < dataPoints; i++) {
    data.push({
      name: `${i + 1}月`,
      value: Math.floor(Math.random() * 1000) + 100,
      category: ["专利申请", "专利授权", "专利驳回"][i % 3],
    });
  }

  return data;
};

const initChart = () => {
  if (!chartRef.value || typeof window === "undefined") return;

  // 模拟 ECharts 初始化
  nextTick(() => {
    if (chartRef.value) {
      const containerWidth = chartRef.value.clientWidth;
      const containerHeight = chartRef.value.clientHeight;

      // 检查容器尺寸是否有效
      if (containerWidth <= 0 || containerHeight <= 0) {
        console.warn(
          "ChartWidget: Container has invalid dimensions, retrying...",
          {
            width: containerWidth,
            height: containerHeight,
          }
        );
        // 延迟重试
        setTimeout(() => {
          initChart();
        }, 100);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      chartRef.value.innerHTML = "";
      chartRef.value.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawChart(ctx, canvas.width, canvas.height);
      }
    }
  });
};

const drawChart = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const data = generateChartData();
  const chartType = props.widget.config?.chartType || "line";

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 设置样式
  ctx.fillStyle = props.theme.colors.primary[0];
  ctx.strokeStyle = props.theme.colors.primary[0];
  ctx.lineWidth = 2;

  const padding = 40;
  const chartWidth = Math.max(0, width - padding * 2);
  const chartHeight = Math.max(0, height - padding * 2);

  if (chartType === "line") {
    drawLineChart(ctx, data, padding, chartWidth, chartHeight);
  } else if (chartType === "bar") {
    drawBarChart(ctx, data, padding, chartWidth, chartHeight);
  } else if (chartType === "pie") {
    const radius = Math.max(10, Math.min(chartWidth, chartHeight) / 3);
    drawPieChart(ctx, data, width / 2, height / 2, radius);
  }
};

const drawLineChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  padding: number,
  width: number,
  height: number
) => {
  if (data.length === 0 || width <= 0 || height <= 0) return;

  const maxValue = Math.max(...data.map((d) => d.value));
  if (maxValue <= 0) return;

  const stepX = width / (data.length - 1);

  ctx.beginPath();
  data.forEach((point, index) => {
    const x = padding + index * stepX;
    const y = padding + height - (point.value / maxValue) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    // 绘制数据点
    ctx.fillRect(x - 2, y - 2, 4, 4);
  });
  ctx.stroke();
};

const drawBarChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  padding: number,
  width: number,
  height: number
) => {
  if (data.length === 0 || width <= 0 || height <= 0) return;

  const maxValue = Math.max(...data.map((d) => d.value));
  if (maxValue <= 0) return;

  const barWidth = (width / data.length) * 0.8;
  const stepX = width / data.length;

  data.forEach((point, index) => {
    if (point.value <= 0) return;

    const x = padding + index * stepX + stepX * 0.1;
    const barHeight = (point.value / maxValue) * height;
    const y = padding + height - barHeight;

    ctx.fillRect(x, y, barWidth, barHeight);
  });
};

const drawPieChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  centerX: number,
  centerY: number,
  radius: number
) => {
  if (data.length === 0 || radius <= 0) return;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return;

  let currentAngle = 0;

  data.forEach((point, index) => {
    if (point.value <= 0) return;

    const sliceAngle = (point.value / total) * 2 * Math.PI;
    const color =
      props.theme.colors.primary[index % props.theme.colors.primary.length];

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    currentAngle += sliceAngle;
  });
};

const refreshData = () => {
  initChart();
  emit("update", props.widget.id, generateChartData());
};

const exportChart = () => {
  if (chartRef.value) {
    const canvas = chartRef.value.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.download = `${props.widget.title}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }
};

const handleResize = () => {
  initChart();
};

watch(
  () => props.widget.config,
  () => {
    initChart();
  },
  { deep: true }
);

watch(
  () => props.theme,
  () => {
    initChart();
  },
  { deep: true }
);

onMounted(() => {
  initChart();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.chart-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.widget-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text, #333);
}

.widget-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chart-widget:hover .widget-actions {
  opacity: 1;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  position: relative;
}

.chart-container canvas {
  border-radius: 4px;
}
</style>
