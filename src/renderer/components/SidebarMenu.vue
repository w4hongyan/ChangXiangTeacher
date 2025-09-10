<template>
  <div class="sidebar" :class="{ collapsed: settingsStore.sidebarCollapsed }">
    <div class="sidebar-header">
      <div class="logo" v-show="!settingsStore.sidebarCollapsed">
        <el-icon class="logo-icon"><School /></el-icon>
        <span class="logo-text">畅享教学</span>
      </div>
      <div class="logo-mini" v-show="settingsStore.sidebarCollapsed">
        <el-icon class="logo-icon"><School /></el-icon>
      </div>
    </div>

    <el-menu
      :default-active="$route.path"
      :collapse="settingsStore.sidebarCollapsed"
      :router="true"
      class="sidebar-menu"
    >
      <el-menu-item index="/">
        <el-icon><House /></el-icon>
        <template #title>首页</template>
      </el-menu-item>

      <el-menu-item index="/classes">
        <el-icon><School /></el-icon>
        <template #title>班级管理</template>
      </el-menu-item>

      <el-menu-item index="/students">
        <el-icon><User /></el-icon>
        <template #title>学生管理</template>
      </el-menu-item>

      <el-menu-item index="/seating">
        <el-icon><Grid /></el-icon>
        <template #title>排位管理</template>
      </el-menu-item>

      <el-menu-item index="/grades">
        <el-icon><TrendCharts /></el-icon>
        <template #title>成绩管理</template>
      </el-menu-item>

      <el-menu-item index="/points">
        <el-icon><Trophy /></el-icon>
        <template #title>积分管理</template>
      </el-menu-item>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer">
      <el-button
        type="text"
        @click="settingsStore.toggleSidebar"
        class="collapse-btn"
      >
        <el-icon>
          <DArrowLeft v-if="!settingsStore.sidebarCollapsed" />
          <DArrowRight v-else />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  House,
  School,
  User,
  Grid,
  TrendCharts,
  Trophy,
  Setting,
  DArrowLeft,
  DArrowRight
} from '@element-plus/icons-vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()
</script>

<style scoped>
.sidebar {
  width: 200px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: bold;
}

.logo-mini {
  color: white;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

.collapse-btn {
  color: #909399;
}

.collapse-btn:hover {
  color: #667eea;
}

/* 深色主题 */
:global(.dark-theme) .sidebar {
  background: #141414;
  border-right-color: #303030;
}

:global(.dark-theme) .sidebar-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

:global(.dark-theme) .sidebar-footer {
  border-top-color: #303030;
}
</style>