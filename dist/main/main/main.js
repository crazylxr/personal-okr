"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const database_1 = require("./database");
const isDev = () => {
    return process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
};
class Application {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        console.log('Application constructor called');
        this.isDuplicateInstance();
        this.initializeApp();
    }
    isDuplicateInstance() {
        console.log('Checking for duplicate instance');
        const gotTheLock = electron_1.app.requestSingleInstanceLock();
        if (!gotTheLock) {
            console.log('Another instance is running, quitting');
            electron_1.app.quit();
        }
        else {
            console.log('Got the lock, setting up second-instance handler');
            electron_1.app.on('second-instance', () => {
                if (this.mainWindow) {
                    if (this.mainWindow.isMinimized())
                        this.mainWindow.restore();
                    this.mainWindow.focus();
                }
            });
        }
    }
    initializeApp() {
        console.log('Initializing app');
        electron_1.app.whenReady().then(async () => {
            console.log('App is ready');
            this.createWindow();
            this.createTray();
            // 先设置 IPC 处理器
            console.log('Setting up IPC handlers');
            await this.setupIpcHandlers();
            // 然后初始化数据库
            try {
                console.log('Initializing database');
                await database_1.database.init();
                console.log('Database initialized successfully');
                // 添加示例数据
                const { seedDatabase } = await Promise.resolve().then(() => __importStar(require('./seedData')));
                await seedDatabase();
                console.log('Seed data added successfully');
            }
            catch (error) {
                console.error('Failed to initialize database:', error);
            }
        }).catch(error => {
            console.error('App initialization failed:', error);
        });
        electron_1.app.on('window-all-closed', async () => {
            if (process.platform !== 'darwin') {
                await database_1.database.close();
                electron_1.app.quit();
            }
        });
        electron_1.app.on('before-quit', async () => {
            await database_1.database.close();
        });
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }
    createWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: (0, path_1.join)(__dirname, 'preload.js')
            },
            frame: false,
            show: false
        });
        // 加载应用
        if (isDev()) {
            this.mainWindow.loadURL('http://localhost:5174');
            // 注释掉开发者工具，因为它会阻止 -webkit-app-region: drag 工作
            // this.mainWindow.webContents.openDevTools();
        }
        else {
            this.mainWindow.loadFile((0, path_1.join)(__dirname, '../dist/index.html'));
        }
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
        });
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }
    createTray() {
        // 创建系统托盘图标
        try {
            const iconPath = (0, path_1.join)(__dirname, '../assets/tray-icon.png');
            const icon = electron_1.nativeImage.createFromPath(iconPath);
            this.tray = new electron_1.Tray(icon.isEmpty() ? electron_1.nativeImage.createEmpty() : icon);
        }
        catch (error) {
            console.warn('Failed to create tray icon:', error);
            this.tray = new electron_1.Tray(electron_1.nativeImage.createEmpty());
        }
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: '显示窗口',
                click: () => {
                    this.mainWindow?.show();
                }
            },
            {
                label: '退出',
                click: () => {
                    electron_1.app.quit();
                }
            }
        ]);
        this.tray.setToolTip('Personal OKR Manager');
        this.tray.setContextMenu(contextMenu);
        this.tray.on('click', () => {
            this.mainWindow?.show();
        });
    }
    // IPC handlers for database operations
    async setupIpcHandlers() {
        // 动态导入服务，确保数据库已初始化
        const { databaseService } = await Promise.resolve().then(() => __importStar(require('./services/databaseService')));
        const { mainWebDAVService } = await Promise.resolve().then(() => __importStar(require('./services/webdavService')));
        const { mainGitSyncService } = await Promise.resolve().then(() => __importStar(require('./services/gitSyncService')));
        const { s3BackupService } = await Promise.resolve().then(() => __importStar(require('./services/s3BackupService')));
        // Todo operations
        electron_1.ipcMain.handle('db:getTodos', () => databaseService.getTodos());
        electron_1.ipcMain.handle('db:getTodo', (_, id) => databaseService.getTodo(id));
        electron_1.ipcMain.handle('db:createTodo', (_, todo) => databaseService.createTodo(todo));
        electron_1.ipcMain.handle('db:updateTodo', (_, id, todo) => databaseService.updateTodo(id, todo));
        electron_1.ipcMain.handle('db:deleteTodo', (_, id) => databaseService.deleteTodo(id));
        // OKR operations
        electron_1.ipcMain.handle('db:getOKRs', () => databaseService.getOKRs());
        electron_1.ipcMain.handle('db:getOKR', (_, id) => databaseService.getOKR(id));
        electron_1.ipcMain.handle('db:createOKR', (_, okr) => databaseService.createOKR(okr));
        electron_1.ipcMain.handle('db:updateOKR', (_, id, okr) => databaseService.updateOKR(id, okr));
        electron_1.ipcMain.handle('db:deleteOKR', (_, id) => databaseService.deleteOKR(id));
        // Task operations
        electron_1.ipcMain.handle('db:getTasks', (_, okrId) => databaseService.getTasks(okrId));
        electron_1.ipcMain.handle('db:getTask', (_, id) => databaseService.getTask(id));
        electron_1.ipcMain.handle('db:createTask', (_, task) => databaseService.createTask(task));
        electron_1.ipcMain.handle('db:updateTask', (_, id, task) => databaseService.updateTask(id, task));
        electron_1.ipcMain.handle('db:deleteTask', (_, id) => databaseService.deleteTask(id));
        // Note operations
        electron_1.ipcMain.handle('db:getNotes', () => databaseService.getNotes());
        electron_1.ipcMain.handle('db:getNote', (_, id) => databaseService.getNote(id));
        electron_1.ipcMain.handle('db:createNote', (_, note) => databaseService.createNote(note));
        electron_1.ipcMain.handle('db:updateNote', (_, id, note) => databaseService.updateNote(id, note));
        electron_1.ipcMain.handle('db:deleteNote', (_, id) => databaseService.deleteNote(id));
        // KeyResult operations
        electron_1.ipcMain.handle('db:getKeyResults', (_, okrId) => databaseService.getKeyResults(okrId));
        electron_1.ipcMain.handle('db:getKeyResult', (_, id) => databaseService.getKeyResult(id));
        electron_1.ipcMain.handle('db:createKeyResult', (_, keyResult) => databaseService.createKeyResult(keyResult));
        electron_1.ipcMain.handle('db:updateKeyResult', (_, id, keyResult) => databaseService.updateKeyResult(id, keyResult));
        electron_1.ipcMain.handle('db:deleteKeyResult', (_, id) => databaseService.deleteKeyResult(id));
        // WebDAV operations
        electron_1.ipcMain.handle('webdav:initClient', async (_, config) => {
            try {
                await mainWebDAVService.initializeClient(config);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('webdav:testConnection', async () => {
            try {
                const result = await mainWebDAVService.testConnection();
                return { success: true, result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('webdav:syncData', async () => {
            try {
                const result = await mainWebDAVService.syncData();
                return { success: true, data: result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        // Git operations
        electron_1.ipcMain.handle('git:createRepository', async (_, config) => {
            try {
                const remoteUrl = await mainGitSyncService.createRemoteRepository(config);
                return { success: true, remoteUrl };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:initRepository', async (_, config) => {
            try {
                await mainGitSyncService.initializeRepository(config);
                mainGitSyncService.updateConfig(config);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:testConnection', async () => {
            try {
                const result = await mainGitSyncService.testConnection();
                return { success: true, result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:syncData', async () => {
            try {
                const result = await mainGitSyncService.syncData();
                return { success: true, data: result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:exportData', async () => {
            try {
                await mainGitSyncService.exportData();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:commitChanges', async (_, message) => {
            try {
                await mainGitSyncService.commitChanges(message);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:pushChanges', async () => {
            try {
                await mainGitSyncService.pushChanges();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:pullChanges', async () => {
            try {
                await mainGitSyncService.pullChanges();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:getStatus', async () => {
            try {
                const result = await mainGitSyncService.getStatus();
                return { success: true, data: result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('git:testProxyConnection', async (_, proxyConfig) => {
            try {
                const result = await mainGitSyncService.testProxyConnection(proxyConfig);
                return { success: true, result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        // S3 backup operations
        electron_1.ipcMain.handle('s3:initialize', async (_, config) => {
            try {
                await s3BackupService.initialize(config);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:testConnection', async () => {
            try {
                const result = await s3BackupService.testConnection();
                return { success: true, result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:performBackup', async () => {
            try {
                await s3BackupService.performBackup();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:getBackupList', async () => {
            try {
                const result = await s3BackupService.getBackupList();
                return { success: true, data: result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:getStatus', async () => {
            try {
                const result = await s3BackupService.getStatus();
                return { success: true, data: result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:startAutoBackup', async () => {
            try {
                s3BackupService.startAutoBackup();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:stopAutoBackup', async () => {
            try {
                s3BackupService.stopAutoBackup();
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:updateConfig', async (_, config) => {
            try {
                s3BackupService.updateConfig(config);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:performRestore', async (_, key, mode) => {
            try {
                await s3BackupService.performRestore(key, mode);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('s3:getBackupDetails', async (_, key) => {
            try {
                const result = await s3BackupService.getBackupDetails(key);
                return { success: true, data: result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        // App operations
        electron_1.ipcMain.handle('app:quit', () => electron_1.app.quit());
        electron_1.ipcMain.handle('app:minimize', () => {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window)
                window.minimize();
        });
        electron_1.ipcMain.handle('app:maximize', () => {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window) {
                if (window.isMaximized()) {
                    window.unmaximize();
                }
                else {
                    window.maximize();
                }
            }
        });
        electron_1.ipcMain.handle('app:close', () => {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window)
                window.close();
        });
        // Window drag operations
        let isDragging = false;
        let dragStartPosition = { x: 0, y: 0 };
        let windowStartPosition = { x: 0, y: 0 };
        let dragInterval = null;
        electron_1.ipcMain.handle('window:startDrag', () => {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (!window)
                return;
            isDragging = true;
            const winPosition = window.getPosition();
            windowStartPosition = { x: winPosition[0], y: winPosition[1] };
            dragStartPosition = electron_1.screen.getCursorScreenPoint();
            // Clear existing interval
            if (dragInterval) {
                clearInterval(dragInterval);
            }
            // Start drag interval with higher frequency for smoother dragging
            dragInterval = setInterval(() => {
                if (!isDragging || !window || window.isDestroyed()) {
                    if (dragInterval) {
                        clearInterval(dragInterval);
                        dragInterval = null;
                    }
                    return;
                }
                const currentPosition = electron_1.screen.getCursorScreenPoint();
                const x = windowStartPosition.x + currentPosition.x - dragStartPosition.x;
                const y = windowStartPosition.y + currentPosition.y - dragStartPosition.y;
                window.setPosition(x, y, false); // Remove animation for smoother dragging
            }, 8); // Higher frequency for smoother dragging (~120fps)
        });
        electron_1.ipcMain.handle('window:stopDrag', () => {
            isDragging = false;
            if (dragInterval) {
                clearInterval(dragInterval);
                dragInterval = null;
            }
        });
    }
}
new Application();
