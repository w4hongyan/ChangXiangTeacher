<template>
  <div class="sidebar-menu">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical"
      :collapse="isCollapse"
      @select="handleSelect"
    >
      <el-menu-item index="/home">
        <el-icon><House /></el-icon>
        <template #title>首页</template>
      </el-menu-item>
      
      <el-menu-item index="/classes">
        <el-icon><Collection /></el-icon>
        <template #title>班级管理</template>
      </el-menu-item>
      
      <el-menu-item index="/students">
        <el-icon><User /></el-icon>
        <template #title>学生管理</template>
      </el-menu-item>
      
      <el-menu-item index="/seating">
        <el-icon><Monitor /></el-icon>
        <template #title>排位管理</template>
      </el-menu-item>
      
      <el-menu-item index="/grades">
        <el-icon><TrendCharts /></el-icon>
        <template #title>成绩管理</template>
      </el-menu-item>
      
      <el-menu-item index="/points">
        <el-icon><Star /></el-icon>
        <template #title>积分管理</template>
      </el-menu-item>
      
      <el-menu-item index="/schedules">
        <el-icon><Calendar /></el-icon>
        <template #title>课程表</template>
      </el-menu-item>
      
      <el-menu-item index="/calendar">
        <el-icon><Date /></el-icon>
        <template #title>学期日历</template>
      </el-menu-item>
      
      <el-menu-item index="/documents"> <!-- 添加这一项 -->
        <el-icon><Document /></el-icon>
        <template #title>文档模板</template>
      </el-menu-item>
      
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  House,
  Collection,
  User,
  Monitor,
  TrendCharts,
  Star,
  Calendar,
  Date,
  Document, // 添加这一行
  Setting
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)

const activeIndex = computed(() => route.path)

const handleSelect = (index: string) => {
  router.push(index)
}

// 暴露给父组件的方法
defineExpose({
  toggleCollapse: () => {
    isCollapse.value = !isCollapse.value
  }
})
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  overflow-y: auto;
}

.el-menu-vertical {
  height: 100%;
  border-right: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}
</style>