<template>
  <div class="chart-config">
    <el-form-item label="图表类型">
      <el-select v-model="localConfig.chartType" @change="updateConfig">
        <el-option label="折线图" value="line" />
        <el-option label="柱状图" value="bar" />
        <el-option label="饼图" value="pie" />
        <el-option label="散点图" value="scatter" />
        <el-option label="面积图" value="area" />
      </el-select>
    </el-form-item>

    <el-form-item label="数据源">
      <el-select v-model="localConfig.dataSource" @change="updateConfig">
        <el-option label="专利数据" value="patent" />
        <el-option label="用户数据" value="user" />
        <el-option label="分析数据" value="analytics" />
        <el-option label="自定义数据" value="custom" />
      </el-select>
    </el-form-item>

    <el-form-item label="X轴字段">
      <el-select v-model="localConfig.xField" @change="updateConfig">
        <el-option label="日期" value="date" />
        <el-option label="类型" value="type" />
        <el-option label="状态" value="status" />
        <el-option label="分类" value="category" />
      </el-select>
    </el-form-item>

    <el-form-item label="Y轴字段">
      <el-select v-model="localConfig.yField" @change="updateConfig">
        <el-option label="数量" value="count" />
        <el-option label="值" value="value" />
        <el-option label="比例" value="ratio" />
        <el-option label="增长率" value="growth" />
      </el-select>
    </el-form-item>

    <el-form-item label="显示图例">
      <el-switch v-model="localConfig.showLegend" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示网格">
      <el-switch v-model="localConfig.showGrid" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="动画效果">
      <el-switch v-model="localConfig.animation" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="颜色主题">
      <el-select v-model="localConfig.colorTheme" @change="updateConfig">
        <el-option label="默认" value="default" />
        <el-option label="蓝色" value="blue" />
        <el-option label="绿色" value="green" />
        <el-option label="紫色" value="purple" />
        <el-option label="橙色" value="orange" />
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
  chartType: "line",
  dataSource: "patent",
  xField: "date",
  yField: "count",
  showLegend: true,
  showGrid: true,
  animation: true,
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
.chart-config {
  padding: 16px 0;
}
</style>
