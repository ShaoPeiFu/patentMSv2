import { ref, computed } from 'vue';

export interface WebSocketMessage {
  type: 'comment' | 'notification' | 'edit' | 'status' | 'typing' | 'presence';
  data: any;
  sender: string;
  timestamp: number;
  roomId?: string;
}

export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  currentPage?: string;
}

export interface Comment {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: number;
  patentId?: string;
  documentId?: string;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  type: 'comment' | 'edit' | 'mention' | 'system';
  title: string;
  message: string;
  sender?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export class WebSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private heartbeatInterval: number | null = null;
  
  // 状态管理
  public isConnected = ref(false);
  public isConnecting = ref(false);
  public connectionError = ref<string | null>(null);
  
  // 数据管理
  public onlineUsers = ref<UserPresence[]>([]);
  public notifications = ref<Notification[]>([]);
  public comments = ref<Comment[]>([]);
  public typingUsers = ref<Set<string>>(new Set());
  
  // 计算属性
  public onlineUserCount = computed(() => 
    this.onlineUsers.value.filter(user => user.status === 'online').length
  );
  
  public unreadNotifications = computed(() => 
    this.notifications.value.filter(n => !n.read).length
  );

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  // 连接WebSocket
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting.value = true;
      this.connectionError.value = null;

      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.isConnected.value = true;
          this.isConnecting.value = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.sendPresenceUpdate();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭:', event.code, event.reason);
          this.isConnected.value = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          this.connectionError.value = '连接失败，请检查网络';
          this.isConnecting.value = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting.value = false;
        this.connectionError.value = '连接初始化失败';
        reject(error);
      }
    });
  }

  // 断开连接
  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, '用户主动断开');
      this.ws = null;
    }
    this.isConnected.value = false;
    this.stopHeartbeat();
  }

  // 发送消息
  public send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  // 发送评论
  public sendComment(content: string, patentId?: string, documentId?: string, replyTo?: string): void {
    this.send({
      type: 'comment',
      data: {
        content,
        patentId,
        documentId,
        replyTo
      },
      sender: this.getCurrentUserId(),
      roomId: patentId || documentId
    });
  }

  // 发送编辑通知
  public sendEditNotification(patentId: string, field: string, value: string): void {
    this.send({
      type: 'edit',
      data: {
        patentId,
        field,
        value,
        action: 'editing'
      },
      sender: this.getCurrentUserId(),
      roomId: patentId
    });
  }

  // 发送在线状态
  public sendPresenceUpdate(): void {
    this.send({
      type: 'presence',
      data: {
        status: 'online',
        currentPage: window.location.pathname
      },
      sender: this.getCurrentUserId()
    });
  }

  // 发送正在输入状态
  public sendTypingStatus(patentId: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      data: {
        patentId,
        isTyping
      },
      sender: this.getCurrentUserId(),
      roomId: patentId
    });
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'comment':
        this.handleComment(message);
        break;
      case 'notification':
        this.handleNotification(message);
        break;
      case 'edit':
        this.handleEdit(message);
        break;
      case 'status':
        this.handleStatus(message);
        break;
      case 'typing':
        this.handleTyping(message);
        break;
      case 'presence':
        this.handlePresence(message);
        break;
      default:
        console.warn('未知消息类型:', message.type);
    }
  }

  // 处理评论消息
  private handleComment(message: WebSocketMessage): void {
    const comment: Comment = {
      id: Date.now().toString(),
      content: message.data.content,
      sender: message.sender,
      senderName: this.getUserName(message.sender),
      timestamp: message.timestamp,
      patentId: message.data.patentId,
      documentId: message.data.documentId,
      replies: []
    };

    if (message.data.replyTo) {
      // 添加到回复中
      const parentComment = this.comments.value.find(c => c.id === message.data.replyTo);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(comment);
      }
    } else {
      // 添加新评论
      this.comments.value.unshift(comment);
    }

    // 触发评论更新事件
    this.emitEvent('comment:new', comment);
  }

  // 处理通知消息
  private handleNotification(message: WebSocketMessage): void {
    const notification: Notification = {
      id: Date.now().toString(),
      type: message.data.type,
      title: message.data.title,
      message: message.data.message,
      sender: message.data.sender,
      timestamp: message.timestamp,
      read: false,
      actionUrl: message.data.actionUrl
    };

    this.notifications.value.unshift(notification);
    
    // 触发通知更新事件
    this.emitEvent('notification:new', notification);
    
    // 显示浏览器通知
    this.showBrowserNotification(notification);
  }

  // 处理编辑消息
  private handleEdit(message: WebSocketMessage): void {
    // 触发编辑更新事件
    this.emitEvent('edit:update', message.data);
  }

  // 处理状态消息
  private handleStatus(message: WebSocketMessage): void {
    // 触发状态更新事件
    this.emitEvent('status:update', message.data);
  }

  // 处理正在输入状态
  private handleTyping(message: WebSocketMessage): void {
    if (message.data.isTyping) {
      this.typingUsers.value.add(message.sender);
    } else {
      this.typingUsers.value.delete(message.sender);
    }
    
    // 触发输入状态更新事件
    this.emitEvent('typing:update', {
      userId: message.sender,
      isTyping: message.data.isTyping
    });
  }

  // 处理在线状态
  private handlePresence(message: WebSocketMessage): void {
    const userIndex = this.onlineUsers.value.findIndex(u => u.userId === message.sender);
    const userPresence: UserPresence = {
      userId: message.sender,
      username: this.getUserName(message.sender),
      status: message.data.status,
      lastSeen: Date.now(),
      currentPage: message.data.currentPage
    };

    if (userIndex >= 0) {
      this.onlineUsers.value[userIndex] = userPresence;
    } else {
      this.onlineUsers.value.push(userPresence);
    }

    // 触发在线状态更新事件
    this.emitEvent('presence:update', userPresence);
  }

  // 心跳检测
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // 30秒发送一次心跳
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 重连机制
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect().catch(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
    }, this.reconnectInterval);
  }

  // 事件系统
  private eventListeners: Map<string, Function[]> = new Map();

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('事件回调执行错误:', error);
        }
      });
    }
  }

  // 浏览器通知
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }

  // 工具方法
  private getCurrentUserId(): string {
    // 从用户store或localStorage获取当前用户ID
    const userStore = JSON.parse(localStorage.getItem('user') || '{}');
    return userStore.id || 'anonymous';
  }

  private getUserName(userId: string): string {
    // 从在线用户列表或缓存中获取用户名
    const user = this.onlineUsers.value.find(u => u.userId === userId);
    return user?.username || userId;
  }

  // 清理资源
  public cleanup(): void {
    this.disconnect();
    this.eventListeners.clear();
    this.onlineUsers.value = [];
    this.notifications.value = [];
    this.comments.value = [];
    this.typingUsers.value.clear();
  }
}

// 创建单例实例
export const websocketService = new WebSocketService();
