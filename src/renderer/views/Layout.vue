<template>
  <div class="layout-container">
    <sidebar-menu />
    
    <div class="main-content">
      <header-bar />
      
      <div class="content-area">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SidebarMenu from '../components/SidebarMenu.vue'
import HeaderBar from '../components/HeaderBar.vue'
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
}

.dark-theme .content-area {
  background: #141414;
}
</style>