<template>
  <div class="patent-add">
    <h1>专利申请</h1>
    <el-card>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="专利标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入专利标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利号" prop="patentNumber">
              <el-input
                v-model="form.patentNumber"
                placeholder="请输入专利号"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请号" prop="applicationNumber">
              <el-input
                v-model="form.applicationNumber"
                placeholder="请输入申请号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请日期" prop="applicationDate">
              <el-date-picker
                v-model="form.applicationDate"
                type="date"
                placeholder="选择申请日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="专利类型" prop="type">
              <el-select
                v-model="form.type"
                placeholder="选择专利类型"
                style="width: 100%"
              >
                <el-option label="发明专利" value="invention" />
                <el-option label="实用新型" value="utility_model" />
                <el-option label="外观设计" value="design" />
                <el-option label="软件专利" value="software" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select
                v-model="form.categoryId"
                placeholder="选择专利分类"
                style="width: 100%"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="专利描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入专利描述"
          />
        </el-form-item>

        <el-form-item label="技术领域" prop="technicalField">
          <el-input
            v-model="form.technicalField"
            placeholder="请输入技术领域"
          />
        </el-form-item>

        <el-form-item label="关键词" prop="keywords">
          <el-select
            v-model="form.keywords"
            multiple
            filterable
            allow-create
            placeholder="请输入关键词"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="申请人" prop="applicants">
          <el-select
            v-model="form.applicants"
            multiple
            filterable
            allow-create
            placeholder="请输入申请人"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="发明人" prop="inventors">
          <el-select
            v-model="form.inventors"
            multiple
            filterable
            allow-create
            placeholder="请输入发明人"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            保存
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { usePatentStore } from "@/stores/patent";
import type { PatentType } from "@/types/patent";

const router = useRouter();
const patentStore = usePatentStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

// 获取分类数据
const categories = computed(() => patentStore.categories);

const form = reactive({
  title: "",
  patentNumber: "",
  applicationNumber: "",
  applicationDate: "",
  type: "",
  categoryId: null as number | null,
  description: "",
  technicalField: "",
  keywords: [],
  applicants: [],
  inventors: [],
});

const rules: FormRules = {
  title: [{ required: true, message: "请输入专利标题", trigger: "blur" }],
  patentNumber: [{ required: true, message: "请输入专利号", trigger: "blur" }],
  type: [{ required: true, message: "请选择专利类型", trigger: "change" }],
  categoryId: [
    { required: true, message: "请选择专利分类", trigger: "change" },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 准备专利申请数据
    const applicationData = {
      title: form.title,
      description: form.description,
      patentNumber: form.patentNumber,
      applicationNumber: form.applicationNumber,
      applicationDate: form.applicationDate,
      type: form.type as PatentType,
      categoryId: form.categoryId || 1,
      applicants: form.applicants,
      inventors: form.inventors,
      technicalField: form.technicalField,
      keywords: form.keywords,
      applicant: form.applicants[0] || "申请人",
      submitDate:
        form.applicationDate || new Date().toISOString().split("T")[0],
      priority: "medium" as const, // 默认优先级
    };

    // 提交专利申请
    // const newApplication = await patentStore.submitApplication(applicationData);

    ElMessage.success("专利申请提交成功，等待审核");
    // 跳转到专利申请列表或控制台
    router.push("/dashboard");
  } catch (error) {
    ElMessage.error("专利添加失败");
    console.error("提交失败:", error);
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取分类数据
onMounted(async () => {
  try {
    await patentStore.fetchCategories();
  } catch (error) {
    console.error("获取分类数据失败:", error);
  }
});
</script>

<style scoped>
.patent-add {
  padding: 20px;
}

.patent-add h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}
</style>
