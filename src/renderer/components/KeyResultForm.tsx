import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Cross2Icon,
  ChevronDownIcon
} from '@radix-ui/react-icons';
import type { KeyResult } from '../../types/database';

interface KeyResultFormData {
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
}

interface KeyResultFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KeyResultFormData) => void;
  editingKeyResult?: KeyResult | null;
  okrId: number;
}

const KeyResultForm: React.FC<KeyResultFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingKeyResult,
  okrId
}) => {
  const [formData, setFormData] = useState<KeyResultFormData>({
    title: '',
    description: '',
    target_value: 0,
    current_value: 0,
    unit: '',
    status: 'not_started'
  });

  useEffect(() => {
    if (editingKeyResult) {
      setFormData({
        title: editingKeyResult.title,
        description: editingKeyResult.description || '',
        target_value: editingKeyResult.target_value,
        current_value: editingKeyResult.current_value,
        unit: editingKeyResult.unit,
        status: editingKeyResult.status
      });
    } else {
      setFormData({
        title: '',
        description: '',
        target_value: 0,
        current_value: 0,
        unit: '',
        status: 'not_started'
      });
    }
  }, [editingKeyResult, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return;
    }
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (field: keyof KeyResultFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const statusOptions = [
    { value: 'not_started', label: '未开始' },
    { value: 'in_progress', label: '进行中' },
    { value: 'at_risk', label: '有风险' },
    { value: 'completed', label: '已完成' }
  ];

  const commonUnits = ['个', '次', '人', '%', '万元', '小时', '天', '项'];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {editingKeyResult ? '编辑关键结果' : '新建关键结果'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                <Cross2Icon className="w-4 h-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 标题 */}
            <div>
              <Label htmlFor="kr-title">标题 *</Label>
              <Input
                id="kr-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入关键结果标题"
                required
              />
            </div>

            {/* 描述 */}
            <div>
              <Label htmlFor="kr-description">描述</Label>
              <Textarea
                id="kr-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请输入关键结果描述（可选）"
                rows={3}
              />
            </div>

            {/* 目标值和单位 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kr-target">目标值 *</Label>
                <Input
                  id="kr-target"
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => handleInputChange('target_value', parseFloat(e.target.value) || 0)}
                  placeholder="目标值"
                  min={0}
                  step={0.1}
                  required
                />
              </div>
              <div>
                <Label htmlFor="kr-unit">单位 *</Label>
                <Select.Root
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                >
                  <Select.Trigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <Select.Value placeholder="选择单位" />
                      <ChevronDownIcon className="w-4 h-4" />
                    </Button>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white border rounded-lg shadow-lg p-1 z-50">
                      <Select.Viewport>
                        {commonUnits.map((unit) => (
                          <Select.Item
                            key={unit}
                            value={unit}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                          >
                            <Select.ItemText>{unit}</Select.ItemText>
                          </Select.Item>
                        ))}
                        <Select.Item
                          value="custom"
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded border-t"
                        >
                          <Select.ItemText>自定义...</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                {formData.unit === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="输入自定义单位"
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* 当前值 */}
            <div>
              <Label htmlFor="kr-current">当前值</Label>
              <Input
                id="kr-current"
                type="number"
                value={formData.current_value}
                onChange={(e) => handleInputChange('current_value', parseFloat(e.target.value) || 0)}
                placeholder="当前值"
                min={0}
                max={formData.target_value}
                step={0.1}
              />
            </div>

            {/* 状态 */}
            <div>
              <Label htmlFor="kr-status">状态</Label>
              <Select.Root
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <Select.Trigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <Select.Value />
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border rounded-lg shadow-lg p-1 z-50">
                    <Select.Viewport>
                      {statusOptions.map((option) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded"
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit">
                {editingKeyResult ? '更新' : '创建'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default KeyResultForm;