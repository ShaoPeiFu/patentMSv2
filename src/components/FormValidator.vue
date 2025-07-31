<template>
  <div class="form-validator">
    <slot
      :validateField="validateField"
      :clearErrors="clearErrors"
      :hasErrors="hasErrors"
    />

    <!-- 错误提示 -->
    <div v-if="showErrors && errors.length > 0" class="error-summary">
      <el-alert title="表单验证失败" type="error" :closable="false" show-icon>
        <ul class="error-list">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  showErrors?: boolean;
}

interface Emits {
  (e: "validation-change", isValid: boolean, errors: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  showErrors: false,
});

const emit = defineEmits<Emits>();

const errors = ref<string[]>([]);

// 验证规则类型
type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
};

// 验证字段
const validateField = (value: any, rules: ValidationRule[]): string[] => {
  const fieldErrors: string[] = [];

  for (const rule of rules) {
    // 必填验证
    if (
      rule.required &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      fieldErrors.push(rule.message || "此字段为必填项");
      continue;
    }

    // 如果值为空且非必填，跳过其他验证
    if (!value && !rule.required) {
      continue;
    }

    // 最小长度验证
    if (
      rule.minLength &&
      typeof value === "string" &&
      value.length < rule.minLength
    ) {
      fieldErrors.push(rule.message || `最少需要${rule.minLength}个字符`);
    }

    // 最大长度验证
    if (
      rule.maxLength &&
      typeof value === "string" &&
      value.length > rule.maxLength
    ) {
      fieldErrors.push(rule.message || `最多允许${rule.maxLength}个字符`);
    }

    // 正则验证
    if (
      rule.pattern &&
      typeof value === "string" &&
      !rule.pattern.test(value)
    ) {
      fieldErrors.push(rule.message || "格式不正确");
    }

    // 自定义验证
    if (rule.custom) {
      const result = rule.custom(value);
      if (result === false || typeof result === "string") {
        fieldErrors.push(
          typeof result === "string" ? result : rule.message || "验证失败"
        );
      }
    }
  }

  return fieldErrors;
};

// 批量验证
const validateForm = (
  formData: Record<string, any>,
  validationRules: Record<string, ValidationRule[]>
): boolean => {
  const allErrors: string[] = [];

  for (const [field, rules] of Object.entries(validationRules)) {
    const fieldErrors = validateField(formData[field], rules);
    allErrors.push(...fieldErrors);
  }

  errors.value = allErrors;
  const isValid = allErrors.length === 0;

  emit("validation-change", isValid, allErrors);
  return isValid;
};

// 清除错误
const clearErrors = () => {
  errors.value = [];
  emit("validation-change", true, []);
};

// 是否有错误
const hasErrors = () => errors.value.length > 0;

// 暴露方法
defineExpose({
  validateField,
  validateForm,
  clearErrors,
  hasErrors,
  errors,
});
</script>

<style scoped>
.form-validator {
  width: 100%;
}

.error-summary {
  margin-top: 16px;
}

.error-list {
  margin: 8px 0 0 20px;
  padding: 0;
}

.error-list li {
  margin-bottom: 4px;
  color: #f56c6c;
}
</style>
