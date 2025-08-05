<template>
  <div class="metric-widget">
    <div class="metric-header">
      <h3 class="metric-title">{{ widget.title }}</h3>
      <div class="metric-actions">
        <el-button size="small" @click="refreshData">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="metric-content">
      <div class="metric-main">
        <div class="metric-value" :style="{ color: metricColor }">
          {{ formattedValue }}
          <span v-if="config.unit" class="metric-unit">{{ config.unit }}</span>
        </div>

        <div
          v-if="config.trend && config.trend !== 'none'"
          class="metric-trend"
          :class="trendClass"
        >
          <el-icon>
            <component :is="trendIcon" />
          </el-icon>
          <span>{{ Math.abs(config.trendValue || 0) }}%</span>
        </div>
      </div>

      <div v-if="config.description" class="metric-description">
        {{ config.description }}
      </div>

      <div v-if="config.target" class="metric-progress">
        <el-progress
          :percentage="progressPercentage"
          :color="progressColor"
          :show-text="false"
          :stroke-width="6"
        />
        <div class="progress-label">
          目标: {{ formatNumber(config.target) }}{{ config.unit }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Refresh } from "@element-plus/icons-vue";
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

const config = computed(() => props.widget.config || {});

const formattedValue = computed(() => {
  const value =
    config.value?.value || config.value?.currentValue || config.value || 0;
  return formatNumber(value);
});

const metricColor = computed(() => {
  const trend = config.value.trend;
  if (trend === "up") return props.theme.colors.primary[1]; // 绿色
  if (trend === "down") return props.theme.colors.primary[3]; // 红色
  return props.theme.colors.primary[0]; // 默认蓝色
});

const trendClass = computed(() => {
  const trend = config.value.trend;
  return {
    "trend-up": trend === "up",
    "trend-down": trend === "down",
    "trend-stable": trend === "stable",
  };
});

const trendIcon = computed(() => {
  const trend = config.value.trend;
  switch (trend) {
    case "up":
      return "ArrowUp";
    case "down":
      return "ArrowDown";
    default:
      return "Minus";
  }
});

const progressPercentage = computed(() => {
  if (!config.value.target) return 0;
  const value =
    config.value.value || config.value.currentValue || config.value || 0;
  return Math.min(100, (value / config.value.target) * 100);
});

const progressColor = computed(() => {
  const percentage = progressPercentage.value;
  if (percentage >= 90) return props.theme.colors.primary[1];
  if (percentage >= 70) return props.theme.colors.primary[2];
  if (percentage >= 50) return props.theme.colors.primary[0];
  return props.theme.colors.primary[3];
});

const formatNumber = (value: number): string => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + "B";
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  } else {
    return value.toLocaleString();
  }
};

const refreshData = () => {
  // 模拟数据刷新
  const newValue = Math.floor(Math.random() * 10000) + 100;
  const previousValue = config.value.value || 0;
  const trendValue =
    previousValue > 0 ? ((newValue - previousValue) / previousValue) * 100 : 0;
  const trend = trendValue > 0 ? "up" : trendValue < 0 ? "down" : "stable";

  const newData = {
    value: newValue,
    trend,
    trendValue: Math.abs(trendValue),
    target: config.value.target || newValue * 1.2,
  };

  emit("update", props.widget.id, newData);
};
</script>

<style scoped>
.metric-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.metric-widget:hover .metric-actions {
  opacity: 1;
}

.metric-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: var(--theme-primary, #409eff);
}

.metric-unit {
  font-size: 16px;
  font-weight: 400;
  margin-left: 4px;
  color: var(--theme-text, #666);
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.metric-trend.trend-up {
  color: #67c23a;
}

.metric-trend.trend-down {
  color: #f56c6c;
}

.metric-trend.trend-stable {
  color: #909399;
}

.metric-description {
  font-size: 12px;
  color: var(--theme-text, #999);
  margin-bottom: 12px;
}

.metric-progress {
  margin-top: auto;
}

.progress-label {
  font-size: 12px;
  color: var(--theme-text, #666);
  margin-top: 4px;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metric-value {
    font-size: 24px;
  }

  .metric-unit {
    font-size: 14px;
  }

  .metric-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
