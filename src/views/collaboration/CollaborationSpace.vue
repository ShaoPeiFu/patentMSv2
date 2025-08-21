<template>
  <div class="collaboration-space">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="panel">
          <template #header>
            <div class="channel-header">
              <span>频道</span>
              <el-button
                size="small"
                type="primary"
                @click="showCreateChannelDialog = true"
              >
                <el-icon><Plus /></el-icon>
                新建
              </el-button>
            </div>
          </template>
          <el-menu
            :default-active="String(activeChannelId)"
            @select="onSelectChannel"
            v-loading="collab.loading"
          >
            <el-menu-item
              v-for="ch in collab.channels"
              :index="String(ch.id)"
              :key="ch.id"
            >
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ ch.name }}</span>
              <el-tag size="small" type="info" class="member-count">
                {{ ch.memberCount }}
              </el-tag>
            </el-menu-item>
            <el-empty
              v-if="!collab.loading && collab.channels.length === 0"
              description="暂无频道"
            />
          </el-menu>
        </el-card>

        <el-card class="panel" style="margin-top: 12px">
          <template #header>
            <div class="member-header">
              <span>成员</span>
              <div v-if="activeChannelId && canManageMembers">
                <el-button size="small" @click="showAddMemberDialog = true">
                  <el-icon><User /></el-icon>
                  添加
                </el-button>
              </div>
            </div>
          </template>
          <el-scrollbar max-height="260px">
            <div v-if="activeChannelId && activeChannelMembers.length > 0">
              <div class="member" v-for="m in activeChannelMembers" :key="m.id">
                <el-avatar :size="24">{{ m.name.slice(0, 1) }}</el-avatar>
                <span class="name">{{ m.name }}</span>
                <el-tag size="small" :type="getRoleType(m.role)">{{
                  getRoleText(m.role)
                }}</el-tag>
                <el-dropdown
                  v-if="canManageMember(m)"
                  trigger="click"
                  @command="handleMemberAction"
                >
                  <el-button size="small" text>
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :command="{
                          action: 'remove',
                          channelId: activeChannelId,
                          userId: m.id,
                        }"
                        style="color: #f56c6c"
                      >
                        <el-icon><Close /></el-icon>
                        移除成员
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <el-empty v-else description="请选择频道查看成员" />
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :span="18">
        <RealtimeComments
          v-if="activeChannelId"
          :channel-id="activeChannelId"
        />
        <el-empty v-else description="请选择频道开始聊天" />
      </el-col>
    </el-row>

    <!-- 创建频道对话框 -->
    <el-dialog
      v-model="showCreateChannelDialog"
      title="创建新频道"
      width="500px"
    >
      <el-form
        :model="createChannelForm"
        :rules="createChannelRules"
        ref="createChannelFormRef"
      >
        <el-form-item label="频道名称" prop="name">
          <el-input
            v-model="createChannelForm.name"
            placeholder="请输入频道名称"
          />
        </el-form-item>
        <el-form-item label="频道描述" prop="description">
          <el-input
            v-model="createChannelForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入频道描述（可选）"
          />
        </el-form-item>
        <el-form-item label="频道类型" prop="type">
          <el-select
            v-model="createChannelForm.type"
            placeholder="选择频道类型"
          >
            <el-option label="通用频道" value="general" />
            <el-option label="项目频道" value="project" />
            <el-option label="团队频道" value="team" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateChannelDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleCreateChannel"
          :loading="collab.loading"
        >
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加成员" width="500px">
      <el-form>
        <el-form-item label="选择用户">
          <el-select
            v-model="selectedUserIds"
            multiple
            placeholder="请选择要添加的用户"
            style="width: 100%"
            :loading="collab.loading"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.realName || user.username} (${user.department})`"
              :value="user.id"
            >
              <div style="display: flex; justify-content: space-between">
                <span>{{ user.realName || user.username }}</span>
                <span style="color: #8492a6; font-size: 13px">{{
                  user.department
                }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="成员角色">
          <el-radio-group v-model="newMemberRole">
            <el-radio value="member">普通成员</el-radio>
            <el-radio value="moderator">协管员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddMembers"
          :loading="collab.loading"
          :disabled="selectedUserIds.length === 0"
        >
          添加成员
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useCollaborationStore } from "@/stores/collaboration";
import { useUserStore } from "@/stores/user";
import RealtimeComments from "@/components/collab/RealtimeComments.vue";
import { ChatDotRound, Plus, User, More, Close } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance } from "element-plus";

const collab = useCollaborationStore();
const userStore = useUserStore();

// 响应式数据
const activeChannelId = ref<number>(0);
const showCreateChannelDialog = ref(false);
const showAddMemberDialog = ref(false);
const createChannelFormRef = ref<FormInstance>();
const selectedUserIds = ref<number[]>([]);
const newMemberRole = ref("member");

const createChannelForm = ref({
  name: "",
  description: "",
  type: "general",
});

const createChannelRules = {
  name: [
    { required: true, message: "请输入频道名称", trigger: "blur" },
    {
      min: 2,
      max: 20,
      message: "频道名称长度在 2 到 20 个字符",
      trigger: "blur",
    },
  ],
  type: [{ required: true, message: "请选择频道类型", trigger: "change" }],
};

// 计算属性
const activeChannelMembers = computed(() => {
  if (!activeChannelId.value) return [];
  const channel = collab.channels.find((ch) => ch.id === activeChannelId.value);
  return channel?.members || [];
});

const activeChannel = computed(() => {
  if (!activeChannelId.value) return null;
  return collab.channels.find((ch) => ch.id === activeChannelId.value) || null;
});

const currentUser = computed(() => userStore.currentUser);

const canManageMembers = computed(() => {
  if (!activeChannelId.value || !currentUser.value) return false;
  const myMembership = activeChannelMembers.value.find(
    (m) => m.id === currentUser.value.id
  );
  return (
    (myMembership &&
      (myMembership.role === "admin" || myMembership.role === "moderator")) ||
    activeChannel.value?.createdBy === currentUser.value.id
  );
});

const availableUsers = computed(() => {
  // 过滤掉已经是频道成员的用户
  const memberIds = activeChannelMembers.value.map((m) => m.id);
  return collab.allUsers.filter((user) => !memberIds.includes(user.id));
});

// 方法
const onSelectChannel = (index: string) => {
  activeChannelId.value = Number(index);
};

const handleCreateChannel = async () => {
  if (!createChannelFormRef.value) return;

  try {
    await createChannelFormRef.value.validate();

    const result = await collab.createChannel({
      name: createChannelForm.value.name,
      description: createChannelForm.value.description,
      type: createChannelForm.value.type,
    });

    if (result) {
      showCreateChannelDialog.value = false;
      createChannelForm.value = {
        name: "",
        description: "",
        type: "general",
      };

      // 自动选择新创建的频道
      activeChannelId.value = result.id;
    }
  } catch (error) {
    console.error("创建频道失败:", error);
  }
};

const canManageMember = (member: any) => {
  if (!currentUser.value) return false;

  // 不能管理自己
  if (member.id === currentUser.value.id) return false;

  // 不能移除频道创建者
  if (activeChannel.value?.createdBy === member.id) return false;

  // 只有管理员和协管员可以管理成员
  return canManageMembers.value;
};

const handleMemberAction = async (command: any) => {
  if (command.action === "remove") {
    await handleRemoveMember(command.channelId, command.userId);
  }
};

const handleRemoveMember = async (channelId: number, userId: number) => {
  const member = activeChannelMembers.value.find((m) => m.id === userId);
  if (!member) return;

  try {
    await ElMessageBox.confirm(
      `确定要移除成员 ${member.name} 吗？`,
      "确认移除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const success = await collab.removeMember(channelId, userId);
    if (success) {
      // 成功消息已经在store中显示了
    }
  } catch (error) {
    // 用户取消了操作
  }
};

const handleAddMembers = async () => {
  if (selectedUserIds.value.length === 0) return;

  try {
    const result = await collab.addChannelMembers(activeChannelId.value, {
      userIds: selectedUserIds.value,
      role: newMemberRole.value,
    });

    if (result) {
      showAddMemberDialog.value = false;
      selectedUserIds.value = [];
      newMemberRole.value = "member";
    }
  } catch (error) {
    console.error("添加成员失败:", error);
  }
};

const getRoleType = (role: string) => {
  switch (role) {
    case "admin":
      return "danger";
    case "moderator":
      return "warning";
    default:
      return "info";
  }
};

const getRoleText = (role: string) => {
  switch (role) {
    case "admin":
      return "管理员";
    case "moderator":
      return "协管员";
    default:
      return "成员";
  }
};

onMounted(async () => {
  await collab.initializeCollaboration();

  // 如果有频道，自动选择第一个
  if (collab.channels.length > 0) {
    activeChannelId.value = collab.channels[0].id;
  }
});
</script>

<style scoped>
.collaboration-space {
  padding: 16px;
}

.panel {
  height: auto;
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-count {
  margin-left: auto;
}

.member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  transition: background-color 0.2s;
  position: relative;
}

.member:hover {
  background: #f5f7fa;
}

.member .name {
  flex: 1;
  font-size: 14px;
}
</style>
