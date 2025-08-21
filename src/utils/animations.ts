import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 确保GSAP正确初始化
try {
  // 使用更安全的方式设置opacity，避免在组件卸载时出现问题
  if (typeof document !== "undefined") {
    gsap.set("body", { opacity: 1 });
  }
} catch (error) {
  console.warn("GSAP初始化警告:", error);
}

// 苹果风格的动画预设
export const appleAnimations = {
  // 淡入动画
  fadeIn: (element: HTMLElement, duration = 0.6) => {
    try {
      // 检查元素是否仍然存在且有效
      if (!element || !element.parentNode || !element.isConnected) {
        // 静默处理，不显示警告
        return null;
      }

      return gsap.fromTo(
        element,
        { opacity: 0 },
        {
          opacity: 1,
          duration,
          ease: "power2.out",
        }
      );
    } catch (error) {
      // 静默处理GSAP错误
      if (element && element.style) {
        element.style.opacity = "1";
        element.style.transition = `opacity ${duration}s ease-out`;
      }
      return null;
    }
  },

  // 从下方滑入
  slideUp: (element: HTMLElement, duration = 0.6) => {
    try {
      if (!element || !element.parentNode || !element.isConnected) {
        // 静默处理，不显示警告
        return null;
      }

      return gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          ease: "power2.out",
        }
      );
    } catch (error) {
      // 静默处理GSAP错误
      if (element && element.style) {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
        element.style.transition = `opacity ${duration}s ease-out, transform ${duration}s ease-out`;
      }
      return null;
    }
  },

  // 从上方滑入
  slideDown: (element: HTMLElement, duration = 0.6) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: -30,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        ease: "power2.out",
      }
    );
  },

  // 缩放动画
  scaleIn: (element: HTMLElement, duration = 0.5) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        scale: 0.8,
      },
      {
        opacity: 1,
        scale: 1,
        duration,
        ease: "back.out(1.7)",
      }
    );
  },

  // 弹性动画
  bounceIn: (element: HTMLElement, duration = 0.8) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        scale: 0.3,
      },
      {
        opacity: 1,
        scale: 1,
        duration,
        ease: "elastic.out(1, 0.3)",
      }
    );
  },

  // 浮动动画
  float: (element: HTMLElement, duration = 3) => {
    return gsap.to(element, {
      y: -10,
      duration: duration / 2,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    });
  },

  // 脉冲动画
  pulse: (element: HTMLElement, duration = 2) => {
    return gsap.to(element, {
      scale: 1.05,
      duration: duration / 2,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
    });
  },

  // 旋转动画
  rotate: (element: HTMLElement, duration = 3) => {
    return gsap.to(element, {
      rotation: 360,
      duration,
      ease: "none",
      repeat: -1,
    });
  },

  // 打字机效果
  typewriter: (element: HTMLElement, text: string, duration = 0.05) => {
    const chars = text.split("");
    let currentText = "";

    return gsap.to(
      {},
      {
        duration: chars.length * duration,
        onUpdate: function () {
          const progress = this.progress();
          const charIndex = Math.floor(progress * chars.length);
          currentText = chars.slice(0, charIndex).join("");
          element.textContent = currentText;
        },
        ease: "none",
      }
    );
  },

  // 进度条动画
  progressBar: (element: HTMLElement, progress: number, duration = 1) => {
    return gsap.to(element, {
      width: `${progress}%`,
      duration,
      ease: "power2.out",
    });
  },

  // 路径动画
  motionPath: (element: HTMLElement, path: string, duration = 2) => {
    return gsap.to(element, {
      motionPath: {
        path: path,
        alignOrigin: [0.5, 0.5],
      },
      duration,
      ease: "power1.inOut",
    });
  },

  // 视差滚动
  parallax: (element: HTMLElement, speed = 0.5) => {
    return gsap.to(element, {
      yPercent: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  },

  // 滚动触发动画
  scrollTrigger: (element: HTMLElement, animation: any) => {
    return ScrollTrigger.create({
      trigger: element,
      start: "top 80%",
      end: "bottom 20%",
      animation: animation,
      toggleActions: "play none none reverse",
    });
  },

  // 交错动画
  stagger: (elements: HTMLElement[], animation: any, stagger = 0.1) => {
    return gsap.to(elements, {
      ...animation,
      stagger,
      ease: "power2.out",
    });
  },

  // 时间轴动画
  timeline: () => {
    return gsap.timeline();
  },

  // 卡片动画
  animateCards: (elements: HTMLElement[], stagger = 0.1) => {
    try {
      if (!elements || elements.length === 0) return null;

      // 过滤掉无效元素
      const validElements = elements.filter(
        (el) => el && el.parentNode && el.isConnected
      );

      if (validElements.length === 0) return null;

      return gsap.fromTo(
        validElements,
        {
          opacity: 0,
          y: 30,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger,
        }
      );
    } catch (error) {
      console.warn("卡片动画执行失败:", error);
      // 降级处理：直接设置样式
      elements.forEach((el, index) => {
        if (el && el.style) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0) scale(1)";
            el.style.transition =
              "opacity 0.6s ease-out, transform 0.6s ease-out";
          }, index * 100);
        }
      });
      return null;
    }
  },
};

// 页面过渡动画
export const pageTransitions = {
  // 页面进入动画
  pageEnter: (element: HTMLElement) => {
    const tl = gsap.timeline();

    tl.set(element, { opacity: 0, y: 20 }).to(element, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    return tl;
  },

  // 页面退出动画
  pageExit: (element: HTMLElement) => {
    const tl = gsap.timeline();

    tl.to(element, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: "power2.in",
    });

    return tl;
  },

  // 模态框动画
  modalEnter: (element: HTMLElement) => {
    const tl = gsap.timeline();

    tl.set(element, { opacity: 0, scale: 0.8 }).to(element, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.7)",
    });

    return tl;
  },

  modalExit: (element: HTMLElement) => {
    const tl = gsap.timeline();

    tl.to(element, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      ease: "power2.in",
    });

    return tl;
  },
};

// 交互式动画
export const interactiveAnimations = {
  // 悬停效果
  hover: (element: HTMLElement) => {
    element.addEventListener("mouseenter", () => {
      gsap.to(element, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    element.addEventListener("mouseleave", () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  },

  // 点击波纹效果
  ripple: (element: HTMLElement, event: MouseEvent) => {
    const ripple = document.createElement("div");
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
    `;

    element.style.position = "relative";
    element.appendChild(ripple);

    gsap.to(ripple, {
      scale: 2,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        element.removeChild(ripple);
      },
    });
  },

  // 拖拽动画
  draggable: (element: HTMLElement) => {
    return gsap.to(element, {
      duration: 0.3,
      ease: "power2.out",
      onUpdate: function () {
        // 拖拽逻辑
      },
    });
  },
};

// 性能优化
export const performanceOptimizations = {
  // 批量动画
  batch: (animations: any[]) => {
    return gsap.timeline().add(animations);
  },

  // 清理动画
  cleanup: () => {
    gsap.killTweensOf("*");
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  },

  // 暂停所有动画
  pause: () => {
    gsap.globalTimeline.pause();
  },

  // 恢复所有动画
  resume: () => {
    gsap.globalTimeline.resume();
  },
};

// 导出默认动画实例
export default appleAnimations;
