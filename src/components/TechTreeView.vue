<template>
  <div class="tech-tree-view">
    <!-- 控制面板 -->
    <div class="tech-tree-controls">
      <div class="controls-left"></div>

      <div class="controls-right">
        <el-switch
          v-model="config.showLabels"
          @change="updateShowLabels"
          active-text="显示标签"
          size="small"
        />

        <el-switch
          v-model="config.showRelations"
          @change="updateShowRelations"
          active-text="显示关系"
          size="small"
        />

        <el-button size="small" @click="addNode">
          <el-icon><Plus /></el-icon>
          添加节点
        </el-button>

        <el-button size="small" @click="showSettings = true">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>

        <el-button size="small" @click="exportTree">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 技术树画布 -->
    <div class="tech-tree-canvas" ref="canvasRef">
      <svg
        :width="canvasWidth"
        :height="canvasHeight"
        @wheel="handleZoom"
        @mousedown="startPan"
      >
        <defs>
          <!-- 箭头标记 -->
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" :fill="theme.colors.border" />
          </marker>

          <!-- 渐变定义 -->
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              :stop-color="theme.colors.primary[0]"
              stop-opacity="0.8"
            />
            <stop
              offset="100%"
              :stop-color="theme.colors.primary[1]"
              stop-opacity="0.6"
            />
          </linearGradient>
        </defs>

        <g :transform="`translate(${panX}, ${panY}) scale(${zoomLevel})`">
          <!-- 关系连线 -->
          <g v-if="config.showRelations" class="relations-group">
            <path
              v-for="relation in visibleRelations"
              :key="relation.id"
              :d="getRelationPath(relation)"
              :stroke="getRelationColor(relation)"
              :stroke-width="getRelationWidth(relation)"
              :stroke-dasharray="getRelationDashArray(relation)"
              :stroke-opacity="0.9"
              fill="none"
              class="relation-path"
              :class="`relation-${relation.type}`"
              marker-end="url(#arrowhead)"
              @click="selectRelation(relation)"
            />
          </g>

          <!-- 技术节点 -->
          <g class="nodes-group">
            <g
              v-for="node in visibleNodes"
              :key="node.id"
              class="tech-node"
              :class="[
                `node-${node.category.replace(/\s+/g, '-')}`,
                `level-${node.level}`,
                `status-${node.status}`,
                {
                  active: selectedNode?.id === node.id,
                  highlighted: highlightedNodes.includes(node.id),
                },
              ]"
              :transform="`translate(${node.x}, ${node.y})`"
              @click="selectNode(node)"
              @mouseenter="highlightNode(node)"
              @mouseleave="unhighlightNode"
              style="cursor: pointer"
            >
              <!-- 节点背景 -->
              <circle
                :r="getNodeSize(node)"
                :fill="getNodeColor(node)"
                :stroke="getNodeBorderColor(node)"
                :stroke-width="selectedNode?.id === node.id ? 3 : 1"
                class="node-background"
              />

              <!-- 节点图标 -->
              <foreignObject
                :x="-8"
                :y="-8"
                width="16"
                height="16"
                class="node-icon"
              >
                <div class="icon-container">
                  <el-icon :style="{ color: getNodeIconColor(node) }">
                    <component :is="getNodeIcon(node)" />
                  </el-icon>
                </div>
              </foreignObject>

              <!-- 专利数量标记 -->
              <text
                v-if="node.patentCount > 0 && zoomLevel >= 1.2"
                :y="-getNodeSize(node) - 5"
                text-anchor="middle"
                :fill="getNodeTextColor(node)"
                font-size="10"
                font-weight="bold"
                class="patent-count"
                style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5)"
              >
                {{ node.patentCount }}
              </text>

              <!-- 节点标签背景 -->
              <rect
                v-if="config.showLabels"
                :x="-getNodeSize(node) - 10"
                :y="getNodeSize(node) + 5"
                :width="getNodeSize(node) * 2 + 20"
                :height="20"
                fill="rgba(255,255,255,0.9)"
                stroke="rgba(0,0,0,0.1)"
                stroke-width="1"
                rx="4"
                class="node-label-bg"
              />

              <!-- 节点标签 -->
              <text
                v-if="config.showLabels"
                :y="getNodeSize(node) + 20"
                text-anchor="middle"
                :fill="theme.colors.text"
                font-size="14"
                font-weight="bold"
                class="node-label"
                style="text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8)"
              >
                {{ node.name }}
              </text>
            </g>
          </g>
        </g>
      </svg>

      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <el-button-group>
          <el-button size="small" @click="zoomIn">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button size="small" @click="zoomOut">
            <el-icon><Minus /></el-icon>
          </el-button>
          <el-button size="small" @click="fitToView">
            <el-icon><FullScreen /></el-icon>
          </el-button>
          <el-button size="small" @click="resetView">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-button-group>
        <el-button size="small" @click="fitToView" type="primary">
          <el-icon><Aim /></el-icon>
          自动适应
        </el-button>
      </div>

      <!-- 图例 -->
      <div
        class="tech-tree-legend"
        :style="{ background: theme.colors.background }"
      >
        <h4>技术族谱图例</h4>

        <!-- 节点状态图例 -->
        <div class="legend-section">
          <h5>技术状态</h5>
          <div class="legend-items">
            <div
              v-for="status in nodeStatuses"
              :key="status.value"
              class="legend-item"
            >
              <div
                class="legend-node"
                :style="{ background: status.color }"
              ></div>
              <span>{{ status.label }}</span>
            </div>
          </div>
        </div>

        <!-- 关系类型图例 -->
        <div v-if="config.showRelations" class="legend-section">
          <h5>关系类型</h5>
          <div class="legend-items">
            <div
              v-for="relationType in relationTypes"
              :key="relationType.value"
              class="legend-item"
            >
              <div
                class="legend-line"
                :style="{
                  borderTop: `2px ${relationType.style} ${relationType.color}`,
                }"
              ></div>
              <span>{{ relationType.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情面板 -->
    <div
      class="details-panel"
      :class="{ expanded: selectedNode || selectedRelation }"
      v-show="selectedNode || selectedRelation"
    >
      <!-- 节点详情 -->
      <div v-if="selectedNode" class="node-details">
        <div class="details-header">
          <div class="node-info">
            <el-icon class="node-type-icon">
              <component :is="getNodeIcon(selectedNode)" />
            </el-icon>
            <div>
              <h3>{{ selectedNode.name }}</h3>
              <div class="node-meta">
                <el-tag
                  :type="getStatusTagType(selectedNode.status)"
                  size="small"
                >
                  {{ getStatusLabel(selectedNode.status) }}
                </el-tag>
                <span class="level-badge">Level {{ selectedNode.level }}</span>
              </div>
            </div>
          </div>
          <el-button size="small" @click="clearSelection">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="details-content">
          <div class="info-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">技术分类:</span>
                <span class="info-value">{{ selectedNode.category }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">专利数量:</span>
                <span class="info-value">{{ selectedNode.patentCount }}</span>
              </div>
              <div v-if="selectedNode.evolutionYear" class="info-item">
                <span class="info-label">演进年份:</span>
                <span class="info-value">{{ selectedNode.evolutionYear }}</span>
              </div>
              <div v-if="selectedNode.description" class="info-item full-width">
                <span class="info-label">技术描述:</span>
                <span class="info-value">{{ selectedNode.description }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedNode.keywords.length > 0" class="info-section">
            <h4>关键词</h4>
            <div class="keywords-tags">
              <el-tag
                v-for="keyword in selectedNode.keywords"
                :key="keyword"
                size="small"
                type="info"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>

          <div
            v-if="selectedNode.relatedTechnologies.length > 0"
            class="info-section"
          >
            <h4>相关技术</h4>
            <div class="related-tech-list">
              <div
                v-for="tech in selectedNode.relatedTechnologies"
                :key="tech"
                class="related-tech-item"
                @click="searchRelatedTech(tech)"
              >
                <el-icon><Connection /></el-icon>
                <span>{{ tech }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>节点关系</h4>
            <div class="relations-summary">
              <div class="relation-count">
                <span>父技术: {{ getParentCount(selectedNode) }}</span>
                <span>子技术: {{ getChildrenCount(selectedNode) }}</span>
                <span>相关技术: {{ getRelatedCount(selectedNode) }}</span>
              </div>
              <!-- 添加滚动提示 -->
              <div class="scroll-hint">
                <el-icon><ArrowDown /></el-icon>
                <span>向下滚动查看更多信息</span>
              </div>
            </div>
          </div>

          <div class="node-actions">
            <el-button size="small" @click="editNode(selectedNode)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" @click="addRelation(selectedNode)">
              <el-icon><Connection /></el-icon>
              添加关系
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteNode(selectedNode.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 关系详情 -->
      <div v-if="selectedRelation" class="relation-details">
        <div class="details-header">
          <h3>技术关系</h3>
          <el-button size="small" @click="clearSelection">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="details-content">
          <div class="relation-info">
            <div class="relation-nodes">
              <div class="source-node">
                {{ getNodeById(selectedRelation.source)?.name }}
              </div>
              <el-icon class="relation-arrow"><ArrowRight /></el-icon>
              <div class="target-node">
                {{ getNodeById(selectedRelation.target)?.name }}
              </div>
            </div>

            <div class="relation-meta">
              <el-tag
                :type="getRelationTagType(selectedRelation.type)"
                size="small"
              >
                {{ getRelationTypeLabel(selectedRelation.type) }}
              </el-tag>
              <div class="strength-indicator">
                强度: {{ Math.round(selectedRelation.strength * 100) }}%
              </div>
            </div>

            <div
              v-if="selectedRelation.description"
              class="relation-description"
            >
              {{ selectedRelation.description }}
            </div>
          </div>

          <div class="relation-actions">
            <el-button size="small" @click="editRelation(selectedRelation)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteRelation(selectedRelation.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑节点对话框 -->
    <el-dialog
      v-model="showNodeDialog"
      :title="editingNode?.id ? '编辑技术节点' : '添加技术节点'"
      width="600px"
    >
      <el-form
        ref="nodeFormRef"
        :model="nodeForm"
        :rules="nodeRules"
        label-width="100px"
      >
        <el-form-item label="技术名称" prop="name">
          <el-input v-model="nodeForm.name" placeholder="请输入技术名称" />
        </el-form-item>

        <el-form-item label="技术分类" prop="category">
          <el-select v-model="nodeForm.category" placeholder="选择技术分类">
            <el-option
              v-for="category in techCategories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="技术层级" prop="level">
          <el-input-number v-model="nodeForm.level" :min="0" :max="10" />
        </el-form-item>

        <el-form-item label="专利数量" prop="patentCount">
          <el-input-number v-model="nodeForm.patentCount" :min="0" />
        </el-form-item>

        <el-form-item label="技术状态" prop="status">
          <el-radio-group v-model="nodeForm.status">
            <el-radio label="emerging">新兴</el-radio>
            <el-radio label="developing">发展中</el-radio>
            <el-radio label="mature">成熟</el-radio>
            <el-radio label="declining">衰退</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="演进年份">
          <el-input-number
            v-model="nodeForm.evolutionYear"
            :min="1900"
            :max="2030"
          />
        </el-form-item>

        <el-form-item label="技术描述">
          <el-input
            v-model="nodeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入技术描述"
          />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="keywordsInput"
            placeholder="请输入关键词，用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showNodeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveNode">保存</el-button>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="技术树设置" width="500px">
      <el-form :model="treeSettings" label-width="120px">
        <el-form-item label="交互模式">
          <el-radio-group v-model="treeSettings.interactionMode">
            <el-radio label="explore">浏览模式</el-radio>
            <el-radio label="edit">编辑模式</el-radio>
            <el-radio label="readonly">只读模式</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="连线样式">
          <el-select v-model="treeSettings.edgeStyle">
            <el-option label="直线" value="straight" />
            <el-option label="曲线" value="curved" />
            <el-option label="折线" value="polyline" />
          </el-select>
        </el-form-item>

        <el-form-item label="动画效果">
          <el-switch v-model="treeSettings.animationEnabled" />
        </el-form-item>

        <el-form-item label="自动布局">
          <el-switch v-model="treeSettings.autoLayout" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
} from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { useVisualizationStore } from "@/stores/visualization";
import type {
  TechnologyNode,
  TechnologyRelation,
  VisualizationTheme,
} from "@/types/visualization";
import {
  Plus,
  Setting,
  Download,
  Minus,
  FullScreen,
  Refresh,
  Close,
  Edit,
  Delete,
  Connection,
  ArrowRight,
  ArrowDown,
  Aim,
} from "@element-plus/icons-vue";

interface Props {
  theme: VisualizationTheme;
}

const props = defineProps<Props>();
const visualizationStore = useVisualizationStore();

// 响应式数据
const canvasRef = ref<HTMLDivElement>();
const canvasWidth = ref(1200);
const canvasHeight = ref(800);
const zoomLevel = ref(1);
const panX = ref(600);
const panY = ref(400);
const isPanning = ref(false);
const lastPanX = ref(0);
const lastPanY = ref(0);
const selectedNode = ref<TechnologyNode | null>(null);
const selectedRelation = ref<TechnologyRelation | null>(null);
const highlightedNodes = ref<string[]>([]);
const showNodeDialog = ref(false);
const showSettings = ref(false);
const editingNode = ref<TechnologyNode | null>(null);
const nodeFormRef = ref<FormInstance>();
const keywordsInput = ref("");

const nodeForm = reactive({
  name: "",
  category: "",
  level: 0,
  patentCount: 0,
  status: "developing",
  evolutionYear: new Date().getFullYear(),
  description: "",
  keywords: [] as string[],
});

const nodeRules = {
  name: [{ required: true, message: "请输入技术名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择技术分类", trigger: "change" }],
  level: [{ required: true, message: "请输入技术层级", trigger: "blur" }],
};

const treeSettings = reactive({
  interactionMode: "explore",
  edgeStyle: "curved",
  animationEnabled: true,
  autoLayout: true,
});

const techCategories = [
  "人工智能",
  "通信技术",
  "生物技术",
  "新能源",
  "材料科学",
  "量子计算",
  "区块链",
  "物联网",
  "大数据",
  "云计算",
];

const nodeStatuses = [
  { value: "emerging", label: "新兴技术", color: "#10B981" },
  { value: "developing", label: "发展中", color: "#3B82F6" },
  { value: "mature", label: "成熟技术", color: "#6B7280" },
  { value: "declining", label: "衰退技术", color: "#EF4444" },
];

const relationTypes = [
  { value: "evolution", label: "技术演进", color: "#3B82F6", style: "solid" },
  {
    value: "combination",
    label: "技术融合",
    color: "#10B981",
    style: "dashed",
  },
  { value: "dependency", label: "技术依赖", color: "#F59E0B", style: "dotted" },
  { value: "competition", label: "技术竞争", color: "#EF4444", style: "solid" },
];

// 计算属性
const config = computed(() => visualizationStore.techTreeConfig);
const nodes = computed(() => visualizationStore.technologyNodes);
const relations = computed(() => visualizationStore.technologyRelations);

// 计算节点位置
const visibleNodes = computed(() => {
  return nodes.value.map((node) => ({
    ...node,
    x: getNodeX(node),
    y: getNodeY(node),
  }));
});

const visibleRelations = computed(() => {
  const filtered = relations.value.filter((relation) => {
    const sourceNode = visibleNodes.value.find((n) => n.id === relation.source);
    const targetNode = visibleNodes.value.find((n) => n.id === relation.target);
    return sourceNode && targetNode;
  });

  console.log(
    "可见关系数量:",
    filtered.length,
    "总关系数量:",
    relations.value.length
  );
  console.log("可见关系:", filtered);

  return filtered;
});

// 方法
const getNodeX = (node: TechnologyNode): number => {
  // 使用标准树状布局算法
  return calculateTreeNodeX(node);
};

const getNodeY = (node: TechnologyNode): number => {
  // 使用标准树状布局算法
  return calculateTreeNodeY(node);
};

const getNodeSize = (node: TechnologyNode): number => {
  const baseSize = 25; // 增加基础大小
  return baseSize + Math.min(node.patentCount / 50, 15); // 按专利数量调整大小
};

const getNodeColor = (node: TechnologyNode): string => {
  // 根据技术状态确定颜色
  const statusColor = nodeStatuses.find((s) => s.value === node.status);
  if (statusColor) {
    console.log(
      `节点 ${node.name} 状态: ${node.status}, 颜色: ${statusColor.color}`
    );
    return statusColor.color;
  }

  // 如果没有找到状态颜色，则使用分类颜色作为备选
  const categoryIndex = techCategories.indexOf(node.category);
  const fallbackColor =
    props.theme.colors.primary[
      categoryIndex % props.theme.colors.primary.length
    ];
  console.log(`节点 ${node.name} 使用备选颜色: ${fallbackColor}`);
  return fallbackColor;
};

const getNodeBorderColor = (node: TechnologyNode): string => {
  return selectedNode.value?.id === node.id
    ? props.theme.colors.primary[0]
    : props.theme.colors.border;
};

const getNodeIconColor = (_node: TechnologyNode): string => {
  return props.theme.colors.background;
};

const getNodeTextColor = (_node: TechnologyNode): string => {
  return props.theme.colors.background;
};

const getNodeIcon = (node: TechnologyNode): string => {
  const iconMap: Record<string, string> = {
    人工智能: "Cpu",
    通信技术: "Connection",
    生物技术: "Search",
    新能源: "Plus",
    材料科学: "Setting",
  };
  return iconMap[node.category] || "Cpu";
};

const getRelationPath = (relation: TechnologyRelation): string => {
  const sourceNode = visibleNodes.value.find((n) => n.id === relation.source);
  const targetNode = visibleNodes.value.find((n) => n.id === relation.target);

  if (!sourceNode || !targetNode) {
    console.warn("找不到关系节点:", relation.source, relation.target);
    return "";
  }

  // 使用实际的节点坐标
  const x1 = sourceNode.x;
  const y1 = sourceNode.y;
  const x2 = targetNode.x;
  const y2 = targetNode.y;

  console.log("关系路径:", {
    source: sourceNode.name,
    target: targetNode.name,
    x1,
    y1,
    x2,
    y2,
  });

  // 确保坐标有效
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    console.warn("节点坐标无效:", { x1, y1, x2, y2 });
    return "";
  }

  // 使用曲线连接
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - 50;
  return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
};

const getRelationColor = (relation: TechnologyRelation): string => {
  const relationType = relationTypes.find((t) => t.value === relation.type);
  return relationType?.color || props.theme.colors.border;
};

const getRelationWidth = (relation: TechnologyRelation): number => {
  return 2 + relation.strength * 4; // 增加线条宽度
};

const getRelationDashArray = (relation: TechnologyRelation): string => {
  const relationType = relationTypes.find((t) => t.value === relation.type);
  switch (relationType?.style) {
    case "dashed":
      return "5,5";
    case "dotted":
      return "2,2";
    default:
      return "";
  }
};

const selectNode = (node: TechnologyNode) => {
  console.log("选中节点:", node); // 添加调试日志
  console.log("节点名称:", node.name); // 添加调试日志
  selectedNode.value = node;
  selectedRelation.value = null;

  // 显示提示信息
  ElMessage.success(`已选中节点: ${node.name}`);

  // 自动滚动到详情面板顶部
  nextTick(() => {
    const detailsPanel = document.querySelector(".node-details") as HTMLElement;
    if (detailsPanel) {
      detailsPanel.scrollTop = 0;
    }
    console.log("详情面板状态:", selectedNode.value); // 添加调试日志
  });
};

const selectRelation = (relation: TechnologyRelation) => {
  selectedRelation.value = relation;
  selectedNode.value = null;
  highlightedNodes.value = [relation.source, relation.target];
};

const highlightNode = (node: TechnologyNode) => {
  if (selectedNode.value) return;

  const relatedIds = relations.value
    .filter((r) => r.source === node.id || r.target === node.id)
    .map((r) => (r.source === node.id ? r.target : r.source));

  highlightedNodes.value = [node.id, ...relatedIds];
};

const unhighlightNode = () => {
  if (!selectedNode.value) {
    highlightedNodes.value = [];
  }
};

const clearSelection = () => {
  selectedNode.value = null;
  selectedRelation.value = null;
  highlightedNodes.value = [];
};

const getNodeById = (id: string): TechnologyNode | undefined => {
  return visibleNodes.value.find((n) => n.id === id);
};

const getParentCount = (node: TechnologyNode): number => {
  return relations.value.filter((r) => r.target === node.id).length;
};

const getChildrenCount = (node: TechnologyNode): number => {
  return relations.value.filter((r) => r.source === node.id).length;
};

const getRelatedCount = (node: TechnologyNode): number => {
  return relations.value.filter(
    (r) =>
      (r.source === node.id || r.target === node.id) && r.type !== "evolution"
  ).length;
};

const getStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    emerging: "success",
    developing: "primary",
    mature: "info",
    declining: "danger",
  };
  return typeMap[status] || "info";
};

const getStatusLabel = (status: string): string => {
  const statusObj = nodeStatuses.find((s) => s.value === status);
  return statusObj?.label || status;
};

const getRelationTagType = (type: string): string => {
  const typeMap: Record<string, string> = {
    evolution: "primary",
    combination: "success",
    dependency: "warning",
    competition: "danger",
  };
  return typeMap[type] || "info";
};

const getRelationTypeLabel = (type: string): string => {
  const relationType = relationTypes.find((t) => t.value === type);
  return relationType?.label || type;
};

const updateShowLabels = (show: boolean) => {
  visualizationStore.updateTechTreeConfig({ showLabels: show });
};

const updateShowRelations = (show: boolean) => {
  visualizationStore.updateTechTreeConfig({ showRelations: show });
};

// 缩放和平移
const handleZoom = (event: WheelEvent) => {
  event.preventDefault();

  // 获取鼠标在SVG中的位置
  const svg = event.currentTarget as HTMLElement;
  const rect = svg.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // 计算缩放前的鼠标位置相对于内容的位置
  const contentX = (mouseX - panX.value) / zoomLevel.value;
  const contentY = (mouseY - panY.value) / zoomLevel.value;

  // 计算新的缩放级别
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newZoomLevel = Math.max(0.3, Math.min(3, zoomLevel.value + delta));

  // 计算缩放比例
  // const scaleRatio = newZoomLevel / zoomLevel.value;

  // 更新缩放级别
  zoomLevel.value = newZoomLevel;

  // 调整平移位置，使鼠标位置保持不变
  panX.value = mouseX - contentX * newZoomLevel;
  panY.value = mouseY - contentY * newZoomLevel;
};

const startPan = (event: MouseEvent) => {
  isPanning.value = true;
  lastPanX.value = event.clientX;
  lastPanY.value = event.clientY;
};

const handlePan = (event: MouseEvent) => {
  if (!isPanning.value) return;

  const deltaX = event.clientX - lastPanX.value;
  const deltaY = event.clientY - lastPanY.value;

  panX.value += deltaX;
  panY.value += deltaY;

  lastPanX.value = event.clientX;
  lastPanY.value = event.clientY;
};

const stopPan = () => {
  isPanning.value = false;
};

const zoomIn = () => {
  const newZoomLevel = Math.min(3, zoomLevel.value * 1.2);
  const scaleRatio = newZoomLevel / zoomLevel.value;

  // 以画布中心为缩放中心
  const centerX = canvasWidth.value / 2;
  const centerY = canvasHeight.value / 2;

  panX.value = centerX - (centerX - panX.value) * scaleRatio;
  panY.value = centerY - (centerY - panY.value) * scaleRatio;

  zoomLevel.value = newZoomLevel;
};

const zoomOut = () => {
  const newZoomLevel = Math.max(0.3, zoomLevel.value / 1.2);
  const scaleRatio = newZoomLevel / zoomLevel.value;

  // 以画布中心为缩放中心
  const centerX = canvasWidth.value / 2;
  const centerY = canvasHeight.value / 2;

  panX.value = centerX - (centerX - panX.value) * scaleRatio;
  panY.value = centerY - (centerY - panY.value) * scaleRatio;

  zoomLevel.value = newZoomLevel;
};

const fitToView = () => {
  // 计算所有节点的边界
  if (visibleNodes.value.length === 0) return;

  const minX = Math.min(...visibleNodes.value.map((n) => n.x));
  const maxX = Math.max(...visibleNodes.value.map((n) => n.x));
  const minY = Math.min(...visibleNodes.value.map((n) => n.y));
  const maxY = Math.max(...visibleNodes.value.map((n) => n.y));

  // 添加额外的边距
  const padding = 100;
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  // 计算合适的缩放比例
  const scaleX = (canvasWidth.value - padding * 2) / contentWidth;
  const scaleY = (canvasHeight.value - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  zoomLevel.value = scale;

  // 计算居中位置
  const scaledContentWidth = contentWidth * scale;
  const scaledContentHeight = contentHeight * scale;

  panX.value = (canvasWidth.value - scaledContentWidth) / 2 - minX * scale;
  panY.value = (canvasHeight.value - scaledContentHeight) / 2 - minY * scale;
};

const resetView = () => {
  zoomLevel.value = 1;
  panX.value = 0;
  panY.value = 0;
};

// 标准树状布局算法
const calculateTreeNodeX = (node: TechnologyNode): number => {
  // 获取所有层级
  const levels = [...new Set(nodes.value.map((n) => n.level))].sort(
    (a, b) => a - b
  );

  // 计算每个层级的节点数量
  const levelNodeCounts = levels.map(
    (level) => nodes.value.filter((n) => n.level === level).length
  );

  // 计算每个节点的位置
  const levelNodes = nodes.value.filter((n) => n.level === node.level);
  const nodeIndex = levelNodes.indexOf(node);

  // 使用标准间距
  const nodeSpacing = 250;

  // 计算该层级的总宽度，考虑节点间距
  const levelWidth = levelNodeCounts[node.level] * nodeSpacing;
  const startX = (canvasWidth.value - levelWidth) / 2;

  return startX + nodeIndex * nodeSpacing + nodeSpacing / 2;
};

const calculateTreeNodeY = (node: TechnologyNode): number => {
  // 使用标准层级高度
  const levelHeight = 200;
  const startY = 150; // 起始Y位置

  return startY + node.level * levelHeight;
};

// 节点和关系管理
const addNode = () => {
  editingNode.value = null;
  Object.assign(nodeForm, {
    name: "",
    category: "",
    level: 0,
    patentCount: 0,
    status: "developing",
    evolutionYear: new Date().getFullYear(),
    description: "",
    keywords: [],
  });
  keywordsInput.value = "";
  showNodeDialog.value = true;
};

const editNode = (node: TechnologyNode) => {
  editingNode.value = node;
  Object.assign(nodeForm, {
    name: node.name,
    category: node.category,
    level: node.level,
    patentCount: node.patentCount,
    status: node.status,
    evolutionYear: node.evolutionYear,
    description: node.description || "",
    keywords: [...node.keywords],
  });
  keywordsInput.value = node.keywords.join(", ");
  showNodeDialog.value = true;
};

const saveNode = async () => {
  if (!nodeFormRef.value) return;

  try {
    await nodeFormRef.value.validate();

    const keywords = keywordsInput.value
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const nodeData = {
      ...nodeForm,
      keywords,
      relatedTechnologies: editingNode.value?.relatedTechnologies || [],
    };

    if (editingNode.value) {
      visualizationStore.updateTechnologyNode(
        editingNode.value.id,
        nodeData as any
      );
      ElMessage.success("技术节点更新成功");
    } else {
      visualizationStore.addTechnologyNode(nodeData as any);
      ElMessage.success("技术节点添加成功");
    }

    showNodeDialog.value = false;
  } catch (error) {
    console.error("保存节点失败:", error);
  }
};

const deleteNode = async (nodeId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个技术节点吗？", "确认删除", {
      type: "warning",
    });

    visualizationStore.deleteTechnologyNode(nodeId);
    clearSelection();
    ElMessage.success("技术节点删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const addRelation = (_node: TechnologyNode) => {
  ElMessage.info("添加关系功能开发中");
};

const editRelation = (_relation: TechnologyRelation) => {
  ElMessage.info("编辑关系功能开发中");
};

const deleteRelation = async (_relationId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个技术关系吗？", "确认删除", {
      type: "warning",
    });

    // TODO: 实现删除关系的方法
    ElMessage.success("技术关系删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const searchRelatedTech = (tech: string) => {
  const relatedNode = nodes.value.find((n) => n.name.includes(tech));
  if (relatedNode) {
    selectNode(relatedNode);
  }
};

const exportTree = () => {
  ElMessage.info("技术树导出功能开发中");
};

const saveSettings = () => {
  visualizationStore.updateTechTreeConfig({
    interactionMode: treeSettings.interactionMode as any,
    edgeStyle: treeSettings.edgeStyle as any,
  });
  showSettings.value = false;
  ElMessage.success("设置已保存");
};

const updateCanvasSize = () => {
  if (canvasRef.value) {
    canvasWidth.value = canvasRef.value.clientWidth;
    canvasHeight.value = canvasRef.value.clientHeight;
  }
};

// 监听节点数据变化，自动适应视图
watch(
  () => visibleNodes.value,
  () => {
    if (visibleNodes.value.length > 0) {
      nextTick(() => {
        fitToView();
      });
    }
  },
  { deep: true }
);

// 生命周期
onMounted(() => {
  updateCanvasSize();

  // 确保有技术数据
  if (nodes.value.length === 0) {
    visualizationStore.generateTechnologyTree();
  }

  // 确保关系显示开启
  if (!config.value.showRelations) {
    visualizationStore.updateTechTreeConfig({ showRelations: true });
  }

  // 绑定事件
  document.addEventListener("mousemove", handlePan);
  document.addEventListener("mouseup", stopPan);
  window.addEventListener("resize", updateCanvasSize);

  // 延迟自动适应视图，确保数据已加载
  nextTick(() => {
    setTimeout(() => {
      console.log("节点数据:", visibleNodes.value);
      console.log("关系数据:", visibleRelations.value);
      console.log("关系显示配置:", config.value.showRelations);
      fitToView();
    }, 100);
  });
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handlePan);
  document.removeEventListener("mouseup", stopPan);
  window.removeEventListener("resize", updateCanvasSize);
});
</script>

<style scoped>
.tech-tree-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow-y: auto; /* 允许垂直滚动 */
  position: relative; /* 为详情面板提供定位上下文 */
}

.tech-tree-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e1e3e9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* 防止控制栏被压缩 */
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tech-tree-canvas {
  flex: 1;
  position: relative;
  background: white;
  overflow: hidden;
  cursor: grab;
}

.tech-tree-canvas:active {
  cursor: grabbing;
}

.tech-node {
  cursor: pointer;
  transition: all 0.3s ease;
}

.tech-node:hover {
  filter: brightness(1.1);
}

.tech-node.active {
  filter: brightness(1.2);
}

.tech-node.highlighted {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

.node-background {
  transition: all 0.3s ease;
}

.node-label {
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.node-label-bg {
  pointer-events: none;
  opacity: 0.9;
}

.patent-count {
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  fill: #ffffff;
  stroke: #000000;
  stroke-width: 0.5px;
  paint-order: stroke fill;
}

.relation-path {
  cursor: pointer;
  transition: all 0.3s ease;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.relation-path:hover {
  stroke-width: 4;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.4));
}

.relation-evolution {
  stroke: #3b82f6;
}

.relation-combination {
  stroke: #10b981;
}

.relation-dependency {
  stroke: #f59e0b;
}

.relation-competition {
  stroke: #ef4444;
}

.icon-container {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
}

.tech-tree-legend {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  max-width: 250px;
}

.tech-tree-legend h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.tech-tree-legend h5 {
  margin: 12px 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.legend-section {
  margin-bottom: 16px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.legend-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
}

.legend-line {
  width: 20px;
  height: 1px;
}

.details-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 100%;
  overflow: hidden;
  transition: width 0.3s ease;
  background: white;
  border-left: 1px solid #e1e3e9;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.details-panel.expanded {
  width: 400px;
}

.node-details,
.relation-details {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 200px); /* 确保有足够的高度 */
  min-height: 400px; /* 设置最小高度 */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #c1c1c1 #f1f1f1; /* Firefox */
}

/* Webkit浏览器的滚动条样式 */
.node-details::-webkit-scrollbar,
.relation-details::-webkit-scrollbar {
  width: 6px;
}

.node-details::-webkit-scrollbar-track,
.relation-details::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.node-details::-webkit-scrollbar-thumb,
.relation-details::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.node-details::-webkit-scrollbar-thumb:hover,
.relation-details::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.node-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.node-type-icon {
  font-size: 24px;
  color: #3b82f6;
  margin-top: 4px;
}

.details-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px; /* 添加底部间距 */
}

.info-section {
  flex-shrink: 0; /* 防止内容被压缩 */
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
  background: white;
  padding: 8px 0;
  z-index: 10;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item.full-width {
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 13px;
  min-width: 80px;
}

.info-value {
  color: #111827;
  font-size: 13px;
  text-align: right;
  word-break: break-word;
}

.info-item.full-width .info-value {
  text-align: left;
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.related-tech-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-tech-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 13px;
  color: #374151;
}

.related-tech-item:hover {
  background: #f3f4f6;
}

.relations-summary {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
}

.relation-count {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

.scroll-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 10px;
  justify-content: center;
}

.node-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.relation-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relation-nodes {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.source-node,
.target-node {
  font-weight: 500;
  color: #111827;
}

.relation-arrow {
  color: #6b7280;
}

.relation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strength-indicator {
  font-size: 13px;
  color: #6b7280;
}

.relation-description {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

.relation-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .tech-tree-controls {
    flex-direction: column;
    gap: 12px;
  }

  .controls-left,
  .controls-right {
    width: 100%;
    justify-content: center;
  }

  .details-panel.expanded {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 10;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .tech-tree-legend {
    position: static;
    margin: 16px;
  }
}

@media (max-width: 768px) {
  .tech-tree-legend {
    display: none;
  }

  .details-panel.expanded {
    width: 100%;
  }

  .zoom-controls {
    bottom: 80px;
  }
}
</style>
