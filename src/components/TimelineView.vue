<template>
  <div class="timeline-view">
    <!-- 控制面板 -->
    <div class="timeline-controls">
      <div class="controls-left">
        <el-button-group size="small">
          <el-button
            v-for="granularity in granularities"
            :key="granularity.value"
            :type="
              timelineConfig.granularity === granularity.value ? 'primary' : ''
            "
            @click="updateGranularity(granularity.value)"
          >
            {{ granularity.label }}
          </el-button>
        </el-button-group>

        <el-select
          v-model="selectedEventTypes"
          multiple
          placeholder="选择事件类型"
          size="small"
          style="width: 200px; margin-left: 12px"
        >
          <el-option
            v-for="type in eventTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
      </div>

      <div class="controls-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="updateDateRange"
        />

        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <el-button size="small" @click="zoomOut" :disabled="zoomLevel <= 0.5">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <el-button size="small" @click="zoomIn" :disabled="zoomLevel >= 5">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </div>

        <!-- 导航控制 -->
        <div class="navigation-controls">
          <el-button size="small" @click="resetView">
            <el-icon><Refresh /></el-icon>
            重置视图
          </el-button>
        </div>

        <el-button size="small" @click="addEvent">
          <el-icon><Plus /></el-icon>
          添加事件
        </el-button>

        <el-button size="small" @click="exportTimeline">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 时间轴导航 -->
    <div class="timeline-navigation">
      <div class="timeline-scale" ref="scaleRef">
        <div
          v-for="mark in timeMarks"
          :key="mark.date"
          class="time-mark"
          :style="{ left: mark.position + '%' }"
        >
          <div class="mark-line"></div>
          <div class="mark-label">{{ mark.label }}</div>
        </div>
      </div>

      <div class="timeline-viewport" @wheel="handleZoom" @mousedown="startPan">
        <div
          class="timeline-content"
          :style="{
            transform: `translateX(${panOffset}px) scale(${zoomLevel})`,
            transformOrigin: 'left center',
          }"
        >
          <!-- 时间线 -->
          <div class="timeline-line"></div>

          <!-- 事件点 -->
          <div
            v-for="event in visibleEvents"
            :key="event.id"
            class="timeline-event"
            :class="[
              `event-${event.type}`,
              `importance-${event.importance}`,
              { active: selectedEvent?.id === event.id },
            ]"
            :style="{ left: getEventPosition(event.date) + '%' }"
            @click="selectEvent(event)"
            @mouseenter="showEventTooltip($event, event)"
            @mouseleave="hideEventTooltip"
          >
            <div class="event-dot">
              <el-icon>
                <component :is="getEventIcon(event.type)" />
              </el-icon>
            </div>
            <!-- 只在缩放级别足够高时显示标签 -->
            <div
              v-if="zoomLevel >= 2 && shouldShowEventLabel(event)"
              class="event-label"
            >
              {{ getShortEventTitle(event.title) }}
            </div>
          </div>

          <!-- 事件工具提示 -->
          <div
            v-if="eventTooltip.visible"
            class="event-tooltip"
            :style="{ left: eventTooltip.x + 'px', top: eventTooltip.y + 'px' }"
          >
            <div class="tooltip-header">
              <div class="tooltip-title">{{ eventTooltip.event?.title }}</div>
              <div class="tooltip-type">
                {{ getEventTypeLabel(eventTooltip.event?.type || "") }}
              </div>
            </div>
            <div class="tooltip-content">
              <div class="tooltip-date">
                {{ formatDate(eventTooltip.event?.date || "") }}
              </div>
              <div class="tooltip-description">
                {{ eventTooltip.event?.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件详情面板 -->
    <div class="timeline-details">
      <div class="details-sidebar" :class="{ expanded: selectedEvent }">
        <div v-if="selectedEvent" class="event-details">
          <div class="event-header">
            <div class="event-type-badge" :class="`type-${selectedEvent.type}`">
              <el-icon>
                <component :is="getEventIcon(selectedEvent.type)" />
              </el-icon>
              {{ getEventTypeLabel(selectedEvent.type) }}
            </div>
            <div
              class="event-importance"
              :class="`importance-${selectedEvent.importance}`"
            >
              {{ getImportanceLabel(selectedEvent.importance) }}
            </div>
          </div>

          <h3 class="event-title">{{ selectedEvent.title }}</h3>
          <p class="event-date">{{ formatDate(selectedEvent.date) }}</p>
          <p class="event-description">{{ selectedEvent.description }}</p>

          <div v-if="selectedEvent.metadata" class="event-metadata">
            <h4>相关信息</h4>
            <div class="metadata-grid">
              <div
                v-for="(value, key) in selectedEvent.metadata"
                :key="key"
                class="metadata-item"
              >
                <span class="metadata-key">{{ key }}:</span>
                <span class="metadata-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <div class="event-actions">
            <el-button size="small" @click="editEvent(selectedEvent)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteEvent(selectedEvent.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>

        <div v-else class="no-selection">
          <el-icon><Calendar /></el-icon>
          <p>点击时间轴上的事件查看详情</p>
        </div>
      </div>

      <!-- 事件列表 -->
      <div class="events-list">
        <div class="list-header">
          <h3>事件列表</h3>
          <div class="list-controls">
            <el-input
              v-model="searchQuery"
              placeholder="搜索事件..."
              size="small"
              prefix-icon="Search"
              clearable
            />

            <el-select v-model="groupBy" size="small" style="width: 120px">
              <el-option label="按类型" value="type" />
              <el-option label="按重要性" value="importance" />
              <el-option label="按日期" value="date" />
            </el-select>
          </div>
        </div>

        <div class="events-grid">
          <div
            v-for="group in groupedEvents"
            :key="group.key"
            class="event-group"
          >
            <h4 class="group-title">{{ group.title }}</h4>
            <div
              v-for="event in group.events"
              :key="event.id"
              class="event-card"
              :class="{ active: selectedEvent?.id === event.id }"
              @click="selectEvent(event)"
            >
              <div class="card-header">
                <el-icon class="event-icon">
                  <component :is="getEventIcon(event.type)" />
                </el-icon>
                <span class="card-title">{{ event.title }}</span>
                <el-tag
                  :type="getImportanceTagType(event.importance)"
                  size="small"
                >
                  {{ getImportanceLabel(event.importance) }}
                </el-tag>
              </div>
              <p class="card-date">{{ formatDate(event.date) }}</p>
              <p class="card-description">{{ event.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑事件对话框 -->
    <el-dialog
      v-model="showEventDialog"
      :title="editingEvent?.id ? '编辑事件' : '添加事件'"
      width="600px"
    >
      <el-form
        ref="eventFormRef"
        :model="eventForm"
        :rules="eventRules"
        label-width="100px"
      >
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
        </el-form-item>

        <el-form-item label="事件描述" prop="description">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入事件描述"
          />
        </el-form-item>

        <el-form-item label="事件日期" prop="date">
          <el-date-picker
            v-model="eventForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="事件类型" prop="type">
          <el-select v-model="eventForm.type" placeholder="选择事件类型">
            <el-option
              v-for="type in eventTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="重要性" prop="importance">
          <el-radio-group v-model="eventForm.importance">
            <el-radio label="low">低</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="high">高</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-input v-model="eventForm.category" placeholder="事件分类" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEventDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEvent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { useVisualizationStore } from "@/stores/visualization";
import type { TimelineEvent } from "@/types/visualization";
import {
  Plus,
  Download,
  Edit,
  Delete,
  Calendar,
  ZoomIn,
  ZoomOut,
  Refresh,
} from "@element-plus/icons-vue";

const visualizationStore = useVisualizationStore();

// 响应式数据
const selectedEvent = ref<TimelineEvent | null>(null);
const selectedEventTypes = ref<string[]>([
  "application",
  "approval",
  "rejection",
]);
const dateRange = ref<[Date, Date] | null>(null);
const searchQuery = ref("");
const groupBy = ref("type");
const zoomLevel = ref(1);
const panOffset = ref(0);
const isPanning = ref(false);
const lastPanX = ref(0);
const showEventDialog = ref(false);
const editingEvent = ref<TimelineEvent | null>(null);
const eventFormRef = ref<FormInstance>();

// 工具提示相关
const eventTooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  event: null as TimelineEvent | null,
});

// 表单数据
const eventForm = reactive({
  title: "",
  description: "",
  date: new Date(),
  type: "application",
  importance: "medium",
  category: "",
});

// 表单验证规则
const eventRules = {
  title: [{ required: true, message: "请输入事件标题", trigger: "blur" }],
  description: [{ required: true, message: "请输入事件描述", trigger: "blur" }],
  date: [{ required: true, message: "请选择日期", trigger: "change" }],
  type: [{ required: true, message: "请选择事件类型", trigger: "change" }],
  importance: [{ required: true, message: "请选择重要性", trigger: "change" }],
};

// 配置选项
const granularities = [
  { label: "日", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
  { label: "季度", value: "quarter" },
  { label: "年", value: "year" },
];

const eventTypes = [
  { label: "专利申请", value: "application" },
  { label: "专利授权", value: "approval" },
  { label: "专利驳回", value: "rejection" },
  { label: "专利到期", value: "expiry" },
  { label: "重要里程碑", value: "milestone" },
];

// 计算属性
const timelineConfig = computed(() => visualizationStore.timelineConfig);
const events = computed(() => visualizationStore.filteredTimelineEvents);

const visibleEvents = computed(() => {
  let filtered = events.value;

  // 按事件类型过滤
  if (selectedEventTypes.value.length > 0) {
    filtered = filtered.filter((event) =>
      selectedEventTypes.value.includes(event.type)
    );
  }

  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const groupedEvents = computed(() => {
  const groups: Record<string, TimelineEvent[]> = {};

  visibleEvents.value.forEach((event) => {
    let key: string;
    switch (groupBy.value) {
      case "type":
        key = event.type;
        break;
      case "importance":
        key = event.importance;
        break;
      case "date":
        key = new Date(event.date).getFullYear().toString();
        break;
      default:
        key = "default";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
  });

  return Object.entries(groups).map(([key, events]) => ({
    key,
    title: getGroupTitle(key, groupBy.value),
    events: events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  }));
});

const timeMarks = computed(() => {
  const startDate = new Date(timelineConfig.value.startDate);
  const endDate = new Date(timelineConfig.value.endDate);
  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const marks = [];
  const granularity = timelineConfig.value.granularity;

  // 根据时间跨度和缩放级别调整标记密度
  const maxMarks = Math.min(20, Math.max(5, Math.floor(totalDays / 30))); // 最多20个标记
  const interval = Math.ceil(totalDays / maxMarks);

  let current = new Date(startDate);
  let markCount = 0;

  while (current <= endDate && markCount < maxMarks) {
    const daysDiff =
      (current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const position = (daysDiff / totalDays) * 100;

    // 只显示主要的时间标记
    const shouldShowMark =
      markCount % Math.max(1, Math.floor(maxMarks / 10)) === 0;

    if (shouldShowMark) {
      marks.push({
        date: current.toISOString(),
        position,
        label: formatMarkLabel(current, granularity),
      });
    }

    // 根据粒度增加时间
    switch (granularity) {
      case "day":
        current.setDate(current.getDate() + interval);
        break;
      case "week":
        current.setDate(current.getDate() + interval * 7);
        break;
      case "month":
        current.setMonth(
          current.getMonth() + Math.max(1, Math.floor(interval / 30))
        );
        break;
      case "quarter":
        current.setMonth(
          current.getMonth() + Math.max(3, Math.floor(interval / 30) * 3)
        );
        break;
      case "year":
        current.setFullYear(
          current.getFullYear() + Math.max(1, Math.floor(interval / 365))
        );
        break;
    }
    markCount++;
  }

  return marks;
});

// 方法
const updateGranularity = (granularity: string) => {
  visualizationStore.updateTimelineConfig({ granularity: granularity as any });
};

const updateDateRange = (range: [Date, Date] | null) => {
  if (range) {
    visualizationStore.updateTimelineConfig({
      startDate: range[0].toISOString().split("T")[0],
      endDate: range[1].toISOString().split("T")[0],
    });
  }
};

const getEventPosition = (date: string): number => {
  const eventDate = new Date(date);
  const startDate = new Date(timelineConfig.value.startDate);
  const endDate = new Date(timelineConfig.value.endDate);

  const totalTime = endDate.getTime() - startDate.getTime();
  const eventTime = eventDate.getTime() - startDate.getTime();

  return Math.max(0, Math.min(100, (eventTime / totalTime) * 100));
};

const selectEvent = (event: TimelineEvent) => {
  selectedEvent.value = event;
};

const getEventIcon = (type: string) => {
  const icons: Record<string, string> = {
    application: "DocumentAdd",
    approval: "SuccessFilled",
    rejection: "CircleClose",
    expiry: "WarningFilled",
    milestone: "Flag",
  };
  return icons[type] || "Star";
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

const getImportanceLabel = (importance: string) => {
  const labels: Record<string, string> = {
    low: "低重要性",
    medium: "中等重要性",
    high: "高重要性",
  };
  return labels[importance] || importance;
};

const getImportanceTagType = (importance: string) => {
  const types: Record<string, string> = {
    low: "info",
    medium: "warning",
    high: "danger",
  };
  return types[importance] || "info";
};

const getGroupTitle = (key: string, groupBy: string) => {
  if (groupBy === "type") {
    return getEventTypeLabel(key);
  } else if (groupBy === "importance") {
    return getImportanceLabel(key);
  } else if (groupBy === "date") {
    return `${key}年`;
  }
  return key;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatMarkLabel = (date: Date, granularity: string) => {
  switch (granularity) {
    case "day":
    case "week":
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case "month":
      return `${date.getFullYear()}/${date.getMonth() + 1}`;
    case "quarter":
      return `${date.getFullYear()}Q${Math.floor(date.getMonth() / 3) + 1}`;
    case "year":
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString();
  }
};

const handleZoom = (event: WheelEvent) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  zoomLevel.value = Math.max(0.5, Math.min(3, zoomLevel.value + delta));
};

const startPan = (event: MouseEvent) => {
  isPanning.value = true;
  lastPanX.value = event.clientX;
};

const handlePan = (event: MouseEvent) => {
  if (!isPanning.value) return;

  const deltaX = event.clientX - lastPanX.value;
  panOffset.value += deltaX;
  lastPanX.value = event.clientX;
};

const stopPan = () => {
  isPanning.value = false;
};

const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.1);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1);
};

const resetView = () => {
  zoomLevel.value = 1;
  panOffset.value = 0;
};

const addEvent = () => {
  editingEvent.value = null;
  Object.assign(eventForm, {
    title: "",
    description: "",
    date: new Date(),
    type: "application",
    importance: "medium",
    category: "",
  });
  showEventDialog.value = true;
};

const editEvent = (event: TimelineEvent) => {
  editingEvent.value = event;
  Object.assign(eventForm, {
    title: event.title,
    description: event.description,
    date: new Date(event.date),
    type: event.type,
    importance: event.importance,
    category: event.category || "",
  });
  showEventDialog.value = true;
};

const saveEvent = async () => {
  if (!eventFormRef.value) return;

  try {
    await eventFormRef.value.validate();

    const eventData = {
      title: eventForm.title,
      description: eventForm.description,
      date: eventForm.date.toISOString().split("T")[0],
      type: eventForm.type as any,
      importance: eventForm.importance as any,
      category: eventForm.category,
    };

    if (editingEvent.value) {
      visualizationStore.updateTimelineEvent(editingEvent.value.id, eventData);
      ElMessage.success("事件更新成功");
    } else {
      visualizationStore.addTimelineEvent(eventData);
      ElMessage.success("事件添加成功");
    }

    showEventDialog.value = false;
  } catch (error) {
    console.error("保存事件失败:", error);
  }
};

const deleteEvent = async (eventId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个事件吗？", "确认删除", {
      type: "warning",
    });

    visualizationStore.deleteTimelineEvent(eventId);
    selectedEvent.value = null;
    ElMessage.success("事件删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const exportTimeline = () => {
  ElMessage.info("导出功能开发中");
};

// 工具提示相关方法
const showEventTooltip = (event: MouseEvent, eventData: TimelineEvent) => {
  eventTooltip.visible = true;
  eventTooltip.event = eventData;
  eventTooltip.x = event.clientX;
  eventTooltip.y = event.clientY;
};

const hideEventTooltip = () => {
  eventTooltip.visible = false;
  eventTooltip.event = null;
};

const shouldShowEventLabel = (_event: TimelineEvent) => {
  // 当缩放级别大于等于2时，显示标签
  return zoomLevel.value >= 2;
};

const getShortEventTitle = (title: string) => {
  if (title.length > 15) {
    return title.substring(0, 15) + "...";
  }
  return title;
};

// 生命周期
onMounted(() => {
  // 初始化日期范围
  dateRange.value = [
    new Date(timelineConfig.value.startDate),
    new Date(timelineConfig.value.endDate),
  ];

  // 绑定事件
  document.addEventListener("mousemove", handlePan);
  document.addEventListener("mouseup", stopPan);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handlePan);
  document.removeEventListener("mouseup", stopPan);
});
</script>

<style scoped>
.timeline-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow-y: auto;
}

.timeline-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e1e3e9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e1e3e9;
}

.zoom-level {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.navigation-controls {
  margin-left: 12px;
}

.timeline-navigation {
  background: white;
  border-bottom: 1px solid #e1e3e9;
  padding: 16px;
}

.timeline-scale {
  position: relative;
  height: 60px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e3e9;
  overflow: hidden;
}

.time-mark {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.mark-line {
  width: 1px;
  height: 20px;
  background: #d1d5db;
  margin-bottom: 4px;
}

.mark-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timeline-viewport {
  position: relative;
  height: 200px;
  background: white;
  overflow: hidden;
  cursor: grab;
}

.timeline-viewport:active {
  cursor: grabbing;
}

.timeline-content {
  position: relative;
  height: 100%;
  transition: transform 0.1s ease;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
  transform: translateY(-50%);
}

.timeline-event {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
}

.timeline-event:hover {
  z-index: 10;
}

.event-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.timeline-event:hover .event-dot {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.event-application .event-dot {
  background: #3b82f6;
}

.event-approval .event-dot {
  background: #10b981;
}

.event-rejection .event-dot {
  background: #ef4444;
}

.event-expiry .event-dot {
  background: #f59e0b;
}

.event-milestone .event-dot {
  background: #8b5cf6;
}

.importance-high .event-dot {
  border: 2px solid #fbbf24;
}

.importance-medium .event-dot {
  border: 2px solid #6b7280;
}

.importance-low .event-dot {
  border: 2px solid #d1d5db;
}

.timeline-event.active .event-dot {
  border: 3px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.event-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(17, 24, 39, 0.95);
  color: white;
  padding: 16px;
  border-radius: 12px;
  font-size: 13px;
  pointer-events: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 250px;
  max-width: 350px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tooltip-title {
  font-weight: 600;
  font-size: 14px;
  color: #f3f4f6;
}

.tooltip-type {
  font-size: 12px;
  color: #d1d5db;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.tooltip-content {
  font-size: 12px;
  color: #d1d5db;
}

.tooltip-date {
  margin-bottom: 8px;
  font-weight: 500;
  color: #f3f4f6;
}

.tooltip-description {
  line-height: 1.4;
  opacity: 0.9;
}

.timeline-details {
  flex: 1;
  display: flex;
  background: white;
}

.details-sidebar {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
  border-right: 1px solid #e1e3e9;
}

.details-sidebar.expanded {
  width: 400px;
}

.event-details {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.event-type-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.event-type-badge.type-application {
  background: #dbeafe;
  color: #1d4ed8;
}

.event-type-badge.type-approval {
  background: #d1fae5;
  color: #065f46;
}

.event-type-badge.type-rejection {
  background: #fee2e2;
  color: #dc2626;
}

.event-importance {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.event-importance.importance-high {
  background: #fee2e2;
  color: #dc2626;
}

.event-importance.importance-medium {
  background: #fef3c7;
  color: #d97706;
}

.event-importance.importance-low {
  background: #e5e7eb;
  color: #6b7280;
}

.event-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.event-date {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
}

.event-description {
  margin: 0 0 16px 0;
  color: #374151;
  line-height: 1.6;
}

.event-metadata h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.metadata-grid {
  display: grid;
  gap: 8px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.metadata-key {
  font-weight: 500;
  color: #6b7280;
}

.metadata-value {
  color: #111827;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.no-selection .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.events-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.list-controls {
  display: flex;
  gap: 12px;
}

.events-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.event-group {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.group-title {
  margin: 0;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.event-card {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.event-card:hover,
.event-card.active {
  background: #f8fafc;
}

.event-card:last-child {
  border-bottom: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.event-icon {
  color: #6b7280;
}

.card-title {
  flex: 1;
  font-weight: 500;
  color: #111827;
}

.card-date {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #6b7280;
}

.card-description {
  margin: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .timeline-controls {
    flex-direction: column;
    gap: 12px;
  }

  .controls-left,
  .controls-right {
    width: 100%;
    justify-content: center;
  }

  .timeline-details {
    flex-direction: column;
  }

  .details-sidebar.expanded {
    width: 100%;
    height: 300px;
  }
}

@media (max-width: 768px) {
  .timeline-navigation {
    padding: 8px;
  }

  .timeline-viewport {
    height: 80px;
  }

  .event-label {
    display: none;
  }

  .events-list {
    padding: 16px;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
  }

  .list-controls {
    width: 100%;
  }
}
</style>
