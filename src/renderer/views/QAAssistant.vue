<template>
  <Layout>
    <div class="qa-assistant">
      <div class="qa-header">
        <div class="header-left">
          <el-button @click="goBack" type="text" size="large">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>💬 教学问答助手</h2>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="createNewSession" size="small">
            <el-icon><Plus /></el-icon>
            新建对话
          </el-button>
        </div>
      </div>

      <div class="qa-container">
        <!-- 侧边栏 - 会话列表 -->
        <div class="qa-sidebar">
          <div class="session-header">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索对话..."
              size="small"
              @input="searchSessions"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="session-list">
            <div 
              v-for="session in filteredSessions" 
              :key="session.id"
              class="session-item"
              :class="{ active: currentSessionId === session.id }"
              @click="selectSession(session.id)"
            >
              <div class="session-title">{{ session.title }}</div>
              <div class="session-time">{{ formatTime(session.updatedAt) }}</div>
              <div class="session-actions">
                <el-button @click.stop="deleteSession(session.id)" type="text" size="small">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 主聊天区域 -->
        <div class="qa-main">
          <div v-if="!currentSessionId" class="welcome-screen">
            <div class="welcome-content">
              <el-icon size="64" color="#409EFF"><ChatDotRound /></el-icon>
              <h3>欢迎使用教学问答助手</h3>
              <p>选择一个对话或创建新对话开始使用</p>
              
              <div class="quick-questions">
                <h4>常见问题</h4>
                <div class="question-tags">
                  <el-tag 
                    v-for="question in quickQuestions" 
                    :key="question"
                    @click="askQuickQuestion(question)"
                    class="question-tag"
                  >
                    {{ question }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="chat-area">
            <!-- 消息列表 -->
            <div class="message-list" ref="messageListRef">
              <div 
                v-for="message in messages" 
                :key="message.id"
                class="message-item"
                :class="message.role"
              >
                <div class="message-avatar">
                  <el-avatar v-if="message.role === 'user'" :size="32">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <el-avatar v-else :size="32" style="background-color: #409EFF">
                    <el-icon><ChatDotRound /></el-icon>
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-text" v-html="formatMessage(message.content)"></div>
                  <div class="message-time">{{ formatTime(message.createdAt) }}</div>
                  <div v-if="message.role === 'assistant'" class="message-actions">
                    <el-button @click="copyMessage(message.content)" type="text" size="small">
                      <el-icon><DocumentCopy /></el-icon>
                      复制
                    </el-button>
                    <el-button @click="regenerateResponse(message.id)" type="text" size="small">
                      <el-icon><Refresh /></el-icon>
                      重新生成
                    </el-button>
                  </div>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="isLoading" class="message-item assistant">
                <div class="message-avatar">
                  <el-avatar :size="32" style="background-color: #409EFF">
                    <el-icon><ChatDotRound /></el-icon>
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="input-area">
              <div class="input-container">
                <el-input
                  v-model="inputMessage"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入您的问题..."
                  @keydown.ctrl.enter="sendMessage"
                  :disabled="isLoading"
                  resize="none"
                ></el-input>
                <div class="input-actions">
                  <div class="input-tips">
                    <span>Ctrl + Enter 发送</span>
                  </div>
                  <el-button 
                    type="primary" 
                    @click="sendMessage" 
                    :loading="isLoading"
                    :disabled="!inputMessage.trim()"
                  >
                    发送
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Delete, 
  ChatDotRound, 
  User, 
  DocumentCopy, 
  Refresh 
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// 响应式数据
const currentSessionId = ref<string | null>(null)
const sessions = ref<any[]>([])
const messages = ref<any[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const searchKeyword = ref('')
const messageListRef = ref<HTMLElement>()

// 快速问题
const quickQuestions = ref([
  '如何提高学生的学习兴趣？',
  '怎样设计有效的课堂活动？',
  '如何处理课堂纪律问题？',
  '怎样进行差异化教学？',
  '如何评估学生的学习效果？',
  '怎样与家长有效沟通？'
])

// 计算属性
const filteredSessions = computed(() => {
  if (!searchKeyword.value.trim()) {
    return sessions.value
  }
  return sessions.value.filter(session => 
    session.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 方法
const goBack = () => {
  router.push('/ai-assistant')
}

const createNewSession = async () => {
  try {
    const result = await window.electronAPI.ai.createSession('新对话', 'qa')
    if (result.success) {
      const newSession = {
        id: result.sessionId,
        title: '新对话',
        updatedAt: new Date().toISOString(),
        type: 'qa'
      }
      sessions.value.unshift(newSession)
      currentSessionId.value = result.sessionId
      messages.value = []
      ElMessage.success('创建新对话成功')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  }
}

const selectSession = async (sessionId: string) => {
  currentSessionId.value = sessionId
  await loadMessages(sessionId)
}

const loadMessages = async (sessionId: string) => {
  try {
    const result = await window.electronAPI.ai.getMessages(sessionId)
    if (result.success) {
      messages.value = result.messages
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    ElMessage.error('加载消息失败')
  }
}

const deleteSession = async (sessionId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '确认删除', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.ai.deleteSession(sessionId)
    if (result.success) {
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
        messages.value = []
      }
      ElMessage.success('删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error('删除会话失败')
    }
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  if (!currentSessionId.value) {
    await createNewSession()
    if (!currentSessionId.value) return
  }

  const userMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value.trim(),
    createdAt: new Date().toISOString()
  }

  messages.value.push(userMessage)
  const messageContent = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true

  await nextTick()
  scrollToBottom()

  try {
    const result = await window.electronAPI.ai.chat(currentSessionId.value, messageContent, 'qa')
    if (result.success) {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        createdAt: new Date().toISOString()
      }
      messages.value.push(assistantMessage)
      
      // 更新会话标题
      const session = sessions.value.find(s => s.id === currentSessionId.value)
      if (session && session.title === '新对话') {
        session.title = messageContent.length > 20 ? messageContent.substring(0, 20) + '...' : messageContent
      }
      if (session) {
        session.updatedAt = new Date().toISOString()
      }
    } else {
      ElMessage.error('发送消息失败: ' + result.error)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请检查网络连接')
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const askQuickQuestion = async (question: string) => {
  inputMessage.value = question
  await sendMessage()
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const regenerateResponse = async (messageId: string) => {
  const messageIndex = messages.value.findIndex(m => m.id === messageId)
  if (messageIndex === -1) return

  // 找到对应的用户消息
  const userMessageIndex = messageIndex - 1
  if (userMessageIndex < 0 || messages.value[userMessageIndex].role !== 'user') return

  const userMessage = messages.value[userMessageIndex].content
  
  // 删除原来的AI回复
  messages.value.splice(messageIndex, 1)
  
  isLoading.value = true
  
  try {
    const result = await window.electronAPI.ai.chat(currentSessionId.value!, userMessage, 'qa')
    if (result.success) {
      const newAssistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.response,
        createdAt: new Date().toISOString()
      }
      messages.value.splice(messageIndex, 0, newAssistantMessage)
    } else {
      ElMessage.error('重新生成失败: ' + result.error)
    }
  } catch (error) {
    console.error('重新生成失败:', error)
    ElMessage.error('重新生成失败')
  } finally {
    isLoading.value = false
  }
}

const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

const formatTime = (timeString: string) => {
  const time = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  } else {
    return time.toLocaleDateString()
  }
}

const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const searchSessions = () => {
  // 搜索功能已通过计算属性实现
}

const loadSessions = async () => {
  try {
    const result = await window.electronAPI.ai.getSessions('qa')
    if (result.success) {
      sessions.value = result.sessions
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.qa-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.qa-container {
  flex: 1;
  display: flex;
  height: calc(100vh - 80px);
}

.qa-sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.session-header {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.session-item:hover {
  background-color: #e9ecef;
}

.session-item.active {
  background-color: #409EFF;
  color: white;
}

.session-title {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  opacity: 0.7;
}

.session-actions {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-actions {
  opacity: 1;
}

.qa-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
  max-width: 500px;
}

.welcome-content h3 {
  margin: 16px 0 8px 0;
  color: #303133;
}

.welcome-content p {
  color: #606266;
  margin-bottom: 32px;
}

.quick-questions h4 {
  margin-bottom: 16px;
  color: #303133;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.question-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.question-tag:hover {
  background-color: #409EFF;
  color: white;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background-color: #409EFF;
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message-item.assistant .message-content {
  background-color: #f5f5f5;
  border-radius: 18px 18px 18px 4px;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  position: relative;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409EFF;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.input-area {
  border-top: 1px solid #e9ecef;
  padding: 16px;
  background: white;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-tips {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .qa-sidebar {
    width: 240px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>