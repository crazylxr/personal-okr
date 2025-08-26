import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Divider,
  Progress,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useDataStore } from '../stores/dataStore';
import type { Task } from '../../types/database';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  tags?: string;
}

const Tasks: React.FC = () => {
  const {
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTask,
    deleteTask
  } = useDataStore();

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSubmit = async (values: TaskFormData) => {
    try {
      const taskData = {
        ...values,
        due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : undefined,
        tags: values.tags || ''
      };

      if (editingTask) {
        await updateTask(editingTask.id!, taskData);
        message.success('任务更新成功');
      } else {
        await createTask(taskData);
        message.success('任务创建成功');
      }
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      message.error(editingTask ? '任务更新失败' : '任务创建失败');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      actual_hours: task.actual_hours,
      due_date: task.due_date ? dayjs(task.due_date) : undefined,
      tags: task.tags
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      message.success('任务删除成功');
    } catch (error) {
      message.error('任务删除失败');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateTask(id, { status });
      message.success('状态更新成功');
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleTimeUpdate = async (id: number, actual_hours: number) => {
    try {
      await updateTask(id, { actual_hours });
      message.success('工时更新成功');
    } catch (error) {
      message.error('工时更新失败');
    }
  };

  const resetForm = () => {
    form.resetFields();
    setEditingTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'default';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
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
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
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
    if (!estimated || !actual) return '#1890ff';
    const progress = actual / estimated;
    if (progress <= 0.8) return '#52c41a';
    if (progress <= 1.0) return '#faad14';
    return '#ff4d4f';
  };

  // 过滤数据
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const columns: ColumnsType<Task> = [
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
          {record.tags && (
            <div style={{ marginTop: '4px' }}>
              {record.tags.split(',').map((tag: string, index: number) => (
                <Tag key={index}>{tag.trim()}</Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: Task) => (
        <Select
          value={status}
          size="small"
          style={{ width: '100%' }}
          onChange={(value) => handleStatusChange(record.id!, value)}
        >
          <Option value="todo">待办</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="completed">已完成</Option>
          <Option value="cancelled">已取消</Option>
        </Select>
      )
    },
    {
      title: '工时',
      key: 'hours',
      width: 150,
      render: (_, record: Task) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>预估: {record.estimated_hours || 0}h</span>
            <span>实际: {record.actual_hours || 0}h</span>
          </div>
          {record.estimated_hours && (
            <Progress
              percent={getTimeProgress(record.estimated_hours, record.actual_hours)}
              size="small"
              strokeColor={getTimeProgressColor(record.estimated_hours, record.actual_hours)}
              showInfo={false}
            />
          )}
          <InputNumber
            size="small"
            min={0}
            step={0.5}
            value={record.actual_hours || 0}
            onChange={(value) => handleTimeUpdate(record.id!, value || 0)}
            style={{ marginTop: 4, width: '100%' }}
            placeholder="实际工时"
          />
        </div>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const dueDate = dayjs(date);
        const now = dayjs();
        const isOverdue = dueDate.isBefore(now, 'day');
        const isToday = dueDate.isSame(now, 'day');
        
        return (
          <Text 
            type={isOverdue ? 'danger' : isToday ? 'warning' : 'secondary'}
            style={{ fontSize: '12px' }}
          >
            {dueDate.format('MM-DD')}
          </Text>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: Task) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            任务管理
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            新建任务
          </Button>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Select
              placeholder="筛选状态"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="todo">待办</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="筛选优先级"
              value={filterPriority}
              onChange={setFilterPriority}
              style={{ width: '100%' }}
            >
              <Option value="all">全部优先级</Option>
              <Option value="urgent">紧急</Option>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          resetForm();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'todo',
            priority: 'medium',
            estimated_hours: 1
          }}
        >
          <Form.Item
            label="任务标题"
            name="title"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            label="任务描述"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="请输入任务描述（可选）"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="todo">待办</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="cancelled">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select>
                  <Option value="urgent">紧急</Option>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="预估工时 (小时)"
                name="estimated_hours"
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  style={{ width: '100%' }}
                  placeholder="预估工时"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际工时 (小时)"
                name="actual_hours"
              >
                <InputNumber
                  min={0}
                  step={0.5}
                  style={{ width: '100%' }}
                  placeholder="实际工时"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="截止日期"
                name="due_date"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择截止日期"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="标签"
                name="tags"
              >
                <Input
                  placeholder="用逗号分隔多个标签"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                resetForm();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTask ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;