<template>
  <div class="layout-container">
    <el-container>
      <el-aside :width="isSidebarCollapsed ? '64px' : '200px'" class="sidebar-aside">
        <SidebarMenu ref="sidebarRef" />
      </el-aside>
      
      <el-container>
        <el-header class="header-container">
          <HeaderBar @toggle-sidebar="toggleSidebar" />
        </el-header>
        
        <el-main class="main-container">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SidebarMenu from '../components/SidebarMenu.vue'
import HeaderBar from '../components/HeaderBar.vue'

const sidebarRef = ref()
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  sidebarRef.value?.toggleCollapse()
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar-aside {
  background-color: #ffffff;
  border-right: 1px solid #e6e6e6;
  transition: width 0.3s ease;
}

.header-container {
  background-color: #ffffff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0;
  height: 60px;
}

.main-container {
  background-color: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}
</style>