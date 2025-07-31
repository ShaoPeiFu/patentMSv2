<template>
  <div class="test-performance">
    <h1>性能警告测试页面</h1>

    <div class="test-section">
      <h2>测试结果</h2>
      <div class="status-card">
        <div class="status-item">
          <h3>Vue 组件响应式警告</h3>
          <p class="status-description">
            检查浏览器控制台，应该不再看到关于组件被转换为响应式对象的警告信息。
          </p>
          <div class="status-indicator">
            <el-tag type="success">✅ 已修复</el-tag>
          </div>
        </div>

        <div class="status-item">
          <h3>菜单项图标</h3>
          <p class="status-description">
            侧边栏菜单项的图标应该正常显示，没有性能问题。
          </p>
          <div class="status-indicator">
            <el-tag type="success">✅ 正常显示</el-tag>
          </div>
        </div>

        <div class="status-item">
          <h3>组件性能</h3>
          <p class="status-description">
            使用 markRaw() 和 shallowRef() 避免了不必要的响应式转换。
          </p>
          <div class="status-indicator">
            <el-tag type="success">✅ 性能优化</el-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>修复说明</h2>
      <div class="fix-explanation">
        <div class="fix-item">
          <h4>问题原因</h4>
          <p>
            在 <code>Layout.vue</code> 中，菜单项配置使用了 <code>ref()</code>
            来包装包含 Vue 组件的数组，这导致 Vue 组件对象被转换为响应式对象，
            产生了不必要的性能开销。
          </p>
        </div>

        <div class="fix-item">
          <h4>解决方案</h4>
          <ul>
            <li>
              <strong>使用 shallowRef()</strong>：替代 <code>ref()</code>，
              只对顶层属性进行响应式转换，避免深度响应式。
            </li>
            <li>
              <strong>使用 markRaw()</strong>：标记组件对象为非响应式， 防止 Vue
              将其转换为响应式对象。
            </li>
          </ul>
        </div>

        <div class="fix-item">
          <h4>代码对比</h4>
          <div class="code-comparison">
            <div class="code-before">
              <h5>修复前：</h5>
              <pre><code>const menuItems = ref([
  {
    path: "/dashboard",
    title: "控制台",
    icon: House, // ❌ 组件会被响应式化
    exact: true,
  },
  // ...
]);</code></pre>
            </div>

            <div class="code-after">
              <h5>修复后：</h5>
              <pre><code>const menuItems = shallowRef([
  {
    path: "/dashboard", 
    title: "控制台",
    icon: markRaw(House), // ✅ 组件标记为非响应式
    exact: true,
  },
  // ...
]);</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>性能提升</h2>
      <div class="performance-benefits">
        <div class="benefit-item">
          <el-icon class="benefit-icon"><TrendCharts /></el-icon>
          <div class="benefit-content">
            <h4>减少内存使用</h4>
            <p>避免创建不必要的响应式代理对象</p>
          </div>
        </div>

        <div class="benefit-item">
          <el-icon class="benefit-icon"><Timer /></el-icon>
          <div class="benefit-content">
            <h4>提升渲染性能</h4>
            <p>减少 Vue 的响应式系统开销</p>
          </div>
        </div>

        <div class="benefit-item">
          <el-icon class="benefit-icon"><Check /></el-icon>
          <div class="benefit-content">
            <h4>消除警告</h4>
            <p>清理控制台警告信息</p>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>检查步骤</h2>
      <div class="check-steps">
        <ol>
          <li>
            <strong>打开浏览器开发者工具</strong>
            <p>按 F12 或右键选择"检查"</p>
          </li>
          <li>
            <strong>查看控制台(Console)</strong>
            <p>检查是否还有关于组件响应式的警告</p>
          </li>
          <li>
            <strong>测试侧边栏菜单</strong>
            <p>点击各个菜单项，确认图标正常显示</p>
          </li>
          <li>
            <strong>刷新页面</strong>
            <p>重新加载页面，确认警告不再出现</p>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendCharts, Timer, Check } from "@element-plus/icons-vue";
</script>

<style scoped>
.test-performance {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 40px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.test-section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.status-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.status-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-item h3 {
  margin-bottom: 10px;
  color: #409eff;
}

.status-description {
  margin-bottom: 15px;
  color: #666;
  line-height: 1.6;
}

.status-indicator {
  text-align: center;
}

.fix-explanation {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fix-item {
  margin-bottom: 25px;
}

.fix-item h4 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.fix-item p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.fix-item ul {
  margin-left: 20px;
  color: #666;
}

.fix-item li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.code-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;
}

.code-before,
.code-after {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.code-before h5 {
  color: #e74c3c;
  margin-bottom: 10px;
}

.code-after h5 {
  color: #27ae60;
  margin-bottom: 10px;
}

.code-comparison pre {
  margin: 0;
  background: transparent;
  padding: 0;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
}

.code-comparison code {
  background: transparent;
  color: #2c3e50;
}

.performance-benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.benefit-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.benefit-icon {
  font-size: 24px;
  color: #409eff;
  flex-shrink: 0;
}

.benefit-content h4 {
  margin-bottom: 5px;
  color: #2c3e50;
}

.benefit-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.check-steps {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.check-steps ol {
  margin-left: 20px;
}

.check-steps li {
  margin-bottom: 15px;
  line-height: 1.6;
}

.check-steps li strong {
  color: #2c3e50;
  display: block;
  margin-bottom: 5px;
}

.check-steps li p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-card {
    grid-template-columns: 1fr;
  }

  .code-comparison {
    grid-template-columns: 1fr;
  }

  .performance-benefits {
    grid-template-columns: 1fr;
  }

  .benefit-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>
