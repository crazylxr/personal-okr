import { contextBridge, ipcRenderer } from 'electron';
import { Todo, OKR, Task, Note, KeyResult } from '../types/database';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // Todo操作
  todos: {
    getAll: () => ipcRenderer.invoke('db:getTodos'),
    get: (id: number) => ipcRenderer.invoke('db:getTodo', id),
    create: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => ipcRenderer.invoke('db:createTodo', todo),
    update: (id: number, todo: Partial<Todo>) => ipcRenderer.invoke('db:updateTodo', id, todo),
    delete: (id: number) => ipcRenderer.invoke('db:deleteTodo', id)
  },

  // OKR操作
  okrs: {
    getAll: () => ipcRenderer.invoke('db:getOKRs'),
    get: (id: number) => ipcRenderer.invoke('db:getOKR', id),
    create: (okr: Omit<OKR, 'id' | 'created_at' | 'updated_at'>) => ipcRenderer.invoke('db:createOKR', okr),
    update: (id: number, okr: Partial<OKR>) => ipcRenderer.invoke('db:updateOKR', id, okr),
    delete: (id: number) => ipcRenderer.invoke('db:deleteOKR', id)
  },

  // Task操作
  tasks: {
    getAll: (okrId?: number) => ipcRenderer.invoke('db:getTasks', okrId),
    get: (id: number) => ipcRenderer.invoke('db:getTask', id),
    create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => ipcRenderer.invoke('db:createTask', task),
    update: (id: number, task: Partial<Task>) => ipcRenderer.invoke('db:updateTask', id, task),
    delete: (id: number) => ipcRenderer.invoke('db:deleteTask', id)
  },

  // Note操作
  notes: {
    getAll: () => ipcRenderer.invoke('db:getNotes'),
    get: (id: number) => ipcRenderer.invoke('db:getNote', id),
    create: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => ipcRenderer.invoke('db:createNote', note),
    update: (id: number, note: Partial<Note>) => ipcRenderer.invoke('db:updateNote', id, note),
    delete: (id: number) => ipcRenderer.invoke('db:deleteNote', id)
  },

  // KeyResult操作
  keyResults: {
    getAll: (okrId?: number) => ipcRenderer.invoke('db:getKeyResults', okrId),
    get: (id: number) => ipcRenderer.invoke('db:getKeyResult', id),
    create: (keyResult: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => ipcRenderer.invoke('db:createKeyResult', keyResult),
    update: (id: number, keyResult: Partial<KeyResult>) => ipcRenderer.invoke('db:updateKeyResult', id, keyResult),
    delete: (id: number) => ipcRenderer.invoke('db:deleteKeyResult', id)
  },

  // WebDAV同步
  webdav: {
    initClient: (config: any) => ipcRenderer.invoke('webdav:initClient', config),
    testConnection: () => ipcRenderer.invoke('webdav:testConnection'),
    syncData: () => ipcRenderer.invoke('webdav:syncData')
  },

  // Git同步
  git: {
    createRepository: (config: any) => ipcRenderer.invoke('git:createRepository', config),
    initRepository: (config: any) => ipcRenderer.invoke('git:initRepository', config),
    testConnection: () => ipcRenderer.invoke('git:testConnection'),
    testProxyConnection: (proxyConfig: any) => ipcRenderer.invoke('git:testProxyConnection', proxyConfig),
    syncData: () => ipcRenderer.invoke('git:syncData'),
    exportData: () => ipcRenderer.invoke('git:exportData'),
    commitChanges: (message?: string) => ipcRenderer.invoke('git:commitChanges', message),
    pushChanges: () => ipcRenderer.invoke('git:pushChanges'),
    pullChanges: () => ipcRenderer.invoke('git:pullChanges'),
    getStatus: () => ipcRenderer.invoke('git:getStatus')
  },

  // S3备份
  s3: {
    initialize: (config: any) => ipcRenderer.invoke('s3:initialize', config),
    testConnection: () => ipcRenderer.invoke('s3:testConnection'),
    performBackup: () => ipcRenderer.invoke('s3:performBackup'),
    getBackupList: () => ipcRenderer.invoke('s3:getBackupList'),
    getStatus: () => ipcRenderer.invoke('s3:getStatus'),
    startAutoBackup: () => ipcRenderer.invoke('s3:startAutoBackup'),
    stopAutoBackup: () => ipcRenderer.invoke('s3:stopAutoBackup'),
    updateConfig: (config: any) => ipcRenderer.invoke('s3:updateConfig', config),
    performRestore: (key: string, mode: string) => ipcRenderer.invoke('s3:performRestore', key, mode),
    getBackupDetails: (key: string) => ipcRenderer.invoke('s3:getBackupDetails', key),
  },

  // 通用方法
  invokeS3Action: (action: string, ...args: any[]) => ipcRenderer.invoke(`s3:${action}`, ...args),

  // 应用控制
app: {
      quit: () => ipcRenderer.invoke('app:quit'),
      minimize: () => ipcRenderer.invoke('app:minimize'),
      maximize: () => ipcRenderer.invoke('app:maximize'),
      close: () => ipcRenderer.invoke('app:close'),
    },
     window: {
       startDrag: () => ipcRenderer.invoke('window:startDrag'),
       stopDrag: () => ipcRenderer.invoke('window:stopDrag'),
     },
 });

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      todos: {
        getAll: () => Promise<Todo[]>;
        get: (id: number) => Promise<Todo | null>;
        create: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, todo: Partial<Todo>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      okrs: {
        getAll: () => Promise<OKR[]>;
        get: (id: number) => Promise<OKR | null>;
        create: (okr: Omit<OKR, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, okr: Partial<OKR>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      tasks: {
        getAll: (okrId?: number) => Promise<Task[]>;
        get: (id: number) => Promise<Task | null>;
        create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, task: Partial<Task>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      notes: {
        getAll: () => Promise<Note[]>;
        get: (id: number) => Promise<Note | null>;
        create: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, note: Partial<Note>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      keyResults: {
        getAll: (okrId?: number) => Promise<KeyResult[]>;
        get: (id: number) => Promise<KeyResult | null>;
        create: (keyResult: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, keyResult: Partial<KeyResult>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      webdav: {
        initClient: (config: any) => Promise<{ success: boolean; error?: string }>;
        testConnection: () => Promise<{ success: boolean; result?: boolean; error?: string }>;
        syncData: () => Promise<{ success: boolean; data?: any; error?: string }>;
      };
      git: {
        createRepository: (config: any) => Promise<{ success: boolean; remoteUrl?: string; error?: string }>;
        initRepository: (config: any) => Promise<{ success: boolean; error?: string }>;
        testConnection: () => Promise<{ success: boolean; result?: boolean; error?: string }>;
        testProxyConnection: (proxyConfig: any) => Promise<{ success: boolean; result?: boolean; error?: string }>;
        syncData: () => Promise<{ success: boolean; data?: any; error?: string }>;
        exportData: () => Promise<{ success: boolean; error?: string }>;
        commitChanges: (message?: string) => Promise<{ success: boolean; error?: string }>;
        pushChanges: () => Promise<{ success: boolean; error?: string }>;
        pullChanges: () => Promise<{ success: boolean; error?: string }>;
        getStatus: () => Promise<{ success: boolean; data?: any; error?: string }>;
      };
      s3: {
        initialize: (config: any) => Promise<{ success: boolean; error?: string }>;
        testConnection: () => Promise<{ success: boolean; result?: boolean; error?: string }>;
        performBackup: () => Promise<{ success: boolean; error?: string }>;
        getBackupList: () => Promise<{ success: boolean; data?: any; error?: string }>;
        getStatus: () => Promise<{ success: boolean; data?: any; error?: string }>;
        startAutoBackup: () => Promise<{ success: boolean; error?: string }>;
        stopAutoBackup: () => Promise<{ success: boolean; error?: string }>;
        updateConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
        performRestore: (key: string, mode: string) => Promise<{ success: boolean; error?: string }>;
        getBackupDetails: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      };
      invokeS3Action: (action: string, ...args: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      app: {
        quit: () => Promise<void>;
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      window: {
        startDrag: () => Promise<void>;
        stopDrag: () => Promise<void>;
      };
    };
  }
}