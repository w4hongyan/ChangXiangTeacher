import { contextBridge, ipcRenderer } from 'electron'

// 定义API接口
declare global {
  interface Window {
    electronAPI: {
      dbQuery: (sql: string, params?: any[]) => Promise<any>
      dbRun: (sql: string, params?: any[]) => Promise<any>
      dbGet: (sql: string, params?: any[]) => Promise<any>
      dbAll: (sql: string, params?: any[]) => Promise<any[]>
      classes: {
        getAll: () => Promise<any>
        getById: (id: number) => Promise<any>
        create: (classData: any) => Promise<any>
        update: (id: number, classData: any) => Promise<any>
        delete: (id: number) => Promise<any>
      }
      students: {
        list: (params?: any) => Promise<any>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        batchDelete: (ids: number[]) => Promise<any>
        getClasses: () => Promise<any>
        import: (buffer: ArrayBuffer) => Promise<any>
        export: (params?: any) => Promise<any>
      }
      seating: {
        getClassConfig: (classId: number) => Promise<any>
        saveClassConfig: (data: any) => Promise<any>
        getArrangement: (classId: number) => Promise<any>
        assignStudent: (data: any) => Promise<any>
        removeStudent: (data: any) => Promise<any>
        swapStudents: (data: any) => Promise<any>
        swapMultipleStudents: (data: any) => Promise<any>
        autoAssign: (classId: number, options?: any) => Promise<any>
        saveArrangement: (classId: number) => Promise<any>
      }
      grades: {
        list: (params?: any) => Promise<any>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        batchDelete: (ids: number[]) => Promise<any>
        getStats: (params?: any) => Promise<any>
        getSubjects: () => Promise<any>
        getExamTypes: () => Promise<any>
        import: (data: any[]) => Promise<any>
        export: (params?: any) => Promise<any>
      }
    }
  }
}

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', sql, params),
  dbRun: (sql: string, params?: any[]) => ipcRenderer.invoke('db-run', sql, params),
  dbGet: (sql: string, params?: any[]) => ipcRenderer.invoke('db-get', sql, params),
  dbAll: (sql: string, params?: any[]) => ipcRenderer.invoke('db-all', sql, params),
  classes: {
    getAll: () => ipcRenderer.invoke('classes:getAll'),
    getById: (id: number) => ipcRenderer.invoke('classes:getById', id),
    create: (classData: any) => ipcRenderer.invoke('classes:create', classData),
    update: (id: number, classData: any) => ipcRenderer.invoke('classes:update', id, classData),
    delete: (id: number) => ipcRenderer.invoke('classes:delete', id)
  },
  students: {
    list: (params?: any) => ipcRenderer.invoke('students:list', params),
    getById: (id: number) => ipcRenderer.invoke('students:getById', id),
    create: (data: any) => ipcRenderer.invoke('students:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('students:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('students:delete', id),
    batchDelete: (ids: number[]) => ipcRenderer.invoke('students:batchDelete', ids),
    getClasses: () => ipcRenderer.invoke('students:getClasses'),
    import: (buffer: ArrayBuffer) => ipcRenderer.invoke('students:import', buffer),
    export: (params?: any) => ipcRenderer.invoke('students:export', params)
  },
  seating: {
    getClassConfig: (classId: number) => ipcRenderer.invoke('seating:getClassConfig', classId),
    saveClassConfig: (data: any) => ipcRenderer.invoke('seating:saveClassConfig', data),
    getArrangement: (classId: number) => ipcRenderer.invoke('seating:getArrangement', classId),
    assignStudent: (data: any) => ipcRenderer.invoke('seating:assignStudent', data),
    removeStudent: (data: any) => ipcRenderer.invoke('seating:removeStudent', data),
    swapStudents: (data: any) => ipcRenderer.invoke('seating:swapStudents', data),
    swapMultipleStudents: (data: any) => ipcRenderer.invoke('seating:swapMultipleStudents', data),
    autoAssign: (classId: number, options?: any) => ipcRenderer.invoke('seating:autoAssign', classId, options),
    saveArrangement: (classId: number) => ipcRenderer.invoke('seating:saveArrangement', classId)
  },
  grades: {
    list: (params?: any) => ipcRenderer.invoke('grades:list', params),
    getById: (id: number) => ipcRenderer.invoke('grades:getById', id),
    create: (data: any) => ipcRenderer.invoke('grades:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('grades:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('grades:delete', id),
    batchDelete: (ids: number[]) => ipcRenderer.invoke('grades:batchDelete', ids),
    getStats: (params?: any) => ipcRenderer.invoke('grades:getStats', params),
    getSubjects: () => ipcRenderer.invoke('grades:getSubjects'),
    getExamTypes: () => ipcRenderer.invoke('grades:getExamTypes'),
    import: (data: any[]) => ipcRenderer.invoke('grades:import', data),
    export: (params?: any) => ipcRenderer.invoke('grades:export', params)
  }
})

// 开发工具警告移除
if (process.env.NODE_ENV === 'production') {
  contextBridge.exposeInMainWorld('__devtron', { require: undefined, process: undefined })
}