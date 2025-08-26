import React, { useState, useEffect, useRef } from 'react';
import { Input, Card, Tag, Empty, Spin, message, Modal, Button, Space, Typography, Divider } from 'antd';
import { PlusOutlined, SearchOutlined, TagOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useDataStore } from '../stores/dataStore';
import { Note } from '../../types/database';
import styled from 'styled-components';
import MarkdownPreview from '@uiw/react-markdown-preview';

const { TextArea } = Input;
const { Text } = Typography;

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
  
  .ant-card-body {
    padding: 16px;
  }
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
  
  .ant-card-body {
    padding: 16px;
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
  
  .ant-input {
    border-radius: 20px;
    padding: 8px 16px;
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
  const inputRef = useRef<any>(null);

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
      message.success('笔记创建成功');
      
      // 重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      message.error('创建笔记失败');
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
      message.error('请输入笔记标题');
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
      
      message.success('笔记更新成功');
      setIsEditModalVisible(false);
      setEditingNote(null);
    } catch (error) {
      message.error('更新笔记失败');
    }
  };

  // 删除笔记
  const handleDelete = async (noteId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条笔记吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteNote(noteId);
          message.success('笔记删除成功');
        } catch (error) {
          message.error('删除笔记失败');
        }
      }
    });
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
        <TextArea
          ref={inputRef}
          placeholder="记录想法... 使用 #标签 来分类，按 Cmd/Ctrl + Enter 保存"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={handleKeyPress}
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ 
            border: 'none', 
            boxShadow: 'none',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        />
        {quickInput.trim() && (
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={handleQuickCreate}
            >
              保存
            </Button>
          </div>
        )}
      </QuickInputCard>

      {/* 搜索区域 */}
      <SearchContainer>
        <Input
          placeholder="搜索笔记..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </SearchContainer>

      {/* 笔记列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={searchTerm ? '没有找到匹配的笔记' : '开始记录你的第一个想法吧'}
        />
      ) : (
        <div>
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} size="small">
              <NoteContent>
                <MarkdownPreview source={note.content} style={{ background: 'transparent', padding: 0 }} />
              </NoteContent>
              
              <NoteMeta>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   {note.tags && note.tags.trim() && (
                     <TagContainer>
                       {note.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                         <Tag key={index} color="blue" style={{ margin: 0, fontSize: '12px' }}>
                           #{tag.trim()}
                         </Tag>
                       ))}
                     </TagContainer>
                   )}
                   
                   <Text type="secondary" style={{ fontSize: '12px' }}>
                     <ClockCircleOutlined style={{ marginRight: '4px' }} />
                     {formatDate(note.updated_at || note.created_at || '')}
                   </Text>
                 </div>
                
                <ActionButtons>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(note)}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(note.id!)}
                  />
                </ActionButtons>
              </NoteMeta>
            </NoteCard>
          ))}
        </div>
      )}

      {/* 编辑模态框 */}
      <Modal
        title="编辑笔记"
        open={isEditModalVisible}
        onOk={handleUpdate}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingNote(null);
        }}
        okText="更新"
        cancelText="取消"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>标题</Text>
            <Input
              placeholder="请输入笔记标题"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>
          
          <div>
            <Text strong>内容</Text>
            <TextArea
              placeholder="请输入笔记内容"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 10 }}
              style={{ marginTop: '8px' }}
            />
          </div>
          
          <div>
            <Text strong>标签</Text>
            <Input
              placeholder="使用 #标签 格式，如：#工作 #学习"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>
        </Space>
      </Modal>
    </FlomoContainer>
  );
};

export default Notes;