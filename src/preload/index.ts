import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Student, StudentFormData } from '../renderer/types/student'
import type { Class, ClassFormData } from '../renderer/types/class'
import type { Grade, GradeFormData, GradeQueryParams } from '../renderer/types/grade'
import type { PointRecord, PointRule, PointFormData, PointQueryParams } from '../renderer/types/point'
import type { Group, GroupFormData } from '../renderer/types/group'
import type { Schedule, ScheduleFormData } from '../renderer/types/schedule'
import type { Semester, CalendarEvent, SemesterFormData, CalendarEventFormData } from '../renderer/types/calendar'
import type { DocumentTemplate, DocumentTemplateFormData } from '../renderer/types/document'

// Custom APIs for main process
const api = {
  // 首页仪表板API
  dashboard: {
    getStats: (): Promise<{ success: boolean; data?: any; error?: string }> => 
      ipcRenderer.invoke('dashboard:getStats')
  },

  // 学生管理API
  students: {
    create: (data: StudentFormData): Promise<{ success: boolean; data?: Student; error?: string }> => 
      ipcRenderer.invoke('students:create', data),
    list: (params: { class_id?: number; page?: number; page_size?: number; search?: string }): Promise<{ success: boolean; data?: { students: Student[]; total: number }; error?: string }> => 
      ipcRenderer.invoke('students:list', params),
    getById: (id: number): Promise<{ success: boolean; data?: Student; error?: string }> => 
      ipcRenderer.invoke('students:getById', id),
    update: (id: number, data: Partial<StudentFormData>): Promise<{ success: boolean; data?: Student; error?: string }> => 
      ipcRenderer.invoke('students:update', id, data),
    delete: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('students:delete', id),
    batchDelete: (ids: number[]): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('students:batchDelete', ids),
    import: (file_path: string, class_id: number): Promise<{ success: boolean; data?: { success_count: number; error_count: number; errors: string[] }; error?: string }> => 
      ipcRenderer.invoke('students:import', file_path, class_id),
    export: (class_id: number, file_path: string): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('students:export', class_id, file_path),
    getTemplate: (): Promise<{ success: boolean; data?: { headers: string[]; sample: any[] }; error?: string }> => 
      ipcRenderer.invoke('students:getTemplate')
  },

  // 班级管理API
  classes: {
    create: (data: ClassFormData): Promise<{ success: boolean; data?: Class; error?: string }> => 
      ipcRenderer.invoke('classes:create', data),
    list: (): Promise<{ success: boolean; data?: Class[]; error?: string }> => 
      ipcRenderer.invoke('classes:list'),
    getById: (id: number): Promise<{ success: boolean; data?: Class; error?: string }> => 
      ipcRenderer.invoke('classes:getById', id),
    update: (id: number, data: Partial<ClassFormData>): Promise<{ success: boolean; data?: Class; error?: string }> => 
      ipcRenderer.invoke('classes:update', id, data),
    delete: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('classes:delete', id),
    batchUpgrade: (year: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('classes:batchUpgrade', year)
  },

  // 成绩管理API
  grades: {
    create: (data: GradeFormData): Promise<{ success: boolean; data?: Grade; error?: string }> => 
      ipcRenderer.invoke('grades:create', data),
    list: (params: GradeQueryParams): Promise<{ success: boolean; data?: { grades: Grade[]; total: number }; error?: string }> => 
      ipcRenderer.invoke('grades:list', params),
    getById: (id: number): Promise<{ success: boolean; data?: Grade; error?: string }> => 
      ipcRenderer.invoke('grades:getById', id),
    update: (id: number, data: Partial<GradeFormData>): Promise<{ success: boolean; data?: Grade; error?: string }> => 
      ipcRenderer.invoke('grades:update', id, data),
    delete: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('grades:delete', id),
    batchDelete: (ids: number[]): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('grades:batchDelete', ids),
    import: (file_path: string, class_id: number): Promise<{ success: boolean; data?: { success_count: number; error_count: number; errors: string[] }; error?: string }> => 
      ipcRenderer.invoke('grades:import', file_path, class_id),
    export: (params: GradeQueryParams, file_path: string): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('grades:export', params, file_path),
    getTemplate: (): Promise<{ success: boolean; data?: { headers: string[]; sample: any[] }; error?: string }> => 
      ipcRenderer.invoke('grades:getTemplate'),
    getStats: (params: GradeQueryParams): Promise<{ success: boolean; data?: any; error?: string }> => 
      ipcRenderer.invoke('grades:getStats', params)
  },

  // 积分管理API
  points: {
    create: (data: PointFormData): Promise<{ success: boolean; data?: PointRecord; error?: string }> => 
      ipcRenderer.invoke('points:create', data),
    list: (params: PointQueryParams): Promise<{ success: boolean; data?: { records: PointRecord[]; total: number }; error?: string }> => 
      ipcRenderer.invoke('points:list', params),
    getRules: (): Promise<{ success: boolean; data?: PointRule[]; error?: string }> => 
      ipcRenderer.invoke('points:getRules'),
    updateRule: (id: number, data: Partial<PointRule>): Promise<{ success: boolean; data?: PointRule; error?: string }> => 
      ipcRenderer.invoke('points:updateRule', id, data),
    createRule: (data: Partial<PointRule>): Promise<{ success: boolean; data?: PointRule; error?: string }> => 
      ipcRenderer.invoke('points:createRule', data),
    deleteRule: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('points:deleteRule', id),
    getStudentSummary: (student_id: number): Promise<{ success: boolean; data?: any; error?: string }> => 
      ipcRenderer.invoke('points:getStudentSummary', student_id),
    getClassRanking: (class_id: number): Promise<{ success: boolean; data?: any[]; error?: string }> => 
      ipcRenderer.invoke('points:getClassRanking', class_id)
  },

  // 小组管理API
  groups: {
    create: (data: GroupFormData): Promise<{ success: boolean; data?: Group; error?: string }> => 
      ipcRenderer.invoke('groups:create', data),
    list: (class_id: number): Promise<{ success: boolean; data?: Group[]; error?: string }> => 
      ipcRenderer.invoke('groups:list', class_id),
    getById: (id: number): Promise<{ success: boolean; data?: any; error?: string }> => 
      ipcRenderer.invoke('groups:getById', id),
    update: (id: number, data: Partial<GroupFormData>): Promise<{ success: boolean; data?: Group; error?: string }> => 
      ipcRenderer.invoke('groups:update', id, data),
    delete: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('groups:delete', id),
    addMember: (group_id: number, student_id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('groups:addMember', group_id, student_id),
    removeMember: (group_id: number, student_id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('groups:removeMember', group_id, student_id),
    getPoints: (group_id: number): Promise<{ success: boolean; data?: any[]; error?: string }> => 
      ipcRenderer.invoke('groups:getPoints', group_id)
  },

  // 课程表API
  schedules: {
    list: (): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => 
      ipcRenderer.invoke('schedules:list'),
    listByClassId: (class_id: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => 
      ipcRenderer.invoke('schedules:listByClassId', class_id),
    listByTeacherId: (teacher_id: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => 
      ipcRenderer.invoke('schedules:listByTeacherId', teacher_id),
    create: (data: ScheduleFormData): Promise<{ success: boolean; data?: Schedule; error?: string }> => 
      ipcRenderer.invoke('schedules:create', data),
    update: (id: number, data: ScheduleFormData): Promise<{ success: boolean; data?: Schedule; error?: string }> => 
      ipcRenderer.invoke('schedules:update', id, data),
    delete: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('schedules:delete', id),
    listClassSchedules: (class_id: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => 
      ipcRenderer.invoke('schedules:listClassSchedules', class_id),
    listTeacherSchedules: (teacher_id: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => 
      ipcRenderer.invoke('schedules:listTeacherSchedules', teacher_id)
  },

  // 日历API
  calendar: {
    // 学期相关
    listSemesters: (): Promise<{ success: boolean; data?: Semester[]; error?: string }> => 
      ipcRenderer.invoke('calendar:listSemesters'),
    getCurrentSemester: (): Promise<{ success: boolean; data?: Semester; error?: string }> => 
      ipcRenderer.invoke('calendar:getCurrentSemester'),
    createSemester: (data: SemesterFormData): Promise<{ success: boolean; data?: Semester; error?: string }> => 
      ipcRenderer.invoke('calendar:createSemester', data),
    updateSemester: (id: number, data: SemesterFormData): Promise<{ success: boolean; data?: Semester; error?: string }> => 
      ipcRenderer.invoke('calendar:updateSemester', id, data),
    deleteSemester: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('calendar:deleteSemester', id),
    setCurrentSemester: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('calendar:setCurrentSemester', id),
    
    // 事件相关
    listEventsByDateRange: (startDate: string, endDate: string): Promise<{ success: boolean; data?: CalendarEvent[]; error?: string }> => 
      ipcRenderer.invoke('calendar:listEventsByDateRange', startDate, endDate),
    listEventsByDate: (date: string): Promise<{ success: boolean; data?: CalendarEvent[]; error?: string }> => 
      ipcRenderer.invoke('calendar:listEventsByDate', date),
    createEvent: (data: CalendarEventFormData): Promise<{ success: boolean; data?: CalendarEvent; error?: string }> => 
      ipcRenderer.invoke('calendar:createEvent', data),
    updateEvent: (id: number, data: CalendarEventFormData): Promise<{ success: boolean; data?: CalendarEvent; error?: string }> => 
      ipcRenderer.invoke('calendar:updateEvent', id, data),
    deleteEvent: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('calendar:deleteEvent', id)
  },

  // 文档模板API
  documents: {
    list: (): Promise<{ success: boolean; data?: DocumentTemplate[]; error?: string }> => 
      ipcRenderer.invoke('documents:list'),
    listByCategory: (category: string): Promise<{ success: boolean; data?: DocumentTemplate[]; error?: string }> => 
      ipcRenderer.invoke('documents:listByCategory', category),
    getById: (id: number): Promise<{ success: boolean; data?: DocumentTemplate; error?: string }> => 
      ipcRenderer.invoke('documents:getById', id),
    create: (data: DocumentTemplateFormData): Promise<{ success: boolean; data?: DocumentTemplate; error?: string }> => 
      ipcRenderer.invoke('documents:create', data),
    update: (id: number, data: DocumentTemplateFormData): Promise<{ success: boolean; data?: DocumentTemplate; error?: string }> => 
      ipcRenderer.invoke('documents:update', id, data),
    delete: (id: number): Promise<{ success: boolean; error?: string }> => 
      ipcRenderer.invoke('documents:delete', id),
    download: (id: number): Promise<{ success: boolean; data?: { file_path: string }; error?: string }> => 
      ipcRenderer.invoke('documents:download', id),
    search: (keyword: string): Promise<{ success: boolean; data?: DocumentTemplate[]; error?: string }> => 
      ipcRenderer.invoke('documents:search', keyword)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      ...electronAPI,
      ...api
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = { ...electronAPI, ...api }
}