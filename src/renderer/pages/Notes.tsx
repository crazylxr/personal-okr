import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  TrashIcon,
  Pencil1Icon,
  Cross2Icon
} from '@radix-ui/react-icons';
import { useDataStore } from '../stores/dataStore';
import { Note } from '../../types/database';
import styled from 'styled-components';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useToast } from '../hooks/use-toast';

// flomo风格的样式组件
const FlomoContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
`;

const QuickInputCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const NoteCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
`;

const NoteContent = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
  word-break: break-word;
  
  /* Markdown 样式 */
  h1, h2, h3, h4, h5, h6 {
    margin: 0.5em 0;
    font-weight: 600;
  }
  
  p {
    margin: 0.5em 0;
  }
  
  code {
    background: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.9em;
  }
  
  pre {
    background: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  blockquote {
    border-left: 4px solid #ddd;
    margin: 0;
    padding-left: 12px;
    color: #666;
  }
  
  ul, ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  
  a {
    color: #1890ff;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
`;

const NoteMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${NoteCard}:hover & {
    opacity: 1;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
  position: relative;
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    z-index: 1;
  }
  
  input {
    border-radius: 20px;
    padding: 8px 16px 8px 40px;
  }
`;

const Notes: React.FC = () => {
  const { notes, loading, loadNotes, createNote, updateNote, deleteNote } = useDataStore();
  const [quickInput, setQuickInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // 快速创建笔记
  const handleQuickCreate = async () => {
    if (!quickInput.trim()) return;

    try {
      // 解析标签（以#开头的词）
      const tagRegex = /#([^\s#]+)/g;
      const tags: string[] = [];
      let match;
      while ((match = tagRegex.exec(quickInput)) !== null) {
        tags.push(match[1]);
      }
      
      // 移除标签，剩余内容作为笔记内容
      const content = quickInput.replace(tagRegex, '').trim();
      
      // 生成简短标题（取前20个字符）
      const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
      
      await createNote({
        title,
        content,
        tags: tags.join(',')
      });
      
      setQuickInput('');
      toast({ title: '成功', description: '笔记创建成功' });
      
      // 重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      toast({ title: '错误', description: '创建笔记失败', variant: 'destructive' });
    }
  };

  // 处理快速输入的键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleQuickCreate();
    }
  };

  // 编辑笔记
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    const tagsArray = note.tags ? note.tags.split(',').filter(tag => tag.trim()) : [];
    setEditTags(tagsArray.map(tag => `#${tag.trim()}`).join(' '));
    setIsEditModalVisible(true);
  };

  // 更新笔记
  const handleUpdate = async () => {
    if (!editingNote || !editTitle.trim()) {
      toast({ title: '错误', description: '请输入笔记标题', variant: 'destructive' });
      return;
    }

    try {
      // 解析标签
      const tagRegex = /#([^\s#]+)/g;
      const tags: string[] = [];
      let match;
      while ((match = tagRegex.exec(editTags)) !== null) {
        tags.push(match[1]);
      }

      await updateNote(editingNote.id!, {
        title: editTitle.trim(),
        content: editContent,
        tags: tags.join(',')
      });
      
      toast({ title: '成功', description: '笔记更新成功' });
      setIsEditModalVisible(false);
      setEditingNote(null);
    } catch (error) {
      toast({ title: '错误', description: '更新笔记失败', variant: 'destructive' });
    }
  };

  // 删除笔记
  const handleDelete = async (noteId: number) => {
    try {
      await deleteNote(noteId);
      toast({ title: '成功', description: '笔记删除成功' });
    } catch (error) {
      toast({ title: '错误', description: '删除笔记失败', variant: 'destructive' });
    }
  };

  // 过滤和排序笔记
  const filteredNotes = notes
    .filter(note => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const tagsArray = note.tags ? note.tags.split(',').filter(tag => tag.trim()) : [];
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content?.toLowerCase().includes(searchLower) ||
        tagsArray.some(tag => tag.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      // 按更新时间倒序排列（最新的在前）
      const dateA = new Date(a.updated_at || a.created_at || '');
      const dateB = new Date(b.updated_at || b.created_at || '');
      return dateB.getTime() - dateA.getTime();
    });

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <FlomoContainer>
      {/* 快速输入区域 */}
      <QuickInputCard>
        <CardContent className="p-4">
          <Textarea
            ref={inputRef}
            placeholder="记录想法... 使用 #标签 来分类，按 Cmd/Ctrl + Enter 保存"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px] border-none shadow-none text-sm leading-relaxed resize-none"
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
          {quickInput.trim() && (
            <div className="mt-3 text-right">
              <Button size="sm" onClick={handleQuickCreate}>
                <PlusIcon className="w-4 h-4 mr-1" />
                保存
              </Button>
            </div>
          )}
        </CardContent>
      </QuickInputCard>

      {/* 搜索区域 */}
      <SearchContainer>
        <MagnifyingGlassIcon className="search-icon w-4 h-4" />
        <Input
          placeholder="搜索笔记..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </SearchContainer>

      {/* 笔记列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">📝</div>
          <div>{searchTerm ? '没有找到匹配的笔记' : '开始记录你的第一个想法吧'}</div>
        </div>
      ) : (
        <div>
          {filteredNotes.map((note) => (
            <NoteCard key={note.id}>
              <CardContent className="p-4">
                <NoteContent>
                  <MarkdownPreview source={note.content} style={{ background: 'transparent', padding: 0 }} />
                </NoteContent>
                
                <NoteMeta>
                  <div className="flex items-center gap-3">
                     {note.tags && note.tags.trim() && (
                       <TagContainer>
                         {note.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                           <Badge key={index} variant="secondary" className="text-xs">
                             #{tag.trim()}
                           </Badge>
                         ))}
                       </TagContainer>
                     )}
                     
                     <div className="flex items-center text-xs text-gray-500">
                       <ClockIcon className="w-3 h-3 mr-1" />
                       {formatDate(note.updated_at || note.created_at || '')}
                     </div>
                   </div>
                  
                  <ActionButtons>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(note)}
                    >
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
                            确定要删除这条笔记吗？此操作无法撤销。
                          </AlertDialog.Description>
                          <div className="flex justify-end space-x-2">
                            <AlertDialog.Cancel asChild>
                              <Button variant="outline">取消</Button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <Button variant="destructive" onClick={() => handleDelete(note.id!)}>
                                删除
                              </Button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </ActionButtons>
                </NoteMeta>
              </CardContent>
            </NoteCard>
          ))}
        </div>
      )}

      {/* 编辑模态框 */}
      <Dialog.Root open={isEditModalVisible} onOpenChange={setIsEditModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              编辑笔记
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium">
                  标题
                </Label>
                <Input
                  id="edit-title"
                  placeholder="请输入笔记标题"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-content" className="text-sm font-medium">
                  内容
                </Label>
                <Textarea
                  id="edit-content"
                  placeholder="请输入笔记内容"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mt-2 min-h-[120px]"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-tags" className="text-sm font-medium">
                  标签
                </Label>
                <Input
                  id="edit-tags"
                  placeholder="使用 #标签 格式，如：#工作 #学习"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">取消</Button>
              </Dialog.Close>
              <Button onClick={handleUpdate}>
                更新
              </Button>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" className="absolute top-4 right-4">
                <Cross2Icon className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </FlomoContainer>
  );
};

export default Notes;