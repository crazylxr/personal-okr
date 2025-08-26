import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  PlusIcon,
  Pencil1Icon,
  TrashIcon,
  CheckCircledIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  Cross2Icon
} from '@radix-ui/react-icons';
import dayjs from 'dayjs';
import { Todo } from '../../types/database';
import { useToast } from '../hooks/use-toast';

interface TodoFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string[];
}

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const todosData = await window.electronAPI.todos.getAll();
      setTodos(todosData);
    } catch (error) {
      console.error('Failed to load todos:', error);
      toast({ title: '错误', description: '加载待办事项失败', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const todoData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        due_date: formData.dueDate || undefined,
        tags: formData.tags.join(',')
      };

      if (editingTodo) {
        await window.electronAPI.todos.update(editingTodo.id!, todoData);
        toast({ title: '成功', description: '待办事项更新成功' });
      } else {
        await window.electronAPI.todos.create({
          ...todoData,
          status: 'pending' as const
        });
        toast({ title: '成功', description: '待办事项创建成功' });
      }
      
      await loadTodos();
      resetForm();
    } catch (error) {
      console.error('Failed to save todo:', error);
      toast({ title: '错误', description: '操作失败，请重试', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.due_date || '',
      tags: todo.tags ? todo.tags.split(',').filter(tag => tag.trim()) : []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.todos.delete(id);
      toast({ title: '成功', description: '待办事项删除成功' });
      await loadTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      toast({ title: '错误', description: '删除失败，请重试', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await window.electronAPI.todos.update(id, { status: newStatus });
      toast({ title: '成功', description: '状态更新成功' });
      await loadTodos();
    } catch (error) {
      console.error('Failed to update todo status:', error);
      toast({ title: '错误', description: '状态更新失败', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      tags: []
    });
  };

  const filteredTodos = todos.filter(todo => {
    if (filterStatus === 'all') return true;
    return todo.status === filterStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircledIcon className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case 'pending': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待办';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">待办事项</CardTitle>
            <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
              <Dialog.Trigger asChild>
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  添加待办
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
                  <Dialog.Title className="text-lg font-semibold mb-4">
                    {editingTodo ? '编辑待办事项' : '添加待办事项'}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">标题</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="请输入待办事项标题"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="请输入详细描述"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>优先级</Label>
                        <Select.Root value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}>
                          <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <Select.Value placeholder="选择优先级" />
                            <Select.Icon asChild>
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                              <Select.Viewport className="p-1">
                                <Select.Item value="low" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                                  <Select.ItemText>低优先级</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="medium" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                                  <Select.ItemText>中优先级</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="high" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                                  <Select.ItemText>高优先级</Select.ItemText>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>
                      <div>
                        <Label htmlFor="dueDate">截止日期</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tags">标签</Label>
                      <Input
                        id="tags"
                        value={formData.tags.join(', ')}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                        placeholder="输入标签，用逗号分隔"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Dialog.Close asChild>
                        <Button type="button" variant="outline">取消</Button>
                      </Dialog.Close>
                      <Button type="submit" disabled={loading}>
                        {loading ? '保存中...' : (editingTodo ? '更新' : '创建')}
                      </Button>
                    </div>
                  </form>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="sm" className="absolute top-4 right-4">
                      <Cross2Icon className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select.Root value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'in_progress' | 'completed') => setFilterStatus(value)}>
              <Select.Trigger className="flex h-10 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Select.Value placeholder="状态筛选" />
                <Select.Icon asChild>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                  <Select.Viewport className="p-1">
                    <Select.Item value="all" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                      <Select.ItemText>全部</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="pending" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                      <Select.ItemText>待办</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="in_progress" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                      <Select.ItemText>进行中</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="completed" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
                      <Select.ItemText>已完成</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          
          <div className="space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filterStatus === 'all' ? '暂无待办事项' : `暂无${getStatusText(filterStatus)}的事项`}
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <Card key={todo.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-4">
                      {/* 左侧：待办事项信息 */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* 状态图标 */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(todo.status)}
                        </div>
                        
                        {/* 标题 */}
                        <h3 className={`text-sm font-medium flex-1 min-w-0 truncate ${
                          todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-gray-900'
                        }`}>
                          {todo.title}
                        </h3>
                        
                        {/* 优先级徽章 */}
                        <Badge variant={getPriorityColor(todo.priority)} className="text-xs px-2 py-0.5 flex-shrink-0">
                          {getPriorityText(todo.priority)}
                        </Badge>
                        
                        {/* 截止日期 */}
                        {todo.due_date && (
                          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                            {dayjs(todo.due_date).format('MM-DD')}
                          </span>
                        )}
                        
                        {/* 标签 */}
                        {todo.tags && (
                          <div className="flex gap-1 flex-shrink-0">
                            {todo.tags.split(',').filter(tag => tag.trim()).slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border">
                                {tag.trim()}
                              </span>
                            ))}
                            {todo.tags.split(',').filter(tag => tag.trim()).length > 2 && (
                              <span className="text-xs text-gray-400">+{todo.tags.split(',').filter(tag => tag.trim()).length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 右侧：操作区域 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 状态选择器 */}
                        <Select.Root value={todo.status} onValueChange={(value: 'pending' | 'in_progress' | 'completed') => handleStatusChange(todo.id!, value)}>
                          <Select.Trigger className="w-18 h-6 px-2 text-xs border border-gray-200 bg-white rounded shadow-sm hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors flex items-center justify-between">
                            <Select.Value />
                            <Select.Icon asChild>
                              <ChevronDownIcon className="h-3 w-3 flex-shrink-0" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="relative z-50 min-w-[6rem] overflow-hidden rounded-md border bg-white text-gray-900 shadow-md">
                              <Select.Viewport className="p-1">
                                <Select.Item value="pending" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1 px-2 text-xs outline-none hover:bg-gray-100 focus:bg-gray-100">
                                  <Select.ItemText>待办</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="in_progress" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1 px-2 text-xs outline-none hover:bg-gray-100 focus:bg-gray-100">
                                  <Select.ItemText>进行中</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="completed" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1 px-2 text-xs outline-none hover:bg-gray-100 focus:bg-gray-100">
                                  <Select.ItemText>已完成</Select.ItemText>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>

                        {/* 操作按钮 */}
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(todo)} className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Pencil1Icon className="w-3 h-3" />
                          </Button>
                          <AlertDialog.Root>
                            <AlertDialog.Trigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <TrashIcon className="w-3 h-3" />
                              </Button>
                            </AlertDialog.Trigger>
                            <AlertDialog.Portal>
                              <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                              <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
                                <AlertDialog.Title className="text-lg font-semibold mb-2">
                                  确认删除
                                </AlertDialog.Title>
                                <AlertDialog.Description className="text-sm text-muted-foreground mb-4">
                                  确定要删除这个待办事项吗？此操作无法撤销。
                                </AlertDialog.Description>
                                <div className="flex justify-end space-x-2">
                                  <AlertDialog.Cancel asChild>
                                    <Button variant="outline">取消</Button>
                                  </AlertDialog.Cancel>
                                  <AlertDialog.Action asChild>
                                    <Button variant="destructive" onClick={() => handleDelete(todo.id!)}>
                                      删除
                                    </Button>
                                  </AlertDialog.Action>
                                </div>
                              </AlertDialog.Content>
                            </AlertDialog.Portal>
                          </AlertDialog.Root>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Todos;