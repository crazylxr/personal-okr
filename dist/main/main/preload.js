"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露安全的API给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Todo操作
    todos: {
        getAll: () => electron_1.ipcRenderer.invoke('db:getTodos'),
        get: (id) => electron_1.ipcRenderer.invoke('db:getTodo', id),
        create: (todo) => electron_1.ipcRenderer.invoke('db:createTodo', todo),
        update: (id, todo) => electron_1.ipcRenderer.invoke('db:updateTodo', id, todo),
        delete: (id) => electron_1.ipcRenderer.invoke('db:deleteTodo', id)
    },
    // OKR操作
    okrs: {
        getAll: () => electron_1.ipcRenderer.invoke('db:getOKRs'),
        get: (id) => electron_1.ipcRenderer.invoke('db:getOKR', id),
        create: (okr) => electron_1.ipcRenderer.invoke('db:createOKR', okr),
        update: (id, okr) => electron_1.ipcRenderer.invoke('db:updateOKR', id, okr),
        delete: (id) => electron_1.ipcRenderer.invoke('db:deleteOKR', id)
    },
    // Task操作
    tasks: {
        getAll: (okrId) => electron_1.ipcRenderer.invoke('db:getTasks', okrId),
        get: (id) => electron_1.ipcRenderer.invoke('db:getTask', id),
        create: (task) => electron_1.ipcRenderer.invoke('db:createTask', task),
        update: (id, task) => electron_1.ipcRenderer.invoke('db:updateTask', id, task),
        delete: (id) => electron_1.ipcRenderer.invoke('db:deleteTask', id)
    },
    // Note操作
    notes: {
        getAll: () => electron_1.ipcRenderer.invoke('db:getNotes'),
        get: (id) => electron_1.ipcRenderer.invoke('db:getNote', id),
        create: (note) => electron_1.ipcRenderer.invoke('db:createNote', note),
        update: (id, note) => electron_1.ipcRenderer.invoke('db:updateNote', id, note),
        delete: (id) => electron_1.ipcRenderer.invoke('db:deleteNote', id)
    },
    // KeyResult操作
    keyResults: {
        getAll: (okrId) => electron_1.ipcRenderer.invoke('db:getKeyResults', okrId),
        get: (id) => electron_1.ipcRenderer.invoke('db:getKeyResult', id),
        create: (keyResult) => electron_1.ipcRenderer.invoke('db:createKeyResult', keyResult),
        update: (id, keyResult) => electron_1.ipcRenderer.invoke('db:updateKeyResult', id, keyResult),
        delete: (id) => electron_1.ipcRenderer.invoke('db:deleteKeyResult', id)
    },
    // WebDAV同步
    webdav: {
        initClient: (config) => electron_1.ipcRenderer.invoke('webdav:initClient', config),
        testConnection: () => electron_1.ipcRenderer.invoke('webdav:testConnection'),
        syncData: () => electron_1.ipcRenderer.invoke('webdav:syncData')
    },
    // 应用控制
    app: {
        quit: () => electron_1.ipcRenderer.invoke('app:quit'),
        minimize: () => electron_1.ipcRenderer.invoke('app:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('app:maximize'),
        close: () => electron_1.ipcRenderer.invoke('app:close'),
    },
    window: {
        startDrag: () => electron_1.ipcRenderer.invoke('window:startDrag'),
        stopDrag: () => electron_1.ipcRenderer.invoke('window:stopDrag'),
    },
});
