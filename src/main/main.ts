import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } from 'electron';
import { join } from 'path';
import { database } from './database';
import { databaseService } from './services/databaseService';
import { seedDatabase } from './seedData';
import { mainWebDAVService, WebDAVConfig } from './services/webdavService';

const isDev = () => {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
};

class Application {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;

  constructor() {
    this.isDuplicateInstance();
    this.initializeApp();
  }

  private isDuplicateInstance(): void {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    } else {
      app.on('second-instance', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) this.mainWindow.restore();
          this.mainWindow.focus();
        }
      });
    }
  }

  private initializeApp(): void {
    app.whenReady().then(async () => {
      // 初始化数据库
      try {
        await database.init();
        console.log('Database initialized successfully');
        
        // 添加示例数据
        await seedDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }

      this.createWindow();
      this.createTray();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', async () => {
      if (process.platform !== 'darwin') {
        await database.close();
        app.quit();
      }
    });

    app.on('before-quit', async () => {
      await database.close();
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false
    });

    // 加载应用
    if (isDev()) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray(): void {
    // 创建系统托盘图标
    const icon = nativeImage.createFromPath(join(__dirname, '../assets/tray-icon.png'));
    this.tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          this.mainWindow?.show();
        }
      },
      {
        label: '退出',
        click: () => {
          app.quit();
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
  private setupIpcHandlers(): void {
    // Todo operations
    ipcMain.handle('db:getTodos', () => databaseService.getTodos());
    ipcMain.handle('db:getTodo', (_, id: number) => databaseService.getTodo(id));
    ipcMain.handle('db:createTodo', (_, todo) => databaseService.createTodo(todo));
    ipcMain.handle('db:updateTodo', (_, id: number, todo) => databaseService.updateTodo(id, todo));
    ipcMain.handle('db:deleteTodo', (_, id: number) => databaseService.deleteTodo(id));

    // OKR operations
    ipcMain.handle('db:getOKRs', () => databaseService.getOKRs());
    ipcMain.handle('db:getOKR', (_, id: number) => databaseService.getOKR(id));
    ipcMain.handle('db:createOKR', (_, okr) => databaseService.createOKR(okr));
    ipcMain.handle('db:updateOKR', (_, id: number, okr) => databaseService.updateOKR(id, okr));
    ipcMain.handle('db:deleteOKR', (_, id: number) => databaseService.deleteOKR(id));

    // Task operations
    ipcMain.handle('db:getTasks', (_, okrId?: number) => databaseService.getTasks(okrId));
    ipcMain.handle('db:getTask', (_, id: number) => databaseService.getTask(id));
    ipcMain.handle('db:createTask', (_, task) => databaseService.createTask(task));
    ipcMain.handle('db:updateTask', (_, id: number, task) => databaseService.updateTask(id, task));
    ipcMain.handle('db:deleteTask', (_, id: number) => databaseService.deleteTask(id));

    // Note operations
    ipcMain.handle('db:getNotes', () => databaseService.getNotes());
    ipcMain.handle('db:getNote', (_, id: number) => databaseService.getNote(id));
    ipcMain.handle('db:createNote', (_, note) => databaseService.createNote(note));
    ipcMain.handle('db:updateNote', (_, id: number, note) => databaseService.updateNote(id, note));
    ipcMain.handle('db:deleteNote', (_, id: number) => databaseService.deleteNote(id));

    // WebDAV operations
    ipcMain.handle('webdav:initClient', async (_, config: WebDAVConfig) => {
      try {
        await mainWebDAVService.initializeClient(config);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('webdav:testConnection', async () => {
      try {
        const result = await mainWebDAVService.testConnection();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('webdav:syncData', async () => {
      try {
        const result = await mainWebDAVService.syncData();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // App operations
    ipcMain.handle('app:quit', () => app.quit());
    ipcMain.handle('app:minimize', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) window.minimize();
    });
    ipcMain.handle('app:maximize', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) {
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
      }
    });
    ipcMain.handle('app:close', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) window.close();
    });
  }
}

new Application();