<template>
  <div class="advanced-search">
    <!-- 搜索条件构建器 -->
    <el-card class="search-builder" v-show="showBuilder">
      <template #header>
        <div class="card-header">
          <h3>高级搜索</h3>
          <div class="header-actions">
            <el-button size="small" @click="addCondition">
              <el-icon><Plus /></el-icon>
              添加条件
            </el-button>
            <el-button size="small" @click="clearConditions">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
            <el-button size="small" type="primary" @click="executeSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索条件列表 -->
      <div class="conditions-list">
        <div
          v-for="(condition, index) in conditions"
          :key="index"
          class="condition-item"
        >
          <!-- 逻辑运算符 -->
          <div class="logic-operator" v-if="index > 0">
            <el-select v-model="condition.logic" size="small">
              <el-option label="并且" value="and" />
              <el-option label="或者" value="or" />
            </el-select>
          </div>

          <!-- 字段选择 -->
          <div class="field-select">
            <el-select
              v-model="condition.field"
              placeholder="选择字段"
              @change="onFieldChange(condition)"
              size="small"
            >
              <el-option
                v-for="field in searchFields"
                :key="field.key"
                :label="field.label"
                :value="field.key"
              />
            </el-select>
          </div>

          <!-- 操作符选择 -->
          <div class="operator-select">
            <el-select
              v-model="condition.operator"
              placeholder="操作符"
              size="small"
            >
              <el-option
                v-for="op in getFieldOperators(condition.field)"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
          </div>

          <!-- 值输入 -->
          <div class="value-input">
            <!-- 文本输入 -->
            <el-input
              v-if="getFieldType(condition.field) === 'text'"
              v-model="condition.value"
              :placeholder="getFieldPlaceholder(condition.field)"
              size="small"
              clearable
            />

            <!-- 数字输入 -->
            <el-input-number
              v-else-if="getFieldType(condition.field) === 'number'"
              v-model="condition.value"
              size="small"
              style="width: 100%"
            />

            <!-- 日期输入 -->
            <el-date-picker
              v-else-if="getFieldType(condition.field) === 'date'"
              v-model="condition.value"
              type="date"
              placeholder="选择日期"
              size="small"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />

            <!-- 选择器 -->
            <el-select
              v-else-if="getFieldType(condition.field) === 'select'"
              v-model="condition.value"
              placeholder="请选择"
              size="small"
              :multiple="
                condition.operator === 'in' || condition.operator === 'notIn'
              "
              collapse-tags
              style="width: 100%"
            >
              <el-option
                v-for="option in getFieldOptions(condition.field)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <!-- 第二个值输入（用于between操作） -->
          <div class="value2-input" v-if="condition.operator === 'between'">
            <span class="between-label">到</span>
            <el-date-picker
              v-if="getFieldType(condition.field) === 'date'"
              v-model="condition.value2"
              type="date"
              placeholder="结束日期"
              size="small"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-input-number
              v-else-if="getFieldType(condition.field) === 'number'"
              v-model="condition.value2"
              size="small"
              style="width: 100%"
            />
            <el-input
              v-else
              v-model="condition.value2"
              size="small"
              style="width: 100%"
            />
          </div>

          <!-- 删除按钮 -->
          <div class="condition-actions">
            <el-button
              size="small"
              type="danger"
              @click="removeCondition(index)"
              :icon="Delete"
              circle
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="conditions.length === 0" class="empty-conditions">
        <el-empty description="暂无搜索条件">
          <el-button type="primary" @click="addCondition"
            >添加搜索条件</el-button
          >
        </el-empty>
      </div>

      <!-- 保存搜索 -->
      <div class="search-actions" v-if="conditions.length > 0">
        <el-divider />
        <div class="save-search">
          <el-input
            v-model="saveSearchName"
            placeholder="输入搜索名称以保存此搜索条件"
            size="small"
            style="width: 200px; margin-right: 12px"
          />
          <el-button
            size="small"
            type="success"
            @click="saveCurrentSearch"
            :disabled="!saveSearchName.trim()"
          >
            <el-icon><Star /></el-icon>
            保存搜索
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 保存的搜索 -->
    <el-card class="saved-searches" v-if="savedSearches.length > 0">
      <template #header>
        <h4>保存的搜索</h4>
      </template>
      <div class="saved-search-list">
        <div
          v-for="saved in savedSearches"
          :key="saved.id"
          class="saved-search-item"
        >
          <div class="saved-search-info">
            <h5>{{ saved.name }}</h5>
            <p>{{ saved.description || "无描述" }}</p>
            <div class="saved-search-meta">
              <el-tag size="small">{{ saved.conditions.length }}个条件</el-tag>
              <span class="use-count">使用 {{ saved.useCount }} 次</span>
              <span class="last-used" v-if="saved.lastUsed">
                最后使用: {{ formatDate(saved.lastUsed) }}
              </span>
            </div>
          </div>
          <div class="saved-search-actions">
            <el-button size="small" @click="useSavedSearch(saved.id!)">
              <el-icon><Search /></el-icon>
              使用
            </el-button>
            <el-button size="small" @click="editSavedSearch(saved)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteSavedSearch(saved.id!)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 搜索历史 -->
    <el-card class="search-history" v-if="recentHistory.length > 0">
      <template #header>
        <div class="card-header">
          <h4>搜索历史</h4>
          <el-button size="small" @click="clearHistory">
            <el-icon><Delete /></el-icon>
            清空历史
          </el-button>
        </div>
      </template>
      <div class="history-list">
        <div
          v-for="history in recentHistory"
          :key="history.id"
          class="history-item"
          @click="useHistorySearch(history)"
        >
          <div class="history-content">
            <div class="history-query">{{ history.query }}</div>
            <div class="history-meta">
              <span class="result-count">{{ history.resultCount }}个结果</span>
              <span class="search-time">{{
                formatDate(history.timestamp)
              }}</span>
            </div>
          </div>
          <el-button
            size="small"
            @click.stop="deleteHistory(history.id)"
            :icon="Delete"
            circle
          />
        </div>
      </div>
    </el-card>

    <!-- 编辑保存的搜索对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑保存的搜索" width="400px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editingSearch.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editingSearch.description"
            type="textarea"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateSavedSearch">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useSearchStore } from "@/stores/search";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Delete, Search, Star, Edit } from "@element-plus/icons-vue";
import type { SearchCondition, AdvancedSearchParams } from "@/types/search";

// Props
interface Props {
  modelValue?: boolean;
  initialConditions?: SearchCondition[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: true,
  initialConditions: () => [],
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  search: [conditions: SearchCondition[]];
}>();

// Store
const searchStore = useSearchStore();

// 响应式数据
const showBuilder = ref(props.modelValue);
const conditions = ref<SearchCondition[]>([]);
const saveSearchName = ref("");
const showEditDialog = ref(false);
const editingSearch = ref<Partial<AdvancedSearchParams>>({});

// 计算属性
const searchFields = computed(() => searchStore.searchFields);
const savedSearches = computed(() => searchStore.savedSearches);
const recentHistory = computed(() => searchStore.recentSearchHistory);

// 操作符映射
const operatorLabels: Record<string, string> = {
  eq: "等于",
  ne: "不等于",
  contains: "包含",
  startsWith: "开始于",
  endsWith: "结束于",
  gt: "大于",
  gte: "大于等于",
  lt: "小于",
  lte: "小于等于",
  between: "介于",
  in: "包含于",
  notIn: "不包含于",
};

// 监听显示状态
watch(
  () => props.modelValue,
  (newVal) => {
    showBuilder.value = newVal;
  }
);

watch(showBuilder, (newVal) => {
  emit("update:modelValue", newVal);
});

// 方法
const addCondition = () => {
  conditions.value.push({
    field: "",
    operator: "eq",
    value: "",
    logic: conditions.value.length > 0 ? "and" : undefined,
  });
};

const removeCondition = (index: number) => {
  conditions.value.splice(index, 1);
};

const clearConditions = () => {
  conditions.value = [];
  saveSearchName.value = "";
};

const onFieldChange = (condition: SearchCondition) => {
  // 重置操作符和值
  const field = searchFields.value.find((f) => f.key === condition.field);
  if (field && field.operators.length > 0) {
    condition.operator = field.operators[0] as any;
  }
  condition.value = "";
  condition.value2 = undefined;
};

const getFieldType = (fieldKey: string) => {
  const field = searchFields.value.find((f) => f.key === fieldKey);
  return field?.type || "text";
};

const getFieldPlaceholder = (fieldKey: string) => {
  const field = searchFields.value.find((f) => f.key === fieldKey);
  return field?.placeholder || "请输入";
};

const getFieldOptions = (fieldKey: string) => {
  const field = searchFields.value.find((f) => f.key === fieldKey);
  return field?.options || [];
};

const getFieldOperators = (fieldKey: string) => {
  const field = searchFields.value.find((f) => f.key === fieldKey);
  if (!field) return [];

  return field.operators.map((op) => ({
    label: operatorLabels[op] || op,
    value: op,
  }));
};

const executeSearch = () => {
  const validConditions = conditions.value.filter(
    (c) => c.field && c.operator && c.value !== "" && c.value != null
  );

  if (validConditions.length === 0) {
    ElMessage.warning("请至少添加一个有效的搜索条件");
    return;
  }

  emit("search", validConditions);
  ElMessage.success(`执行搜索，共 ${validConditions.length} 个条件`);
};

const saveCurrentSearch = () => {
  if (!saveSearchName.value.trim()) {
    ElMessage.warning("请输入搜索名称");
    return;
  }

  const validConditions = conditions.value.filter(
    (c) => c.field && c.operator && c.value !== "" && c.value != null
  );

  if (validConditions.length === 0) {
    ElMessage.warning("没有有效的搜索条件可保存");
    return;
  }

  searchStore.saveSearchConditions({
    name: saveSearchName.value.trim(),
    description: `包含 ${validConditions.length} 个搜索条件`,
    conditions: validConditions,
  });

  ElMessage.success("搜索条件已保存");
  saveSearchName.value = "";
};

const useSavedSearch = (searchId: string) => {
  const search = searchStore.useSavedSearch(searchId);
  if (search) {
    conditions.value = [...search.conditions];
    executeSearch();
    ElMessage.success(`已加载搜索: ${search.name}`);
  }
};

const editSavedSearch = (search: AdvancedSearchParams) => {
  editingSearch.value = { ...search };
  showEditDialog.value = true;
};

const updateSavedSearch = () => {
  if (editingSearch.value.id) {
    searchStore.updateSavedSearch(editingSearch.value.id, {
      name: editingSearch.value.name,
      description: editingSearch.value.description,
    });
    ElMessage.success("保存的搜索已更新");
  }
  showEditDialog.value = false;
};

const deleteSavedSearch = async (searchId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个保存的搜索吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    searchStore.deleteSavedSearch(searchId);
    ElMessage.success("已删除保存的搜索");
  } catch {
    // 用户取消
  }
};

const useHistorySearch = (history: any) => {
  if (history.conditions && history.conditions.length > 0) {
    conditions.value = [...history.conditions];
  } else {
    // 如果只有查询字符串，创建一个简单的标题搜索条件
    conditions.value = [
      {
        field: "title",
        operator: "contains",
        value: history.query,
      },
    ];
  }
  executeSearch();
};

const deleteHistory = (historyId: string) => {
  searchStore.deleteSearchHistory(historyId);
  ElMessage.success("已删除搜索历史");
};

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有搜索历史吗？", "确认清空", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    searchStore.clearSearchHistory();
    ElMessage.success("已清空搜索历史");
  } catch {
    // 用户取消
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 初始化
onMounted(() => {
  // 更新分类选项

  // 如果有初始条件，加载它们
  if (props.initialConditions.length > 0) {
    conditions.value = [...props.initialConditions];
  }
});
</script>

<style scoped>
.advanced-search {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3,
.card-header h4 {
  margin: 0;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.logic-operator {
  min-width: 80px;
}

.field-select {
  min-width: 120px;
}

.operator-select {
  min-width: 100px;
}

.value-input,
.value2-input {
  min-width: 150px;
  flex: 1;
}

.between-label {
  margin: 0 8px;
  color: #606266;
  font-size: 14px;
}

.condition-actions {
  display: flex;
  gap: 4px;
}

.empty-conditions {
  padding: 40px;
  text-align: center;
}

.search-actions {
  margin-top: 16px;
}

.save-search {
  display: flex;
  align-items: center;
  justify-content: center;
}

.saved-searches,
.search-history {
  margin-top: 20px;
}

.saved-search-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.saved-search-item,
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.saved-search-item:hover,
.history-item:hover {
  background: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.saved-search-info,
.history-content {
  flex: 1;
}

.saved-search-info h5 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.saved-search-info p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.saved-search-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.saved-search-actions {
  display: flex;
  gap: 8px;
}

.history-item {
  cursor: pointer;
}

.history-query {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .condition-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .logic-operator,
  .field-select,
  .operator-select,
  .value-input,
  .value2-input {
    min-width: auto;
  }

  .saved-search-item,
  .history-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .saved-search-actions {
    justify-content: center;
  }
}
</style>
