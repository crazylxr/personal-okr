import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen } from 'electron';
import { join } from 'path';
import { database } from './database';
import { GitConfig } from '../types/database';

const isDev = () => {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
};

class Application {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;

  constructor() {
    console.log('Application constructor called');
    this.isDuplicateInstance();
    this.initializeApp();
  }

  private isDuplicateInstance(): void {
    console.log('Checking for duplicate instance');
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      console.log('Another instance is running, quitting');
      app.quit();
    } else {
      console.log('Got the lock, setting up second-instance handler');
      app.on('second-instance', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) this.mainWindow.restore();
          this.mainWindow.focus();
        }
      });
    }
  }

  private initializeApp(): void {
    console.log('Initializing app');
    app.whenReady().then(async () => {
      console.log('App is ready');
      this.createWindow();
      this.createTray();
      
      // 先设置 IPC 处理器
      console.log('Setting up IPC handlers');
      await this.setupIpcHandlers();
      
      // 然后初始化数据库
      try {
        console.log('Initializing database');
        await database.init();
        console.log('Database initialized successfully');
        
        // 添加示例数据
        const { seedDatabase } = await import('./seedData');
        await seedDatabase();
        console.log('Seed data added successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }).catch(error => {
      console.error('App initialization failed:', error);
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
      frame: false,
      show: false
    });

    // 加载应用
    if (isDev()) {
      this.mainWindow.loadURL('http://localhost:5174');
      // 注释掉开发者工具，因为它会阻止 -webkit-app-region: drag 工作
      // this.mainWindow.webContents.openDevTools();
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
    try {
      const iconPath = join(__dirname, '../assets/tray-icon.png');
      const icon = nativeImage.createFromPath(iconPath);
      this.tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    } catch (error) {
      console.warn('Failed to create tray icon:', error);
      this.tray = new Tray(nativeImage.createEmpty());
    }
    
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
  private async setupIpcHandlers(): Promise<void> {
    // 动态导入服务，确保数据库已初始化
    const { databaseService } = await import('./services/databaseService');
    const { mainWebDAVService } = await import('./services/webdavService');
    const { mainGitSyncService } = await import('./services/gitSyncService');
    const { s3BackupService } = await import('./services/s3BackupService');

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

    // KeyResult operations
    ipcMain.handle('db:getKeyResults', (_, okrId?: number) => databaseService.getKeyResults(okrId));
    ipcMain.handle('db:getKeyResult', (_, id: number) => databaseService.getKeyResult(id));
    ipcMain.handle('db:createKeyResult', (_, keyResult) => databaseService.createKeyResult(keyResult));
    ipcMain.handle('db:updateKeyResult', (_, id: number, keyResult) => databaseService.updateKeyResult(id, keyResult));
    ipcMain.handle('db:deleteKeyResult', (_, id: number) => databaseService.deleteKeyResult(id));

    // WebDAV operations
    ipcMain.handle('webdav:initClient', async (_, config: any) => {
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

    // Git operations
    ipcMain.handle('git:createRepository', async (_, config: GitConfig) => {
      try {
        const remoteUrl = await mainGitSyncService.createRemoteRepository(config);
        return { success: true, remoteUrl };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:initRepository', async (_, config: GitConfig) => {
      try {
        await mainGitSyncService.initializeRepository(config);
        mainGitSyncService.updateConfig(config);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:testConnection', async () => {
      try {
        const result = await mainGitSyncService.testConnection();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:syncData', async () => {
      try {
        const result = await mainGitSyncService.syncData();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:exportData', async () => {
      try {
        await mainGitSyncService.exportData();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:commitChanges', async (_, message?: string) => {
      try {
        await mainGitSyncService.commitChanges(message);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:pushChanges', async () => {
      try {
        await mainGitSyncService.pushChanges();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:pullChanges', async () => {
      try {
        await mainGitSyncService.pullChanges();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:getStatus', async () => {
      try {
        const result = await mainGitSyncService.getStatus();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
    
    ipcMain.handle('git:testProxyConnection', async (_, proxyConfig: NonNullable<GitConfig['proxy']>) => {
      try {
        const result = await mainGitSyncService.testProxyConnection(proxyConfig);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // S3 backup operations
    ipcMain.handle('s3:initialize', async (_, config: any) => {
      try {
        await s3BackupService.initialize(config);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:testConnection', async () => {
      try {
        const result = await s3BackupService.testConnection();
        return { success: true, result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:performBackup', async () => {
      try {
        await s3BackupService.performBackup();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:getBackupList', async () => {
      try {
        const result = await s3BackupService.getBackupList();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:getStatus', async () => {
      try {
        const result = await s3BackupService.getStatus();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:startAutoBackup', async () => {
      try {
        s3BackupService.startAutoBackup();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:stopAutoBackup', async () => {
      try {
        s3BackupService.stopAutoBackup();
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:updateConfig', async (_, config: any) => {
      try {
        s3BackupService.updateConfig(config);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:performRestore', async (_, key: string, mode: string) => {
      try {
        await s3BackupService.performRestore(key, mode as 'database' | 'json' | 'merge');
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('s3:getBackupDetails', async (_, key: string) => {
      try {
        const result = await s3BackupService.getBackupDetails(key);
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

    // Window drag operations
    let isDragging = false;
    let dragStartPosition = { x: 0, y: 0 };
    let windowStartPosition = { x: 0, y: 0 };
    let dragInterval: NodeJS.Timeout | null = null;

    ipcMain.handle('window:startDrag', () => {
      const window = BrowserWindow.getFocusedWindow();
      if (!window) return;
      
      isDragging = true;
      const winPosition = window.getPosition();
      windowStartPosition = { x: winPosition[0], y: winPosition[1] };
      dragStartPosition = screen.getCursorScreenPoint();
      
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
        
        const currentPosition = screen.getCursorScreenPoint();
        const x = windowStartPosition.x + currentPosition.x - dragStartPosition.x;
        const y = windowStartPosition.y + currentPosition.y - dragStartPosition.y;
        
        window.setPosition(x, y, false); // Remove animation for smoother dragging
      }, 8); // Higher frequency for smoother dragging (~120fps)
    });

    ipcMain.handle('window:stopDrag', () => {
      isDragging = false;
      if (dragInterval) {
        clearInterval(dragInterval);
        dragInterval = null;
      }
    });
  }
}

new Application();