import { GitConfig, GitSyncStatus } from '../../types/database';

class RendererGitSyncService {
  private config: GitConfig | null = null;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  /**
   * 加载 Git 配置
   */
  async loadConfig(): Promise<GitConfig | null> {
    try {
      const stored = localStorage.getItem('gitConfig');
      if (stored) {
        this.config = JSON.parse(stored);
        return this.config;
      }
      return null;
    } catch (error) {
      console.error('Failed to load Git config:', error);
      return null;
    }
  }

  /**
   * 更新 Git 配置
   */
  async updateConfig(config: GitConfig): Promise<void> {
    try {
      this.config = config;
      localStorage.setItem('gitConfig', JSON.stringify(config));
      
      // 重新初始化仓库
      await this.initializeRepository();
      
      // 重启自动同步
      if (config.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    } catch (error) {
      console.error('Failed to update Git config:', error);
      throw error;
    }
  }

  /**
   * 创建远程仓库
   */
  async createRepository(config: GitConfig): Promise<string> {
    try {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI || !window.electronAPI.git || !window.electronAPI.git.createRepository) {
        throw new Error('Git API 未初始化，请重启应用');
      }
      
      const result = await window.electronAPI.git.createRepository(config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create repository');
      }
      if (!result.remoteUrl) {
        throw new Error('Remote URL not returned from repository creation');
      }
      return result.remoteUrl;
    } catch (error) {
      console.error('Failed to create Git repository:', error);
      throw error;
    }
  }

  /**
   * 初始化 Git 仓库
   */
  async initializeRepository(): Promise<void> {
    if (!this.config) {
      throw new Error('Git config not found');
    }

    try {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI || !window.electronAPI.git || !window.electronAPI.git.initRepository) {
        throw new Error('Git API 未初始化，请重启应用');
      }
      
      const result = await window.electronAPI.git.initRepository(this.config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize repository');
      }
    } catch (error) {
      console.error('Failed to initialize Git repository:', error);
      throw error;
    }
  }

  /**
   * 测试 Git 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI || !window.electronAPI.git || !window.electronAPI.git.testConnection) {
        throw new Error('Git API 未初始化，请重启应用');
      }
      
      const result = await window.electronAPI.git.testConnection();
      if (!result.success) {
        throw new Error(result.error || 'Git连接测试失败');
      }
      return result.result || false;
    } catch (error) {
      console.error('Failed to test Git connection:', error);
      throw error;
    }
  }

  /**
   * 测试代理连接
   */
  async testProxyConnection(proxyConfig: NonNullable<GitConfig['proxy']>): Promise<boolean> {
    try {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI || !window.electronAPI.git || !window.electronAPI.git.testProxyConnection) {
        throw new Error('Git API 未初始化，请重启应用');
      }
      
      const result = await window.electronAPI.git.testProxyConnection(proxyConfig);
      if (!result.success) {
        throw new Error(result.error || '代理连接测试失败');
      }
      return result.result || false;
    } catch (error) {
      console.error('Failed to test proxy connection:', error);
      throw error;
    }
  }

  /**
   * 执行数据同步
   */
  async syncData(): Promise<any> {
    try {
      // 检查 electronAPI 是否可用
      if (!window.electronAPI || !window.electronAPI.git || !window.electronAPI.git.syncData) {
        throw new Error('Git API 未初始化，请重启应用');
      }
      
      const result = await window.electronAPI.git.syncData();
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }
      return result.data;
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<void> {
    try {
      const result = await window.electronAPI.git.exportData();
      if (!result.success) {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * 提交更改
   */
  async commitChanges(message?: string): Promise<void> {
    try {
      const result = await window.electronAPI.git.commitChanges(message);
      if (!result.success) {
        throw new Error(result.error || 'Commit failed');
      }
    } catch (error) {
      console.error('Failed to commit changes:', error);
      throw error;
    }
  }

  /**
   * 推送更改
   */
  async pushChanges(): Promise<void> {
    try {
      const result = await window.electronAPI.git.pushChanges();
      if (!result.success) {
        throw new Error(result.error || 'Push failed');
      }
    } catch (error) {
      console.error('Failed to push changes:', error);
      throw error;
    }
  }

  /**
   * 拉取更改
   */
  async pullChanges(): Promise<void> {
    try {
      const result = await window.electronAPI.git.pullChanges();
      if (!result.success) {
        throw new Error(result.error || 'Pull failed');
      }
    } catch (error) {
      console.error('Failed to pull changes:', error);
      throw error;
    }
  }

  /**
   * 获取同步状态
   */
  async getStatus(): Promise<GitSyncStatus> {
    try {
      const result = await window.electronAPI.git.getStatus();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get status');
      }
      return result.data;
    } catch (error) {
      console.error('Failed to get Git status:', error);
      throw error;
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync(): void {
    if (!this.config || !this.config.autoSync) {
      return;
    }

    this.stopAutoSync();
    
    const intervalMs = this.config.syncInterval * 60 * 1000; // 转换为毫秒
    this.autoSyncInterval = setInterval(async () => {
      try {
        await this.syncData();
        console.log('Auto sync completed');
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, intervalMs);

    console.log(`Auto sync started with interval: ${this.config.syncInterval} minutes`);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('Auto sync stopped');
    }
  }

  /**
   * 验证配置
   */
  validateConfig(config: GitConfig): boolean {
    if (!config.remoteUrl || !config.branch) {
      return false;
    }

    if (config.authMethod === 'token' && !config.credentials.token) {
      return false;
    }

    if (config.authMethod === 'https' && (!config.credentials.username || !config.credentials.password)) {
      return false;
    }

    if (config.authMethod === 'ssh' && !config.credentials.sshKey) {
      return false;
    }

    return true;
  }

  /**
   * 获取当前配置
   */
  getConfig(): GitConfig | null {
    return this.config;
  }
}

// 导出单例实例
export const gitSyncService = new RendererGitSyncService();