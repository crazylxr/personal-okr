export interface Todo {
  id?: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OKR {
  id?: number;
  title: string;
  description?: string;
  quarter: string;
  year: number;
  progress: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface KeyResult {
  id?: number;
  okr_id: number;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string; // 单位，如 '%', '个', '次' 等
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk';
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id?: number;
  okr_id?: number;
  kr_id?: number; // 关联到关键结果
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string | null;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id?: number;
  title: string;
  content?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

// Git 同步配置接口
export interface GitConfig {
  enabled: boolean;
  remoteUrl: string;
  branch: string;
  authMethod: 'token' | 'ssh' | 'https';
  credentials: {
    token?: string;
    sshKey?: string;
    username?: string;
    password?: string;
  };
  syncInterval: number; // 分钟
  autoSync: boolean;
  localRepoPath?: string;
  // 自动创建仓库相关配置
  autoCreateRepo?: boolean;
  repoName?: string;
  repoDescription?: string;
  gitProvider?: 'github' | 'gitlab';
  repoVisibility?: 'private' | 'public';
  // 代理配置
  proxy?: {
    enabled: boolean;
    type: 'http' | 'https' | 'socks5';
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

// 同步数据格式
export interface SyncData {
  todos: Todo[];
  okrs: OKR[];
  keyResults: KeyResult[];
  tasks: Task[];
  notes: Note[];
  lastSync: string;
  version: string;
}

// Git 同步状态
export interface GitSyncStatus {
  isInitialized: boolean;
  lastSync?: string;
  hasChanges: boolean;
  syncInProgress: boolean;
  error?: string;
}

// 同步策略类型
export type SyncStrategy = 'webdav' | 'git' | 's3';

// S3 备份配置接口
export interface S3Config {
  enabled: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string; // 用于兼容其他 S3 兼容服务
  pathPrefix?: string; // 对象键前缀，如 'backups/'
  backupInterval: number; // 分钟
  autoBackup: boolean;
  maxBackups?: number; // 最大备份数量，默认保留最近 30 个
  compression: boolean; // 是否压缩备份
  encryption: boolean; // 是否加密备份
  // 备份类型
  backupTypes: {
    database: boolean; // 备份数据库文件
    json: boolean; // 备份 JSON 导出
  };
}

// S3 备份状态
export interface S3BackupStatus {
  isConfigured: boolean;
  lastBackup?: string;
  backupCount: number;
  backupInProgress: boolean;
  totalSize: number; // 总备份大小（字节）
  error?: string;
}

// S3 备份信息
export interface S3BackupInfo {
  key: string;
  size: number;
  lastModified: string;
  version?: string;
  type: 'database' | 'json';
}

// S3 备份元数据
export interface S3BackupMetadata {
  appVersion: string;
  schemaVersion: string;
  backupTime: string;
  backupType: 'database' | 'json';
  compressed: boolean;
  encrypted: boolean;
  size: number;
  checksum?: string;
}

// 通用同步配置
export interface SyncConfig {
  strategy: SyncStrategy;
  webdav?: {
    enabled: boolean;
    url: string;
    username: string;
    password: string;
    syncInterval: number;
    autoSync: boolean;
  };
  git?: GitConfig;
  s3?: S3Config;
}

export interface DatabaseAPI {
  // Todo operations
  getTodos: () => Promise<Todo[]>;
  getTodo: (id: number) => Promise<Todo | null>;
  createTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateTodo: (id: number, todo: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  
  // OKR operations
  getOKRs: () => Promise<OKR[]>;
  getOKR: (id: number) => Promise<OKR | null>;
  createOKR: (okr: Omit<OKR, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateOKR: (id: number, okr: Partial<OKR>) => Promise<void>;
  deleteOKR: (id: number) => Promise<void>;
  
  // KeyResult operations
  getKeyResults: (okrId?: number) => Promise<KeyResult[]>;
  getKeyResult: (id: number) => Promise<KeyResult | null>;
  createKeyResult: (keyResult: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateKeyResult: (id: number, keyResult: Partial<KeyResult>) => Promise<void>;
  deleteKeyResult: (id: number) => Promise<void>;
  
  // Task operations
  getTasks: (okrId?: number) => Promise<Task[]>;
  getTask: (id: number) => Promise<Task | null>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateTask: (id: number, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  
  // Note operations
  getNotes: () => Promise<Note[]>;
  getNote: (id: number) => Promise<Note | null>;
  createNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateNote: (id: number, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}