<template>
  <el-dialog
    v-model="visible"
    title="电子签名"
    width="600px"
    @close="handleClose"
  >
    <div class="signature-container">
      <!-- 签名类型选择 -->
      <div class="signature-type-selector">
        <h4>选择签名方式</h4>
        <el-radio-group v-model="signatureType" @change="clearSignature">
          <el-radio label="drawn">手绘签名</el-radio>
          <el-radio label="typed">文字签名</el-radio>
          <el-radio label="digital">数字证书</el-radio>
        </el-radio-group>
      </div>

      <!-- 手绘签名 -->
      <div v-if="signatureType === 'drawn'" class="drawn-signature">
        <h5>请在下方区域绘制您的签名</h5>
        <div class="signature-pad-container">
          <canvas
            ref="signaturePad"
            class="signature-pad"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @touchstart="startDrawing"
            @touchmove="draw"
            @touchend="stopDrawing"
          ></canvas>
          <div class="signature-controls">
            <el-button size="small" @click="clearCanvas">
              <el-icon><Delete /></el-icon>
              清除
            </el-button>
            <el-button
              size="small"
              @click="undoLastStroke"
              :disabled="strokes.length === 0"
            >
              <el-icon><RefreshLeft /></el-icon>
              撤销
            </el-button>
          </div>
        </div>
      </div>

      <!-- 文字签名 -->
      <div v-if="signatureType === 'typed'" class="typed-signature">
        <h5>输入您的签名文字</h5>
        <el-input
          v-model="typedText"
          placeholder="请输入您的姓名或签名文字"
          @input="generateTypedSignature"
        />
        <div class="font-selector">
          <el-select v-model="selectedFont" @change="generateTypedSignature">
            <el-option
              v-for="font in availableFonts"
              :key="font.value"
              :label="font.label"
              :value="font.value"
            />
          </el-select>
        </div>
        <div class="signature-preview" v-if="typedText">
          <canvas ref="typedCanvas" class="typed-canvas"></canvas>
        </div>
      </div>

      <!-- 数字证书签名 -->
      <div v-if="signatureType === 'digital'" class="digital-signature">
        <h5>数字证书签名</h5>
        <el-upload
          class="certificate-upload"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept=".p12,.pfx,.cer,.crt"
          @change="handleCertificateUpload"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将证书文件拖到此处，或<em>点击选择</em>
          </div>
          <div class="el-upload__tip">
            支持 .p12, .pfx, .cer, .crt 格式的证书文件
          </div>
        </el-upload>

        <div v-if="certificateInfo" class="certificate-info">
          <h6>证书信息</h6>
          <div class="cert-details">
            <div><strong>颁发者:</strong> {{ certificateInfo.issuer }}</div>
            <div><strong>主题:</strong> {{ certificateInfo.subject }}</div>
            <div>
              <strong>序列号:</strong> {{ certificateInfo.serialNumber }}
            </div>
            <div>
              <strong>有效期:</strong> {{ certificateInfo.validFrom }} -
              {{ certificateInfo.validTo }}
            </div>
          </div>
          <el-input
            v-model="certificatePassword"
            type="password"
            placeholder="请输入证书密码"
            style="margin-top: 12px"
          />
        </div>
      </div>

      <!-- 签名预览 -->
      <div class="signature-preview-section" v-if="hasSignature">
        <h5>签名预览</h5>
        <div class="preview-container">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
        </div>
      </div>

      <!-- 签名信息 -->
      <div class="signature-info">
        <el-form :model="signatureForm" label-width="80px" size="small">
          <el-form-item label="签名者">
            <el-input v-model="signatureForm.signerName" readonly />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="signatureForm.signerEmail" readonly />
          </el-form-item>
          <el-form-item label="签名时间">
            <el-input v-model="signatureForm.signedAt" readonly />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSignature"
          :disabled="!hasSignature"
          :loading="creating"
        >
          确认签名
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import { Delete, RefreshLeft, UploadFilled } from "@element-plus/icons-vue";
import type { ElectronicSignature } from "@/types/document";

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "signature-created": [signature: ElectronicSignature];
}>();

// Store
const userStore = useUserStore();

// 响应式数据
const visible = ref(props.modelValue);
const signatureType = ref<"drawn" | "typed" | "digital">("drawn");
const creating = ref(false);

// 手绘签名相关
const signaturePad = ref<HTMLCanvasElement>();
const isDrawing = ref(false);
const strokes = ref<Array<Array<{ x: number; y: number }>>>([]);
const currentStroke = ref<Array<{ x: number; y: number }>>([]);

// 文字签名相关
const typedText = ref("");
const selectedFont = ref("Arial");
const typedCanvas = ref<HTMLCanvasElement>();

// 数字证书相关
const certificateFile = ref<File | null>(null);
const certificatePassword = ref("");
const certificateInfo = ref<any>(null);

// 预览相关
const previewCanvas = ref<HTMLCanvasElement>();

// 签名表单
const signatureForm = ref({
  signerName: "",
  signerEmail: "",
  signedAt: "",
});

// 可用字体
const availableFonts = [
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "楷体", value: "KaiTi" },
  { label: "宋体", value: "SimSun" },
  { label: "微软雅黑", value: "Microsoft YaHei" },
];

// 计算属性
const hasSignature = computed(() => {
  switch (signatureType.value) {
    case "drawn":
      return strokes.value.length > 0;
    case "typed":
      return typedText.value.trim().length > 0;
    case "digital":
      return certificateFile.value && certificatePassword.value;
    default:
      return false;
  }
});

// 监听器
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
  }
);

watch(visible, (newVal) => {
  emit("update:modelValue", newVal);
  if (newVal) {
    initializeForm();
    // 对话框显示时重新初始化画布
    nextTick(() => {
      initializeCanvas();
    });
  }
});

watch(hasSignature, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updatePreview();
    });
  }
});

// 方法
const initializeForm = () => {
  const currentUser = userStore.currentUser;
  if (currentUser) {
    signatureForm.value.signerName = currentUser.realName;
    signatureForm.value.signerEmail = currentUser.email;
    signatureForm.value.signedAt = new Date().toLocaleString("zh-CN");
  }
};

// 手绘签名方法
const initializeCanvas = () => {
  if (!signaturePad.value) return;

  const canvas = signaturePad.value;
  const rect = canvas.getBoundingClientRect();

  // 考虑设备像素比，确保高清显示
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 设置CSS尺寸
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  const ctx = canvas.getContext("2d");
  if (ctx) {
    // 缩放画布以匹配设备像素比
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
};

const getCoordinates = (event: MouseEvent | TouchEvent) => {
  if (!signaturePad.value) return { x: 0, y: 0 };

  const canvas = signaturePad.value;
  const rect = canvas.getBoundingClientRect();

  let clientX, clientY;
  if (event instanceof MouseEvent) {
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  }

  // 简化坐标计算，getBoundingClientRect已经考虑了滚动
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  return { x, y };
};

const startDrawing = (event: MouseEvent | TouchEvent) => {
  event.preventDefault();
  isDrawing.value = true;
  currentStroke.value = [];

  const coords = getCoordinates(event);
  currentStroke.value.push(coords);

  const ctx = signaturePad.value?.getContext("2d");
  if (ctx) {
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }
};

const draw = (event: MouseEvent | TouchEvent) => {
  event.preventDefault();
  if (!isDrawing.value) return;

  const coords = getCoordinates(event);
  currentStroke.value.push(coords);

  const ctx = signaturePad.value?.getContext("2d");
  if (ctx) {
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }
};

const stopDrawing = () => {
  if (isDrawing.value && currentStroke.value.length > 0) {
    strokes.value.push([...currentStroke.value]);
  }
  isDrawing.value = false;
  currentStroke.value = [];
};

const clearCanvas = () => {
  if (!signaturePad.value) return;

  const canvas = signaturePad.value;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  }
  strokes.value = [];
};

const undoLastStroke = () => {
  if (strokes.value.length === 0) return;

  strokes.value.pop();
  redrawCanvas();
};

const redrawCanvas = () => {
  if (!signaturePad.value) return;

  const canvas = signaturePad.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 重新初始化画布设置
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  ctx.scale(dpr, dpr);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 清除画布
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 重绘所有笔画
  strokes.value.forEach((stroke) => {
    if (stroke.length > 0) {
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      stroke.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.stroke();
    }
  });
};

// 文字签名方法
const generateTypedSignature = () => {
  if (!typedCanvas.value || !typedText.value.trim()) return;

  const canvas = typedCanvas.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 300;
  canvas.height = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `32px ${selectedFont.value}`;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(typedText.value, canvas.width / 2, canvas.height / 2);
};

// 数字证书方法
const handleCertificateUpload = (file: any) => {
  certificateFile.value = file.raw;

  // 模拟解析证书信息
  certificateInfo.value = {
    issuer: "CN=Certificate Authority",
    subject: `CN=${userStore.currentUser?.realName}`,
    serialNumber: Math.random().toString(16).substr(2, 8).toUpperCase(),
    validFrom: new Date().toLocaleDateString("zh-CN"),
    validTo: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toLocaleDateString("zh-CN"),
  };

  ElMessage.success("证书文件已上传");
};

// 预览更新
const updatePreview = () => {
  if (!previewCanvas.value) return;

  const canvas = previewCanvas.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 300;
  canvas.height = 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch (signatureType.value) {
    case "drawn":
      if (signaturePad.value) {
        ctx.drawImage(signaturePad.value, 0, 0, canvas.width, canvas.height);
      }
      break;
    case "typed":
      if (typedCanvas.value) {
        ctx.drawImage(typedCanvas.value, 0, 0, canvas.width, canvas.height);
      }
      break;
    case "digital":
      ctx.font = "16px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("数字证书签名", canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText(
        signatureForm.value.signerName,
        canvas.width / 2,
        canvas.height / 2 + 10
      );
      break;
  }

  // 添加签名时间戳
  ctx.font = "10px Arial";
  ctx.fillStyle = "#666";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    signatureForm.value.signedAt,
    canvas.width - 5,
    canvas.height - 5
  );
};

const clearSignature = () => {
  switch (signatureType.value) {
    case "drawn":
      clearCanvas();
      break;
    case "typed":
      typedText.value = "";
      break;
    case "digital":
      certificateFile.value = null;
      certificatePassword.value = "";
      certificateInfo.value = null;
      break;
  }
};

const confirmSignature = async () => {
  if (!hasSignature.value) {
    ElMessage.warning("请完成签名");
    return;
  }

  creating.value = true;

  try {
    // 获取签名数据
    let signatureData = "";

    switch (signatureType.value) {
      case "drawn":
        signatureData = signaturePad.value?.toDataURL() || "";
        break;
      case "typed":
        signatureData = typedCanvas.value?.toDataURL() || "";
        break;
      case "digital":
        signatureData = `certificate:${certificateInfo.value?.serialNumber}`;
        break;
    }

    const signature: ElectronicSignature = {
      id: Date.now().toString(),
      signerId: userStore.currentUser?.id || 0,
      signerName: signatureForm.value.signerName,
      signerEmail: signatureForm.value.signerEmail,
      signatureData,
      signatureType: signatureType.value,
      signedAt: new Date().toISOString(),
      ipAddress: "127.0.0.1", // 模拟IP地址
      userAgent: navigator.userAgent,
      isValid: true,
      certificateInfo:
        signatureType.value === "digital" ? certificateInfo.value : undefined,
    };

    emit("signature-created", signature);
    handleClose();

    ElMessage.success("电子签名创建成功");
  } catch (error) {
    ElMessage.error("创建签名失败: " + (error as Error).message);
  } finally {
    creating.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  clearSignature();
};

// 窗口大小变化处理
const handleResize = () => {
  if (signaturePad.value && strokes.value.length > 0) {
    // 如果有签名内容，重新绘制以适应新尺寸
    nextTick(() => {
      redrawCanvas();
    });
  } else if (signaturePad.value) {
    // 如果没有签名内容，重新初始化画布
    nextTick(() => {
      initializeCanvas();
    });
  }
};

// 生命周期
onMounted(() => {
  nextTick(() => {
    initializeCanvas();
  });

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  // 清理事件监听器
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.signature-container {
  padding: 16px 0;
}

.signature-type-selector {
  margin-bottom: 24px;
}

.signature-type-selector h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.drawn-signature h5,
.typed-signature h5,
.digital-signature h5 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.signature-pad-container {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.signature-pad {
  width: 100%;
  height: 200px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
  cursor: crosshair;
}

.signature-controls {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.typed-signature {
  margin-bottom: 24px;
}

.font-selector {
  margin-top: 12px;
  margin-bottom: 16px;
}

.typed-canvas {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
}

.digital-signature {
  margin-bottom: 24px;
}

.certificate-upload {
  margin-bottom: 16px;
}

.certificate-info {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.certificate-info h6 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.cert-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.signature-preview-section {
  margin: 24px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.signature-preview-section h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.preview-container {
  display: flex;
  justify-content: center;
}

.preview-canvas {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
}

.signature-info {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .signature-pad {
    height: 150px;
  }

  .signature-controls {
    flex-direction: column;
  }

  .cert-details {
    font-size: 12px;
  }
}
</style>
