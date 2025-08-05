<template>
  <div class="test-signature">
    <el-card>
      <template #header>
        <h3>电子签名测试页面</h3>
      </template>

      <div class="test-content">
        <div class="instructions">
          <h4>测试说明：</h4>
          <ul>
            <li>点击"测试电子签名"按钮打开签名对话框</li>
            <li>尝试在签名板上绘制，检查鼠标位置与实际落笔位置是否一致</li>
            <li>测试不同的签名方式：手绘、文字、数字证书</li>
            <li>尝试调整浏览器窗口大小，再次测试签名</li>
            <li>检查在页面滚动后签名是否仍然准确</li>
          </ul>
        </div>

        <div class="test-actions">
          <el-button
            type="primary"
            size="large"
            @click="showSignatureDialog = true"
          >
            <el-icon><EditPen /></el-icon>
            测试电子签名
          </el-button>

          <el-button
            v-if="testSignatures.length > 0"
            @click="clearTestSignatures"
          >
            清除所有签名
          </el-button>
        </div>

        <!-- 测试结果展示 -->
        <div v-if="testSignatures.length > 0" class="signature-results">
          <h4>创建的签名：</h4>
          <div class="signatures-grid">
            <div
              v-for="signature in testSignatures"
              :key="signature.id"
              class="signature-item"
            >
              <div class="signature-info">
                <div><strong>签名者:</strong> {{ signature.signerName }}</div>
                <div>
                  <strong>类型:</strong>
                  {{ getSignatureTypeText(signature.signatureType) }}
                </div>
                <div>
                  <strong>时间:</strong> {{ formatDate(signature.signedAt) }}
                </div>
              </div>
              <div class="signature-preview">
                <img
                  v-if="signature.signatureData.startsWith('data:image')"
                  :src="signature.signatureData"
                  alt="签名预览"
                  style="
                    max-width: 200px;
                    max-height: 100px;
                    border: 1px solid #ddd;
                  "
                />
                <div v-else class="digital-signature-info">
                  {{ signature.signatureData }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 填充内容以测试滚动 -->
        <div class="filler-content">
          <h4>测试滚动区域</h4>
          <p v-for="i in 20" :key="i">
            这是第
            {{
              i
            }}
            行测试内容，用于创建足够的页面高度来测试滚动时签名功能是否正常工作。
            滚动页面后再测试签名，确保鼠标位置与落笔位置保持一致。
          </p>
        </div>
      </div>
    </el-card>

    <!-- 电子签名对话框 -->
    <ElectronicSignature
      v-model="showSignatureDialog"
      @signature-created="handleSignatureCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { EditPen } from "@element-plus/icons-vue";
import ElectronicSignature from "@/components/ElectronicSignature.vue";
import type { ElectronicSignature as ElectronicSignatureType } from "@/types/document";

// 响应式数据
const showSignatureDialog = ref(false);
const testSignatures = ref<ElectronicSignatureType[]>([]);

// 方法
const handleSignatureCreated = (signature: ElectronicSignatureType) => {
  testSignatures.value.push(signature);
  ElMessage.success("签名创建成功！");
};

const clearTestSignatures = () => {
  testSignatures.value = [];
  ElMessage.success("已清除所有测试签名");
};

const getSignatureTypeText = (type: string) => {
  const typeMap = {
    drawn: "手绘签名",
    typed: "文字签名",
    digital: "数字证书",
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};
</script>

<style scoped>
.test-signature {
  padding: 20px;
  min-height: 100vh;
}

.test-content {
  padding: 20px 0;
}

.instructions {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.instructions h4 {
  margin-top: 0;
  color: #409eff;
}

.instructions ul {
  margin: 15px 0 0 20px;
}

.instructions li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.test-actions {
  display: flex;
  gap: 16px;
  margin: 30px 0;
  justify-content: center;
}

.signature-results {
  margin: 40px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.signatures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.signature-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.signature-info {
  margin-bottom: 12px;
}

.signature-info div {
  margin-bottom: 4px;
  font-size: 14px;
}

.signature-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
  background: #fafafa;
  border-radius: 4px;
}

.digital-signature-info {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.filler-content {
  margin-top: 60px;
  padding: 30px;
  background: #f0f2f5;
  border-radius: 8px;
}

.filler-content h4 {
  color: #666;
  margin-bottom: 20px;
}

.filler-content p {
  line-height: 1.8;
  margin-bottom: 12px;
  color: #888;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-actions {
    flex-direction: column;
    align-items: center;
  }

  .signatures-grid {
    grid-template-columns: 1fr;
  }
}
</style>
