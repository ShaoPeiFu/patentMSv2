<template>
  <div
    :class="[
      'apple-card',
      variant,
      size,
      { elevated: elevated, interactive: interactive },
    ]"
    ref="cardRef"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="card-header" v-if="$slots.header">
      <slot name="header" />
    </div>

    <div class="card-content">
      <slot />
    </div>

    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>

    <div class="card-background" ref="backgroundRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { appleAnimations } from "@/utils/animations";

interface Props {
  variant?: "default" | "elevated" | "glass" | "gradient";
  size?: "small" | "medium" | "large";
  elevated?: boolean;
  interactive?: boolean;
  animation?: "fade" | "slide" | "scale" | "none";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  size: "medium",
  elevated: false,
  interactive: false,
  animation: "fade",
});

const cardRef = ref<HTMLElement>();
const backgroundRef = ref<HTMLElement>();

const handleMouseEnter = () => {
  if (props.interactive && cardRef.value) {
    // 悬停时的动画效果
  }
};

const handleMouseLeave = () => {
  if (props.interactive && cardRef.value) {
    // 鼠标离开时的动画效果
  }
};

onMounted(() => {
  if (cardRef.value) {
    switch (props.animation) {
      case "fade":
        appleAnimations.fadeIn(cardRef.value, 0.6);
        break;
      case "slide":
        appleAnimations.slideUp(cardRef.value, 0.6);
        break;
      case "scale":
        appleAnimations.scaleIn(cardRef.value, 0.5);
        break;
    }
  }
});
</script>

<style scoped>
.apple-card {
  position: relative;
  background: var(--apple-bg-primary);
  border-radius: var(--apple-radius-large);
  border: 1px solid var(--apple-border-light);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.apple-card.elevated {
  box-shadow: var(--apple-shadow-soft);
}

.apple-card.elevated:hover {
  box-shadow: var(--apple-shadow-medium);
  transform: translateY(-2px);
}

.apple-card.interactive {
  cursor: pointer;
}

.apple-card.interactive:hover {
  transform: translateY(-4px);
  box-shadow: var(--apple-shadow-large);
}

/* 尺寸变体 */
.apple-card.small {
  padding: 16px;
}

.apple-card.medium {
  padding: 24px;
}

.apple-card.large {
  padding: 32px;
}

/* 样式变体 */
.apple-card.default {
  background: var(--apple-bg-primary);
}

.apple-card.elevated {
  background: var(--apple-bg-primary);
  box-shadow: var(--apple-shadow-medium);
}

.apple-card.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.apple-card.gradient {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* 卡片结构 */
.card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--apple-border-light);
}

.card-content {
  flex: 1;
}

.card-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--apple-border-light);
}

/* 背景效果 */
.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.apple-card:hover .card-background {
  opacity: 1;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .apple-card.default {
    background: var(--apple-bg-primary);
    border-color: var(--apple-border);
  }

  .apple-card.glass {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .apple-card.gradient {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.1) 100%
    );
  }

  .card-background {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.02) 100%
    );
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apple-card.medium {
    padding: 20px;
  }

  .apple-card.large {
    padding: 24px;
  }
}

/* 打印样式 */
@media print {
  .apple-card {
    box-shadow: none;
    border: 1px solid #ccc;
    background: white;
  }
}
</style>
