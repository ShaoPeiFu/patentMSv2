<template>
  <button
    :class="[
      'apple-button',
      variant,
      size,
      { loading: loading, disabled: disabled },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    ref="buttonRef"
  >
    <div class="button-content">
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div v-else class="button-inner">
        <slot name="icon" />
        <span v-if="$slots.default" class="button-text">
          <slot />
        </span>
      </div>
    </div>

    <div class="ripple-container" ref="rippleContainer"></div>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { appleAnimations, interactiveAnimations } from "@/utils/animations";

interface Props {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  ripple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "medium",
  loading: false,
  disabled: false,
  ripple: true,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonRef = ref<HTMLElement>();
const rippleContainer = ref<HTMLElement>();

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return;

  if (props.ripple && buttonRef.value) {
    interactiveAnimations.ripple(buttonRef.value, event);
  }

  emit("click", event);
};

const handleMouseEnter = () => {
  if (buttonRef.value && !props.disabled) {
    interactiveAnimations.hover(buttonRef.value);
  }
};

const handleMouseLeave = () => {
  // 鼠标离开时的处理
};

onMounted(() => {
  if (buttonRef.value) {
    appleAnimations.fadeIn(buttonRef.value, 0.3);
  }
});
</script>

<style scoped>
.apple-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.apple-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
}

.apple-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* 尺寸变体 */
.apple-button.small {
  padding: 8px 16px;
  font-size: 14px;
  min-height: 32px;
}

.apple-button.medium {
  padding: 12px 24px;
  font-size: 16px;
  min-height: 44px;
}

.apple-button.large {
  padding: 16px 32px;
  font-size: 18px;
  min-height: 52px;
}

/* 颜色变体 */
.apple-button.primary {
  background: var(--apple-accent);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.apple-button.primary:hover {
  background: var(--apple-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
}

.apple-button.secondary {
  background: var(--apple-bg-secondary);
  color: var(--apple-text-primary);
  border: 1px solid var(--apple-border);
}

.apple-button.secondary:hover {
  background: var(--apple-bg-tertiary);
  border-color: var(--apple-accent);
}

.apple-button.success {
  background: var(--apple-success);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
}

.apple-button.success:hover {
  background: #30d158;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.4);
}

.apple-button.warning {
  background: var(--apple-warning);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.apple-button.warning:hover {
  background: #ff8c00;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 149, 0, 0.4);
}

.apple-button.danger {
  background: var(--apple-danger);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
}

.apple-button.danger:hover {
  background: #ff2d55;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.4);
}

.apple-button.ghost {
  background: transparent;
  color: var(--apple-accent);
  border: 1px solid transparent;
}

.apple-button.ghost:hover {
  background: rgba(0, 122, 255, 0.1);
  border-color: var(--apple-accent);
}

/* 按钮内容 */
.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.button-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-text {
  white-space: nowrap;
}

/* 加载状态 */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 波纹容器 */
.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apple-button.medium {
    padding: 10px 20px;
    font-size: 14px;
    min-height: 40px;
  }

  .apple-button.large {
    padding: 14px 28px;
    font-size: 16px;
    min-height: 48px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .apple-button.secondary {
    background: var(--apple-bg-secondary);
    color: var(--apple-text-primary);
    border-color: var(--apple-border);
  }

  .apple-button.secondary:hover {
    background: var(--apple-bg-tertiary);
  }

  .apple-button.ghost {
    color: var(--apple-accent);
  }

  .apple-button.ghost:hover {
    background: rgba(0, 122, 255, 0.2);
  }
}
</style>
