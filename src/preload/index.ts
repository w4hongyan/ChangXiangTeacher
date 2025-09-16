import { contextBridge, ipcRenderer } from 'electron'

// 定义API接口
declare global {
  interface Window {
    electronAPI: {
      dbQuery: (sql: string, params?: any[]) => Promise<any>
      dbRun: (sql: string, params?: any[]) => Promise<any>
      dbGet: (sql: string, params?: any[]) => Promise<any>
      dbAll: (sql: string, params?: any[]) => Promise<any[]>
      // 添加通用 invoke 方法的类型声明，兼容旧代码中直接调用 window.electronAPI.invoke(channel, ...args)
      invoke: (channel: string, ...args: any[]) => Promise<any>
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
        // Enhanced grade report functions
        getReports: (params?: any) => Promise<any>
        generateClassReport: (classId: number, subject: string, examType: string) => Promise<any>
        generateComparison: (params: any) => Promise<any>
        deleteReport: (id: number) => Promise<any>
      }
      points: {
        list: (params?: any) => Promise<any>
        create: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getStudentSummary: (class_id: number) => Promise<any>
        getRules: (class_id: number) => Promise<any>
        updateRules: (class_id: number, rules: any[]) => Promise<any>
      }
      groups: {
        create: (data: any) => Promise<any>
        list: (class_id: number) => Promise<any>
        getById: (id: number) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        addMember: (group_id: number, student_id: number) => Promise<any>
        removeMember: (group_id: number, student_id: number) => Promise<any>
        getPoints: (group_id: number) => Promise<any>
      }
      schedules: {
        list: (params?: any) => Promise<any>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getByClass: (classId: number) => Promise<any>
        import: (data: any) => Promise<any>
        export: (params?: any) => Promise<any>
      }
      calendar: {
        list: (params?: any) => Promise<any>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        getByDateRange: (startDate: string, endDate: string) => Promise<any>
        getUpcoming: (days?: number) => Promise<any>
      }
      templates: {
        list: (params?: any) => Promise<any>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        generate: (templateId: number, data: any) => Promise<any>
        preview: (templateId: number, data: any) => Promise<any>
      }
      shop: {
        getItems: (params?: any) => Promise<any>
        getItemById: (id: number) => Promise<any>
        createItem: (data: any) => Promise<any>
        updateItem: (id: number, data: any) => Promise<any>
        deleteItem: (id: number) => Promise<any>
        exchange: (data: any) => Promise<any>
        getExchangeHistory: (params?: any) => Promise<any>
        getStats: (params?: any) => Promise<any>
      }
      attendance: {
        save: (data: any) => Promise<any>
        history: (params?: any) => Promise<any>
        stats: (params?: any) => Promise<any>
        today: (classId: number) => Promise<any>
        export: (params?: any) => Promise<any>
      }
      ai: {
        getConfig: () => Promise<any>
        updateConfig: (config: any) => Promise<any>
        getSessions: (type?: string) => Promise<any>
        createSession: (title: string, type?: string) => Promise<any>
        getSessionMessages: (sessionId: string) => Promise<any>
        deleteSession: (sessionId: string) => Promise<any>
        chat: (sessionId: string, message: string, type?: string) => Promise<any>
        generateContent: (prompt: string, type?: string) => Promise<any>
      }
      backup: {
         list: (options?: any) => Promise<any>
         stats: () => Promise<any>
         create: (options?: any) => Promise<any>
         restore: (options: any) => Promise<any>
         download: (id: number) => Promise<any>
         delete: (id: number) => Promise<any>
         getSettings: () => Promise<any>
         saveSettings: (settings: any) => Promise<any>
         selectPath: () => Promise<any>
       }
       cloud: {
         getProviders: () => Promise<any>
         connect: (providerId: string, credentials: any) => Promise<any>
         disconnect: (providerId: string) => Promise<any>
         sync: (providerId: string, filePath: string) => Promise<any>
         download: (providerId: string, remotePath: string, localPath: string) => Promise<any>
         listFiles: (providerId: string, remotePath?: string) => Promise<any>
         getSyncStatus: (providerId: string) => Promise<any>
       }
       updater: {
         checkForUpdates: () => Promise<any>
         downloadUpdate: () => Promise<any>
         installUpdate: () => void
         getAppVersion: () => Promise<string>
         onUpdateChecking: (callback: () => void) => () => void
         onUpdateAvailable: (callback: (info: any) => void) => () => void
         onUpdateNotAvailable: (callback: (info: any) => void) => () => void
         onUpdateError: (callback: (error: string) => void) => () => void
         onDownloadProgress: (callback: (progress: any) => void) => () => void
         onUpdateDownloaded: (callback: (info: any) => void) => () => void
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
  // 暴露通用 invoke，兼容直接调用 window.electronAPI.invoke(channel, ...args)
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
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
    export: (params?: any) => ipcRenderer.invoke('grades:export', params),
    // Enhanced grade report functions
    getReports: (params?: any) => ipcRenderer.invoke('grades:getReports', params),
    generateClassReport: (classId: number, subject: string, examType: string) => ipcRenderer.invoke('grades:generateClassReport', classId, subject, examType),
    generateComparison: (params: any) => ipcRenderer.invoke('grades:generateComparison', params),
    deleteReport: (id: number) => ipcRenderer.invoke('grades:deleteReport', id)
  },
  points: {
    list: (params?: any) => ipcRenderer.invoke('points:list', params),
    create: (data: any) => ipcRenderer.invoke('points:create', data),
    delete: (id: number) => ipcRenderer.invoke('points:delete', id),
    getStudentSummary: (class_id: number) => ipcRenderer.invoke('points:getStudentSummary', class_id),
    getRules: (class_id: number) => ipcRenderer.invoke('points:getRules', class_id),
    updateRules: (class_id: number, rules: any[]) => ipcRenderer.invoke('points:updateRules', class_id, rules)
  },
  groups: {
    create: (data: any) => ipcRenderer.invoke('groups:create', data),
    list: (class_id: number) => ipcRenderer.invoke('groups:list', class_id),
    getById: (id: number) => ipcRenderer.invoke('groups:getById', id),
    update: (id: number, data: any) => ipcRenderer.invoke('groups:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('groups:delete', id),
    addMember: (group_id: number, student_id: number) => ipcRenderer.invoke('groups:addMember', group_id, student_id),
    removeMember: (group_id: number, student_id: number) => ipcRenderer.invoke('groups:removeMember', group_id, student_id),
    getPoints: (group_id: number) => ipcRenderer.invoke('groups:getPoints', group_id)
  },
  schedules: {
    list: (params?: any) => ipcRenderer.invoke('schedules:list', params),
    getById: (id: number) => ipcRenderer.invoke('schedules:getById', id),
    create: (data: any) => ipcRenderer.invoke('schedules:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('schedules:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('schedules:delete', id),
    getByClass: (classId: number) => ipcRenderer.invoke('schedules:getByClass', classId),
    import: (data: any) => ipcRenderer.invoke('schedules:import', data),
    export: (params?: any) => ipcRenderer.invoke('schedules:export', params)
  },
  calendar: {
    list: (params?: any) => ipcRenderer.invoke('calendar:list', params),
    getById: (id: number) => ipcRenderer.invoke('calendar:getById', id),
    create: (data: any) => ipcRenderer.invoke('calendar:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('calendar:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('calendar:delete', id),
    getByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('calendar:getByDateRange', startDate, endDate),
    getUpcoming: (days?: number) => ipcRenderer.invoke('calendar:getUpcoming', days)
  },
  templates: {
    list: (params?: any) => ipcRenderer.invoke('templates:list', params),
    getById: (id: number) => ipcRenderer.invoke('templates:getById', id),
    create: (data: any) => ipcRenderer.invoke('templates:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('templates:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id),
    generate: (options: any) => ipcRenderer.invoke('templates:generate', options),
    preview: (templateId: number, data: any) => ipcRenderer.invoke('templates:preview', templateId, data),
    print: (content: string, options?: any) => ipcRenderer.invoke('templates:print', content, options),
    import: (data: any) => ipcRenderer.invoke('templates:import', data),
    export: (options: any) => ipcRenderer.invoke('templates:export', options),
    getGeneratedDocs: () => ipcRenderer.invoke('templates:getGeneratedDocs'),
    deleteGeneratedDoc: (id: number) => ipcRenderer.invoke('templates:deleteGeneratedDoc', id)
  },
  shop: {
    getItems: (params?: any) => ipcRenderer.invoke('shop:getItems', params),
    getItemById: (id: number) => ipcRenderer.invoke('shop:getItemById', id),
    createItem: (data: any) => ipcRenderer.invoke('shop:createItem', data),
    updateItem: (id: number, data: any) => ipcRenderer.invoke('shop:updateItem', id, data),
    deleteItem: (id: number) => ipcRenderer.invoke('shop:deleteItem', id),
    exchange: (data: any) => ipcRenderer.invoke('shop:exchange', data),
    getExchangeHistory: (params?: any) => ipcRenderer.invoke('shop:getExchangeHistory', params),
    getStats: (params?: any) => ipcRenderer.invoke('shop:getStats', params)
  },
  attendance: {
    save: (data: any) => ipcRenderer.invoke('attendance:save', data),
    history: (params?: any) => ipcRenderer.invoke('attendance:history', params),
    stats: (params?: any) => ipcRenderer.invoke('attendance:stats', params),
    today: (classId: number) => ipcRenderer.invoke('attendance:today', classId),
    export: (params?: any) => ipcRenderer.invoke('attendance:export', params)
  },
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    updateConfig: (config: any) => ipcRenderer.invoke('ai:updateConfig', config),
    getSessions: (type?: string) => ipcRenderer.invoke('ai:getSessions', type),
    createSession: (title: string, type?: string) => ipcRenderer.invoke('ai:createSession', title, type),
    getSessionMessages: (sessionId: string) => ipcRenderer.invoke('ai:getSessionMessages', sessionId),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('ai:deleteSession', sessionId),
    chat: (sessionId: string, message: string, type?: string) => ipcRenderer.invoke('ai:chat', sessionId, message, type),
    generateContent: (prompt: string, type?: string) => ipcRenderer.invoke('ai:generateContent', prompt, type)
  },
  backup: {
     list: (options?: any) => ipcRenderer.invoke('backup:list', options),
     stats: () => ipcRenderer.invoke('backup:stats'),
     create: (options?: any) => ipcRenderer.invoke('backup:create', options),
     restore: (options: any) => ipcRenderer.invoke('backup:restore', options),
     download: (id: number) => ipcRenderer.invoke('backup:download', id),
     delete: (id: number) => ipcRenderer.invoke('backup:delete', id),
     getSettings: () => ipcRenderer.invoke('backup:getSettings'),
     saveSettings: (settings: any) => ipcRenderer.invoke('backup:saveSettings', settings),
     selectPath: () => ipcRenderer.invoke('backup:selectPath')
   },
   cloud: {
      getProviders: () => ipcRenderer.invoke('cloud:getProviders'),
      connect: (providerId: string, credentials: any) => ipcRenderer.invoke('cloud:connect', providerId, credentials),
      disconnect: (providerId: string) => ipcRenderer.invoke('cloud:disconnect', providerId),
      sync: (providerId: string, filePath: string) => ipcRenderer.invoke('cloud:sync', providerId, filePath),
      download: (providerId: string, remotePath: string, localPath: string) => ipcRenderer.invoke('cloud:download', providerId, remotePath, localPath),
      listFiles: (providerId: string, remotePath?: string) => ipcRenderer.invoke('cloud:listFiles', providerId, remotePath),
      getSyncStatus: (providerId: string) => ipcRenderer.invoke('cloud:getSyncStatus', providerId)
    },
    updater: {
      checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
      downloadUpdate: () => ipcRenderer.invoke('download-update'),
      installUpdate: () => ipcRenderer.invoke('install-update'),
      getAppVersion: () => ipcRenderer.invoke('get-app-version'),
      onUpdateChecking: (callback: () => void) => {
        ipcRenderer.on('update-checking', callback)
        return () => ipcRenderer.removeListener('update-checking', callback)
      },
      onUpdateAvailable: (callback: (info: any) => void) => {
        ipcRenderer.on('update-available', (_, info) => callback(info))
        return () => ipcRenderer.removeListener('update-available', callback)
      },
      onUpdateNotAvailable: (callback: (info: any) => void) => {
        ipcRenderer.on('update-not-available', (_, info) => callback(info))
        return () => ipcRenderer.removeListener('update-not-available', callback)
      },
      onUpdateError: (callback: (error: string) => void) => {
        ipcRenderer.on('update-error', (_, error) => callback(error))
        return () => ipcRenderer.removeListener('update-error', callback)
      },
      onDownloadProgress: (callback: (progress: any) => void) => {
        ipcRenderer.on('update-download-progress', (_, progress) => callback(progress))
        return () => ipcRenderer.removeListener('update-download-progress', callback)
      },
      onUpdateDownloaded: (callback: (info: any) => void) => {
        ipcRenderer.on('update-downloaded', (_, info) => callback(info))
        return () => ipcRenderer.removeListener('update-downloaded', callback)
      }
    }
})

// 开发工具警告移除
if (process.env.NODE_ENV === 'production') {
  contextBridge.exposeInMainWorld('__devtron', { require: undefined, process: undefined })
}