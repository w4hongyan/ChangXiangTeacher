<template>
  <Layout>
    <div class="points-container">
      <div class="page-header">
        <h1>积分管理</h1>
        <p>管理学生积分，包括积分规则、积分录入、排行榜等功能</p>
      </div>

      <div class="content">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>积分管理</span>
              <el-button type="primary">添加积分记录</el-button>
            </div>
          </template>
          
          <div class="coming-soon">
            <el-empty description="积分管理功能正在开发中，敬请期待...">
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
.points-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: white;
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