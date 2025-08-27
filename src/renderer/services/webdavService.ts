import { Todo, OKR, Task, Note } from '../../types/database';

export interface WebDAVConfig {
  enabled: boolean;
  url: string;
  username: string;
  password: string;
  syncInterval: number;
  autoSync: boolean;
}

export interface SyncData {
  todos: Todo[];
  okrs: OKR[];
  tasks: Task[];
  notes: Note[];
  lastSync: string;
  version: string;
}

class WebDAVService {
  private config: WebDAVConfig | null = null;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('webdav-config');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
        if (this.config?.enabled) {
          this.initializeClient();
          if (this.config.autoSync) {
            this.startAutoSync();
          }
        }
      }
    } catch (error) {
      console.error('加载WebDAV配置失败:', error);
    }
  }

  public updateConfig(newConfig: WebDAVConfig): void {
    this.config = newConfig;
    localStorage.setItem('webdav-config', JSON.stringify(newConfig));
    
    if (newConfig.enabled) {
      this.initializeClient();
      if (newConfig.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    } else {
      this.stopAutoSync();
    }
  }

  private async initializeClient(): Promise<void> {
    if (!this.config) return;
    
    try {
      await window.electronAPI.webdav.initClient(this.config);
      console.log('WebDAV客户端初始化成功');
    } catch (error) {
      console.error('初始化WebDAV客户端失败:', error);
      throw new Error('WebDAV客户端初始化失败');
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await window.electronAPI.webdav.testConnection();
      return result.result || false;
    } catch (error) {
      console.error('WebDAV连接测试失败:', error);
      throw new Error('WebDAV连接测试失败');
    }
  }

  public async syncData(localData?: SyncData): Promise<SyncData> {
    try {
      const result = await window.electronAPI.webdav.syncData();
      return result.data;
    } catch (error) {
      console.error('数据同步失败:', error);
      throw new Error('数据同步失败');
    }
  }

  private startAutoSync(): void {
    if (!this.config || this.syncTimer) return;

    const intervalMs = this.config.syncInterval * 60 * 1000; // 转换为毫秒
    this.syncTimer = setInterval(() => {
      this.performAutoSync();
    }, intervalMs);

    console.log(`自动同步已启动，间隔: ${this.config.syncInterval} 分钟`);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('自动同步已停止');
    }
  }

  private async performAutoSync(): Promise<void> {
    try {
      await this.syncData();
      console.log('自动同步完成');
    } catch (error) {
      console.error('自动同步失败:', error);
    }
  }

  public isEnabled(): boolean {
    return this.config?.enabled ?? false;
  }

  public getConfig(): WebDAVConfig | null {
    return this.config;
  }
}

// 导出单例实例
export const webdavService = new WebDAVService();
export default webdavService;