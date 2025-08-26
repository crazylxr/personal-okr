import { Todo, OKR, Task, Note, KeyResult } from './database';

declare global {
  interface Window {
    electronAPI: {
      todos: {
        getAll: () => Promise<Todo[]>;
        get: (id: number) => Promise<Todo | null>;
        create: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, todo: Partial<Todo>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      okrs: {
        getAll: () => Promise<OKR[]>;
        get: (id: number) => Promise<OKR | null>;
        create: (okr: Omit<OKR, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, okr: Partial<OKR>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      tasks: {
        getAll: (okrId?: number) => Promise<Task[]>;
        get: (id: number) => Promise<Task | null>;
        create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, task: Partial<Task>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      notes: {
        getAll: () => Promise<Note[]>;
        get: (id: number) => Promise<Note | null>;
        create: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, note: Partial<Note>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      keyResults: {
        getAll: (okrId?: number) => Promise<KeyResult[]>;
        get: (id: number) => Promise<KeyResult | null>;
        create: (keyResult: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
        update: (id: number, keyResult: Partial<KeyResult>) => Promise<void>;
        delete: (id: number) => Promise<void>;
      };
      app: {
        quit: () => Promise<void>;
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
    };
  }
}

export {};