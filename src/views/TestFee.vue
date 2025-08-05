<template>
  <div class="test-fee">
    <h1>费用管理功能测试</h1>

    <div class="test-section">
      <h2>Store 测试</h2>
      <el-button @click="testStore">测试 Store</el-button>
      <p>状态: {{ storeStatus }}</p>
      <p>费用记录数量: {{ feeCount }}</p>
      <p>提醒数量: {{ reminderCount }}</p>
      <p>预算数量: {{ budgetCount }}</p>
    </div>

    <div class="test-section">
      <h2>统计信息</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <h3>总费用</h3>
          <p>{{ statistics.totalFees }}</p>
        </div>
        <div class="stat-item">
          <h3>已缴费</h3>
          <p>{{ statistics.paidFees }}</p>
        </div>
        <div class="stat-item">
          <h3>待缴费</h3>
          <p>{{ statistics.pendingFees }}</p>
        </div>
        <div class="stat-item">
          <h3>逾期费用</h3>
          <p>{{ statistics.overdueFees }}</p>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>添加测试数据</h2>
      <el-button @click="addTestFee">添加测试费用</el-button>
      <el-button @click="addTestBudget">添加测试预算</el-button>
      <el-button @click="addTestReconciliation">添加测试对账</el-button>
    </div>

    <div class="test-section">
      <h2>费用记录</h2>
      <el-table :data="feeRecords" style="width: 100%">
        <el-table-column prop="patentNumber" label="专利号" />
        <el-table-column prop="patentTitle" label="专利标题" />
        <el-table-column prop="feeType" label="费用类型" />
        <el-table-column prop="amount" label="金额" />
        <el-table-column prop="status" label="状态" />
      </el-table>
    </div>

    <div class="test-section">
      <h2>缴费提醒</h2>
      <div class="reminders-list">
        <div
          v-for="reminder in feeReminders"
          :key="reminder.id"
          class="reminder-item"
          :class="reminder.level"
        >
          <h4>{{ reminder.patentTitle }}</h4>
          <p>{{ reminder.patentNumber }} - {{ reminder.feeType }}</p>
          <p>金额: ¥{{ reminder.amount }}</p>
          <p>到期: {{ reminder.dueDate }} ({{ reminder.daysUntilDue }}天)</p>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>预算信息</h2>
      <div class="budgets-list">
        <div
          v-for="budget in activeBudgets"
          :key="budget.id"
          class="budget-item"
        >
          <h4>{{ budget.name }}</h4>
          <p>类型: {{ budget.type }}</p>
          <p>总预算: ¥{{ budget.amount }}</p>
          <p>已使用: ¥{{ budget.spentAmount }}</p>
          <p>剩余: ¥{{ budget.remainingAmount }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFeeStore } from "@/stores/fee";
import { ElMessage } from "element-plus";

const feeStore = useFeeStore();

const storeStatus = ref("");
const feeCount = ref(0);
const reminderCount = ref(0);
const budgetCount = ref(0);

const statistics = computed(() => feeStore.statistics);
const feeRecords = computed(() => feeStore.feeRecords);
const feeReminders = computed(() => feeStore.feeReminders);
const activeBudgets = computed(() => feeStore.activeBudgets);

const testStore = async () => {
  try {
    await feeStore.loadFeeRecords();
    await feeStore.loadFeeReminders();
    await feeStore.loadFeeBudgets();
    await feeStore.loadReconciliationRecords();

    feeCount.value = feeStore.feeRecords.length;
    reminderCount.value = feeStore.feeReminders.length;
    budgetCount.value = feeStore.feeBudgets.length;

    storeStatus.value = "Store 初始化成功";
    ElMessage.success("Store 测试成功");
  } catch (error) {
    storeStatus.value = `Store 初始化失败: ${error}`;
    ElMessage.error("Store 测试失败");
  }
};

const addTestFee = async () => {
  try {
    await feeStore.addFeeRecord({
      patentId: Date.now(),
      patentNumber: `CN${Date.now()}`,
      patentTitle: "测试专利",
      feeType: "application",
      amount: 1000,
      currency: "CNY",
      dueDate: "2024-12-31",
      status: "pending",
      description: "测试费用记录",
    });
    ElMessage.success("测试费用添加成功");
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const addTestBudget = async () => {
  try {
    await feeStore.addBudget({
      name: "测试预算",
      type: "monthly",
      amount: 10000,
      currency: "CNY",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      description: "测试预算",
      isActive: true,
    });
    ElMessage.success("测试预算添加成功");
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const addTestReconciliation = async () => {
  try {
    await feeStore.addReconciliationRecord({
      patentId: Date.now(),
      patentNumber: `CN${Date.now()}`,
      patentTitle: "测试专利",
      feeType: "application",
      expectedAmount: 1000,
      actualAmount: 1000,
      difference: 0,
      reconciliationDate: "2024-01-15",
      status: "matched",
      notes: "测试对账记录",
    });
    ElMessage.success("测试对账记录添加成功");
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

onMounted(async () => {
  await testStore();
});
</script>

<style scoped>
.test-fee {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.test-section h2 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9em;
}

.stat-item p {
  margin: 0;
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
}

.reminders-list,
.budgets-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.reminder-item,
.budget-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

.reminder-item.critical {
  border-left: 4px solid #f56c6c;
}

.reminder-item.urgent {
  border-left: 4px solid #e6a23c;
}

.reminder-item.warning {
  border-left: 4px solid #409eff;
}

.reminder-item.info {
  border-left: 4px solid #909399;
}

.reminder-item h4,
.budget-item h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.reminder-item p,
.budget-item p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 0.9em;
}
</style>
