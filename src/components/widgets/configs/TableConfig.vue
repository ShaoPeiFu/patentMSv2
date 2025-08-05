<template>
  <div class="table-config">
    <el-form-item label="数据源">
      <el-select v-model="localConfig.dataSource" @change="updateConfig">
        <el-option label="专利数据" value="patent" />
        <el-option label="用户数据" value="user" />
        <el-option label="分析数据" value="analytics" />
        <el-option label="自定义" value="custom" />
      </el-select>
    </el-form-item>

    <el-form-item label="显示列">
      <el-checkbox-group v-model="localConfig.columns" @change="updateConfig">
        <el-checkbox label="title">标题</el-checkbox>
        <el-checkbox label="type">类型</el-checkbox>
        <el-checkbox label="status">状态</el-checkbox>
        <el-checkbox label="date">日期</el-checkbox>
        <el-checkbox label="count">数量</el-checkbox>
        <el-checkbox label="value">值</el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="每页显示">
      <el-input-number
        v-model="localConfig.pageSize"
        @change="updateConfig"
        :min="5"
        :max="100"
        :step="5"
      />
    </el-form-item>

    <el-form-item label="显示操作列">
      <el-switch v-model="localConfig.showActions" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示分页">
      <el-switch v-model="localConfig.showPagination" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="显示边框">
      <el-switch v-model="localConfig.showBorder" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="斑马纹">
      <el-switch v-model="localConfig.stripe" @change="updateConfig" />
    </el-form-item>

    <el-form-item label="表格大小">
      <el-select v-model="localConfig.size" @change="updateConfig">
        <el-option label="大" value="large" />
        <el-option label="默认" value="default" />
        <el-option label="小" value="small" />
      </el-select>
    </el-form-item>

    <el-form-item label="排序字段">
      <el-select v-model="localConfig.sortField" @change="updateConfig">
        <el-option label="无" value="" />
        <el-option label="标题" value="title" />
        <el-option label="日期" value="date" />
        <el-option label="数量" value="count" />
        <el-option label="值" value="value" />
      </el-select>
    </el-form-item>

    <el-form-item label="排序方向">
      <el-select
        v-model="localConfig.sortOrder"
        @change="updateConfig"
        :disabled="!localConfig.sortField"
      >
        <el-option label="升序" value="asc" />
        <el-option label="降序" value="desc" />
      </el-select>
    </el-form-item>

    <el-form-item label="过滤条件">
      <el-input
        v-model="localConfig.filterText"
        @change="updateConfig"
        placeholder="输入过滤关键词"
        clearable
      />
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
  dataSource: "patent",
  columns: ["title", "type", "status", "date"],
  pageSize: 20,
  showActions: true,
  showPagination: true,
  showBorder: true,
  stripe: true,
  size: "default",
  sortField: "",
  sortOrder: "asc",
  filterText: "",
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
.table-config {
  padding: 16px 0;
}
</style>
