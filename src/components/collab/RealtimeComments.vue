<template>
  <el-card class="realtime-comments">
    <template #header>
      <div class="header">
        <span>实时评论</span>
        <el-tag type="info">频道：{{ channelName }}</el-tag>
        <el-button
          size="small"
          @click="refreshMessages"
          :loading="collab.loading"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </template>

    <div class="comment-list" v-loading="collab.loading">
      <el-empty
        v-if="!collab.loading && channelComments.length === 0"
        description="暂无评论"
      />
      <div v-else class="items">
        <div v-for="msg in channelComments" :key="msg.id" class="item">
          <div class="meta">
            <el-tag size="small" :type="getAuthorTagType(msg.authorId)">{{
              msg.authorName
            }}</el-tag>
            <span class="time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div class="content">{{ msg.content }}</div>
        </div>
      </div>
    </div>

    <div class="composer">
      <el-input
        v-model="draft"
        type="textarea"
        :rows="3"
        placeholder="输入评论并按下 Enter 发送（支持多行）"
        @keydown.enter.exact.prevent="send"
        :disabled="collab.loading"
      />
      <div class="actions">
        <el-button
          type="primary"
          :disabled="!draft.trim() || collab.loading"
          @click="send"
        >
          发送
        </el-button>
        <el-button @click="draft = ''" :disabled="collab.loading"
          >清空</el-button
        >
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useCollaborationStore } from "@/stores/collaboration";
import { useUserStore } from "@/stores/user";
import { Refresh } from "@element-plus/icons-vue";

const props = defineProps<{ channelId: number }>();

const collab = useCollaborationStore();
const userStore = useUserStore();
const draft = ref("");

const channel = computed(() =>
  collab.channels.find((c) => c.id === props.channelId)
);

const channelName = computed(
  () => channel.value?.name || `#${props.channelId}`
);

const channelComments = computed(() =>
  collab.messages.filter((c) => c.channelId === props.channelId)
);

const currentUser = computed(() => userStore.currentUser);

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    return iso;
  }
};

const getAuthorTagType = (authorId: number) => {
  if (!currentUser.value) return "info";
  return authorId === currentUser.value.id ? "success" : "info";
};

const send = async () => {
  if (!draft.value.trim() || !currentUser.value) return;

  try {
    const result = await collab.sendMessage(props.channelId, {
      content: draft.value.trim(),
      type: "text",
    });

    if (result) {
      draft.value = "";
    }
  } catch (error) {
    console.error("发送消息失败:", error);
  }
};

const refreshMessages = async () => {
  await collab.loadChannelMessages(props.channelId, 1, 50);
};

// 监听频道变化，自动加载消息
watch(
  () => props.channelId,
  async (newChannelId) => {
    if (newChannelId) {
      await collab.loadChannelMessages(newChannelId, 1, 50);
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (props.channelId) {
    await collab.loadChannelMessages(props.channelId, 1, 50);
  }
});
</script>

<style scoped>
.realtime-comments {
  margin-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.comment-list {
  padding: 10px 0;
  min-height: 200px;
}

.items .item {
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.items .item:last-child {
  border-bottom: none;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
}

.content {
  margin-top: 6px;
  white-space: pre-wrap;
  line-height: 1.5;
}

.composer {
  margin-top: 12px;
}

.actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
