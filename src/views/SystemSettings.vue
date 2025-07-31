<template>
  <div class="system-settings">
    <div class="page-header">
      <h1>系统设置</h1>
      <el-button @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div class="settings-container">
      <!-- 基本设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>基本设置</span>
          </div>
        </template>

        <el-form :model="basicSettings" label-width="120px">
          <el-form-item label="系统名称">
            <el-input
              v-model="basicSettings.systemName"
              placeholder="请输入系统名称"
            />
          </el-form-item>

          <el-form-item label="系统版本">
            <el-input v-model="basicSettings.version" disabled />
          </el-form-item>

          <el-form-item label="管理员邮箱">
            <el-input
              v-model="basicSettings.adminEmail"
              placeholder="请输入管理员邮箱"
            />
          </el-form-item>

          <el-form-item label="系统描述">
            <el-input
              v-model="basicSettings.description"
              type="textarea"
              :rows="3"
              placeholder="请输入系统描述"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 安全设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>安全设置</span>
          </div>
        </template>

        <el-form :model="securitySettings" label-width="120px">
          <el-form-item label="密码最小长度">
            <el-input-number
              v-model="securitySettings.minPasswordLength"
              :min="6"
              :max="20"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="密码复杂度">
            <el-checkbox-group v-model="securitySettings.passwordRequirements">
              <el-checkbox label="uppercase">必须包含大写字母</el-checkbox>
              <el-checkbox label="lowercase">必须包含小写字母</el-checkbox>
              <el-checkbox label="numbers">必须包含数字</el-checkbox>
              <el-checkbox label="special">必须包含特殊字符</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="会话超时时间">
            <el-select
              v-model="securitySettings.sessionTimeout"
              placeholder="选择超时时间"
            >
              <el-option label="30分钟" value="30" />
              <el-option label="1小时" value="60" />
              <el-option label="2小时" value="120" />
              <el-option label="4小时" value="240" />
              <el-option label="8小时" value="480" />
            </el-select>
          </el-form-item>

          <el-form-item label="登录失败锁定">
            <el-switch v-model="securitySettings.loginLockEnabled" />
            <span class="setting-tip">启用后，连续登录失败将锁定账户</span>
          </el-form-item>

          <el-form-item
            label="最大登录失败次数"
            v-if="securitySettings.loginLockEnabled"
          >
            <el-input-number
              v-model="securitySettings.maxLoginAttempts"
              :min="3"
              :max="10"
              controls-position="right"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 专利设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>专利设置</span>
          </div>
        </template>

        <el-form :model="patentSettings" label-width="120px">
          <el-form-item label="专利号前缀">
            <el-input
              v-model="patentSettings.patentNumberPrefix"
              placeholder="请输入专利号前缀"
            />
          </el-form-item>

          <el-form-item label="专利号长度">
            <el-input-number
              v-model="patentSettings.patentNumberLength"
              :min="6"
              :max="12"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="自动审核">
            <el-switch v-model="patentSettings.autoReviewEnabled" />
            <span class="setting-tip">启用后，新专利将自动进入审核流程</span>
          </el-form-item>

          <el-form-item label="专利过期提醒">
            <el-input-number
              v-model="patentSettings.expirationReminderDays"
              :min="7"
              :max="90"
              controls-position="right"
            />
            <span class="setting-tip">天前提醒专利即将过期</span>
          </el-form-item>

          <el-form-item label="允许的专利类型">
            <el-checkbox-group v-model="patentSettings.allowedPatentTypes">
              <el-checkbox label="invention">发明专利</el-checkbox>
              <el-checkbox label="utility_model">实用新型</el-checkbox>
              <el-checkbox label="design">外观设计</el-checkbox>
              <el-checkbox label="software">软件专利</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 通知设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>通知设置</span>
          </div>
        </template>

        <el-form :model="notificationSettings" label-width="120px">
          <el-form-item label="邮件通知">
            <el-switch v-model="notificationSettings.emailEnabled" />
            <span class="setting-tip">启用邮件通知功能</span>
          </el-form-item>

          <el-form-item label="系统通知">
            <el-switch
              v-model="notificationSettings.systemNotificationEnabled"
            />
            <span class="setting-tip">启用系统内通知功能</span>
          </el-form-item>

          <el-form-item label="通知类型">
            <el-checkbox-group v-model="notificationSettings.notificationTypes">
              <el-checkbox label="patent_approved">专利审核通过</el-checkbox>
              <el-checkbox label="patent_rejected">专利审核拒绝</el-checkbox>
              <el-checkbox label="patent_expiring">专利即将过期</el-checkbox>
              <el-checkbox label="user_registered">新用户注册</el-checkbox>
              <el-checkbox label="system_maintenance">系统维护</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 备份设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>备份设置</span>
          </div>
        </template>

        <el-form :model="backupSettings" label-width="120px">
          <el-form-item label="自动备份">
            <el-switch v-model="backupSettings.autoBackupEnabled" />
            <span class="setting-tip">启用自动备份功能</span>
          </el-form-item>

          <el-form-item
            label="备份频率"
            v-if="backupSettings.autoBackupEnabled"
          >
            <el-select
              v-model="backupSettings.backupFrequency"
              placeholder="选择备份频率"
            >
              <el-option label="每天" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="每月" value="monthly" />
            </el-select>
          </el-form-item>

          <el-form-item
            label="保留备份数量"
            v-if="backupSettings.autoBackupEnabled"
          >
            <el-input-number
              v-model="backupSettings.maxBackupCount"
              :min="5"
              :max="50"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="handleManualBackup"
              :loading="backupLoading"
            >
              <el-icon><Download /></el-icon>
              立即备份
            </el-button>
            <el-button @click="handleRestoreBackup">
              <el-icon><Upload /></el-icon>
              恢复备份
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 操作按钮 -->
      <div class="settings-actions">
        <el-button type="primary" @click="handleSaveSettings" :loading="saving">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
        <el-button @click="handleResetSettings">
          <el-icon><Refresh /></el-icon>
          重置设置
        </el-button>
        <el-button @click="handleExportSettings">
          <el-icon><Download /></el-icon>
          导出设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { useUserStore } from "@/stores/user";
import { hasPermission } from "@/utils/permissions";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Check,
  Refresh,
  Download,
  Upload,
} from "@element-plus/icons-vue";

const router = useRouter();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

// 权限检查
const checkPermission = () => {
  const currentUser = userStore.currentUser;
  if (!currentUser) {
    ElMessage.error("用户信息获取失败");
    router.push("/login");
    return false;
  }

  if (!hasPermission(currentUser.role, "canManageSystem")) {
    ElMessage.error("您没有系统设置权限");
    router.push("/dashboard");
    return false;
  }

  return true;
};

// 响应式数据
const saving = ref(false);
const backupLoading = ref(false);

// 基本设置
const basicSettings = reactive(settingsStore.settings.basic);

// 安全设置
const securitySettings = reactive(settingsStore.settings.security);

// 专利设置
const patentSettings = reactive(settingsStore.settings.patent);

// 通知设置
const notificationSettings = reactive(settingsStore.settings.notification);

// 备份设置
const backupSettings = reactive(settingsStore.settings.backup);

// 保存设置
const handleSaveSettings = async () => {
  saving.value = true;
  try {
    // 模拟保存设置
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 使用store保存设置
    const success = await settingsStore.saveSettings({
      basic: basicSettings,
      security: securitySettings,
      patent: patentSettings,
      notification: notificationSettings,
      backup: backupSettings,
    });

    if (success) {
      ElMessage.success("设置保存成功");
    } else {
      ElMessage.error("设置保存失败");
    }
  } catch (error) {
    ElMessage.error("设置保存失败");
  } finally {
    saving.value = false;
  }
};

// 重置设置
const handleResetSettings = async () => {
  try {
    await ElMessageBox.confirm("确定要重置所有设置吗？", "确认重置", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 使用store重置设置
    settingsStore.resetSettings();

    // 重新加载设置到表单
    Object.assign(basicSettings, settingsStore.settings.basic);
    Object.assign(securitySettings, settingsStore.settings.security);
    Object.assign(patentSettings, settingsStore.settings.patent);
    Object.assign(notificationSettings, settingsStore.settings.notification);
    Object.assign(backupSettings, settingsStore.settings.backup);

    ElMessage.success("设置已重置为默认值");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("重置设置失败");
    }
  }
};

// 导出设置
const handleExportSettings = () => {
  settingsStore.exportSettings();
  ElMessage.success("设置导出成功");
};

// 手动备份
const handleManualBackup = async () => {
  backupLoading.value = true;
  try {
    // 模拟备份过程
    await new Promise((resolve) => setTimeout(resolve, 2000));
    ElMessage.success("备份完成");
  } catch (error) {
    ElMessage.error("备份失败");
  } finally {
    backupLoading.value = false;
  }
};

// 恢复备份
const handleRestoreBackup = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要恢复备份吗？这将覆盖当前设置。",
      "确认恢复",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 模拟恢复过程
    await new Promise((resolve) => setTimeout(resolve, 1500));
    ElMessage.success("备份恢复成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("备份恢复失败");
    }
  }
};

// 生命周期
onMounted(() => {
  // 检查权限
  checkPermission();
  // 设置已经通过store自动加载
});
</script>

<style scoped>
.system-settings {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 600;
  color: #2c3e50;
}

.setting-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #666;
}

.settings-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-settings {
    padding: 15px;
  }

  .settings-actions {
    flex-direction: column;
  }
}
</style>
