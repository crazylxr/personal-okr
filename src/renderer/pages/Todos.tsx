import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Todo } from '../../types/database';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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
  const [form] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const todosData = await window.electronAPI.todos.getAll();
      setTodos(todosData);
    } catch (error) {
      console.error('Failed to load todos:', error);
      message.error('加载待办事项失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const todoData = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        tags: values.tags ? values.tags.join(',') : ''
      };

      if (editingTodo) {
        await window.electronAPI.todos.update(editingTodo.id!, todoData);
        message.success('待办事项更新成功');
      } else {
        await window.electronAPI.todos.create({
          ...todoData,
          status: 'pending' as const
        });
        message.success('待办事项创建成功');
      }
      
      await loadTodos();
      resetForm();
    } catch (error) {
      console.error('Failed to save todo:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    form.setFieldsValue({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: todo.due_date ? dayjs(todo.due_date) : null,
      tags: todo.tags ? todo.tags.split(',').filter(tag => tag.trim()) : []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.todos.delete(id);
      message.success('待办事项删除成功');
      await loadTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      message.error('删除失败，请重试');
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await window.electronAPI.todos.update(id, { status: newStatus });
      message.success('状态更新成功');
      await loadTodos();
    } catch (error) {
      console.error('Failed to update todo status:', error);
      message.error('状态更新失败');
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
    form.resetFields();
  };

  // 过滤逻辑
  const filteredTodos = todos.filter(todo => {
    if (filterStatus === 'all') return true;
    return todo.status === filterStatus;
  });

  // 优先级颜色映射
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // 状态图标映射
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'in_progress': return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'pending': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default: return null;
    }
  };

  // 表格列定义
  const columns: ColumnsType<Todo> = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: Todo) => (
        <Select
          value={status}
          style={{ width: 90 }}
          size="small"
          onChange={(value: string) => handleStatusChange(record.id!, value as 'pending' | 'in_progress' | 'completed')}
        >
          <Option value="pending">待办</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="completed">已完成</Option>
        </Select>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Todo) => (
        <Space>
          {getStatusIcon(record.status)}
          <span style={{ textDecoration: record.status === 'completed' ? 'line-through' : 'none' }}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
        </Tag>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string) => (
        <>
          {tags && tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
            <Tag key={index}>{tag.trim()}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: Todo) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个待办事项吗？"
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>待办事项</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              添加待办
            </Button>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Select
              value={filterStatus}
              style={{ width: 120 }}
              onChange={(value: 'all' | 'pending' | 'in_progress' | 'completed') => setFilterStatus(value)}
              placeholder="状态筛选"
            >
              <Option value="all">全部</Option>
              <Option value="pending">待办</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredTodos}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: filterStatus === 'all' ? '暂无待办事项' : `暂无${filterStatus === 'pending' ? '待办' : filterStatus === 'in_progress' ? '进行中' : '已完成'}的事项`
          }}
        />
      </Card>

      <Modal
        title={editingTodo ? '编辑待办事项' : '添加待办事项'}
        open={isModalOpen}
        onCancel={resetForm}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priority: 'medium'
          }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入待办事项标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入详细描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="low">低优先级</Option>
                  <Option value="medium">中优先级</Option>
                  <Option value="high">高优先级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="due_date"
                label="截止日期"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择截止日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入标签，按回车添加"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={resetForm}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTodo ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Todos;