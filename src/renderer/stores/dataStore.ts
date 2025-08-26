import { create } from 'zustand';
import { Todo, OKR, Task, Note } from '../../types/database';

interface DataState {
  todos: Todo[];
  okrs: OKR[];
  tasks: Task[];
  notes: Note[];
  loading: boolean;
  error: string | null;
}

interface DataActions {
  // Todo actions
  loadTodos: () => Promise<void>;
  createTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  
  // OKR actions
  loadOKRs: () => Promise<void>;
  createOKR: (okr: Omit<OKR, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateOKR: (id: number, updates: Partial<OKR>) => Promise<void>;
  deleteOKR: (id: number) => Promise<void>;
  
  // Task actions
  loadTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  
  // Note actions
  loadNotes: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type DataStore = DataState & DataActions;

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial state
  todos: [],
  okrs: [],
  tasks: [],
  notes: [],
  loading: false,
  error: null,

  // Todo actions
  loadTodos: async () => {
    try {
      set({ loading: true, error: null });
      const todos = await window.electronAPI.todos.getAll();
      set({ todos, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load todos', loading: false });
    }
  },

  createTodo: async (todoData) => {
    try {
      set({ loading: true, error: null });
      const todoId = await window.electronAPI.todos.create(todoData);
      const newTodo = await window.electronAPI.todos.get(todoId);
      if (newTodo) {
        set(state => ({ 
          todos: [...state.todos, newTodo], 
          loading: false 
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create todo', loading: false });
    }
  },

  updateTodo: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.todos.update(id, updates);
      const updatedTodo = await window.electronAPI.todos.get(id);
      if (updatedTodo) {
        set(state => ({
          todos: state.todos.map(todo => todo.id === id ? updatedTodo : todo),
          loading: false
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update todo', loading: false });
    }
  },

  deleteTodo: async (id) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.todos.delete(id);
      set(state => ({
        todos: state.todos.filter(todo => todo.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete todo', loading: false });
    }
  },

  // OKR actions
  loadOKRs: async () => {
    try {
      set({ loading: true, error: null });
      const okrs = await window.electronAPI.okrs.getAll();
      set({ okrs, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load OKRs', loading: false });
    }
  },

  createOKR: async (okrData) => {
    try {
      set({ loading: true, error: null });
      const okrId = await window.electronAPI.okrs.create(okrData);
      const newOKR = await window.electronAPI.okrs.get(okrId);
      if (newOKR) {
        set(state => ({ 
          okrs: [...state.okrs, newOKR], 
          loading: false 
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create OKR', loading: false });
    }
  },

  updateOKR: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.okrs.update(id, updates);
      const updatedOKR = await window.electronAPI.okrs.get(id);
      if (updatedOKR) {
        set(state => ({
          okrs: state.okrs.map(okr => okr.id === id ? updatedOKR : okr),
          loading: false
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update OKR', loading: false });
    }
  },

  deleteOKR: async (id) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.okrs.delete(id);
      set(state => ({
        okrs: state.okrs.filter(okr => okr.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete OKR', loading: false });
    }
  },

  // Task actions
  loadTasks: async () => {
    try {
      set({ loading: true, error: null });
      const tasks = await window.electronAPI.tasks.getAll();
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load tasks', loading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      set({ loading: true, error: null });
      const taskId = await window.electronAPI.tasks.create(taskData);
      const newTask = await window.electronAPI.tasks.get(taskId);
      if (newTask) {
        set(state => ({ 
          tasks: [...state.tasks, newTask], 
          loading: false 
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task', loading: false });
    }
  },

  updateTask: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.tasks.update(id, updates);
      const updatedTask = await window.electronAPI.tasks.get(id);
      if (updatedTask) {
        set(state => ({
          tasks: state.tasks.map(task => task.id === id ? updatedTask : task),
          loading: false
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update task', loading: false });
    }
  },

  deleteTask: async (id) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.tasks.delete(id);
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete task', loading: false });
    }
  },

  // Note actions
  loadNotes: async () => {
    try {
      set({ loading: true, error: null });
      const notes = await window.electronAPI.notes.getAll();
      set({ notes, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load notes', loading: false });
    }
  },

  createNote: async (noteData) => {
    try {
      set({ loading: true, error: null });
      const noteId = await window.electronAPI.notes.create(noteData);
      const newNote = await window.electronAPI.notes.get(noteId);
      if (newNote) {
        set(state => ({ 
          notes: [...state.notes, newNote], 
          loading: false 
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create note', loading: false });
    }
  },

  updateNote: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.notes.update(id, updates);
      const updatedNote = await window.electronAPI.notes.get(id);
      if (updatedNote) {
        set(state => ({
          notes: state.notes.map(note => note.id === id ? updatedNote : note),
          loading: false
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update note', loading: false });
    }
  },

  deleteNote: async (id) => {
    try {
      set({ loading: true, error: null });
      await window.electronAPI.notes.delete(id);
      set(state => ({
        notes: state.notes.filter(note => note.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete note', loading: false });
    }
  },

  // Utility actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));