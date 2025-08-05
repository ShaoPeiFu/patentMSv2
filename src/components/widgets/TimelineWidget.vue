<template>
  <div class="timeline-widget">
    <div class="widget-header">
      <h3 class="widget-title">{{ widget.title }}</h3>
      <div class="widget-actions">
        <el-button-group size="small">
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="addEvent">
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="timeline-container" ref="timelineContainer">
      <div class="timeline-controls">
        <el-select v-model="granularity" size="small" style="width: 100px">
          <el-option label="日" value="day" />
          <el-option label="周" value="week" />
          <el-option label="月" value="month" />
        </el-select>

        <el-button-group size="small">
          <el-button @click="zoomIn">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button @click="zoomOut">
            <el-icon><Minus /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <div
        class="timeline-content"
        :style="{ transform: `scale(${zoomLevel})` }"
      >
        <!-- 时间轴线 -->
        <div class="timeline-line"></div>

        <!-- 时间刻度 -->
        <div class="time-markers">
          <div
            v-for="marker in timeMarkers"
            :key="marker.date"
            class="time-marker"
            :style="{ left: marker.position + '%' }"
          >
            <div class="marker-line"></div>
            <div class="marker-label">{{ marker.label }}</div>
          </div>
        </div>

        <!-- 事件点 -->
        <div class="events-container">
          <div
            v-for="event in visibleEvents"
            :key="event.id"
            class="timeline-event"
            :class="[
              `event-${event.type}`,
              { active: selectedEvent?.id === event.id },
            ]"
            :style="{ left: getEventPosition(event.date) + '%' }"
            @click="selectEvent(event)"
          >
            <div class="event-dot">
              <el-icon>
                <component :is="getEventIcon(event.type)" />
              </el-icon>
            </div>
            <div class="event-label">{{ event.title }}</div>
          </div>
        </div>
      </div>

      <!-- 事件详情 -->
      <div v-if="selectedEvent" class="event-details">
        <div class="details-header">
          <h4>{{ selectedEvent.title }}</h4>
          <el-button size="small" @click="selectedEvent = null">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="details-content">
          <p><strong>日期:</strong> {{ formatDate(selectedEvent.date) }}</p>
          <p>
            <strong>类型:</strong> {{ getEventTypeLabel(selectedEvent.type) }}
          </p>
          <p><strong>描述:</strong> {{ selectedEvent.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Refresh, Plus, Minus, Close } from "@element-plus/icons-vue";
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
const timelineContainer = ref<HTMLDivElement>();
const granularity = ref("month");
const zoomLevel = ref(1);
const selectedEvent = ref<any>(null);

// 计算属性
// const config = computed(() => props.widget.config || {});

const timelineEvents = computed(() => {
  return generateTimelineEvents();
});

const timeRange = computed(() => {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 1, 0, 1);
  const endDate = new Date(now.getFullYear(), 11, 31);

  return { startDate, endDate };
});

const timeMarkers = computed(() => {
  const { startDate, endDate } = timeRange.value;
  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const markers = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const daysDiff =
      (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const position = (daysDiff / totalDays) * 100;

    markers.push({
      date: current.toISOString(),
      position,
      label: formatMarkerLabel(current),
    });

    // 根据粒度增加时间
    switch (granularity.value) {
      case "day":
        current.setDate(current.getDate() + 7);
        break;
      case "week":
        current.setDate(current.getDate() + 7);
        break;
      case "month":
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return markers;
});

const visibleEvents = computed(() => {
  return timelineEvents.value.filter((event) => {
    const eventDate = new Date(event.date);
    const { startDate, endDate } = timeRange.value;
    return eventDate >= startDate && eventDate <= endDate;
  });
});

// 方法
const generateTimelineEvents = () => {
  const eventTypes = [
    "application",
    "approval",
    "rejection",
    "expiry",
    "milestone",
  ];
  const events = [];

  for (let i = 0; i < 20; i++) {
    const date = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    events.push({
      id: `event_${i}`,
      title: `事件 ${i + 1}`,
      description: `这是第 ${i + 1} 个时间轴事件`,
      date: date.toISOString(),
      type,
      importance: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
    });
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

const getEventPosition = (dateString: string): number => {
  const eventDate = new Date(dateString);
  const { startDate, endDate } = timeRange.value;

  const totalTime = endDate.getTime() - startDate.getTime();
  const eventTime = eventDate.getTime() - startDate.getTime();

  return Math.max(0, Math.min(100, (eventTime / totalTime) * 100));
};

const getEventIcon = (type: string) => {
  const icons: Record<string, string> = {
    application: "DocumentAdd",
    approval: "SuccessFilled",
    rejection: "CircleClose",
    expiry: "WarningFilled",
    milestone: "Flag",
  };
  return icons[type] || "Flag";
};

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    application: "专利申请",
    approval: "专利授权",
    rejection: "专利驳回",
    expiry: "专利到期",
    milestone: "重要里程碑",
  };
  return labels[type] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatMarkerLabel = (date: Date) => {
  switch (granularity.value) {
    case "day":
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case "week":
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case "month":
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    default:
      return date.toLocaleDateString();
  }
};

const selectEvent = (event: any) => {
  selectedEvent.value = event;
};

const zoomIn = () => {
  zoomLevel.value = Math.min(2, zoomLevel.value * 1.2);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value / 1.2);
};

const refreshData = () => {
  const newEvents = generateTimelineEvents();
  emit("update", props.widget.id, newEvents);
};

const addEvent = () => {
  console.log("Add event clicked");
  // 这里可以触发添加事件的对话框
};

const updateContainerSize = () => {
  // 根据容器大小调整时间轴显示
};

// 生命周期
onMounted(() => {
  updateContainerSize();
  window.addEventListener("resize", updateContainerSize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateContainerSize);
});
</script>

<style scoped>
.timeline-widget {
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

.timeline-widget:hover .widget-actions {
  opacity: 1;
}

.timeline-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  position: relative;
}

.timeline-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.timeline-content {
  flex: 1;
  position: relative;
  padding: 20px 0;
  transform-origin: center;
  transition: transform 0.3s ease;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #d1d5db;
  transform: translateY(-50%);
}

.time-markers {
  position: absolute;
  top: 60%;
  left: 0;
  right: 0;
  height: 30px;
}

.time-marker {
  position: absolute;
  top: 0;
  height: 100%;
  transform: translateX(-50%);
}

.marker-line {
  width: 1px;
  height: 15px;
  background: #9ca3af;
  margin: 0 auto;
}

.marker-label {
  font-size: 10px;
  color: #6b7280;
  text-align: center;
  margin-top: 2px;
  white-space: nowrap;
}

.events-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
}

.timeline-event {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) translateX(-50%);
  cursor: pointer;
  z-index: 10;
}

.event-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.timeline-event:hover .event-dot,
.timeline-event.active .event-dot {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timeline-event.event-application .event-dot {
  border-color: #3b82f6;
  color: #3b82f6;
}

.timeline-event.event-approval .event-dot {
  border-color: #10b981;
  color: #10b981;
}

.timeline-event.event-rejection .event-dot {
  border-color: #ef4444;
  color: #ef4444;
}

.timeline-event.event-expiry .event-dot {
  border-color: #f59e0b;
  color: #f59e0b;
}

.timeline-event.event-milestone .event-dot {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.event-label {
  font-size: 10px;
  color: #374151;
  text-align: center;
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-details {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.details-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.details-content p {
  margin: 4px 0;
  font-size: 12px;
  color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timeline-controls {
    flex-direction: column;
    gap: 8px;
  }

  .event-label {
    display: none;
  }

  .timeline-content {
    padding: 15px 0;
  }
}
</style>
