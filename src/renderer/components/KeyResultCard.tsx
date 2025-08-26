import React, { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Progress from '@radix-ui/react-progress';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Pencil1Icon,
  TrashIcon,
  PlusIcon
} from '@radix-ui/react-icons';
import type { KeyResult } from '../../types/database';

interface KeyResultCardProps {
  keyResults: KeyResult[];
  okrId: number;
  onEdit: (keyResult: KeyResult) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onProgressUpdate: (id: number, currentValue: number) => void;
}

const KeyResultCard: React.FC<KeyResultCardProps> = ({
  keyResults,
  okrId,
  onEdit,
  onDelete,
  onAdd,
  onProgressUpdate
}) => {
  const [editingProgress, setEditingProgress] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const handleProgressEdit = (kr: KeyResult) => {
    setEditingProgress(kr.id!);
    setTempValue(kr.current_value.toString());
  };

  const handleProgressSave = (kr: KeyResult) => {
    const newValue = parseFloat(tempValue) || 0;
    const clampedValue = Math.max(0, Math.min(newValue, kr.target_value));
    onProgressUpdate(kr.id!, clampedValue);
    setEditingProgress(null);
    setTempValue('');
  };

  const handleProgressCancel = () => {
    setEditingProgress(null);
    setTempValue('');
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // green
    if (percentage >= 70) return '#3b82f6'; // blue
    if (percentage >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'at_risk': return 'destructive';
      case 'not_started': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'at_risk': return '有风险';
      case 'not_started': return '未开始';
      default: return '未知';
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-sm text-gray-700">关键结果 (KR)</h4>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <PlusIcon className="w-3 h-3 mr-1" />
          添加KR
        </Button>
      </div>
      
      {keyResults.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          暂无关键结果，点击上方按钮添加
        </div>
      ) : (
        <div className="space-y-3">
          {keyResults.map((kr) => {
            const progressPercentage = getProgressPercentage(kr.current_value, kr.target_value);
            
            return (
              <Card key={kr.id} className="border border-gray-100">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm mb-1">{kr.title}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant={getStatusColor(kr.status) as any} className="text-xs">
                          {getStatusText(kr.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(kr)}>
                        <Pencil1Icon className="w-3 h-3" />
                      </Button>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger asChild>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                          <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
                            <AlertDialog.Title className="text-lg font-semibold mb-2">
                              确认删除
                            </AlertDialog.Title>
                            <AlertDialog.Description className="text-sm text-gray-600 mb-4">
                              确定要删除这个关键结果吗？此操作无法撤销。
                            </AlertDialog.Description>
                            <div className="flex justify-end space-x-2">
                              <AlertDialog.Cancel asChild>
                                <Button variant="outline">取消</Button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action asChild>
                                <Button variant="destructive" onClick={() => onDelete(kr.id!)}>
                                  删除
                                </Button>
                              </AlertDialog.Action>
                            </div>
                          </AlertDialog.Content>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </div>
                  </div>
                  
                  {/* 进度显示和编辑 */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">进度</span>
                      <div className="flex items-center gap-2">
                        {editingProgress === kr.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="w-16 h-6 text-xs"
                              min={0}
                              max={kr.target_value}
                              step={0.1}
                            />
                            <span className="text-xs text-gray-500">/ {kr.target_value} {kr.unit}</span>
                            <Button size="sm" variant="ghost" onClick={() => handleProgressSave(kr)} className="h-6 px-2 text-xs">
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleProgressCancel} className="h-6 px-2 text-xs">
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">
                              {kr.current_value} / {kr.target_value} {kr.unit}
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleProgressEdit(kr)}
                              className="h-6 px-2 text-xs"
                            >
                              编辑
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <Progress.Root className="relative overflow-hidden bg-secondary rounded-full w-full h-1.5">
                      <Progress.Indicator
                        className="h-full w-full flex-1 transition-all"
                        style={{
                          backgroundColor: getProgressColor(progressPercentage),
                          transform: `translateX(-${100 - progressPercentage}%)`
                        }}
                      />
                    </Progress.Root>
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-500">{progressPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KeyResultCard;