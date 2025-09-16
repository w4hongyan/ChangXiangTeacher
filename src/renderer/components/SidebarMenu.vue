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

      <!-- 基础管理 -->
      <el-sub-menu index="basic">
        <template #title>
          <el-icon><School /></el-icon>
          <span>基础管理</span>
        </template>
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
      </el-sub-menu>

      <!-- 教学工具 -->
      <el-sub-menu index="teaching">
        <template #title>
          <el-icon><UserFilled /></el-icon>
          <span>教学工具</span>
        </template>
        <el-menu-item index="/attendance">
          <el-icon><UserFilled /></el-icon>
          <template #title>班级点名</template>
        </el-menu-item>
        <el-menu-item index="/homework">
          <el-icon><Document /></el-icon>
          <template #title>作业管理</template>
        </el-menu-item>
        <el-menu-item index="/lottery">
          <el-icon><Operation /></el-icon>
          <template #title>课堂抽签</template>
        </el-menu-item>
        <el-menu-item index="/grades">
          <el-icon><TrendCharts /></el-icon>
          <template #title>成绩管理</template>
        </el-menu-item>
        <el-menu-item index="/grade-reports">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>成绩报告</template>
        </el-menu-item>
        <el-menu-item index="/points">
          <el-icon><Trophy /></el-icon>
          <template #title>积分管理</template>
        </el-menu-item>
        <el-menu-item index="/quick-points">
          <el-icon><Star /></el-icon>
          <template #title>快速积分</template>
        </el-menu-item>
        <el-menu-item index="/shop">
          <el-icon><ShoppingBag /></el-icon>
          <template #title>积分商城</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- AI智能助手 -->
      <el-sub-menu index="ai">
        <template #title>
          <el-icon><ChatDotRound /></el-icon>
          <span>AI智能助手</span>
        </template>
        <el-menu-item index="/ai-assistant">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>智能助手总览</template>
        </el-menu-item>
        <el-menu-item index="/qa-assistant">
          <el-icon><QuestionFilled /></el-icon>
          <template #title>教学问答</template>
        </el-menu-item>
        <el-menu-item index="/lesson-prep-assistant">
          <el-icon><Document /></el-icon>
          <template #title>备课助手</template>
        </el-menu-item>
        <el-menu-item index="/ai/essay-grading">
          <el-icon><EditPen /></el-icon>
          <template #title>作文批改</template>
        </el-menu-item>
        <el-menu-item index="/ai/resources">
          <el-icon><FolderOpened /></el-icon>
          <template #title>教育资源</template>
        </el-menu-item>
        <el-menu-item index="/ai/multimedia">
          <el-icon><VideoCamera /></el-icon>
          <template #title>多媒体工具</template>
        </el-menu-item>
        <el-menu-item index="/ai/schedule">
          <el-icon><Clock /></el-icon>
          <template #title>日程提醒</template>
        </el-menu-item>
        <el-menu-item index="/ai/ppt">
          <el-icon><Monitor /></el-icon>
          <template #title>AI PPT助手</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 系统功能 -->
      <el-sub-menu index="system">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统功能</span>
        </template>
        <el-menu-item index="/schedule">
          <el-icon><Calendar /></el-icon>
          <template #title>课程表管理</template>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Clock /></el-icon>
          <template #title>学期日历</template>
        </el-menu-item>
        <el-menu-item index="/templates">
          <el-icon><Document /></el-icon>
          <template #title>文档模板</template>
        </el-menu-item>
        <el-menu-item index="/data-backup">
          <el-icon><FolderOpened /></el-icon>
          <template #title>数据备份</template>
        </el-menu-item>
        <el-menu-item index="/cloud">
          <el-icon><Upload /></el-icon>
          <template #title>云存储管理</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-sub-menu>
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
  ShoppingBag,
  Calendar,
  Clock,
  Document,
  Setting,
  DArrowLeft,
  DArrowRight,
  UserFilled,
  FolderOpened,
  Upload,
  Operation,
  DataAnalysis,
  ChatDotRound,
  Star,
  QuestionFilled,
  EditPen,
  VideoCamera,
  Monitor
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

.sidebar-menu .el-sub-menu__title {
  height: 48px;
  line-height: 48px;
  font-weight: 500;
}

.sidebar-menu .el-menu-item {
  height: 40px;
  line-height: 40px;
  padding-left: 50px !important;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  background-color: rgba(0, 0, 0, 0.02);
}

.sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
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

:global(.dark-theme) .sidebar-menu .el-sub-menu .el-menu-item {
  background-color: rgba(255, 255, 255, 0.05);
}

:global(.dark-theme) .sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.2);
}
</style>