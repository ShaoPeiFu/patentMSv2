<template>
  <div class="test-patent-edit">
    <h1>专利编辑功能测试</h1>

    <div class="test-section">
      <h2>测试更新专利</h2>
      <el-button @click="testUpdatePatent">测试更新第一个专利</el-button>
      <el-button @click="testValidation">测试验证逻辑</el-button>
      <el-button @click="showPatents">显示所有专利</el-button>
    </div>

    <div class="results-section">
      <h2>测试结果</h2>
      <div
        class="result-item"
        v-for="(result, index) in testResults"
        :key="index"
      >
        <strong>{{ result.title }}</strong>
        <pre>{{ result.content }}</pre>
      </div>
    </div>

    <div class="patents-section" v-if="patents.length > 0">
      <h2>当前专利列表</h2>
      <div class="patent-item" v-for="patent in patents" :key="patent.id">
        <div><strong>ID:</strong> {{ patent.id }}</div>
        <div><strong>标题:</strong> {{ patent.title }}</div>
        <div><strong>专利号:</strong> {{ patent.patentNumber }}</div>
        <div>
          <strong>申请人:</strong> {{ patent.applicants?.join(", ") || "无" }}
        </div>
        <div>
          <strong>发明人:</strong> {{ patent.inventors?.join(", ") || "无" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePatentStore } from "@/stores/patent";
import { ElMessage } from "element-plus";

const patentStore = usePatentStore();
const testResults = ref<Array<{ title: string; content: string }>>([]);
const patents = ref<any[]>([]);

const addResult = (title: string, content: unknown) => {
  testResults.value.push({
    title,
    content:
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
  });
};

const testUpdatePatent = async () => {
  try {
    // 获取第一个专利
    await patentStore.fetchPatents();
    const firstPatent = patentStore.patents[0];

    if (!firstPatent) {
      addResult("测试失败", "没有找到专利数据");
      return;
    }

    addResult("原始专利数据", firstPatent);

    // 尝试更新专利
    const updateData = {
      title: firstPatent.title + " (已更新)",
      description: firstPatent.description + " 这是更新后的描述。",
      patentNumber: firstPatent.patentNumber, // 使用相同的专利号
      applicationNumber: firstPatent.applicationNumber,
      applicationDate: firstPatent.applicationDate,
      type: firstPatent.type,
      status: firstPatent.status,
      categoryId: firstPatent.categoryId,
      applicants: firstPatent.applicants || ["新浪科技有限公司"],
      inventors: firstPatent.inventors || ["系统管理员"],
      technicalField: firstPatent.technicalField,
      keywords: firstPatent.keywords,
      abstract: firstPatent.abstract,
      claims: firstPatent.claims,
      documents: firstPatent.documents,
      fees: firstPatent.fees,
      timeline: firstPatent.timeline,
      legalStatus: firstPatent.legalStatus,
    };

    addResult("更新数据", updateData);

    const result = await patentStore.updatePatent(firstPatent.id, updateData);

    addResult("更新成功", result);
    ElMessage.success("专利更新测试成功");

    // 刷新专利列表
    showPatents();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addResult("更新失败", errorMessage);
    ElMessage.error("专利更新测试失败: " + errorMessage);
  }
};

const testValidation = async () => {
  try {
    // 测试验证逻辑
    const testData = {
      id: 999, // 测试用ID
      title: "测试专利",
      patentNumber: "TEST123456",
      applicationDate: "2024-01-01",
      type: "invention",
      status: "pending",
      applicants: [],
      inventors: [],
    };

    addResult("测试验证数据", testData);

    // 这里我们不能直接调用validatePatent，因为它是内部方法
    // 但我们可以尝试添加一个专利来触发验证
    await patentStore.addPatent(testData as any);

    addResult("验证测试", "验证通过，专利添加成功");
    ElMessage.success("验证测试成功");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addResult("验证测试失败", errorMessage);
    ElMessage.error("验证测试失败: " + errorMessage);
  }
};

const showPatents = async () => {
  try {
    await patentStore.fetchPatents();
    patents.value = patentStore.patents;
    addResult("专利列表", `共 ${patents.value.length} 个专利`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addResult("获取专利列表失败", errorMessage);
  }
};

onMounted(() => {
  showPatents();
});
</script>

<style scoped>
.test-patent-edit {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.test-section h2 {
  margin-bottom: 15px;
}

.test-section .el-button {
  margin-right: 10px;
}

.results-section {
  margin-bottom: 30px;
}

.result-item {
  margin-bottom: 15px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.result-item strong {
  display: block;
  margin-bottom: 10px;
  color: #2c3e50;
}

.result-item pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.patents-section {
  margin-bottom: 30px;
}

.patent-item {
  margin-bottom: 15px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.patent-item div {
  margin-bottom: 5px;
}
</style>
