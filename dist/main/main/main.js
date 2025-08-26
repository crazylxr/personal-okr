"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const database_1 = require("./database");
const databaseService_1 = require("./services/databaseService");
const seedData_1 = require("./seedData");
const webdavService_1 = require("./services/webdavService");
const isDev = () => {
    return process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
};
class Application {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.isDuplicateInstance();
        this.initializeApp();
    }
    isDuplicateInstance() {
        const gotTheLock = electron_1.app.requestSingleInstanceLock();
        if (!gotTheLock) {
            electron_1.app.quit();
        }
        else {
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
        electron_1.app.whenReady().then(async () => {
            // 初始化数据库
            try {
                await database_1.database.init();
                console.log('Database initialized successfully');
                // 添加示例数据
                await (0, seedData_1.seedDatabase)();
            }
            catch (error) {
                console.error('Failed to initialize database:', error);
            }
            this.createWindow();
            this.createTray();
            this.setupIpcHandlers();
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
            this.mainWindow.loadURL('http://localhost:5173');
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
        const icon = electron_1.nativeImage.createFromPath((0, path_1.join)(__dirname, '../assets/tray-icon.png'));
        this.tray = new electron_1.Tray(icon);
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
    setupIpcHandlers() {
        // Todo operations
        electron_1.ipcMain.handle('db:getTodos', () => databaseService_1.databaseService.getTodos());
        electron_1.ipcMain.handle('db:getTodo', (_, id) => databaseService_1.databaseService.getTodo(id));
        electron_1.ipcMain.handle('db:createTodo', (_, todo) => databaseService_1.databaseService.createTodo(todo));
        electron_1.ipcMain.handle('db:updateTodo', (_, id, todo) => databaseService_1.databaseService.updateTodo(id, todo));
        electron_1.ipcMain.handle('db:deleteTodo', (_, id) => databaseService_1.databaseService.deleteTodo(id));
        // OKR operations
        electron_1.ipcMain.handle('db:getOKRs', () => databaseService_1.databaseService.getOKRs());
        electron_1.ipcMain.handle('db:getOKR', (_, id) => databaseService_1.databaseService.getOKR(id));
        electron_1.ipcMain.handle('db:createOKR', (_, okr) => databaseService_1.databaseService.createOKR(okr));
        electron_1.ipcMain.handle('db:updateOKR', (_, id, okr) => databaseService_1.databaseService.updateOKR(id, okr));
        electron_1.ipcMain.handle('db:deleteOKR', (_, id) => databaseService_1.databaseService.deleteOKR(id));
        // Task operations
        electron_1.ipcMain.handle('db:getTasks', (_, okrId) => databaseService_1.databaseService.getTasks(okrId));
        electron_1.ipcMain.handle('db:getTask', (_, id) => databaseService_1.databaseService.getTask(id));
        electron_1.ipcMain.handle('db:createTask', (_, task) => databaseService_1.databaseService.createTask(task));
        electron_1.ipcMain.handle('db:updateTask', (_, id, task) => databaseService_1.databaseService.updateTask(id, task));
        electron_1.ipcMain.handle('db:deleteTask', (_, id) => databaseService_1.databaseService.deleteTask(id));
        // Note operations
        electron_1.ipcMain.handle('db:getNotes', () => databaseService_1.databaseService.getNotes());
        electron_1.ipcMain.handle('db:getNote', (_, id) => databaseService_1.databaseService.getNote(id));
        electron_1.ipcMain.handle('db:createNote', (_, note) => databaseService_1.databaseService.createNote(note));
        electron_1.ipcMain.handle('db:updateNote', (_, id, note) => databaseService_1.databaseService.updateNote(id, note));
        electron_1.ipcMain.handle('db:deleteNote', (_, id) => databaseService_1.databaseService.deleteNote(id));
        // KeyResult operations
        electron_1.ipcMain.handle('db:getKeyResults', (_, okrId) => databaseService_1.databaseService.getKeyResults(okrId));
        electron_1.ipcMain.handle('db:getKeyResult', (_, id) => databaseService_1.databaseService.getKeyResult(id));
        electron_1.ipcMain.handle('db:createKeyResult', (_, keyResult) => databaseService_1.databaseService.createKeyResult(keyResult));
        electron_1.ipcMain.handle('db:updateKeyResult', (_, id, keyResult) => databaseService_1.databaseService.updateKeyResult(id, keyResult));
        electron_1.ipcMain.handle('db:deleteKeyResult', (_, id) => databaseService_1.databaseService.deleteKeyResult(id));
        // WebDAV operations
        electron_1.ipcMain.handle('webdav:initClient', async (_, config) => {
            try {
                await webdavService_1.mainWebDAVService.initializeClient(config);
                return { success: true };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('webdav:testConnection', async () => {
            try {
                const result = await webdavService_1.mainWebDAVService.testConnection();
                return { success: true, result };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('webdav:syncData', async () => {
            try {
                const result = await webdavService_1.mainWebDAVService.syncData();
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
