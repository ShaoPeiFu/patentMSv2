<template>
  <div class="workflow-demo">
    <el-card>
      <template #header>
        <h2>工作流和审批系统演示</h2>
      </template>

      <div class="demo-content">
        <div class="feature-intro">
          <h3>🚀 高级工作流和审批功能</h3>
          <p>本系统实现了完整的工作流管理和审批功能，包括：</p>
        </div>

        <!-- 功能特性展示 -->
        <el-row :gutter="20" class="features-grid">
          <el-col :span="12">
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><Rank /></el-icon>
              </div>
              <div class="feature-content">
                <h4>多级审批流程</h4>
                <ul>
                  <li>支持顺序、并行、条件审批</li>
                  <li>灵活的审批步骤配置</li>
                  <li>自定义审批角色和权限</li>
                  <li>动态的审批路径调整</li>
                </ul>
              </div>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="feature-content">
                <h4>审批时间限制</h4>
                <ul>
                  <li>设置每个步骤的时间限制</li>
                  <li>自动超时检测和处理</li>
                  <li>支持自动批准或升级处理</li>
                  <li>通知提醒机制</li>
                </ul>
              </div>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><Switch /></el-icon>
              </div>
              <div class="feature-content">
                <h4>审批委托功能</h4>
                <ul>
                  <li>临时委托审批权限</li>
                  <li>设置委托有效期</li>
                  <li>支持特定工作流委托</li>
                  <li>委托状态管理</li>
                </ul>
              </div>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="feature-card">
              <div class="feature-icon">
                <el-icon><DocumentIcon /></el-icon>
              </div>
              <div class="feature-content">
                <h4>工作流模板管理</h4>
                <ul>
                  <li>创建可复用的工作流模板</li>
                  <li>模板分类和复杂度标记</li>
                  <li>基于模板快速创建工作流</li>
                  <li>模板使用统计</li>
                </ul>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 快速访问按钮 -->
        <div class="quick-actions">
          <h3>快速体验</h3>
          <div class="action-buttons">
            <el-button
              type="primary"
              size="large"
              @click="$router.push('/dashboard/workflows')"
            >
              <el-icon><Setting /></el-icon>
              工作流管理
            </el-button>

            <el-button
              type="success"
              size="large"
              @click="$router.push('/dashboard/review')"
            >
              <el-icon><View /></el-icon>
              审批中心
            </el-button>

            <el-button size="large" @click="createSampleWorkflow">
              <el-icon><Plus /></el-icon>
              创建示例工作流
            </el-button>

            <el-button size="large" @click="createSampleDelegation">
              <el-icon><Switch /></el-icon>
              创建示例委托
            </el-button>
          </div>
        </div>

        <!-- 使用指南 -->
        <div class="usage-guide">
          <h3>使用指南</h3>
          <el-steps :active="0" direction="vertical">
            <el-step
              title="创建工作流"
              description="在工作流管理页面创建新的审批流程，配置审批步骤和规则"
            />
            <el-step
              title="设置审批权限"
              description="为每个步骤分配审批角色，设置时间限制和其他参数"
            />
            <el-step
              title="启动审批流程"
              description="提交文档或专利申请，系统将自动启动相应的审批流程"
            />
            <el-step
              title="处理审批任务"
              description="审批人员在审批中心查看和处理待审批任务"
            />
            <el-step
              title="监控和管理"
              description="管理员可以监控流程进度，处理超时和异常情况"
            />
          </el-steps>
        </div>

        <!-- 技术特点 -->
        <div class="tech-features">
          <h3>技术特点</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="tech-item">
                <el-icon class="tech-icon"><DataLine /></el-icon>
                <h5>类型安全</h5>
                <p>使用TypeScript确保类型安全，减少运行时错误</p>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="tech-item">
                <el-icon class="tech-icon"><Monitor /></el-icon>
                <h5>响应式设计</h5>
                <p>基于Vue 3 Composition API的响应式状态管理</p>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="tech-item">
                <el-icon class="tech-icon"><Grid /></el-icon>
                <h5>模块化架构</h5>
                <p>清晰的模块划分，易于维护和扩展</p>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useDocumentStore } from "@/stores/document";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import {
  Rank,
  Timer,
  Switch,
  Document as DocumentIcon,
  Setting,
  View,
  Plus,
  DataLine,
  Monitor,
  Grid,
} from "@element-plus/icons-vue";

// Store
const documentStore = useDocumentStore();
const userStore = useUserStore();

// 方法
const createSampleWorkflow = async () => {
  try {
    const sampleWorkflow = {
      name: "示例专利审批流程",
      description: "这是一个用于演示的专利审批工作流",
      type: "sequential" as const,
      priority: "medium" as const,
      category: "专利",
      version: "1.0",
      steps: [
        {
          id: "step-1-preliminary-review",
          stepNumber: 1,
          name: "初步审查",
          description: "对专利申请进行初步形式审查",
          approverRoles: ["reviewer"],
          isRequired: true,
          allowParallel: false,
          timeLimit: 24,
          minApprovals: 1,
          autoApprove: false,
          delegationAllowed: true,
        },
        {
          id: "step-2-technical-review",
          stepNumber: 2,
          name: "技术审查",
          description: "对专利技术内容进行详细审查",
          approverRoles: ["reviewer"],
          isRequired: true,
          allowParallel: false,
          timeLimit: 72,
          minApprovals: 1,
          autoApprove: false,
          delegationAllowed: true,
        },
        {
          id: "step-3-final-approval",
          stepNumber: 3,
          name: "最终审批",
          description: "管理员进行最终审批决定",
          approverRoles: ["admin"],
          isRequired: true,
          allowParallel: false,
          timeLimit: 48,
          minApprovals: 1,
          autoApprove: false,
          delegationAllowed: false,
        },
      ],
      isActive: true,
      createdBy: userStore.currentUser?.id || 1,
      tags: ["示例", "专利", "演示"],
    };

    await documentStore.createApprovalWorkflow(sampleWorkflow);
    ElMessage.success("示例工作流创建成功！");
  } catch (error) {
    ElMessage.error("创建失败: " + (error as Error).message);
  }
};

const createSampleDelegation = async () => {
  try {
    const currentUser = userStore.currentUser;
    if (!currentUser) {
      ElMessage.warning("请先登录");
      return;
    }

    // 查找一个可以委托的用户
    const availableUsers = userStore.users.filter(
      (u) =>
        u.id !== currentUser.id && (u.role === "admin" || u.role === "reviewer")
    );

    if (availableUsers.length === 0) {
      ElMessage.warning("没有可委托的用户");
      return;
    }

    const delegateeUser = availableUsers[0];
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后

    const sampleDelegation = {
      delegatorId: currentUser.id,
      delegatorName: currentUser.realName,
      delegateeId: delegateeUser.id,
      delegateeName: delegateeUser.realName,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      reason: "出差期间临时委托审批权限",
      isActive: true,
    };

    await documentStore.createDelegation(sampleDelegation);
    ElMessage.success("示例委托创建成功！");
  } catch (error) {
    ElMessage.error("创建失败: " + (error as Error).message);
  }
};
</script>

<style scoped>
.workflow-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-content {
  padding: 20px;
}

.feature-intro {
  text-align: center;
  margin-bottom: 40px;
}

.feature-intro h3 {
  color: #2c3e50;
  font-size: 2em;
  margin-bottom: 16px;
}

.feature-intro p {
  color: #666;
  font-size: 1.1em;
  line-height: 1.6;
}

.features-grid {
  margin-bottom: 40px;
}

.feature-card {
  display: flex;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  margin-right: 20px;
  flex-shrink: 0;
}

.feature-content h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 1.3em;
}

.feature-content ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.feature-content li {
  margin-bottom: 6px;
  line-height: 1.5;
}

.quick-actions {
  text-align: center;
  margin: 40px 0;
  padding: 30px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.quick-actions h3 {
  margin: 0 0 24px 0;
  color: #409eff;
  font-size: 1.5em;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.usage-guide {
  margin: 40px 0;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 12px;
}

.usage-guide h3 {
  margin: 0 0 24px 0;
  color: #2c3e50;
  font-size: 1.5em;
}

.tech-features {
  margin: 40px 0;
}

.tech-features h3 {
  margin: 0 0 24px 0;
  color: #2c3e50;
  font-size: 1.5em;
  text-align: center;
}

.tech-item {
  text-align: center;
  padding: 20px;
}

.tech-icon {
  font-size: 2.5em;
  color: #409eff;
  margin-bottom: 12px;
}

.tech-item h5 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.tech-item p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-demo {
    padding: 10px;
  }

  .demo-content {
    padding: 10px;
  }

  .feature-card {
    flex-direction: column;
    text-align: center;
  }

  .feature-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-buttons .el-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
