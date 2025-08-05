<template>
  <div class="search-suggestions">
    <!-- 搜索建议下拉框 -->
    <el-popover
      v-model:visible="showSuggestions"
      placement="bottom-start"
      :width="popoverWidth"
      trigger="manual"
      popper-class="search-suggestions-popover"
    >
      <template #reference>
        <div class="search-input-wrapper">
          <el-input
            v-model="query"
            :placeholder="placeholder"
            :size="size"
            clearable
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
            @keydown="onKeydown"
            @clear="onClear"
            ref="inputRef"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #suffix v-if="loading">
              <el-icon class="is-loading"><Loading /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <div class="suggestions-content" v-if="showSuggestions">
        <!-- 搜索建议 -->
        <div class="suggestions-section" v-if="filteredSuggestions.length > 0">
          <div class="section-title">搜索建议</div>
          <div
            v-for="(suggestion, index) in filteredSuggestions"
            :key="suggestion.id"
            class="suggestion-item"
            :class="{ active: selectedIndex === index }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <el-icon class="suggestion-icon">
              <component :is="getSuggestionIcon(suggestion.type)" />
            </el-icon>
            <div class="suggestion-content">
              <div class="suggestion-text">{{ suggestion.text }}</div>
              <div class="suggestion-type">
                {{ getSuggestionTypeText(suggestion.type) }}
              </div>
            </div>
            <div class="suggestion-frequency">{{ suggestion.frequency }}</div>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div
          class="history-section"
          v-if="showHistory && recentHistory.length > 0"
        >
          <div class="section-title">最近搜索</div>
          <div
            v-for="(history, index) in recentHistory.slice(0, 5)"
            :key="history.id"
            class="history-item"
            :class="{
              active: selectedIndex === filteredSuggestions.length + index,
            }"
            @click="selectHistory(history)"
            @mouseenter="selectedIndex = filteredSuggestions.length + index"
          >
            <el-icon class="history-icon"><Clock /></el-icon>
            <div class="history-content">
              <div class="history-query">{{ history.query }}</div>
              <div class="history-meta">{{ history.resultCount }}个结果</div>
            </div>
          </div>
        </div>

        <!-- 热门搜索 -->
        <div
          class="popular-section"
          v-if="showPopular && popularKeywords.length > 0"
        >
          <div class="section-title">热门搜索</div>
          <div class="popular-keywords">
            <el-tag
              v-for="keyword in popularKeywords.slice(0, 10)"
              :key="keyword.keyword"
              class="popular-tag"
              @click="selectKeyword(keyword.keyword)"
              size="small"
            >
              {{ keyword.keyword }}
              <span class="keyword-count">({{ keyword.count }})</span>
            </el-tag>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          class="empty-suggestions"
          v-if="query && filteredSuggestions.length === 0"
        >
          <el-icon><Search /></el-icon>
          <div>未找到相关建议</div>
          <el-button size="small" type="primary" @click="searchCurrent">
            搜索 "{{ query }}"
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useSearchStore } from "@/stores/search";
import { debounce } from "@/utils/performance";
import {
  Search,
  Loading,
  Clock,
  Document,
  User,
  Folder,

} from "@element-plus/icons-vue";
import type { SearchSuggestion, SearchHistory } from "@/types/search";

// Props
interface Props {
  modelValue?: string;
  placeholder?: string;
  size?: "large" | "default" | "small";
  showHistory?: boolean;
  showPopular?: boolean;
  maxSuggestions?: number;
  debounceDelay?: number;
  popoverWidth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "请输入搜索关键词...",
  size: "default",
  showHistory: true,
  showPopular: true,
  maxSuggestions: 8,
  debounceDelay: 300,
  popoverWidth: 400,
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [query: string];
  "suggestion-select": [suggestion: SearchSuggestion];
  "history-select": [history: SearchHistory];
}>();

// Store
const searchStore = useSearchStore();

// 响应式数据
const query = ref(props.modelValue);
const showSuggestions = ref(false);
const selectedIndex = ref(-1);
const loading = ref(false);
const inputRef = ref();

// 计算属性
const filteredSuggestions = computed(() => {
  if (!query.value || query.value.length < 2) return [];

  return searchStore.getSearchSuggestions(query.value, props.maxSuggestions);
});

const recentHistory = computed(() => searchStore.recentSearchHistory);
const popularKeywords = computed(() => searchStore.popularKeywords);

const totalSuggestionCount = computed(() => {
  let count = filteredSuggestions.value.length;
  if (props.showHistory) count += Math.min(recentHistory.value.length, 5);
  return count;
});

// 建议类型图标映射
const suggestionIconMap: Record<string, any> = {
  keyword: Search,
  patentNumber: Document,
  inventor: User,
  applicant: User,
  category: Folder,
};

// 监听输入值变化
watch(
  () => props.modelValue,
  (newVal) => {
    query.value = newVal;
  }
);

watch(query, (newVal) => {
  emit("update:modelValue", newVal);
  debouncedSearch();
});

// 防抖搜索
const debouncedSearch = debounce(() => {
  if (query.value && query.value.length >= 2) {
    loading.value = true;
    // 模拟异步搜索
    setTimeout(() => {
      loading.value = false;
    }, 200);
  }
}, props.debounceDelay);

// 方法
const onInput = () => {
  showSuggestions.value = query.value.length >= 2;
  selectedIndex.value = -1;
};

const onFocus = () => {
  if (query.value.length >= 2 || props.showHistory || props.showPopular) {
    showSuggestions.value = true;
  }
};

const onBlur = () => {
  // 延迟关闭，以便点击建议项
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const onKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      selectedIndex.value = Math.min(
        selectedIndex.value + 1,
        totalSuggestionCount.value - 1
      );
      break;
    case "ArrowUp":
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case "Enter":
      event.preventDefault();
      if (selectedIndex.value >= 0) {
        selectByIndex(selectedIndex.value);
      } else {
        searchCurrent();
      }
      break;
    case "Escape":
      showSuggestions.value = false;
      selectedIndex.value = -1;
      break;
  }
};

const onClear = () => {
  showSuggestions.value = false;
  selectedIndex.value = -1;
};

const selectByIndex = (index: number) => {
  if (index < filteredSuggestions.value.length) {
    selectSuggestion(filteredSuggestions.value[index]);
  } else {
    const historyIndex = index - filteredSuggestions.value.length;
    if (historyIndex < recentHistory.value.length) {
      selectHistory(recentHistory.value[historyIndex]);
    }
  }
};

const selectSuggestion = (suggestion: SearchSuggestion) => {
  query.value = suggestion.text;
  showSuggestions.value = false;
  selectedIndex.value = -1;

  emit("suggestion-select", suggestion);
  emit("search", suggestion.text);

  // 更新建议频率
  searchStore.updateSearchSuggestions(suggestion.text);
};

const selectHistory = (history: SearchHistory) => {
  query.value = history.query;
  showSuggestions.value = false;
  selectedIndex.value = -1;

  emit("history-select", history);
  emit("search", history.query);
};

const selectKeyword = (keyword: string) => {
  query.value = keyword;
  showSuggestions.value = false;
  selectedIndex.value = -1;

  emit("search", keyword);
};

const searchCurrent = () => {
  if (query.value.trim()) {
    showSuggestions.value = false;
    selectedIndex.value = -1;
    emit("search", query.value.trim());
  }
};

const getSuggestionIcon = (type: string) => {
  return suggestionIconMap[type] || Search;
};

const getSuggestionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    keyword: "关键词",
    patentNumber: "专利号",
    inventor: "发明人",
    applicant: "申请人",
    category: "分类",
  };
  return typeMap[type] || "其他";
};

// 公开方法
const focus = () => {
  inputRef.value?.focus();
};

const blur = () => {
  inputRef.value?.blur();
};

const clear = () => {
  query.value = "";
  onClear();
};

defineExpose({
  focus,
  blur,
  clear,
});
</script>

<style scoped>
.search-suggestions {
  width: 100%;
}

.search-input-wrapper {
  width: 100%;
}

.suggestions-content {
  max-height: 400px;
  overflow-y: auto;
}

.suggestions-section,
.history-section,
.popular-section {
  margin-bottom: 16px;
}

.suggestions-section:last-child,
.history-section:last-child,
.popular-section:last-child {
  margin-bottom: 0;
}

.section-title {
  padding: 8px 12px;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}

.suggestion-item,
.history-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover,
.history-item:hover,
.suggestion-item.active,
.history-item.active {
  background-color: #f5f7fa;
}

.suggestion-icon,
.history-icon {
  margin-right: 12px;
  color: #409eff;
  font-size: 16px;
}

.suggestion-content,
.history-content {
  flex: 1;
  min-width: 0;
}

.suggestion-text,
.history-query {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-type,
.history-meta {
  font-size: 12px;
  color: #909399;
}

.suggestion-frequency {
  font-size: 12px;
  color: #c0c4cc;
  margin-left: 8px;
}

.popular-keywords {
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.popular-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.popular-tag:hover {
  background-color: #409eff;
  color: white;
}

.keyword-count {
  margin-left: 4px;
  opacity: 0.7;
}

.empty-suggestions {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.empty-suggestions .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<style>
.search-suggestions-popover {
  padding: 0 !important;
}
</style>
