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
  TargetIcon,
  ChevronDownIcon,
  Cross2Icon
} from '@radix-ui/react-icons';
import { useDataStore } from '../stores/dataStore';
import type { OKR, KeyResult } from '../../types/database';
import { useToast } from '../hooks/use-toast';
import KeyResultCard from '../components/KeyResultCard';
import KeyResultForm from '../components/KeyResultForm';

interface OKRFormData {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  progress: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

interface KeyResultDraft {
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
}

const OKRs: React.FC = () => {
  const {
    okrs,
    keyResults,
    loading,
    loadOKRs,
    createOKR,
    updateOKR,
    deleteOKR,
    loadKeyResults,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult
  } = useDataStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | null>(null);
  const [isKRModalVisible, setIsKRModalVisible] = useState(false);
  const [editingKeyResult, setEditingKeyResult] = useState<KeyResult | null>(null);
  const [selectedOKRId, setSelectedOKRId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<OKRFormData>({
    title: '',
    description: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    progress: 0,
    status: 'draft'
  });
  const [keyResultDrafts, setKeyResultDrafts] = useState<KeyResultDraft[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadOKRs();
    loadKeyResults();
  }, [loadOKRs, loadKeyResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: '错误', description: '请输入目标标题', variant: 'destructive' });
      return;
    }

    try {
      if (editingOKR) {
        await updateOKR(editingOKR.id!, formData);
        toast({ title: '成功', description: 'OKR更新成功' });
      } else {
        const okrId = await createOKR(formData);
        
        // 如果有预设的 Key Results，创建它们
        if (keyResultDrafts.length > 0) {
          for (const krDraft of keyResultDrafts) {
            const progress = Math.round((krDraft.current_value / krDraft.target_value) * 100);
            await createKeyResult({
              ...krDraft,
              okr_id: okrId,
              progress,
              status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
            });
          }
          await loadKeyResults(); // 刷新 Key Results 列表
        }
        
        toast({ title: '成功', description: 'OKR创建成功' });
      }
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: '错误', 
        description: editingOKR ? 'OKR更新失败' : 'OKR创建失败', 
        variant: 'destructive' 
      });
    }
  };

  const handleEdit = (okr: OKR) => {
    setEditingOKR(okr);
    setFormData({
      title: okr.title,
      description: okr.description || '',
      quarter: okr.quarter,
      year: okr.year,
      progress: okr.progress,
      status: okr.status
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteOKR(id);
      toast({ title: '成功', description: 'OKR删除成功' });
    } catch (error) {
      toast({ title: '错误', description: 'OKR删除失败', variant: 'destructive' });
    }
  };

  const handleProgressUpdate = async (id: number, progress: number) => {
    try {
      await updateOKR(id, { progress });
      toast({ title: '成功', description: '进度更新成功' });
    } catch (error) {
      toast({ title: '错误', description: '进度更新失败', variant: 'destructive' });
    }
  };

  // KeyResult 相关处理函数
  const handleAddKeyResult = (okrId: number) => {
    setSelectedOKRId(okrId);
    setEditingKeyResult(null);
    setIsKRModalVisible(true);
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setSelectedOKRId(keyResult.okr_id);
    setEditingKeyResult(keyResult);
    setIsKRModalVisible(true);
  };

  const handleDeleteKeyResult = async (id: number) => {
    try {
      await deleteKeyResult(id);
      toast({ title: '成功', description: '关键结果删除成功' });
    } catch (error) {
      toast({ title: '错误', description: '关键结果删除失败', variant: 'destructive' });
    }
  };

  const handleKeyResultSubmit = async (data: any) => {
    try {
      if (editingKeyResult) {
        await updateKeyResult(editingKeyResult.id!, data);
        toast({ title: '成功', description: '关键结果更新成功' });
      } else {
        await createKeyResult({ ...data, okr_id: selectedOKRId! });
        toast({ title: '成功', description: '关键结果创建成功' });
      }
      // 刷新数据以显示新创建或更新的 KeyResult
      await loadKeyResults();
      setIsKRModalVisible(false);
    } catch (error) {
      toast({ 
        title: '错误', 
        description: editingKeyResult ? '关键结果更新失败' : '关键结果创建失败', 
        variant: 'destructive' 
      });
    }
  };

  const handleKeyResultProgressUpdate = async (id: number, currentValue: number) => {
    try {
      const kr = keyResults.find(kr => kr.id === id);
      if (kr) {
        const progress = kr.target_value > 0 ? Math.min((currentValue / kr.target_value) * 100, 100) : 0;
        await updateKeyResult(id, { current_value: currentValue, progress });
        toast({ title: '成功', description: '关键结果进度更新成功' });
      }
    } catch (error) {
      toast({ title: '错误', description: '关键结果进度更新失败', variant: 'destructive' });
    }
  };

  // 获取特定 OKR 的 KeyResults
  const getKeyResultsForOKR = (okrId: number) => {
    return keyResults.filter(kr => kr.okr_id === okrId);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      progress: 0,
      status: 'draft'
    });
    setKeyResultDrafts([]);
    setEditingOKR(null);
  };

  const addKeyResultDraft = () => {
    setKeyResultDrafts([...keyResultDrafts, {
      title: '',
      description: '',
      target_value: 100,
      current_value: 0,
      unit: '个'
    }]);
  };

  const updateKeyResultDraft = (index: number, updates: Partial<KeyResultDraft>) => {
    const updated = keyResultDrafts.map((kr, i) => 
      i === index ? { ...kr, ...updates } : kr
    );
    setKeyResultDrafts(updated);
  };

  const removeKeyResultDraft = (index: number) => {
    setKeyResultDrafts(keyResultDrafts.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'active': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'hsl(142, 76%, 36%)';
    if (progress >= 60) return 'hsl(221, 83%, 53%)';
    if (progress >= 40) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
  };

  // 过滤数据
  const filteredOKRs = okrs.filter(okr => {
    const statusMatch = filterStatus === 'all' || okr.status === filterStatus;
    const yearMatch = okr.year === filterYear;
    return statusMatch && yearMatch;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
           <TargetIcon className="w-6 h-6 mr-2" />
           <h1 className="text-2xl font-bold">OKR管理</h1>
         </div>
        <Button onClick={() => setIsModalVisible(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          新建OKR
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* 筛选器 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                      <Select.Item value="draft" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>草稿</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="active" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
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
              <Label className="text-sm font-medium mb-2 block">筛选年份</Label>
              <Select.Root value={filterYear.toString()} onValueChange={(value) => setFilterYear(parseInt(value))}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="选择年份" />
                  <Select.Icon asChild>
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      {[2024, 2025, 2026].map(year => (
                        <Select.Item key={year} value={year.toString()} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                          <Select.ItemText>{year}年</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* OKR 列表 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : filteredOKRs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">🎯</div>
              <div>暂无OKR数据</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOKRs.map((okr) => (
                <Card key={okr.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{okr.title}</h3>
                        {okr.description && (
                          <p className="text-sm text-gray-600 mb-2">{okr.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{okr.year} {okr.quarter}</span>
                          <Badge variant={getStatusColor(okr.status) as any}>
                            {getStatusText(okr.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(okr)}>
                          <Pencil1Icon className="w-4 h-4" />
                        </Button>
                        <AlertDialog.Root>
                          <AlertDialog.Trigger asChild>
                            <Button variant="ghost" size="sm">
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
                                确定要删除这个OKR吗？此操作无法撤销。
                              </AlertDialog.Description>
                              <div className="flex justify-end space-x-2">
                                <AlertDialog.Cancel asChild>
                                  <Button variant="outline">取消</Button>
                                </AlertDialog.Cancel>
                                <AlertDialog.Action asChild>
                                  <Button variant="destructive" onClick={() => handleDelete(okr.id!)}>
                                    删除
                                  </Button>
                                </AlertDialog.Action>
                              </div>
                            </AlertDialog.Content>
                          </AlertDialog.Portal>
                        </AlertDialog.Root>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">进度</span>
                        <span className="text-sm text-gray-600">{okr.progress}%</span>
                      </div>
                      <Progress.Root className="relative overflow-hidden bg-secondary rounded-full w-full h-2">
                        <Progress.Indicator
                          className="h-full w-full flex-1 transition-all"
                          style={{
                            backgroundColor: getProgressColor(okr.progress),
                            transform: `translateX(-${100 - okr.progress}%)`
                          }}
                        />
                      </Progress.Root>
                      {okr.status === 'active' && (
                        <div className="mt-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={okr.progress}
                            onChange={(e) => {
                              const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100);
                              handleProgressUpdate(okr.id!, value);
                            }}
                            className="w-20 text-sm"
                            placeholder="进度"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* KeyResult 组件 */}
                    <KeyResultCard
                      keyResults={getKeyResultsForOKR(okr.id!)}
                      okrId={okr.id!}
                      onEdit={handleEditKeyResult}
                      onDelete={handleDeleteKeyResult}
                      onAdd={() => handleAddKeyResult(okr.id!)}
                      onProgressUpdate={handleKeyResultProgressUpdate}
                    />
                  </CardContent>
                </Card>
              ))}
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
              {editingOKR ? '编辑OKR' : '新建OKR'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  目标标题 *
                </Label>
                <Input
                  id="title"
                  placeholder="请输入目标标题"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  目标描述
                </Label>
                <Textarea
                  id="description"
                  placeholder="请输入目标描述（可选）"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">年份 *</Label>
                  <Select.Root value={formData.year.toString()} onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="选择年份" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                        <Select.Viewport className="p-1">
                          {[2024, 2025, 2026].map(year => (
                            <Select.Item key={year} value={year.toString()} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{year}年</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">季度 *</Label>
                  <Select.Root value={formData.quarter} onValueChange={(value) => setFormData({ ...formData, quarter: value })}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="选择季度" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                        <Select.Viewport className="p-1">
                          <Select.Item value="Q1" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>第一季度</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="Q2" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>第二季度</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="Q3" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>第三季度</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="Q4" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>第四季度</Select.ItemText>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
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
                          <Select.Item value="draft" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <Select.ItemText>草稿</Select.ItemText>
                          </Select.Item>
                          <Select.Item value="active" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
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
                  <Label htmlFor="progress" className="text-sm font-medium">
                    进度 (%) *
                  </Label>
                  <Input
                    id="progress"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0-100"
                    value={formData.progress}
                    onChange={(e) => {
                      const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100);
                      setFormData({ ...formData, progress: value });
                    }}
                    className="mt-2"
                    required
                  />
                </div>
              </div>
              
              {/* Key Results 预设部分 - 仅在创建新 OKR 时显示 */}
              {!editingOKR && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">预设关键结果 (可选)</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addKeyResultDraft}>
                      + 添加 KR
                    </Button>
                  </div>
                  
                  {keyResultDrafts.map((kr, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">关键结果 {index + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeKeyResultDraft(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          删除
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`kr-title-${index}`}>标题 *</Label>
                          <Input
                            id={`kr-title-${index}`}
                            value={kr.title}
                            onChange={(e) => updateKeyResultDraft(index, { title: e.target.value })}
                            placeholder="输入关键结果标题"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`kr-unit-${index}`}>单位</Label>
                          <Input
                            id={`kr-unit-${index}`}
                            value={kr.unit}
                            onChange={(e) => updateKeyResultDraft(index, { unit: e.target.value })}
                            placeholder="个、次、%等"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`kr-current-${index}`}>当前值</Label>
                          <Input
                            id={`kr-current-${index}`}
                            type="number"
                            value={kr.current_value}
                            onChange={(e) => updateKeyResultDraft(index, { current_value: Number(e.target.value) })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`kr-target-${index}`}>目标值</Label>
                          <Input
                            id={`kr-target-${index}`}
                            type="number"
                            value={kr.target_value}
                            onChange={(e) => updateKeyResultDraft(index, { target_value: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`kr-description-${index}`}>描述 (可选)</Label>
                        <Textarea
                          id={`kr-description-${index}`}
                          value={kr.description || ''}
                          onChange={(e) => updateKeyResultDraft(index, { description: e.target.value })}
                          placeholder="描述这个关键结果的具体要求"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {keyResultDrafts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>暂无预设关键结果</p>
                      <p className="text-sm">您可以在创建 OKR 后再添加关键结果</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                </Dialog.Close>
                <Button type="submit">
                  {editingOKR ? '更新' : '创建'}
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

      {/* KeyResult 表单模态框 */}
      <KeyResultForm
        isOpen={isKRModalVisible}
        onClose={() => setIsKRModalVisible(false)}
        onSubmit={handleKeyResultSubmit}
        editingKeyResult={editingKeyResult}
        okrId={selectedOKRId || 0}
      />
    </div>
  );
};

export default OKRs;