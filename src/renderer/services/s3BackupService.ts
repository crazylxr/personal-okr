import { S3Config, S3BackupStatus, S3BackupInfo } from '../../types/database';

class RendererS3BackupService {
  private config: S3Config | null = null;

  constructor() {
    // 构造函数
  }

  /**
   * 初始化 S3 配置
   */
  public async initialize(config: S3Config): Promise<void> {
    try {
      // 通过 IPC 调用主进程初始化 S3
      const result = await window.electronAPI.invokeS3Action('initialize', config);
      if (result.success) {
        this.config = config;
        console.log('S3 初始化成功');
      } else {
        throw new Error(result.error || 'S3 初始化失败');
      }
    } catch (error) {
      console.error('S3 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 测试 S3 连接
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await window.electronAPI.invokeS3Action('testConnection');
      return result.success;
    } catch (error) {
      console.error('测试 S3 连接失败:', error);
      throw error;
    }
  }

  /**
   * 执行备份
   */
  public async performBackup(): Promise<void> {
    try {
      const result = await window.electronAPI.invokeS3Action('performBackup');
      if (!result.success) {
        throw new Error(result.error || '备份失败');
      }
      console.log('备份成功');
    } catch (error) {
      console.error('备份失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份列表
   */
  public async getBackupList(): Promise<S3BackupInfo[]> {
    try {
      const result = await window.electronAPI.invokeS3Action('getBackupList');
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取备份列表失败');
      }
    } catch (error) {
      console.error('获取备份列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份状态
   */
  public async getStatus(): Promise<S3BackupStatus> {
    try {
      const result = await window.electronAPI.invokeS3Action('getStatus');
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取备份状态失败');
      }
    } catch (error) {
      console.error('获取备份状态失败:', error);
      throw error;
    }
  }

  /**
   * 启动自动备份
   */
  public async startAutoBackup(): Promise<void> {
    try {
      const result = await window.electronAPI.invokeS3Action('startAutoBackup');
      if (!result.success) {
        throw new Error(result.error || '启动自动备份失败');
      }
      console.log('自动备份已启动');
    } catch (error) {
      console.error('启动自动备份失败:', error);
      throw error;
    }
  }

  /**
   * 停止自动备份
   */
  public async stopAutoBackup(): Promise<void> {
    try {
      const result = await window.electronAPI.invokeS3Action('stopAutoBackup');
      if (!result.success) {
        throw new Error(result.error || '停止自动备份失败');
      }
      console.log('自动备份已停止');
    } catch (error) {
      console.error('停止自动备份失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  public async updateConfig(config: S3Config): Promise<void> {
    try {
      const result = await window.electronAPI.invokeS3Action('updateConfig', config);
      if (result.success) {
        this.config = config;
        console.log('S3 配置更新成功');
      } else {
        throw new Error(result.error || '更新配置失败');
      }
    } catch (error) {
      console.error('更新 S3 配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取配置
   */
  public getConfig(): S3Config | null {
    return this.config;
  }

  /**
   * 检查是否启用
   */
  public isEnabled(): boolean {
    return this.config?.enabled ?? false;
  }

  /**
   * 执行恢复操作
   */
  public async performRestore(key: string, mode: 'database' | 'json' | 'merge'): Promise<void> {
    try {
      const result = await window.electronAPI.s3.performRestore(key, mode);
      if (!result.success) {
        throw new Error(result.error || '恢复失败');
      }
      console.log('恢复成功');
    } catch (error) {
      console.error('恢复失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份详细信息
   */
  public async getBackupDetails(key: string): Promise<any> {
    try {
      const result = await window.electronAPI.s3.getBackupDetails(key);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || '获取备份详细信息失败');
      }
    } catch (error) {
      console.error('获取备份详细信息失败:', error);
      throw error;
    }
  }
}

export const rendererS3BackupService = new RendererS3BackupService();
export default rendererS3BackupService;