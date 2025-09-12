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
    path: '/points',
    name: 'Points',
    component: () => import('../views/Points.vue'),
    meta: {
      title: '积分管理'
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