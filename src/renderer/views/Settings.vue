<template>
  <Layout>
    <div class="settings-container">
      <div class="page-header">
        <h1>系统设置</h1>
        <p>配置系统参数，个性化您的教学管理工具</p>
      </div>

      <div class="content">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统配置</span>
            </div>
          </template>
          
          <div class="coming-soon">
            <el-empty description="系统设置功能正在开发中，敬请期待...">
              <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
            </el-empty>
          </div>
        </el-card>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import Layout from './Layout.vue'
</script>

<style scoped>
.settings-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.content {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coming-soon {
  padding: 40px 0;
}
</style>