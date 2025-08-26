"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = void 0;
const database_1 = require("../database");
class DatabaseService {
    // Todo operations
    async getTodos() {
        return await database_1.database.all('SELECT * FROM todos ORDER BY created_at DESC');
    }
    async getTodo(id) {
        return await database_1.database.get('SELECT * FROM todos WHERE id = ?', [id]);
    }
    async createTodo(todo) {
        const result = await database_1.database.run(`INSERT INTO todos (title, description, priority, status, due_date, tags, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [todo.title, todo.description, todo.priority, todo.status, todo.due_date, todo.tags]);
        return result.lastID;
    }
    async updateTodo(id, todo) {
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
        await database_1.database.run(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async deleteTodo(id) {
        await database_1.database.run('DELETE FROM todos WHERE id = ?', [id]);
    }
    // OKR operations
    async getOKRs() {
        return await database_1.database.all('SELECT * FROM okrs ORDER BY year DESC, quarter DESC');
    }
    async getOKR(id) {
        return await database_1.database.get('SELECT * FROM okrs WHERE id = ?', [id]);
    }
    async createOKR(okr) {
        const result = await database_1.database.run(`INSERT INTO okrs (title, description, quarter, year, progress, status, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [okr.title, okr.description, okr.quarter, okr.year, okr.progress, okr.status]);
        return result.lastID;
    }
    async updateOKR(id, okr) {
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
        await database_1.database.run(`UPDATE okrs SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async deleteOKR(id) {
        await database_1.database.run('DELETE FROM okrs WHERE id = ?', [id]);
    }
    // Task operations
    async getTasks(okrId) {
        if (okrId) {
            return await database_1.database.all('SELECT * FROM tasks WHERE okr_id = ? ORDER BY created_at DESC', [okrId]);
        }
        return await database_1.database.all('SELECT * FROM tasks ORDER BY created_at DESC');
    }
    async getTask(id) {
        return await database_1.database.get('SELECT * FROM tasks WHERE id = ?', [id]);
    }
    async createTask(task) {
        const result = await database_1.database.run(`INSERT INTO tasks (okr_id, kr_id, title, description, priority, estimated_hours, actual_hours, status, due_date, tags, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [task.okr_id, task.kr_id, task.title, task.description, task.priority, task.estimated_hours, task.actual_hours, task.status, task.due_date, task.tags]);
        return result.lastID;
    }
    async updateTask(id, task) {
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
        if (task.okr_id !== undefined) {
            fields.push('okr_id = ?');
            values.push(task.okr_id);
        }
        if (task.kr_id !== undefined) {
            fields.push('kr_id = ?');
            values.push(task.kr_id);
        }
        if (task.priority !== undefined) {
            fields.push('priority = ?');
            values.push(task.priority);
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
        if (task.due_date !== undefined) {
            fields.push('due_date = ?');
            values.push(task.due_date);
        }
        if (task.tags !== undefined) {
            fields.push('tags = ?');
            values.push(task.tags);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await database_1.database.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async deleteTask(id) {
        await database_1.database.run('DELETE FROM tasks WHERE id = ?', [id]);
    }
    // Note operations
    async getNotes() {
        return await database_1.database.all('SELECT * FROM notes ORDER BY updated_at DESC');
    }
    async getNote(id) {
        return await database_1.database.get('SELECT * FROM notes WHERE id = ?', [id]);
    }
    async createNote(note) {
        const result = await database_1.database.run(`INSERT INTO notes (title, content, tags, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`, [note.title, note.content, note.tags]);
        return result.lastID;
    }
    async updateNote(id, note) {
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
        await database_1.database.run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async deleteNote(id) {
        await database_1.database.run('DELETE FROM notes WHERE id = ?', [id]);
    }
    // KeyResult operations
    async getKeyResults(okrId) {
        if (okrId) {
            return await database_1.database.all('SELECT * FROM key_results WHERE okr_id = ? ORDER BY created_at ASC', [okrId]);
        }
        return await database_1.database.all('SELECT * FROM key_results ORDER BY created_at ASC');
    }
    async getKeyResult(id) {
        return await database_1.database.get('SELECT * FROM key_results WHERE id = ?', [id]);
    }
    async createKeyResult(keyResult) {
        // 计算进度百分比
        const progress = keyResult.target_value > 0
            ? Math.min(Math.round((keyResult.current_value / keyResult.target_value) * 100), 100)
            : 0;
        const result = await database_1.database.run(`INSERT INTO key_results (okr_id, title, description, target_value, current_value, unit, status, progress, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [keyResult.okr_id, keyResult.title, keyResult.description, keyResult.target_value, keyResult.current_value, keyResult.unit, keyResult.status, progress]);
        return result.lastID;
    }
    async updateKeyResult(id, keyResult) {
        const fields = [];
        const values = [];
        // 如果需要计算progress，先获取当前记录
        let needsProgressCalculation = false;
        let currentRecord = null;
        if (keyResult.target_value !== undefined || keyResult.current_value !== undefined) {
            currentRecord = await this.getKeyResult(id);
            needsProgressCalculation = true;
        }
        if (keyResult.title !== undefined) {
            fields.push('title = ?');
            values.push(keyResult.title);
        }
        if (keyResult.description !== undefined) {
            fields.push('description = ?');
            values.push(keyResult.description);
        }
        if (keyResult.target_value !== undefined) {
            fields.push('target_value = ?');
            values.push(keyResult.target_value);
        }
        if (keyResult.current_value !== undefined) {
            fields.push('current_value = ?');
            values.push(keyResult.current_value);
        }
        if (keyResult.unit !== undefined) {
            fields.push('unit = ?');
            values.push(keyResult.unit);
        }
        if (keyResult.status !== undefined) {
            fields.push('status = ?');
            values.push(keyResult.status);
        }
        // 计算并更新progress
        if (needsProgressCalculation && currentRecord) {
            const targetValue = keyResult.target_value !== undefined ? keyResult.target_value : currentRecord.target_value;
            const currentValue = keyResult.current_value !== undefined ? keyResult.current_value : currentRecord.current_value;
            const progress = targetValue > 0
                ? Math.min(Math.round((currentValue / targetValue) * 100), 100)
                : 0;
            fields.push('progress = ?');
            values.push(progress);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await database_1.database.run(`UPDATE key_results SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async deleteKeyResult(id) {
        await database_1.database.run('DELETE FROM key_results WHERE id = ?', [id]);
    }
}
exports.databaseService = new DatabaseService();
