<template>
  <div class="fee-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="选择专利" prop="patentId">
        <el-select
          v-model="form.patentId"
          placeholder="请选择专利"
          style="width: 100%"
          filterable
          clearable
          @change="handlePatentChange"
          :loading="patentStore.loading"
        >
          <el-option
            v-for="patent in patentList"
            :key="patent.id"
            :label="`${patent.patentNumber} - ${patent.title}`"
            :value="patent.id"
          >
            <div class="patent-option">
              <div class="patent-number">{{ patent.patentNumber }}</div>
              <div class="patent-title">{{ patent.title }}</div>
            </div>
          </el-option>
        </el-select>
        <div class="form-tip">
          从专利列表中选择要添加费用的专利
          <span v-if="patentList.length === 0" style="color: #f56c6c">
            (正在加载专利列表...)
          </span>
        </div>
      </el-form-item>

      <el-form-item label="费用类型" prop="feeType">
        <el-select
          v-model="form.feeType"
          placeholder="选择费用类型"
          style="width: 100%"
        >
          <el-option label="申请费" value="application" />
          <el-option label="审查费" value="examination" />
          <el-option label="年费" value="maintenance" />
          <el-option label="续展费" value="renewal" />
          <el-option label="优先权费" value="priority" />
          <el-option label="延期费" value="extension" />
          <el-option label="更正费" value="correction" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0"
          :precision="2"
          :step="100"
          style="width: 100%"
          placeholder="输入金额"
        />
      </el-form-item>

      <el-form-item label="货币" prop="currency">
        <el-select
          v-model="form.currency"
          placeholder="选择货币"
          style="width: 100%"
        >
          <el-option label="人民币 (CNY)" value="CNY" />
          <el-option label="美元 (USD)" value="USD" />
          <el-option label="欧元 (EUR)" value="EUR" />
          <el-option label="日元 (JPY)" value="JPY" />
        </el-select>
      </el-form-item>

      <el-form-item label="到期日期" prop="dueDate">
        <el-date-picker
          v-model="form.dueDate"
          type="date"
          placeholder="选择到期日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="输入费用描述"
        />
      </el-form-item>

      <el-form-item label="费用凭证">
        <AdvancedFileUpload
          v-model="voucherFiles"
          :multiple="true"
          :accept="'.pdf,.jpg,.jpeg,.png,.doc,.docx'"
          :max-file-size="10"
          :auto-upload="false"
          hint="上传费用凭证文件（发票、收据等）"
          @file-uploaded="handleVoucherUploaded"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          保存
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { FeeType } from "@/types/fee";
import { usePatentStore } from "@/stores/patent";
import { ElMessage } from "element-plus";
import AdvancedFileUpload from "@/components/AdvancedFileUpload.vue";

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits<{
  submit: [data: any];
  cancel: [];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

// 专利store
const patentStore = usePatentStore();
const patentList = computed(() => patentStore.patents || []);

const form = reactive({
  patentId: undefined as number | undefined,
  feeType: "" as FeeType,
  amount: 0,
  currency: "CNY",
  dueDate: "",
  description: "",
});

// 费用凭证文件
const voucherFiles = ref<any[]>([]);

// 如果有初始数据，填充表单
if (props.initialData) {
  Object.assign(form, props.initialData);
}

// 加载专利列表
onMounted(async () => {
  try {
    console.log("开始加载专利列表...");
    console.log("patentStore.patents 初始值:", patentStore.patents);

    await patentStore.fetchPatents();
    console.log("fetchPatents 完成");
    console.log("patentStore.patents 更新后:", patentStore.patents);
    console.log("patentList 计算属性值:", patentList.value);
    console.log("专利列表长度:", patentList.value.length);

    // 检查每个专利的详细信息
    if (patentList.value.length > 0) {
      console.log("第一个专利详情:", patentList.value[0]);
      console.log("第一个专利ID类型:", typeof patentList.value[0].id);
    }
  } catch (error) {
    console.error("加载专利列表失败:", error);
    ElMessage.error("加载专利列表失败");
  }
});

// 处理专利选择变化
const handlePatentChange = (patentId: number) => {
  console.log("专利选择变化，patentId:", patentId);
  const selectedPatent = patentList.value.find((p) => p.id === patentId);
  if (selectedPatent) {
    console.log("选择的专利:", selectedPatent);
    // 可以在这里预填充一些字段，比如专利标题等
  } else {
    console.warn("未找到选中的专利，patentId:", patentId);
  }
};

// 处理费用凭证上传
const handleVoucherUploaded = (file: any) => {
  console.log("费用凭证上传完成:", file);
};

const rules: FormRules = {
  patentId: [{ required: true, message: "请选择专利", trigger: "change" }],
  feeType: [{ required: true, message: "请选择费用类型", trigger: "change" }],
  amount: [
    { required: true, message: "请输入金额", trigger: "blur" },
    { type: "number", min: 0, message: "金额必须大于0", trigger: "blur" },
  ],
  currency: [{ required: true, message: "请选择货币", trigger: "change" }],
  dueDate: [{ required: true, message: "请选择到期日期", trigger: "change" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    // 验证必需字段
    if (!form.patentId || form.patentId <= 0) {
      ElMessage.error("请选择专利");
      return;
    }

    if (!form.feeType) {
      ElMessage.error("请选择费用类型");
      return;
    }

    if (!form.amount || form.amount <= 0) {
      ElMessage.error("请输入有效的金额");
      return;
    }

    if (!form.dueDate) {
      ElMessage.error("请选择到期日期");
      return;
    }

    // 准备发送给后端的数据
    const submitData = {
      patentId: form.patentId,
      feeType: form.feeType,
      type: form.feeType, // 兼容后端字段名
      amount: form.amount,
      currency: form.currency,
      dueDate: form.dueDate,
      description: form.description || "",
      notes: "", // 添加notes字段
      vouchers: voucherFiles.value, // 包含费用凭证文件
    };

    console.log("发送的费用数据:", submitData);
    emit("submit", submitData);

    // 重置凭证文件
    voucherFiles.value = [];
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  voucherFiles.value = [];
  emit("cancel");
};
</script>

<style scoped>
.fee-form {
  padding: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.patent-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.patent-number {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.patent-title {
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
}
</style>
