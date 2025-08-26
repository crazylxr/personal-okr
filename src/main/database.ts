import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev 
  ? path.join(process.cwd(), 'data.db')
  : path.join(app.getPath('userData'), 'data.db');

class Database {
  private db: sqlite3.Database | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    const tables = [
      // Todos表
      `CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
        due_date TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // OKRs表
      `CREATE TABLE IF NOT EXISTS okrs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        quarter TEXT NOT NULL,
        year INTEGER NOT NULL,
        progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        status TEXT CHECK(status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // KeyResults表（OKR的关键结果）
      `CREATE TABLE IF NOT EXISTS key_results (
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
      )`,
      
      // Tasks表（关联到OKR或KeyResult的具体任务）
      `CREATE TABLE IF NOT EXISTS tasks (
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
      )`,
      
      // Notes表
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
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