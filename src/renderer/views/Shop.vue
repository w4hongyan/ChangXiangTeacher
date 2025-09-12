<template>
  <Layout>
    <div class="shop-page">
      <Shop />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import Layout from './Layout.vue'
import Shop from '../components/Shop.vue'
</script>

<style scoped>
.shop-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
</style>