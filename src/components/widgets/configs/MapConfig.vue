<template>
  <div class="map-config">
    <el-form-item label="地图类型">
      <el-select v-model="localConfig.mapType" @change="updateConfig">
        <el-option label="中国地图" value="china" />
        <el-option label="世界地图" value="world" />
        <el-option label="自定义" value="custom" />
      </el-select>
    </el-form-item>

    <el-form-item label="数据字段">
      <el-select v-model="localConfig.dataField" @change="updateConfig">
        <el-option label="专利数量" value="patentCount" />
        <el-option label="授权率" value="approvalRate" />
        <el-option label="专利价值" value="value" />
        <el-option label="增长率" value="growth" />
      </el-select>
    </el-form-item>

    <el-form-item label="颜色方案">
      <el-select v-model="localConfig.colorScheme" @change="updateConfig">
        <el-option label="蓝色系" value="blue" />
        <el-option label="绿色系" value="green" />
        <el-option label="红色系" value="red" />
        <el-option label="紫色系" value="purple" />
      </el-select>
    </el-form-item>

    <el-form-item label="显示标签">
      <el-switch v-model="localConfig.showLabels" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示工具提示">
      <el-switch v-model="localConfig.showTooltips" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="启用缩放">
      <el-switch v-model="localConfig.zoomEnabled" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示数据点">
      <el-switch v-model="localConfig.showDataPoints" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示图例">
      <el-switch v-model="localConfig.showLegend" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="数据范围">
      <el-row :gutter="8">
        <el-col :span="12">
          <el-input-number
            v-model="localConfig.minValue"
            @change="updateConfig"
            placeholder="最小值"
            size="small"
          />
        </el-col>
        <el-col :span="12">
          <el-input-number
            v-model="localConfig.maxValue"
            @change="updateConfig"
            placeholder="最大值"
            size="small"
          />
        </el-col>
      </el-row>
    </el-form-item>

    <el-form-item label="透明度">
      <el-slider
        v-model="localConfig.opacity"
        @change="updateConfig"
        :min="0"
        :max="100"
        :step="10"
      />
    </el-form-item>

    <el-form-item label="边框宽度">
      <el-input-number
        v-model="localConfig.borderWidth"
        @change="updateConfig"
        :min="0"
        :max="5"
        :step="0.5"
      />
    </el-form-item>

    <el-form-item label="动画效果">
      <el-switch v-model="localConfig.animation" @change="updateConfig" />
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
  mapType: "china",
  dataField: "patentCount",
  colorScheme: "blue",
  showLabels: true,
  showTooltips: true,
  zoomEnabled: true,
  showDataPoints: false,
  showLegend: true,
  minValue: 0,
  maxValue: 1000,
  opacity: 80,
  borderWidth: 1,
  animation: true,
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
.map-config {
  padding: 16px 0;
}
</style>
