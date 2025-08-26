import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Select from '@radix-ui/react-select';
import * as Progress from '@radix-ui/react-progress';
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
  ClockIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  CalendarIcon
} from '@radix-ui/react-icons';
import { useDataStore } from '../stores/dataStore';
import type { Task } from '../../types/database';
import { useToast } from '../hooks/use-toast';
import dayjs from 'dayjs';

interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  start_date: string;
  due_date: string;
  tags: string;
  okr_id?: number;
  kr_id?: number;
}

const Tasks: React.FC = () => {
  const {
    tasks,
    okrs,
    keyResults,
    loading,
    loadTasks,
    loadOKRs,
    loadKeyResults,
    createTask,
    updateTask,
    deleteTask
  } = useDataStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    estimated_hours: 1,
    actual_hours: 0,
    start_date: '',
    due_date: '',
    tags: '',
    okr_id: undefined,
    kr_id: undefined
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
    loadOKRs();
    loadKeyResults();
  }, [loadTasks, loadOKRs, loadKeyResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: '错误', description: '请输入任务标题', variant: 'destructive' });
      return;
    }

    try {
      const taskData = {
        ...formData,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        tags: formData.tags || ''
      };

      if (editingTask) {
        await updateTask(editingTask.id!, taskData);
        toast({ title: '成功', description: '任务更新成功' });
      } else {
        await createTask(taskData);
        toast({ title: '成功', description: '任务创建成功' });
      }
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: '错误', 
        description: editingTask ? '任务更新失败' : '任务创建失败', 
        variant: 'destructive' 
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      estimated_hours: task.estimated_hours || 1,
      actual_hours: task.actual_hours || 0,
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      tags: task.tags || '',
      okr_id: task.okr_id,
      kr_id: task.kr_id
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      toast({ title: '成功', description: '任务删除成功' });
    } catch (error) {
      toast({ title: '错误', description: '任务删除失败', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateTask(id, { status: status as 'todo' | 'in_progress' | 'completed' | 'cancelled' });
      toast({ title: '成功', description: '状态更新成功' });
    } catch (error) {
      toast({ title: '错误', description: '状态更新失败', variant: 'destructive' });
    }
  };

  const handleTimeUpdate = async (id: number, actual_hours: number) => {
    try {
      await updateTask(id, { actual_hours });
      toast({ title: '成功', description: '工时更新成功' });
    } catch (error) {
      toast({ title: '错误', description: '工时更新失败', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      estimated_hours: 1,
      actual_hours: 0,
      start_date: '',
      due_date: '',
      tags: '',
      okr_id: undefined,
      kr_id: undefined
    });
    setEditingTask(null);
  };

  // 获取 OKR 标题
  const getOKRTitle = (okrId?: number) => {
    if (!okrId) return '';
    const okr = okrs.find(o => o.id === okrId);
    return okr ? okr.title : '';
  };

  // 获取关键结果标题
  const getKeyResultTitle = (krId?: number) => {
    if (!krId) return '';
    const kr = keyResults.find(kr => kr.id === krId);
    return kr ? kr.title : '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo': return '待办';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const getTimeProgress = (estimated: number | null, actual: number | null) => {
    if (!estimated || !actual) return 0;
    return Math.min((actual / estimated) * 100, 100);
  };

  const getTimeProgressColor = (estimated: number | null, actual: number | null) => {
    if (!estimated || !actual) return 'hsl(221, 83%, 53%)';
    const progress = actual / estimated;
    if (progress <= 0.8) return 'hsl(142, 76%, 36%)';
    if (progress <= 1.0) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
  };

  // 过滤数据
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const formatDate = (startDate: string | null | undefined, dueDate: string | null | undefined) => {
    const start = startDate ? dayjs(startDate) : null;
    const due = dueDate ? dayjs(dueDate) : null;
    const now = dayjs();
    
    // 如果既没有开始时间也没有截止时间
    if (!start && !due) {
      return { 
        text: '时间: 未设置', 
        isOverdue: false, 
        isToday: false, 
        isCreatedDate: false, 
        hasMultipleDates: false 
      };
    }
    
    // 构建时间显示文本
    let timeText = '';
    let isOverdue = false;
    let isToday = false;
    
    if (start && due) {
      // 有开始时间和截止时间
      timeText = `${start.format('MM-DD')} ~ ${due.format('MM-DD')}`;
      isOverdue = due.isBefore(now, 'day');
      isToday = due.isSame(now, 'day');
    } else if (start) {
      // 只有开始时间
      timeText = `开始: ${start.format('YYYY-MM-DD')}`;
      isToday = start.isSame(now, 'day');
    } else if (due) {
      // 只有截止时间
      timeText = `截止: ${due.format('YYYY-MM-DD')}`;
      isOverdue = due.isBefore(now, 'day');
      isToday = due.isSame(now, 'day');
    }
    
    return {
      text: timeText,
      isOverdue,
      isToday,
      isCreatedDate: false,
      hasMultipleDates: !!(start && due)
    };
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <ClockIcon className="w-6 h-6 mr-2" />
          <h1 className="text-2xl font-bold">任务管理</h1>
        </div>
        <Button onClick={() => setIsModalVisible(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          新建任务
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* 筛选器 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">筛选状态</Label>
              <Select.Root value={filterStatus} onValueChange={setFilterStatus}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="选择状态" />
                  <Select.Icon asChild>
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      <Select.Item value="all" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>全部状态</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="todo" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>待办</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="in_progress" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>进行中</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="completed" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>已完成</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="cancelled" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>已取消</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">筛选优先级</Label>
              <Select.Root value={filterPriority} onValueChange={setFilterPriority}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="选择优先级" />
                  <Select.Icon asChild>
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      <Select.Item value="all" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>全部优先级</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="urgent" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>紧急</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="high" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>高</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="medium" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>中</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="low" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>低</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* 任务列表 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">📋</div>
              <div>暂无任务数据</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const dateInfo = formatDate(task.start_date, task.due_date);
                return (
                  <Card key={task.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg">
                    <CardContent className="p-4">
                      {/* 第一行：任务标题和操作区域 */}
                      <div className="flex items-center justify-between gap-4 mb-3">
                        {/* 左侧：任务标题、OKR标签和优先级 */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 truncate flex-1">{task.title}</h3>
                          
                          {/* OKR/KR关联标签 */}
                          {(task.okr_id || task.kr_id) && (
                            <div className="flex gap-1 flex-shrink-0">
                              {task.okr_id && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  OKR: {getOKRTitle(task.okr_id)}
                                </span>
                              )}
                              {task.kr_id && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                  KR: {getKeyResultTitle(task.kr_id)}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <Badge variant={getPriorityColor(task.priority) as any} className="text-xs px-2 py-1 flex-shrink-0">
                            {getPriorityText(task.priority)}
                          </Badge>
                        </div>

                        {/* 右侧：操作区域 */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* 工时进度 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {task.actual_hours || 0}/{task.estimated_hours || 0}h
                            </span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-300"
                                style={{
                                  backgroundColor: getTimeProgressColor(task.estimated_hours || null, task.actual_hours || null),
                                  width: `${getTimeProgress(task.estimated_hours || null, task.actual_hours || null)}%`
                                }}
                              />
                            </div>
                          </div>

                          {/* 状态选择器 */}
                          <Select.Root value={task.status} onValueChange={(value) => handleStatusChange(task.id!, value)}>
                            <Select.Trigger className="w-28 h-8 px-3 text-sm border border-gray-200 bg-white rounded shadow-sm hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors flex items-center justify-between">
                              <Select.Value />
                              <Select.Icon asChild>
                                <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-900 shadow-md">
                                <Select.Viewport className="p-1">
                                  <Select.Item value="todo" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100">
                                    <Select.ItemText>待办</Select.ItemText>
                                  </Select.Item>
                                  <Select.Item value="in_progress" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100">
                                    <Select.ItemText>进行中</Select.ItemText>
                                  </Select.Item>
                                  <Select.Item value="completed" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100">
                                    <Select.ItemText>已完成</Select.ItemText>
                                  </Select.Item>
                                  <Select.Item value="cancelled" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100">
                                    <Select.ItemText>已取消</Select.ItemText>
                                  </Select.Item>
                                </Select.Viewport>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>

                          {/* 操作按钮 */}
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(task)} className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                              <Pencil1Icon className="w-4 h-4" />
                            </Button>
                            <AlertDialog.Root>
                              <AlertDialog.Trigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors">
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </AlertDialog.Trigger>
                              <AlertDialog.Portal>
                                <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                                <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
                                  <AlertDialog.Title className="text-lg font-semibold mb-2">
                                    确认删除
                                  </AlertDialog.Title>
                                  <AlertDialog.Description className="text-sm text-gray-600 mb-4">
                                    确定要删除这个任务吗？此操作无法撤销。
                                  </AlertDialog.Description>
                                  <div className="flex justify-end space-x-2">
                                    <AlertDialog.Cancel asChild>
                                      <Button variant="outline">取消</Button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                      <Button variant="destructive" onClick={() => handleDelete(task.id!)}>
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

                      {/* 第二行：描述和其他信息 */}
                      <div className="flex items-center justify-between gap-4">
                        {/* 左侧：描述 */}
                        <div className="flex-1 min-w-0">
                          {task.description ? (
                            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">暂无描述</p>
                          )}
                        </div>

                        {/* 右侧：标签、日期和关联信息 */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* 截止日期/创建时间 */}
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${
                              dateInfo.isOverdue ? 'text-red-500 font-medium' : 
                              dateInfo.isToday ? 'text-amber-600 font-medium' : 
                              dateInfo.isCreatedDate ? 'text-blue-500' : 'text-gray-500'
                            }`}>
                              {dateInfo.text}
                            </span>
                          </div>

                          {/* 标签 */}
                          {task.tags && (
                            <div className="flex gap-1">
                              {task.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded border">
                                  {tag.trim()}
                                </span>
                              ))}
                              {task.tags.split(',').length > 3 && (
                                <span className="text-xs text-gray-400">+{task.tags.split(',').length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建/编辑模态框 */}
      <Dialog.Root open={isModalVisible} onOpenChange={setIsModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              {editingTask ? '编辑任务' : '新建任务'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  任务标题 *
                </Label>
                <Input
                  id="title"
                  placeholder="请输入任务标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  任务描述
                </Label>
                <Textarea
                  id="description"
                  placeholder="请输入任务描述（可选）"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">状态 *</Label>
                  <Select.Root value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="选择状态" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                        <Select.Viewport className="p-1">
                          <Select.Item value="todo" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>待办</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="in_progress" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>进行中</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="completed" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>已完成</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="cancelled" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>已取消</Select.ItemText>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">优先级 *</Label>
                  <Select.Root value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="选择优先级" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                        <Select.Viewport className="p-1">
                          <Select.Item value="urgent" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>紧急</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="high" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>高</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="medium" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>中</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="low" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>低</Select.ItemText>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_hours" className="text-sm font-medium">
                    预估工时 (小时)
                  </Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="预估工时"
                    value={formData.estimated_hours || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, estimated_hours: value });
                    }}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="actual_hours" className="text-sm font-medium">
                    实际工时 (小时)
                  </Label>
                  <Input
                    id="actual_hours"
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="实际工时"
                    value={formData.actual_hours || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, actual_hours: value });
                    }}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 时间段选择 */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">任务时间段</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-sm text-gray-600">
                        开始时间
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="due_date" className="text-sm text-gray-600">
                        截止时间
                      </Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="mt-1"
                        min={formData.start_date || undefined}
                      />
                    </div>
                  </div>
                  {formData.start_date && formData.due_date && formData.start_date > formData.due_date && (
                    <p className="text-sm text-red-500 mt-1">截止时间不能早于开始时间</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="tags" className="text-sm font-medium">
                    标签
                  </Label>
                  <Input
                    id="tags"
                    placeholder="用逗号分隔多个标签"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              
              {/* OKR 和关键结果选择器 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">关联 OKR</Label>
                  <Select.Root value={formData.okr_id?.toString() || 'none'} onValueChange={(value) => {
                    const okrId = value === 'none' ? undefined : parseInt(value);
                    setFormData({ ...formData, okr_id: okrId, kr_id: undefined }); // 清空关键结果选择
                  }}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="选择 OKR（可选）" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                        <Select.Viewport className="p-1">
                          <Select.Item value="none" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>无关联 OKR</Select.ItemText>
                          </Select.Item>
                          {okrs.map((okr) => (
                            <Select.Item key={okr.id} value={okr.id!.toString()} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{okr.title}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">关联关键结果</Label>
                  <Select.Root value={formData.kr_id?.toString() || 'none'} onValueChange={(value) => {
                    const krId = value === 'none' ? undefined : parseInt(value);
                    setFormData({ ...formData, kr_id: krId });
                  }}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="选择关键结果（可选）" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                        <Select.Viewport className="p-1">
                          <Select.Item value="none" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>无关联关键结果</Select.ItemText>
                          </Select.Item>
                          {keyResults
                            .filter(kr => !formData.okr_id || kr.okr_id === formData.okr_id)
                            .map((kr) => (
                            <Select.Item key={kr.id} value={kr.id!.toString()} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{kr.title}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                </Dialog.Close>
                <Button type="submit">
                  {editingTask ? '更新' : '创建'}
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
  );
};

export default Tasks;