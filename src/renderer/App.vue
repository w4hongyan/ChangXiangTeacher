<template>
  <div id="app" :class="{ 'dark-theme': isDarkMode }">
    <el-config-provider :locale="zhCn">
      <router-view />
      <!-- 更新通知组件 -->
      <UpdateNotification ref="updateNotificationRef" />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useSettingsStore } from './stores/settings'
import UpdateNotification from './components/UpdateNotification.vue'

const settingsStore = useSettingsStore()
const isDarkMode = ref(false)

onMounted(() => {
  isDarkMode.value = settingsStore.isDarkMode
})
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dark-theme {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%) !important;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
}
</style>