import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

// 云端数据库配置
const CLOUD_DB_ENABLED = process.env.CLOUD_DB_ENABLED === 'true';

let dbPath: string;

if (CLOUD_DB_ENABLED) {
  // 使用云端数据库
  const isDev = process.env.NODE_ENV === 'development';
  dbPath = isDev 
    ? path.join(process.cwd(), 'cloud_data.db')
    : path.join(app.getPath('userData'), 'cloud_data.db');
} else {
  // 使用本地数据库
  const isDev = process.env.NODE_ENV === 'development';
  dbPath = isDev 
    ? path.join(process.cwd(), 'data.db')
    : path.join(app.getPath('userData'), 'data.db');
}

class Database {
  private db: sqlite3.Database | null = null;

  async init(): Promise<void> {
    // 如果启用云端数据库，先下载云端数据库
    if (CLOUD_DB_ENABLED) {
      try {
        const { cloudDatabaseService } = await import('./services/cloudDatabaseService');
        
        // 配置云端数据库连接
        const cloudConfig = {
          host: process.env.CLOUD_DB_HOST || 'your_server_ip',
          port: parseInt(process.env.CLOUD_DB_PORT || '22'),
          username: process.env.CLOUD_DB_USER || 'your_username',
          password: process.env.CLOUD_DB_PASSWORD || 'your_password',
          privateKey: process.env.CLOUD_DB_PRIVATE_KEY, // 可选，SSH 密钥路径
          remotePath: process.env.CLOUD_DB_REMOTE_PATH || '~/personal-okr-manager/data.db'
        };
        
        await cloudDatabaseService.init(cloudConfig);
        
        // 下载云端数据库
        const downloaded = await cloudDatabaseService.downloadDatabase();
        if (downloaded) {
          console.log('成功下载云端数据库');
        } else {
          console.log('云端数据库不存在，将创建新的');
        }
      } catch (error) {
        console.error('云端数据库初始化失败，使用本地数据库:', error);
      }
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database:', dbPath);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    const tables = [
      {
        name: 'todos',
        sql: `CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
          status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
          due_date TEXT,
          tags TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'okrs',
        sql: `CREATE TABLE IF NOT EXISTS okrs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          quarter TEXT NOT NULL,
          year INTEGER NOT NULL,
          progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
          status TEXT CHECK(status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'key_results',
        sql: `CREATE TABLE IF NOT EXISTS key_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          okr_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          target_value REAL NOT NULL DEFAULT 0,
          current_value REAL DEFAULT 0,
          unit TEXT NOT NULL DEFAULT '',
          progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
          status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed', 'at_risk')) DEFAULT 'not_started',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (okr_id) REFERENCES okrs (id) ON DELETE CASCADE
        )`
      },
      {
        name: 'tasks',
        sql: `CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          okr_id INTEGER,
          kr_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
          estimated_hours REAL DEFAULT 0,
          actual_hours REAL DEFAULT 0,
          status TEXT CHECK(status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
          due_date TEXT,
          tags TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (okr_id) REFERENCES okrs (id) ON DELETE CASCADE,
          FOREIGN KEY (kr_id) REFERENCES key_results (id) ON DELETE CASCADE
        )`
      },
      {
        name: 'notes',
        sql: `CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          tags TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      }
    ];

    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        await this.run(table.sql);
        console.log(`Table ${table.name} created successfully`);
      } catch (error) {
        console.error(`Failed to create table ${table.name}:`, error);
        throw error;
      }
    }

    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)',
      'CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)',
      'CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_okrs_year_quarter ON okrs(year, quarter)',
      'CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id)',
      'CREATE INDEX IF NOT EXISTS idx_key_results_status ON key_results(status)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_okr_id ON tasks(okr_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_kr_id ON tasks(kr_id)',
      'CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async close(): Promise<void> {
    // 如果启用云端数据库，先同步到云端
    if (CLOUD_DB_ENABLED) {
      try {
        const { cloudDatabaseService } = await import('./services/cloudDatabaseService');
        await cloudDatabaseService.uploadDatabase();
        console.log('数据库已同步到云端');
        await cloudDatabaseService.close();
      } catch (error) {
        console.error('云端数据库同步失败:', error);
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

export const database = new Database();