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

export interface Task {
  id?: number;
  okr_id?: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
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