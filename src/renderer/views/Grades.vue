<template>
  <Layout>
    <div class="grades-container">
      <div class="page-header">
        <h1>成绩管理</h1>
        <p>管理学生成绩，包括成绩录入、统计分析、趋势图表等功能</p>
      </div>

      <div class="content">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成绩管理</span>
              <el-button type="primary">录入成绩</el-button>
            </div>
          </template>
          
          <div class="coming-soon">
            <el-empty description="成绩管理功能正在开发中，敬请期待...">
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
.grades-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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