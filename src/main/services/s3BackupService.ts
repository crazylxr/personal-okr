import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { join } from 'path';
import { app } from 'electron';
import { promises as fs } from 'fs';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { databaseService } from './databaseService';
import { S3Config, S3BackupStatus, S3BackupInfo, S3BackupMetadata, SyncData } from '../../types/database';

class S3BackupService {
  private s3Client: S3Client | null = null;
  private config: S3Config | null = null;
  private backupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 构造函数
  }

  /**
   * 初始化 S3 客户端
   */
  public async initialize(config: S3Config): Promise<void> {
    try {
      this.config = config;
      
      // 创建 S3 客户端配置
      const clientConfig: any = {
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        region: config.region,
      };

      // 如果有自定义端点，添加配置
      if (config.endpoint) {
        clientConfig.endpoint = config.endpoint;
        clientConfig.forcePathStyle = true; // 兼容其他 S3 服务
      }

      this.s3Client = new S3Client(clientConfig);
      
      // 测试连接
      await this.testConnection();
      
      console.log('S3 客户端初始化成功');
    } catch (error) {
      console.error('S3 客户端初始化失败:', error);
      throw new Error(`S3 客户端初始化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 测试 S3 连接
   */
  public async testConnection(): Promise<boolean> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      // 尝试列出存储桶中的对象来测试连接
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 1,
      });

      await this.s3Client.send(command);
      console.log('S3 连接测试成功');
      return true;
    } catch (error) {
      console.error('S3 连接测试失败:', error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('AccessDenied')) {
        throw new Error('访问被拒绝，请检查访问密钥和权限');
      } else if (errorMessage.includes('NoSuchBucket')) {
        throw new Error('存储桶不存在，请检查存储桶名称');
      } else if (errorMessage.includes('InvalidAccessKeyId')) {
        throw new Error('访问密钥无效，请检查 Access Key ID');
      } else if (errorMessage.includes('SignatureDoesNotMatch')) {
        throw new Error('签名不匹配，请检查 Secret Access Key');
      } else {
        throw new Error(`S3 连接测试失败: ${errorMessage}`);
      }
    }
  }

  /**
   * 生成备份文件名
   */
  private generateBackupKey(type: 'database' | 'json'): string {
    if (!this.config) {
      throw new Error('S3 配置未初始化');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = this.config.pathPrefix || '';
    const extension = type === 'database' ? 'db' : 'json';
    
    return `${prefix}backup-${type}-${timestamp}.${extension}${this.config.compression ? '.gz' : ''}`;
  }

  /**
   * 创建备份元数据
   */
  private createMetadata(type: 'database' | 'json', size: number): S3BackupMetadata {
    return {
      appVersion: '1.0.0',
      schemaVersion: '1.0',
      backupTime: new Date().toISOString(),
      backupType: type,
      compressed: this.config?.compression || false,
      encrypted: this.config?.encryption || false,
      size: size,
    };
  }

  /**
   * 压缩数据
   */
  private async compressData(data: Buffer): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      const gzip = createGzip();
      
      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      
      gzip.end(data);
    });
  }

  /**
   * 解压数据
   */
  private async decompressData(data: Buffer): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      const gunzip = createGunzip();
      
      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks)));
      gunzip.on('error', reject);
      
      gunzip.end(data);
    });
  }

  /**
   * 加密数据
   */
  private async encryptData(data: Buffer): Promise<{ encrypted: Uint8Array; iv: Buffer; key: Buffer }> {
    const algorithm = 'aes-256-gcm';
    const iv = randomBytes(16);
    const key = randomBytes(32); // 256 bits
    
    const cipher = createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    
    return { encrypted, iv, key };
  }

  /**
   * 解密数据
   */
  private async decryptData(encrypted: Buffer, iv: Buffer, key: Buffer): Promise<Buffer> {
    const algorithm = 'aes-256-gcm';
    const decipher = createDecipheriv(algorithm, key, iv);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * 备份数据库文件
   */
  private async backupDatabase(): Promise<{ key: string; size: number }> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      // 获取数据库文件路径
      const isDev = process.env.NODE_ENV === 'development';
      const dbPath = isDev 
        ? join(process.cwd(), 'data.db')
        : join(app.getPath('userData'), 'data.db');

      // 读取数据库文件
      const dbData = await fs.readFile(dbPath);
      let data = dbData;

      // 压缩
      if (this.config.compression) {
        data = Buffer.from(await this.compressData(data));
      }

      // 加密
      let encryptionKey: Buffer | null = null;
      if (this.config.encryption) {
        const { encrypted, iv, key } = await this.encryptData(data);
        data = Buffer.from(encrypted);
        encryptionKey = key;
        
        // 将 IV 添加到数据前面
        data = Buffer.concat([iv, data]);
      }

      // 生成备份键
      const key = this.generateBackupKey('database');
      
      // 创建元数据
      const metadata = this.createMetadata('database', data.length);
      metadata.checksum = this.calculateChecksum(data);

      // 上传到 S3
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: data,
          ContentType: 'application/octet-stream',
          Metadata: {
            'app-version': metadata.appVersion,
            'schema-version': metadata.schemaVersion,
            'backup-time': metadata.backupTime,
            'backup-type': metadata.backupType,
            'compressed': metadata.compressed.toString(),
            'encrypted': metadata.encrypted.toString(),
            'size': metadata.size.toString(),
            'checksum': metadata.checksum || '',
          },
        },
      });

      await upload.done();

      // 如果加密了，需要保存密钥（在实际应用中，应该安全地存储这个密钥）
      if (encryptionKey) {
        // 这里应该将密钥安全地存储，例如使用系统密钥链
        console.log('备份加密完成，请妥善保管加密密钥');
      }

      console.log(`数据库备份完成: ${key}`);
      return { key, size: data.length };
    } catch (error) {
      console.error('数据库备份失败:', error);
      throw new Error(`数据库备份失败: ${(error as Error).message}`);
    }
  }

  /**
   * 备份 JSON 数据
   */
  private async backupJson(): Promise<{ key: string; size: number }> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      // 获取所有数据
      const [todos, okrs, keyResults, tasks, notes] = await Promise.all([
        databaseService.getTodos(),
        databaseService.getOKRs(),
        databaseService.getKeyResults(),
        databaseService.getTasks(),
        databaseService.getNotes()
      ]);

      const syncData: SyncData = {
        todos,
        okrs,
        keyResults,
        tasks,
        notes,
        lastSync: new Date().toISOString(),
        version: '1.0.0'
      };

      // 转换为 JSON
      const jsonData = JSON.stringify(syncData, null, 2);
      let data = Buffer.from(jsonData, 'utf8');

      // 压缩
      if (this.config.compression) {
        data = Buffer.from(await this.compressData(data));
      }

      // 加密
      let encryptionKey: Buffer | null = null;
      if (this.config.encryption) {
        const { encrypted, iv, key } = await this.encryptData(data);
        data = Buffer.from(encrypted);
        encryptionKey = key;
        
        // 将 IV 添加到数据前面
        data = Buffer.concat([iv, data]);
      }

      // 生成备份键
      const key = this.generateBackupKey('json');
      
      // 创建元数据
      const metadata = this.createMetadata('json', data.length);
      metadata.checksum = this.calculateChecksum(data);

      // 上传到 S3
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: data,
          ContentType: 'application/json',
          Metadata: {
            'app-version': metadata.appVersion,
            'schema-version': metadata.schemaVersion,
            'backup-time': metadata.backupTime,
            'backup-type': metadata.backupType,
            'compressed': metadata.compressed.toString(),
            'encrypted': metadata.encrypted.toString(),
            'size': metadata.size.toString(),
            'checksum': metadata.checksum || '',
          },
        },
      });

      await upload.done();

      // 如果加密了，需要保存密钥
      if (encryptionKey) {
        console.log('JSON 备份加密完成，请妥善保管加密密钥');
      }

      console.log(`JSON 备份完成: ${key}`);
      return { key, size: data.length };
    } catch (error) {
      console.error('JSON 备份失败:', error);
      throw new Error(`JSON 备份失败: ${(error as Error).message}`);
    }
  }

  /**
   * 执行备份
   */
  public async performBackup(): Promise<void> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      console.log('开始 S3 备份...');

      const backupResults: { key: string; size: number }[] = [];

      // 备份数据库
      if (this.config.backupTypes.database) {
        const dbResult = await this.backupDatabase();
        backupResults.push(dbResult);
      }

      // 备份 JSON
      if (this.config.backupTypes.json) {
        const JsonResult = await this.backupJson();
        backupResults.push(JsonResult);
      }

      // 清理旧备份
      await this.cleanupOldBackups();

      console.log(`S3 备份完成，共备份 ${backupResults.length} 个文件`);
    } catch (error) {
      console.error('S3 备份失败:', error);
      throw new Error(`S3 备份失败: ${(error as Error).message}`);
    }
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    if (!this.s3Client || !this.config) {
      return;
    }

    try {
      const maxBackups = this.config.maxBackups || 30;
      const prefix = this.config.pathPrefix || '';

      // 列出所有备份文件
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(listCommand);
      const objects = response.Contents || [];

      if (objects.length <= maxBackups) {
        return;
      }

      // 按修改时间排序，删除最旧的文件
      const sortedObjects = objects
        .sort((a, b) => new Date(a.LastModified || 0).getTime() - new Date(b.LastModified || 0).getTime())
        .slice(0, objects.length - maxBackups);

      // 删除旧备份
      for (const obj of sortedObjects) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: obj.Key!,
        });

        await this.s3Client.send(deleteCommand);
        console.log(`删除旧备份: ${obj.Key}`);
      }
    } catch (error) {
      console.error('清理旧备份失败:', error);
    }
  }

  /**
   * 获取备份列表
   */
  public async getBackupList(): Promise<S3BackupInfo[]> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      let prefix = this.config.pathPrefix || '';
      
      // 对于七牛云，需要在路径前缀前面加上存储桶名称
      if (this.config.endpoint && this.config.endpoint.includes('qiniucs.com')) {
        prefix = `${this.config.bucket}/${prefix}`;
      }
      
      console.log('=== S3 备份列表调试信息 ===');
      console.log('S3 配置:', {
        bucket: this.config.bucket,
        endpoint: this.config.endpoint,
        region: this.config.region,
        originalPathPrefix: this.config.pathPrefix || '',
        adjustedPathPrefix: prefix
      });
      
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      });
      
      console.log('发送 S3 请求:', {
        Bucket: this.config.bucket,
        Prefix: prefix
      });
      
      const response = await this.s3Client.send(listCommand);
      console.log('S3 响应:', {
        IsTruncated: response.IsTruncated,
        KeyCount: response.KeyCount,
        MaxKeys: response.MaxKeys,
        Name: response.Name,
        Prefix: response.Prefix,
        StartAfter: response.StartAfter,
        Contents: response.Contents?.map(obj => ({
          Key: obj.Key,
          Size: obj.Size,
          LastModified: obj.LastModified,
          ETag: obj.ETag
        }))
      });
      
      const objects = response.Contents || [];
      console.log(`找到 ${objects.length} 个对象`);
      
      if (objects.length === 0) {
        console.log('警告: 没有找到任何对象。请检查:');
        console.log('1. 存储桶名称是否正确');
        console.log('2. 路径前缀是否正确');
        console.log('3. 是否有权限访问该存储桶');
        console.log('4. 存储桶中是否有文件');
      }

      return objects.map(obj => {
        const key = obj.Key!;
        const type = key.includes('-database-') ? 'database' : 'json';
        
        console.log('处理备份对象:', {
          originalKey: key,
          type,
          size: obj.Size || 0
        });
        
        // 对于七牛云，保留完整的键路径
        let displayKey = key;
        
        console.log('返回的备份键:', {
          originalKey: key,
          displayKey: displayKey
        });
        
        return {
          key: displayKey,
          size: obj.Size || 0,
          lastModified: obj.LastModified?.toISOString() || '',
          type,
        };
      });
    } catch (error) {
      console.error('获取备份列表失败:', error);
      throw new Error(`获取备份列表失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取备份状态
   */
  public async getStatus(): Promise<S3BackupStatus> {
    try {
      if (!this.s3Client || !this.config) {
        return {
          isConfigured: false,
          backupCount: 0,
          backupInProgress: false,
          totalSize: 0,
        };
      }

      const backupList = await this.getBackupList();
      const totalSize = backupList.reduce((sum, backup) => sum + backup.size, 0);
      
      // 获取最新的备份时间
      let lastBackup: string | undefined;
      if (backupList.length > 0) {
        const latestBackup = backupList.reduce((latest, backup) => 
          backup.lastModified > latest.lastModified ? backup : latest
        );
        lastBackup = latestBackup.lastModified;
      }

      return {
        isConfigured: true,
        lastBackup,
        backupCount: backupList.length,
        backupInProgress: false,
        totalSize,
      };
    } catch (error) {
      return {
        isConfigured: false,
        backupCount: 0,
        backupInProgress: false,
        totalSize: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 启动自动备份
   */
  public startAutoBackup(): void {
    if (!this.config || this.backupTimer) return;

    const intervalMs = this.config.backupInterval * 60 * 1000;
    this.backupTimer = setInterval(() => {
      this.performAutoBackup();
    }, intervalMs);

    console.log(`S3 自动备份已启动，间隔: ${this.config.backupInterval} 分钟`);
  }

  /**
   * 停止自动备份
   */
  public stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('S3 自动备份已停止');
    }
  }

  /**
   * 执行自动备份
   */
  private async performAutoBackup(): Promise<void> {
    try {
      await this.performBackup();
      console.log('S3 自动备份完成');
    } catch (error) {
      console.error('S3 自动备份失败:', error);
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: S3Config): void {
    this.config = newConfig;
    
    if (newConfig.enabled && newConfig.autoBackup) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
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
   * 从 S3 下载备份文件
   */
  private async downloadBackup(key: string): Promise<Buffer> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      // 对于七牛云，使用 HTTP 直接下载
      if (this.config.endpoint && this.config.endpoint.includes('qiniucs.com')) {
        const httpsModule = await import('https');
        const httpModule = await import('http');
        
        // 尝试使用七牛云的公开访问格式
        const publicUrl = `http://t1mp3nwsq.hn-bkt.clouddn.com/${key}`;
        console.log('尝试七牛云公开访问:', publicUrl);
        
        return new Promise((resolve, reject) => {
          const client = publicUrl.startsWith('https://') ? httpsModule.default : httpModule.default;
          const req = client.get(publicUrl, (res: any) => {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
              return;
            }
            
            const chunks: Buffer[] = [];
            res.on('data', (chunk: any) => {
              chunks.push(chunk);
            });
            
            res.on('end', () => {
              resolve(Buffer.concat(chunks));
            });
          });
          
          req.on('error', reject);
          req.end();
        });
      }
      
      // 对于其他 S3 提供商，使用 AWS SDK
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Buffer[] = [];

      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('下载备份文件失败:', error);
      throw new Error(`下载备份文件失败: ${(error as Error).message}`);
    }
  }

  /**
   * 恢复数据库备份
   */
  private async restoreDatabase(key: string): Promise<void> {
    try {
      // 下载数据
      let data = await this.downloadBackup(key);
      
      // 解密
      if (this.config?.encryption) {
        // 提取 IV (前 16 字节)
        const iv = data.slice(0, 16);
        const encryptedData = data.slice(16);
        
        // 注意：在实际应用中，需要从安全存储中获取加密密钥
        // 这里为了演示，我们假设有办法获取密钥
        throw new Error('数据库恢复需要解密密钥，请在设置中配置解密密钥');
      }
      
      // 解压
      if (this.config?.compression) {
        data = Buffer.from(await this.decompressData(data));
      }
      
      // 获取数据库文件路径
      const isDev = process.env.NODE_ENV === 'development';
      const dbPath = isDev 
        ? join(process.cwd(), 'data.db')
        : join(app.getPath('userData'), 'data.db');
      
      // 备份当前数据库
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      const { promises: fs } = await import('fs');
      await fs.copyFile(dbPath, backupPath);
      
      // 写入新数据库
      await fs.writeFile(dbPath, data);
      
      console.log(`数据库恢复完成: ${key}`);
      console.log(`原数据库已备份到: ${backupPath}`);
    } catch (error) {
      console.error('数据库恢复失败:', error);
      throw new Error(`数据库恢复失败: ${(error as Error).message}`);
    }
  }

  /**
   * 恢复 JSON 备份
   */
  private async restoreJson(key: string): Promise<SyncData> {
    try {
      // 下载数据
      let data = await this.downloadBackup(key);
      
      // 解密
      if (this.config?.encryption) {
        // 提取 IV (前 16 字节)
        const iv = data.slice(0, 16);
        const encryptedData = data.slice(16);
        
        // 注意：在实际应用中，需要从安全存储中获取加密密钥
        throw new Error('JSON 恢复需要解密密钥，请在设置中配置解密密钥');
      }
      
      // 解压
      if (this.config?.compression) {
        data = Buffer.from(await this.decompressData(data));
      }
      
      // 解析 JSON
      const jsonData = data.toString('utf8');
      const syncData: SyncData = JSON.parse(jsonData);
      
      console.log(`JSON 恢复完成: ${key}`);
      return syncData;
    } catch (error) {
      console.error('JSON 恢复失败:', error);
      throw new Error(`JSON 恢复失败: ${(error as Error).message}`);
    }
  }

  /**
   * 执行恢复操作
   */
  public async performRestore(key: string, mode: 'database' | 'json' | 'merge'): Promise<void> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      console.log(`开始恢复备份: ${key}, 模式: ${mode}`);
      
      if (mode === 'database') {
        await this.restoreDatabase(key);
      } else if (mode === 'json' || mode === 'merge') {
        const syncData = await this.restoreJson(key);
        
        // 恢复数据到数据库
        const { databaseService } = await import('./databaseService');
        
        // 获取现有数据（两种模式都需要）
        const existingTodos = await databaseService.getTodos();
        const existingOKRs = await databaseService.getOKRs();
        const existingKeyResults = await databaseService.getKeyResults();
        const existingTasks = await databaseService.getTasks();
        const existingNotes = await databaseService.getNotes();
        
        if (mode === 'merge') {
          // 合并模式：保留现有数据，只添加不重复的数据
          console.log('使用合并模式恢复数据');
          
          // 创建现有数据的ID集合用于快速查找
          const existingTodoIds = new Set(existingTodos.map(t => t.id));
          const existingOKRIds = new Set(existingOKRs.map(o => o.id));
          const existingKeyResultIds = new Set(existingKeyResults.map(k => k.id));
          const existingTaskIds = new Set(existingTasks.map(t => t.id));
          const existingNoteIds = new Set(existingNotes.map(n => n.id));
          
          console.log(`现有数据统计: Todos(${existingTodoIds.size}), OKRs(${existingOKRIds.size}), KeyResults(${existingKeyResultIds.size}), Tasks(${existingTaskIds.size}), Notes(${existingNoteIds.size})`);
          
          // 只添加不存在的数据
          let newTodos = 0, newOKRs = 0, newKeyResults = 0, newTasks = 0, newNotes = 0;
          
          for (const todo of syncData.todos) {
            if (!existingTodoIds.has(todo.id)) {
              await databaseService.createTodo(todo);
              newTodos++;
            }
          }
          
          for (const okr of syncData.okrs) {
            if (!existingOKRIds.has(okr.id)) {
              await databaseService.createOKR(okr);
              newOKRs++;
            }
          }
          
          for (const keyResult of syncData.keyResults) {
            if (!existingKeyResultIds.has(keyResult.id)) {
              await databaseService.createKeyResult(keyResult);
              newKeyResults++;
            }
          }
          
          for (const task of syncData.tasks) {
            if (!existingTaskIds.has(task.id)) {
              await databaseService.createTask(task);
              newTasks++;
            }
          }
          
          for (const note of syncData.notes) {
            if (!existingNoteIds.has(note.id)) {
              await databaseService.createNote(note);
              newNotes++;
            }
          }
          
          console.log(`合并完成 - 新增数据: Todos(${newTodos}), OKRs(${newOKRs}), KeyResults(${newKeyResults}), Tasks(${newTasks}), Notes(${newNotes})`);
          
        } else {
          // 覆盖模式：先清空现有数据，然后导入所有数据
          console.log('使用覆盖模式恢复数据');
          
          // 清空现有数据
          for (const todo of existingTodos) {
            if (todo.id !== undefined) {
              await databaseService.deleteTodo(todo.id);
            }
          }
          for (const okr of existingOKRs) {
            if (okr.id !== undefined) {
              await databaseService.deleteOKR(okr.id);
            }
          }
          for (const keyResult of existingKeyResults) {
            if (keyResult.id !== undefined) {
              await databaseService.deleteKeyResult(keyResult.id);
            }
          }
          for (const task of existingTasks) {
            if (task.id !== undefined) {
              await databaseService.deleteTask(task.id);
            }
          }
          for (const note of existingNotes) {
            if (note.id !== undefined) {
              await databaseService.deleteNote(note.id);
            }
          }
          
          // 导入所有备份数据
          for (const todo of syncData.todos) {
            await databaseService.createTodo(todo);
          }
          for (const okr of syncData.okrs) {
            await databaseService.createOKR(okr);
          }
          for (const keyResult of syncData.keyResults) {
            await databaseService.createKeyResult(keyResult);
          }
          for (const task of syncData.tasks) {
            await databaseService.createTask(task);
          }
          for (const note of syncData.notes) {
            await databaseService.createNote(note);
          }
          
          console.log('覆盖恢复完成');
        }
        
        console.log('数据恢复完成');
      }
    } catch (error) {
      console.error('恢复操作失败:', error);
      throw new Error(`恢复操作失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取备份详细信息
   */
  public async getBackupDetails(key: string): Promise<any> {
    if (!this.s3Client || !this.config) {
      throw new Error('S3 未初始化');
    }

    try {
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
      
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified?.toISOString() || '',
        metadata: response.Metadata,
        contentType: response.ContentType,
      };
    } catch (error) {
      console.error('获取备份详细信息失败:', error);
      throw new Error(`获取备份详细信息失败: ${(error as Error).message}`);
    }
  }
}

export const s3BackupService = new S3BackupService();
export default s3BackupService;