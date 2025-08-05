<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <div class="calendar-controls">
        <el-button @click="previousMonth">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2>{{ currentMonthYear }}</h2>
        <el-button @click="nextMonth">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-color deadline"></div>
          <span>期限</span>
        </div>
        <div class="legend-item">
          <div class="legend-color reminder"></div>
          <span>提醒</span>
        </div>
        <div class="legend-item">
          <div class="legend-color risk"></div>
          <span>风险</span>
        </div>
      </div>
    </div>

    <div class="calendar-grid">
      <!-- 星期标题 -->
      <div class="calendar-weekdays">
        <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
      </div>

      <!-- 日历网格 -->
      <div class="calendar-days">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            today: day.isToday,
            'has-events': day.events.length > 0,
          }"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="day-events">
            <div
              v-for="event in day.events"
              :key="event.id"
              class="calendar-event"
              :class="event.type"
              :style="{ backgroundColor: event.color }"
              @click.stop="handleEventClick(event)"
            >
              <div class="event-title">{{ event.title }}</div>
              <div class="event-time">{{ formatEventTime(event) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件详情对话框 -->
    <el-dialog v-model="showEventDialog" title="事件详情" width="500px">
      <div v-if="selectedEvent" class="event-details">
        <h3>{{ selectedEvent.title }}</h3>
        <p><strong>类型:</strong> {{ getEventTypeText(selectedEvent.type) }}</p>
        <p>
          <strong>开始时间:</strong> {{ formatDate(selectedEvent.startDate) }}
        </p>
        <p>
          <strong>结束时间:</strong> {{ formatDate(selectedEvent.endDate) }}
        </p>
        <p>
          <strong>优先级:</strong> {{ getPriorityText(selectedEvent.priority) }}
        </p>
        <p><strong>描述:</strong> {{ selectedEvent.description }}</p>
        <div class="event-actions">
          <el-button type="primary" @click="handleEventAction"
            >处理事件</el-button
          >
          <el-button @click="showEventDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import type { CalendarEvent } from "@/types/deadline";

const props = defineProps<{
  events: CalendarEvent[];
}>();

const emit = defineEmits<{
  "event-click": [event: CalendarEvent];
}>();

const currentDate = ref(new Date());
const showEventDialog = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

const currentMonthYear = computed(() => {
  return `${currentDate.value.getFullYear()}年${
    currentDate.value.getMonth() + 1
  }月`;
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const dayEvents = props.events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });

    days.push({
      date: date.toISOString().split("T")[0],
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      events: dayEvents,
    });
  }

  return days;
});

const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

const selectDay = (day: any) => {
  console.log("选择日期:", day);
};

const handleEventClick = (event: CalendarEvent) => {
  selectedEvent.value = event;
  showEventDialog.value = true;
  emit("event-click", event);
};

const handleEventAction = () => {
  if (selectedEvent.value) {
    console.log("处理事件:", selectedEvent.value);
    showEventDialog.value = false;
  }
};

const formatEventTime = (event: CalendarEvent) => {
  if (event.allDay) return "全天";
  const startTime = new Date(event.startDate);
  return startTime.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

const getEventTypeText = (type: string) => {
  const texts: Record<string, string> = {
    deadline: "期限",
    reminder: "提醒",
    risk: "风险",
  };
  return texts[type] || type;
};

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };
  return texts[priority] || priority;
};
</script>

<style scoped>
.calendar-view {
  padding: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.calendar-controls h2 {
  margin: 0;
  color: #2c3e50;
}

.calendar-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.legend-color.deadline {
  background-color: #f56c6c;
}

.legend-color.reminder {
  background-color: #e6a23c;
}

.legend-color.risk {
  background-color: #ff0000;
}

.calendar-grid {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f5f7fa;
}

.weekday {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #606266;
  border-right: 1px solid #e4e7ed;
}

.weekday:last-child {
  border-right: none;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 120px;
  padding: 8px;
  border-right: 1px solid #e4e7ed;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background-color 0.3s;
}

.calendar-day:hover {
  background-color: #f5f7fa;
}

.calendar-day.other-month {
  background-color: #fafafa;
  color: #c0c4cc;
}

.calendar-day.today {
  background-color: #e6f7ff;
}

.calendar-day.has-events {
  background-color: #fff7e6;
}

.day-number {
  font-weight: 600;
  margin-bottom: 5px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-event {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.8em;
  color: #333;
  cursor: pointer;
  transition: opacity 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.calendar-event:hover {
  opacity: 0.8;
}

.event-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  font-size: 0.7em;
  opacity: 0.9;
}

.event-details {
  padding: 20px;
}

.event-details h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.event-details p {
  margin: 0 0 10px 0;
  color: #606266;
}

.event-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    gap: 15px;
  }

  .calendar-legend {
    justify-content: center;
  }

  .calendar-day {
    min-height: 80px;
    padding: 4px;
  }

  .calendar-event {
    font-size: 0.7em;
  }
}
</style>
