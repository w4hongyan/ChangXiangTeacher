<template>
  <div class="header">
    <div class="header-left">
      <h1 class="page-title">{{ $route.meta.title || '畅想教师工具' }}</h1>
    </div>

    <div class="header-right">
      <el-switch
        v-model="settingsStore.isDarkMode"
        @change="settingsStore.toggleDarkMode"
        inline-prompt
        active-text="🌙"
        inactive-text="☀️"
        style="margin-right: 20px"
      />

      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <span class="username">张老师</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item>
              <el-icon><Setting /></el-icon>
              账号设置
            </el-dropdown-item>
            <el-dropdown-item divided>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()
</script>

<style scoped>
.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
}

/* 深色主题 */
:global(.dark-theme) .header {
  background: #141414;
  border-bottom-color: #303030;
}

:global(.dark-theme) .page-title {
  color: #e6e6e6;
}

:global(.dark-theme) .user-info:hover {
  background-color: #1f1f1f;
}

:global(.dark-theme) .username {
  color: #e6e6e6;
}
</style>