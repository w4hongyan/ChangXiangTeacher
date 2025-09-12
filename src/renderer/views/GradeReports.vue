<template>
  <Layout>
    <div class="grade-reports-view">
      <div class="page-header">
        <h2>成绩报告管理</h2>
        <p class="page-description">生成和管理各类成绩分析报告</p>
      </div>

      <GradeReports />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import Layout from './Layout.vue'
import GradeReports from '../components/reports/GradeReports.vue'
</script>

<style scoped>
.grade-reports-view {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 600;
}

.page-description {
  color: #606266;
  font-size: 16px;
  margin: 0;
}
</style>