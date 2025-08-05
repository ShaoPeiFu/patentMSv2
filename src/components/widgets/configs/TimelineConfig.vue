<template>
  <div class="timeline-config">
    <el-form-item label="数据源">
      <el-select v-model="localConfig.dataSource" @change="updateConfig">
        <el-option label="时间轴事件" value="timeline" />
        <el-option label="专利事件" value="patent" />
        <el-option label="用户事件" value="user" />
        <el-option label="自定义" value="custom" />
      </el-select>
    </el-form-item>

    <el-form-item label="事件类型">
      <el-checkbox-group
        v-model="localConfig.eventTypes"
        @change="updateConfig"
      >
        <el-checkbox label="application">专利申请</el-checkbox>
        <el-checkbox label="approval">专利授权</el-checkbox>
        <el-checkbox label="rejection">专利驳回</el-checkbox>
        <el-checkbox label="expiry">专利到期</el-checkbox>
        <el-checkbox label="milestone">重要里程碑</el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="时间粒度">
      <el-select v-model="localConfig.granularity" @change="updateConfig">
        <el-option label="日" value="day" />
        <el-option label="周" value="week" />
        <el-option label="月" value="month" />
        <el-option label="季度" value="quarter" />
        <el-option label="年" value="year" />
      </el-select>
    </el-form-item>

    <el-form-item label="时间范围">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        size="small"
        @change="updateDateRange"
      />
    </el-form-item>

    <el-form-item label="显示标签">
      <el-switch v-model="localConfig.showLabels" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示重要性">
      <el-switch v-model="localConfig.showImportance" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="启用缩放">
      <el-switch v-model="localConfig.zoomEnabled" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示详情">
      <el-switch v-model="localConfig.showDetails" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="最大显示事件">
      <el-input-number
        v-model="localConfig.maxEvents"
        @change="updateConfig"
        :min="10"
        :max="500"
        :step="10"
      />
    </el-form-item>

    <el-form-item label="事件高度">
      <el-slider
        v-model="localConfig.eventHeight"
        @change="updateConfig"
        :min="20"
        :max="60"
        :step="5"
      />
    </el-form-item>

    <el-form-item label="线条颜色">
      <el-color-picker v-model="localConfig.lineColor" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="背景颜色">
      <el-color-picker
        v-model="localConfig.backgroundColor"
        @change="updateConfig"
      />
    </el-form-item>

    <el-form-item label="分组方式">
      <el-select v-model="localConfig.groupBy" @change="updateConfig">
        <el-option label="无分组" value="none" />
        <el-option label="按类型" value="type" />
        <el-option label="按重要性" value="importance" />
        <el-option label="按日期" value="date" />
      </el-select>
    </el-form-item>

    <el-form-item label="动画效果">
      <el-switch v-model="localConfig.animation" @change="updateConfig" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";

interface Props {
  modelValue: Record<string, any>;
  widget?: any;
}

interface Emits {
  (e: "update:modelValue", value: Record<string, any>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dateRange = ref<[Date, Date] | null>(null);

const localConfig = reactive({
  dataSource: "timeline",
  eventTypes: ["application", "approval"],
  granularity: "month",
  startDate: "",
  endDate: "",
  showLabels: true,
  showImportance: true,
  zoomEnabled: true,
  showDetails: true,
  maxEvents: 100,
  eventHeight: 30,
  lineColor: "#d1d5db",
  backgroundColor: "#f8f9fa",
  groupBy: "none",
  animation: true,
  ...props.modelValue,
});

const updateConfig = () => {
  emit("update:modelValue", { ...localConfig });
};

const updateDateRange = (dates: [Date, Date] | null) => {
  if (dates) {
    localConfig.startDate = dates[0].toISOString().split("T")[0];
    localConfig.endDate = dates[1].toISOString().split("T")[0];
  } else {
    localConfig.startDate = "";
    localConfig.endDate = "";
  }
  updateConfig();
};

watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localConfig, newValue);

    // 同步日期范围
    if (localConfig.startDate && localConfig.endDate) {
      dateRange.value = [
        new Date(localConfig.startDate),
        new Date(localConfig.endDate),
      ];
    }
  },
  { deep: true }
);

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    // 设置默认日期范围
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, 0, 1);
    const endDate = new Date(now.getFullYear(), 11, 31);

    localConfig.startDate = startDate.toISOString().split("T")[0];
    localConfig.endDate = endDate.toISOString().split("T")[0];
    dateRange.value = [startDate, endDate];

    updateConfig();
  }
});
</script>

<style scoped>
.timeline-config {
  padding: 16px 0;
}
</style>
