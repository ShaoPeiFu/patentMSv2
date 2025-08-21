<template>
  <div class="fairy-dust-cursor"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

interface Particle {
  character: string;
  lifeSpan: number;
  initialStyles: Record<string, string>;
  velocity: { x: number; y: number };
  position: { x: number; y: number };
  element: HTMLElement;
  init: (x: number, y: number, color: string) => void;
  update: () => void;
  die: () => void;
}

interface Cursor {
  x: number;
  y: number;
}

const possibleColors = ["#D61C59", "#E7D84B", "#1B8798"];
let width = window.innerWidth;
// let height = window.innerHeight;
let cursor: Cursor = { x: width / 2, y: width / 2 };
let particles: Particle[] = [];
let animationId: number | null = null;

// 粒子类
function createParticle(): Particle {
  const particle: Particle = {
    character: "*",
    lifeSpan: 150, // ms
    initialStyles: {
      "position": "fixed",
      "top": "0",
      "display": "block",
      "pointerEvents": "none",
      "zIndex": "10000000",
      "fontSize": "10px",
      "willChange": "transform"
    },
    velocity: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    element: document.createElement('span'),

    init(x: number, y: number, color: string) {
      this.velocity = {
        x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2),
        y: 1
      };
      
      this.position = { x: x - 10, y: y - 20 };
      this.initialStyles.color = color;

      this.element.innerHTML = this.character;
      applyProperties(this.element, this.initialStyles);
      this.update();
      
      document.body.appendChild(this.element);
    },

    update() {
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.lifeSpan--;
      
      this.element.style.transform = `translate3d(${this.position.x}px, ${this.position.y}px, 0) scale(${this.lifeSpan / 120})`;
    },

    die() {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  };

  return particle;
}

// 应用样式属性
function applyProperties(target: HTMLElement, properties: Record<string, string>) {
  for (const key in properties) {
    (target.style as any)[key] = properties[key];
  }
}

// 添加粒子
function addParticle(x: number, y: number, color: string) {
  const particle = createParticle();
  particle.init(x, y, color);
  particles.push(particle);
}

// 更新粒子
function updateParticles() {
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].lifeSpan < 0) {
      particles[i].die();
      particles.splice(i, 1);
    }
  }
}

// 鼠标移动事件
function onMouseMove(e: MouseEvent) {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  
  addParticle(
    cursor.x, 
    cursor.y, 
    possibleColors[Math.floor(Math.random() * possibleColors.length)]
  );
}

// 触摸移动事件
function onTouchMove(e: TouchEvent) {
  if (e.touches.length > 0) {
    for (let i = 0; i < e.touches.length; i++) {
      addParticle(
        e.touches[i].clientX, 
        e.touches[i].clientY, 
        possibleColors[Math.floor(Math.random() * possibleColors.length)]
      );
    }
  }
}

// 窗口大小改变事件
function onWindowResize() {
  width = window.innerWidth;
  // height = window.innerHeight; // This line is removed
}

// 绑定事件
function bindEvents() {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('touchmove', onTouchMove);
  document.addEventListener('touchstart', onTouchMove);
  window.addEventListener('resize', onWindowResize);
}

// 解绑事件
function unbindEvents() {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchstart', onTouchMove);
  window.removeEventListener('resize', onWindowResize);
}

// 动画循环
function loop() {
  animationId = requestAnimationFrame(loop);
  updateParticles();
}

// 初始化
function init() {
  bindEvents();
  loop();
}

// 清理
function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  // 清理所有粒子
  particles.forEach(particle => particle.die());
  particles = [];
  
  unbindEvents();
}

onMounted(() => {
  init();
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.fairy-dust-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999999;
}
</style>
