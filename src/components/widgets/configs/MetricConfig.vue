<template>
  <div class="metric-config">
    <el-form-item label="指标值">
      <el-input-number v-model="localConfig.value" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="单位">
      <el-input
        v-model="localConfig.unit"
        @change="updateConfig"
        placeholder="如：件、%、万元"
      />
    </el-form-item>

    <el-form-item label="趋势">
      <el-select v-model="localConfig.trend" @change="updateConfig">
        <el-option label="无趋势" value="none" />
        <el-option label="上升" value="up" />
        <el-option label="下降" value="down" />
        <el-option label="稳定" value="stable" />
      </el-select>
    </el-form-item>

    <el-form-item label="趋势值">
      <el-input-number
        v-model="localConfig.trendValue"
        @change="updateConfig"
        :disabled="localConfig.trend === 'none'"
        :min="0"
        :max="100"
        :step="0.1"
      />
    </el-form-item>

    <el-form-item label="目标值">
      <el-input-number v-model="localConfig.target" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="描述">
      <el-input
        v-model="localConfig.description"
        @change="updateConfig"
        type="textarea"
        :rows="2"
        placeholder="指标说明"
      />
    </el-form-item>

    <el-form-item label="数据源">
      <el-select v-model="localConfig.dataSource" @change="updateConfig">
        <el-option label="专利数据" value="patent" />
        <el-option label="用户数据" value="user" />
        <el-option label="分析数据" value="analytics" />
        <el-option label="自定义" value="custom" />
      </el-select>
    </el-form-item>

    <el-form-item label="数据字段">
      <el-select v-model="localConfig.dataField" @change="updateConfig">
        <el-option label="总数" value="total" />
        <el-option label="月度" value="monthly" />
        <el-option label="年度" value="yearly" />
        <el-option label="增长率" value="growth" />
      </el-select>
    </el-form-item>

    <el-form-item label="显示进度条">
      <el-switch v-model="localConfig.showProgress" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="颜色主题">
      <el-select v-model="localConfig.colorTheme" @change="updateConfig">
        <el-option label="默认" value="default" />
        <el-option label="成功" value="success" />
        <el-option label="警告" value="warning" />
        <el-option label="危险" value="danger" />
        <el-option label="信息" value="info" />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from "vue";

interface Props {
  modelValue: Record<string, any>;
  widget?: any;
}

interface Emits {
  (e: "update:modelValue", value: Record<string, any>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = reactive({
  value: 0,
  unit: "",
  trend: "none",
  trendValue: 0,
  target: 0,
  description: "",
  dataSource: "patent",
  dataField: "total",
  showProgress: false,
  colorTheme: "default",
  ...props.modelValue,
});

const updateConfig = () => {
  emit("update:modelValue", { ...localConfig });
};

watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localConfig, newValue);
  },
  { deep: true }
);

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    updateConfig();
  }
});
</script>

<style scoped>
.metric-config {
  padding: 16px 0;
}
</style>
