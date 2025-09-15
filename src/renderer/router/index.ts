import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/classes',
    name: 'Classes',
    component: () => import('../views/Classes.vue'),
    meta: {
      title: '班级管理'
    }
  },
  {
    path: '/students',
    name: 'Students',
    component: () => import('../views/Students.vue'),
    meta: {
      title: '学生管理'
    }
  },
  {
    path: '/seating',
    name: 'Seating',
    component: () => import('../views/Seating.vue'),
    meta: {
      title: '排位管理'
    }
  },
  {
    path: '/grades',
    name: 'Grades',
    component: () => import('../views/Grades.vue'),
    meta: {
      title: '成绩管理'
    }
  },
  {
    path: '/grade-reports',
    name: 'GradeReports',
    component: () => import('../views/GradeReports.vue'),
    meta: {
      title: '成绩报告'
    }
  },
  {
    path: '/points',
    name: 'Points',
    component: () => import('../views/Points.vue'),
    meta: {
      title: '积分管理'
    }
  },
  {
    path: '/quick-points',
    name: 'QuickPoints',
    component: () => import('../views/QuickPoints.vue'),
    meta: {
      title: '快速积分'
    }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../views/Shop.vue'),
    meta: {
      title: '积分商城'
    }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('../views/Attendance.vue'),
    meta: { title: '班级点名' }
  },
  {
    path: '/homework',
    name: 'Homework',
    component: () => import('../views/Homework.vue'),
    meta: { title: '作业管理' }
  },
  {
    path: '/homework/:id/submissions',
    name: 'HomeworkSubmissions',
    component: () => import('../views/HomeworkSubmissions.vue'),
    meta: { title: '作业提交管理' }
  },
  {
    path: '/ai-assistant',
    name: 'AIAssistant',
    component: () => import('../views/AIAssistant.vue'),
    meta: { title: 'AI智能助手' }
  },
  {
    path: '/ai/qa',
    name: 'QAAssistant',
    component: () => import('../views/QAAssistant.vue'),
    meta: { title: '教学问答' }
  },
  {
    path: '/ai/lesson-prep',
    name: 'LessonPrepAssistant',
    component: () => import('../views/LessonPrepAssistant.vue'),
    meta: { title: '备课助手' }
  },
  {
    path: '/ai/essay-grading',
    name: 'EssayGradingAssistant',
    component: () => import('../views/EssayGradingAssistant.vue'),
    meta: { title: '作文批改' }
  },
  {
    path: '/ai/resources',
    name: 'EducationResourcesAssistant',
    component: () => import('../views/EducationResourcesAssistant.vue'),
    meta: { title: '教育资源' }
  },
  {
    path: '/ai/multimedia',
    name: 'MultimediaToolsAssistant',
    component: () => import('../views/MultimediaToolsAssistant.vue'),
    meta: { title: '多媒体工具' }
  },
  {
    path: '/ai/schedule',
    name: 'ScheduleAssistant',
    component: () => import('../views/ScheduleAssistant.vue'),
    meta: { title: '日程提醒' }
  },
  {
    path: '/ai/ppt',
    name: 'AIPPTAssistant',
    component: () => import('../views/AIPPTAssistant.vue'),
    meta: { title: 'AI PPT助手' }
  },
  {
    path: '/lottery',
    name: 'Lottery',
    component: () => import('../views/Lottery.vue'),
    meta: { title: '课堂抽签' }
  },
  {
      path: '/backup',
      name: 'Backup',
      component: () => import('../views/Backup.vue'),
      meta: { title: '数据备份' }
    },
    {
      path: '/cloud',
      name: 'Cloud',
      component: () => import('../views/Cloud.vue'),
      meta: { title: '云存储管理' }
    },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('../views/Schedule.vue'),
    meta: {
      title: '课程表管理'
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../views/Calendar.vue'),
    meta: {
      title: '学期日历'
    }
  },
  {
    path: '/templates',
    name: 'Templates',
    component: () => import('../views/TemplatesEnhanced.vue'),
    meta: {
      title: '文档模板'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: {
      title: '系统设置'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '畅享教学工具'} - 畅享教学工具`
  next()
})

export default router