import { database } from '../database';
import { Todo, OKR, Task, Note, DatabaseAPI } from '../../types/database';

class DatabaseService implements DatabaseAPI {
  // Todo operations
  async getTodos(): Promise<Todo[]> {
    return await database.all('SELECT * FROM todos ORDER BY created_at DESC');
  }

  async getTodo(id: number): Promise<Todo | null> {
    return await database.get('SELECT * FROM todos WHERE id = ?', [id]);
  }

  async createTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await database.run(
      `INSERT INTO todos (title, description, priority, status, due_date, tags, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [todo.title, todo.description, todo.priority, todo.status, todo.due_date, todo.tags]
    );
    return result.lastID!;
  }

  async updateTodo(id: number, todo: Partial<Todo>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (todo.title !== undefined) {
      fields.push('title = ?');
      values.push(todo.title);
    }
    if (todo.description !== undefined) {
      fields.push('description = ?');
      values.push(todo.description);
    }
    if (todo.priority !== undefined) {
      fields.push('priority = ?');
      values.push(todo.priority);
    }
    if (todo.status !== undefined) {
      fields.push('status = ?');
      values.push(todo.status);
    }
    if (todo.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(todo.due_date);
    }
    if (todo.tags !== undefined) {
      fields.push('tags = ?');
      values.push(todo.tags);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteTodo(id: number): Promise<void> {
    await database.run('DELETE FROM todos WHERE id = ?', [id]);
  }

  // OKR operations
  async getOKRs(): Promise<OKR[]> {
    return await database.all('SELECT * FROM okrs ORDER BY year DESC, quarter DESC');
  }

  async getOKR(id: number): Promise<OKR | null> {
    return await database.get('SELECT * FROM okrs WHERE id = ?', [id]);
  }

  async createOKR(okr: Omit<OKR, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await database.run(
      `INSERT INTO okrs (title, description, quarter, year, progress, status, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [okr.title, okr.description, okr.quarter, okr.year, okr.progress, okr.status]
    );
    return result.lastID!;
  }

  async updateOKR(id: number, okr: Partial<OKR>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (okr.title !== undefined) {
      fields.push('title = ?');
      values.push(okr.title);
    }
    if (okr.description !== undefined) {
      fields.push('description = ?');
      values.push(okr.description);
    }
    if (okr.quarter !== undefined) {
      fields.push('quarter = ?');
      values.push(okr.quarter);
    }
    if (okr.year !== undefined) {
      fields.push('year = ?');
      values.push(okr.year);
    }
    if (okr.progress !== undefined) {
      fields.push('progress = ?');
      values.push(okr.progress);
    }
    if (okr.status !== undefined) {
      fields.push('status = ?');
      values.push(okr.status);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(
      `UPDATE okrs SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteOKR(id: number): Promise<void> {
    await database.run('DELETE FROM okrs WHERE id = ?', [id]);
  }

  // Task operations
  async getTasks(okrId?: number): Promise<Task[]> {
    if (okrId) {
      return await database.all('SELECT * FROM tasks WHERE okr_id = ? ORDER BY created_at DESC', [okrId]);
    }
    return await database.all('SELECT * FROM tasks ORDER BY created_at DESC');
  }

  async getTask(id: number): Promise<Task | null> {
    return await database.get('SELECT * FROM tasks WHERE id = ?', [id]);
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await database.run(
      `INSERT INTO tasks (okr_id, title, description, estimated_hours, actual_hours, status, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [task.okr_id, task.title, task.description, task.estimated_hours, task.actual_hours, task.status]
    );
    return result.lastID!;
  }

  async updateTask(id: number, task: Partial<Task>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (task.title !== undefined) {
      fields.push('title = ?');
      values.push(task.title);
    }
    if (task.description !== undefined) {
      fields.push('description = ?');
      values.push(task.description);
    }
    if (task.estimated_hours !== undefined) {
      fields.push('estimated_hours = ?');
      values.push(task.estimated_hours);
    }
    if (task.actual_hours !== undefined) {
      fields.push('actual_hours = ?');
      values.push(task.actual_hours);
    }
    if (task.status !== undefined) {
      fields.push('status = ?');
      values.push(task.status);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteTask(id: number): Promise<void> {
    await database.run('DELETE FROM tasks WHERE id = ?', [id]);
  }

  // Note operations
  async getNotes(): Promise<Note[]> {
    return await database.all('SELECT * FROM notes ORDER BY updated_at DESC');
  }

  async getNote(id: number): Promise<Note | null> {
    return await database.get('SELECT * FROM notes WHERE id = ?', [id]);
  }

  async createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await database.run(
      `INSERT INTO notes (title, content, tags, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [note.title, note.content, note.tags]
    );
    return result.lastID!;
  }

  async updateNote(id: number, note: Partial<Note>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (note.title !== undefined) {
      fields.push('title = ?');
      values.push(note.title);
    }
    if (note.content !== undefined) {
      fields.push('content = ?');
      values.push(note.content);
    }
    if (note.tags !== undefined) {
      fields.push('tags = ?');
      values.push(note.tags);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(
      `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteNote(id: number): Promise<void> {
    await database.run('DELETE FROM notes WHERE id = ?', [id]);
  }
}

export const databaseService = new DatabaseService();