import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import router from "./router";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus);

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error("Vue全局错误:", err);
  console.error("错误信息:", info);

  // 忽略组件卸载时的错误
  if (err && typeof err === "object" && "message" in err) {
    const errorMessage = (err as any).message;
    if (
      errorMessage &&
      (errorMessage.includes("Cannot destructure property") ||
        errorMessage.includes("vnode") ||
        errorMessage.includes("unmount"))
    ) {
      console.warn("忽略组件卸载相关错误:", errorMessage);
      return;
    }
  }

  // 其他错误正常处理
  console.error("未处理的错误:", err);
};

// 初始化存储
import { useUserStore } from "./stores/user";
import { useNotificationStore } from "./stores/notification";

const userStore = useUserStore();
const notificationStore = useNotificationStore();

// 初始化存储
userStore.initialize();
notificationStore.initialize();

app.mount("#app");
