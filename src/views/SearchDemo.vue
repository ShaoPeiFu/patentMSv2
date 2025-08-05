<template>
  <div class="search-demo">
    <div class="page-header">
      <h1>高级搜索功能演示</h1>
      <p>体验智能搜索建议、多条件组合搜索、搜索历史记录等功能</p>
    </div>

    <!-- 功能介绍 -->
    <el-card class="feature-intro">
      <template #header>
        <h2>✨ 新功能亮点</h2>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><Search /></el-icon>
            <h3>智能搜索建议</h3>
            <p>输入时自动提供相关搜索建议，支持关键词、专利号、发明人等类型</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><Tools /></el-icon>
            <h3>多条件组合搜索</h3>
            <p>支持多个搜索条件的AND/OR逻辑组合，精确筛选目标数据</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><Star /></el-icon>
            <h3>搜索条件保存</h3>
            <p>可以保存常用搜索条件，一键重复使用，提高工作效率</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="feature-item">
            <el-icon class="feature-icon"><Clock /></el-icon>
            <h3>搜索历史记录</h3>
            <p>自动记录搜索历史，快速回到之前的搜索结果</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 演示区域 -->
    <el-card class="demo-area">
      <template #header>
        <h2>🔍 搜索功能演示</h2>
      </template>

      <!-- 智能搜索演示 -->
      <div class="demo-section">
        <h3>1. 智能搜索建议</h3>
        <p>在下方输入框中输入"专利"、"发明"等关键词，体验智能搜索建议：</p>
        <SearchSuggestions
          v-model="demoQuery1"
          placeholder="试试输入一些关键词..."
          @search="handleDemoSearch"
          style="max-width: 400px"
        />
        <div class="demo-result" v-if="demoResult1">
          <el-tag type="success">搜索: {{ demoResult1 }}</el-tag>
        </div>
      </div>

      <!-- 高级搜索演示 -->
      <div class="demo-section">
        <h3>2. 高级搜索条件</h3>
        <p>点击下方按钮体验多条件组合搜索：</p>
        <el-button type="primary" @click="showAdvancedDemo = true">
          <el-icon><Tools /></el-icon>
          打开高级搜索
        </el-button>

        <div v-if="showAdvancedDemo" style="margin-top: 16px">
          <AdvancedSearch
            v-model="showAdvancedDemo"
            @search="handleAdvancedDemoSearch"
          />
        </div>

        <div class="demo-result" v-if="demoResult2">
          <el-tag type="warning">高级搜索条件数: {{ demoResult2 }}</el-tag>
        </div>
      </div>
    </el-card>

    <!-- 搜索统计 -->
    <el-card class="search-stats">
      <template #header>
        <h2>📊 搜索统计</h2>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-number">
              {{ searchStore.searchHistory.length }}
            </div>
            <div class="stat-label">搜索历史</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-number">
              {{ searchStore.savedSearches.length }}
            </div>
            <div class="stat-label">保存的搜索</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-number">
              {{ searchStore.popularKeywords.length }}
            </div>
            <div class="stat-label">热门关键词</div>
          </div>
        </el-col>
      </el-row>

      <!-- 热门关键词 -->
      <div
        class="popular-keywords"
        v-if="searchStore.popularKeywords.length > 0"
      >
        <h4>🔥 热门搜索关键词：</h4>
        <el-tag
          v-for="keyword in searchStore.popularKeywords.slice(0, 10)"
          :key="keyword.keyword"
          class="keyword-tag"
          size="small"
        >
          {{ keyword.keyword }} ({{ keyword.count }})
        </el-tag>
      </div>
    </el-card>

    <!-- 使用指南 -->
    <el-card class="usage-guide">
      <template #header>
        <h2>📖 使用指南</h2>
      </template>

      <el-collapse v-model="activeGuide">
        <el-collapse-item title="智能搜索建议" name="1">
          <div class="guide-content">
            <h4>功能说明：</h4>
            <ul>
              <li>输入2个字符以上时自动显示搜索建议</li>
              <li>支持关键词、专利号、发明人、申请人、分类等类型建议</li>
              <li>使用键盘上下箭头选择建议，回车确认搜索</li>
              <li>点击建议项直接搜索</li>
            </ul>

            <h4>使用技巧：</h4>
            <ul>
              <li>经常搜索的关键词会优先显示</li>
              <li>可以看到搜索历史记录</li>
              <li>热门搜索标签可以快速点击搜索</li>
            </ul>
          </div>
        </el-collapse-item>

        <el-collapse-item title="多条件组合搜索" name="2">
          <div class="guide-content">
            <h4>功能说明：</h4>
            <ul>
              <li>可以添加多个搜索条件</li>
              <li>支持AND（并且）、OR（或者）逻辑运算</li>
              <li>支持等于、不等于、包含、大于、小于、介于等操作符</li>
              <li>支持文本、数字、日期、下拉选择等字段类型</li>
            </ul>

            <h4>操作步骤：</h4>
            <ol>
              <li>点击"添加条件"按钮</li>
              <li>选择要搜索的字段</li>
              <li>选择操作符（如"包含"、"等于"等）</li>
              <li>输入搜索值</li>
              <li>重复添加更多条件</li>
              <li>点击"搜索"执行查询</li>
            </ol>
          </div>
        </el-collapse-item>

        <el-collapse-item title="搜索条件保存" name="3">
          <div class="guide-content">
            <h4>如何保存搜索：</h4>
            <ol>
              <li>设置好搜索条件后</li>
              <li>在保存区域输入搜索名称</li>
              <li>点击"保存搜索"按钮</li>
              <li>搜索条件会自动保存</li>
            </ol>

            <h4>如何使用保存的搜索：</h4>
            <ul>
              <li>在"保存的搜索"区域找到目标搜索</li>
              <li>点击"使用"按钮加载条件</li>
              <li>可以编辑或删除保存的搜索</li>
            </ul>
          </div>
        </el-collapse-item>

        <el-collapse-item title="搜索历史记录" name="4">
          <div class="guide-content">
            <h4>自动记录：</h4>
            <ul>
              <li>所有搜索操作都会自动记录</li>
              <li>记录搜索关键词、条件和结果数量</li>
              <li>最多保存100条历史记录</li>
            </ul>

            <h4>快速重用：</h4>
            <ul>
              <li>点击历史记录直接重新搜索</li>
              <li>支持简单搜索和复杂搜索条件</li>
              <li>可以单独删除某条历史记录</li>
              <li>可以一键清空所有历史</li>
            </ul>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 测试按钮 -->
    <el-card class="test-actions">
      <template #header>
        <h2>🧪 测试功能</h2>
      </template>
      <div class="action-buttons">
        <el-button @click="addTestData">添加测试搜索历史</el-button>
        <el-button @click="clearAllData" type="danger"
          >清空所有搜索数据</el-button
        >
        <el-button @click="exportData">导出搜索数据</el-button>
        <el-button @click="showImportDialog = true">导入搜索数据</el-button>
      </div>
    </el-card>

    <!-- 导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入搜索数据" width="500px">
      <el-input
        v-model="importData"
        type="textarea"
        rows="10"
        placeholder="请粘贴导出的JSON数据"
      />
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importSearchData">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSearchStore } from "@/stores/search";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Tools, Star, Clock } from "@element-plus/icons-vue";
import SearchSuggestions from "@/components/SearchSuggestions.vue";
import AdvancedSearch from "@/components/AdvancedSearch.vue";
import type { SearchCondition } from "@/types/search";

// Store
const searchStore = useSearchStore();

// 响应式数据
const demoQuery1 = ref("");
const demoResult1 = ref("");
const demoResult2 = ref(0);
const showAdvancedDemo = ref(false);
const activeGuide = ref(["1"]);
const showImportDialog = ref(false);
const importData = ref("");

// 方法
const handleDemoSearch = (query: string) => {
  demoResult1.value = query;
  ElMessage.success(`执行搜索: ${query}`);
};

const handleAdvancedDemoSearch = (conditions: SearchCondition[]) => {
  demoResult2.value = conditions.length;
  ElMessage.success(`高级搜索包含 ${conditions.length} 个条件`);
};

const addTestData = () => {
  const testQueries = [
    "发明专利",
    "实用新型",
    "外观设计",
    "软件专利",
    "人工智能",
    "区块链技术",
    "新能源汽车",
    "5G通信",
    "医疗器械",
    "生物制药",
  ];

  testQueries.forEach((query, _index) => {
    searchStore.addSearchHistory(query, Math.floor(Math.random() * 100) + 1);
  });

  ElMessage.success("已添加测试搜索历史");
};

const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有搜索数据吗？包括搜索历史、保存的搜索和搜索建议。",
      "确认清空",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    searchStore.clearSearchHistory();
    searchStore.savedSearches.splice(0);
    searchStore.searchSuggestions.splice(0);
    demoResult1.value = "";
    demoResult2.value = 0;

    ElMessage.success("已清空所有搜索数据");
  } catch {
    // 用户取消
  }
};

const exportData = () => {
  const data = searchStore.exportSearchHistory();

  // 创建下载链接
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `search-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("搜索数据已导出");
};

const importSearchData = () => {
  if (!importData.value.trim()) {
    ElMessage.warning("请输入要导入的数据");
    return;
  }

  const success = searchStore.importSearchHistory(importData.value);
  if (success) {
    ElMessage.success("搜索数据导入成功");
    showImportDialog.value = false;
    importData.value = "";
  } else {
    ElMessage.error("导入失败，请检查数据格式");
  }
};
</script>

<style scoped>
.search-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.feature-intro,
.demo-area,
.search-stats,
.usage-guide,
.test-actions {
  margin-bottom: 30px;
}

.feature-item {
  text-align: center;
  padding: 20px;
}

.feature-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
}

.feature-item h3 {
  margin: 12px 0 8px 0;
  color: #2c3e50;
}

.feature-item p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.demo-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.demo-section:last-child {
  border-bottom: none;
}

.demo-section h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.demo-section p {
  color: #666;
  margin-bottom: 16px;
}

.demo-result {
  margin-top: 12px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.popular-keywords {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.popular-keywords h4 {
  margin-bottom: 12px;
  color: #2c3e50;
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.guide-content {
  color: #606266;
}

.guide-content h4 {
  color: #2c3e50;
  margin: 16px 0 8px 0;
}

.guide-content ul,
.guide-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.guide-content li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-demo {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
