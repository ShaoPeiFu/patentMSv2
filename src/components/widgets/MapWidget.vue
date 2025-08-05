<template>
  <div class="map-widget">
    <div class="widget-header">
      <h3 class="widget-title">{{ widget.title }}</h3>
      <div class="widget-actions">
        <el-button-group size="small">
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="exportMap">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="map-container" ref="mapContainer">
      <svg :width="mapWidth" :height="mapHeight" class="map-svg">
        <!-- 地图区域 -->
        <g class="regions-group">
          <g
            v-for="region in mapRegions"
            :key="region.id"
            class="region-item"
            @click="selectRegion(region)"
            @mouseenter="showTooltip($event, region)"
            @mouseleave="hideTooltip"
          >
            <path
              :d="region.path"
              :fill="getRegionColor(region)"
              :stroke="theme.colors.border"
              stroke-width="1"
              class="region-path"
            />

            <!-- 数据点 -->
            <circle
              v-if="region.data"
              :cx="region.center[0]"
              :cy="region.center[1]"
              :r="getDataPointSize(region.data)"
              :fill="theme.colors.primary[0]"
              :fill-opacity="0.7"
              :stroke="theme.colors.background"
              stroke-width="2"
              class="data-point"
            />

            <!-- 区域标签 -->
            <text
              v-if="showLabels"
              :x="region.center[0]"
              :y="region.center[1] + 4"
              text-anchor="middle"
              :fill="theme.colors.text"
              font-size="10"
              class="region-label"
            >
              {{ region.name }}
            </text>
          </g>
        </g>
      </svg>

      <!-- 图例 -->
      <div class="map-legend" :style="{ background: theme.colors.background }">
        <h5>{{ getDataTypeLabel() }}</h5>
        <div class="legend-gradient">
          <div
            class="gradient-bar"
            :style="{
              background: `linear-gradient(to right, ${colorScale.join(', ')})`,
            }"
          ></div>
          <div class="legend-labels">
            <span>{{ formatValue(minValue) }}</span>
            <span>{{ formatValue(maxValue) }}</span>
          </div>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="map-controls">
        <el-button-group size="small">
          <el-button @click="zoomIn">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button @click="zoomOut">
            <el-icon><Minus /></el-icon>
          </el-button>
          <el-button @click="resetZoom">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 工具提示 -->
    <div
      v-if="tooltip.visible"
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-title">{{ tooltip.region?.name }}</div>
      <div v-if="tooltip.region?.data" class="tooltip-content">
        <div>
          数据值: {{ formatValue(getCurrentValue(tooltip.region.data)) }}
        </div>
        <div v-if="tooltip.region.data.count">
          数量: {{ tooltip.region.data.count }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { Refresh, Download, Plus, Minus } from "@element-plus/icons-vue";
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

// 响应式数据
const mapContainer = ref<HTMLDivElement>();
const mapWidth = ref(400);
const mapHeight = ref(300);
const zoomLevel = ref(1);
const selectedRegion = ref<any>(null);

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  region: null as any,
});

// 计算属性
const config = computed(() => props.widget.config || {});
const showLabels = computed(() => config.value.showLabels !== false);
const dataType = computed(() => config.value.dataField || "count");
const colorScheme = computed(() => config.value.colorScheme || "blue");

const colorScale = computed(() => {
  const schemes = {
    blue: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5", "#0D47A1"],
    green: ["#E8F5E8", "#A5D6A7", "#66BB6A", "#43A047", "#2E7D32"],
    red: ["#FFEBEE", "#EF9A9A", "#E57373", "#EF5350", "#C62828"],
    purple: ["#F3E5F5", "#CE93D8", "#BA68C8", "#AB47BC", "#7B1FA2"],
  };
  return schemes[colorScheme.value as keyof typeof schemes] || schemes.blue;
});

const mapRegions = computed(() => {
  // 生成模拟地图区域
  const regions = [
    { id: "beijing", name: "北京", center: [200, 80] },
    { id: "shanghai", name: "上海", center: [300, 150] },
    { id: "guangdong", name: "广东", center: [250, 220] },
    { id: "zhejiang", name: "浙江", center: [310, 170] },
    { id: "jiangsu", name: "江苏", center: [290, 130] },
    { id: "sichuan", name: "四川", center: [150, 180] },
    { id: "shandong", name: "山东", center: [260, 110] },
    { id: "henan", name: "河南", center: [220, 140] },
  ];

  return regions.map((region) => ({
    ...region,
    path: generateRegionPath(region.center),
    data: generateRegionData(region.name),
  }));
});

const mapData = computed(() => {
  return mapRegions.value.map((r) => r.data).filter(Boolean);
});

const minValue = computed(() => {
  const values = mapData.value.map((d) => getCurrentValue(d));
  return Math.min(...values, 0);
});

const maxValue = computed(() => {
  const values = mapData.value.map((d) => getCurrentValue(d));
  return Math.max(...values, 1);
});

// 方法
const generateRegionPath = (center: number[]) => {
  // 生成简单的多边形路径
  const [x, y] = center;
  const size = 25 + Math.random() * 20;

  const points = [];
  const sides = 6;
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    points.push(`${px},${py}`);
  }

  return `M ${points.join(" L ")} Z`;
};

const generateRegionData = (_regionName: string) => {
  return {
    count: Math.floor(Math.random() * 1000) + 100,
    value: Math.floor(Math.random() * 50000) + 10000,
    rate: Math.floor(Math.random() * 40) + 60,
    growth: Math.floor(Math.random() * 20) - 10,
  };
};

const getCurrentValue = (data: any) => {
  switch (dataType.value) {
    case "value":
      return data.value || 0;
    case "rate":
      return data.rate || 0;
    case "growth":
      return data.growth || 0;
    default:
      return data.count || 0;
  }
};

const getRegionColor = (region: any) => {
  if (!region.data) return colorScale.value[0];

  const value = getCurrentValue(region.data);
  const normalizedValue =
    (value - minValue.value) / (maxValue.value - minValue.value || 1);
  const colorIndex = Math.min(
    Math.floor(normalizedValue * colorScale.value.length),
    colorScale.value.length - 1
  );

  return colorScale.value[colorIndex];
};

const getDataPointSize = (data: any) => {
  const value = getCurrentValue(data);
  const normalizedValue =
    (value - minValue.value) / (maxValue.value - minValue.value || 1);
  return 3 + normalizedValue * 8;
};

const getDataTypeLabel = () => {
  const labels = {
    count: "数据量",
    value: "数值",
    rate: "比率 (%)",
    growth: "增长率 (%)",
  };
  return labels[dataType.value as keyof typeof labels] || "数据";
};

const formatValue = (value: number) => {
  if (dataType.value === "rate" || dataType.value === "growth") {
    return value + "%";
  } else if (dataType.value === "value") {
    return value >= 10000
      ? `${(value / 10000).toFixed(1)}万`
      : value.toString();
  }
  return value.toLocaleString();
};

const selectRegion = (region: any) => {
  selectedRegion.value = region;
  console.log("Selected region:", region);
};

const showTooltip = (event: MouseEvent, region: any) => {
  tooltip.visible = true;
  tooltip.x = event.clientX + 10;
  tooltip.y = event.clientY - 10;
  tooltip.region = region;
};

const hideTooltip = () => {
  tooltip.visible = false;
  tooltip.region = null;
};

const zoomIn = () => {
  zoomLevel.value = Math.min(3, zoomLevel.value * 1.2);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value / 1.2);
};

const resetZoom = () => {
  zoomLevel.value = 1;
};

const refreshData = () => {
  // 重新生成数据
  const newData = mapRegions.value.map((region) => ({
    region: region.name,
    data: generateRegionData(region.name),
  }));

  emit("update", props.widget.id, newData);
};

const exportMap = () => {
  if (!mapContainer.value) return;

  const svg = mapContainer.value.querySelector("svg");
  if (!svg) return;

  // 创建canvas并绘制SVG
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth.value;
  canvas.height = mapHeight.value;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const data = new XMLSerializer().serializeToString(svg);
  const DOMURL = window.URL || window.webkitURL || window;
  const img = new Image();
  const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = DOMURL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    DOMURL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement("a");
        link.download = `${props.widget.title}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    });
  };

  img.src = url;
};

const updateMapSize = () => {
  if (mapContainer.value) {
    const rect = mapContainer.value.getBoundingClientRect();
    mapWidth.value = Math.max(300, rect.width - 32);
    mapHeight.value = Math.max(200, rect.height - 80);
  }
};

// 生命周期
onMounted(() => {
  updateMapSize();
  window.addEventListener("resize", updateMapSize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateMapSize);
});
</script>

<style scoped>
.map-widget {
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

.map-widget:hover .widget-actions {
  opacity: 1;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 200px;
  overflow: hidden;
  border-radius: 6px;
  background: #f8f9fa;
}

.map-svg {
  width: 100%;
  height: 100%;
}

.region-path {
  cursor: pointer;
  transition: all 0.3s ease;
}

.region-path:hover {
  stroke-width: 2;
  filter: brightness(1.1);
}

.data-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-point:hover {
  transform: scale(1.2);
}

.region-label {
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.map-legend {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  font-size: 12px;
}

.map-legend h5 {
  margin: 0 0 8px 0;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

.gradient-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  margin-bottom: 4px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #6b7280;
}

.map-controls {
  position: absolute;
  bottom: 10px;
  left: 10px;
}

.tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  max-width: 200px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-content {
  font-size: 11px;
  opacity: 0.9;
}

.tooltip-content div {
  margin: 2px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-legend {
    position: static;
    margin: 8px 0;
  }

  .map-controls {
    position: static;
    margin-top: 8px;
    text-align: center;
  }
}
</style>
