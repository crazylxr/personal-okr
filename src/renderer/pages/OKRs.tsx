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
  Progress,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useDataStore } from '../stores/dataStore';
import type { OKR } from '../../types/database';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface OKRFormData {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  progress: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}

const OKRs: React.FC = () => {
  const {
    okrs,
    loading,
    loadOKRs,
    createOKR,
    updateOKR,
    deleteOKR
  } = useDataStore();

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadOKRs();
  }, [loadOKRs]);

  const handleSubmit = async (values: OKRFormData) => {
    try {
      if (editingOKR) {
        await updateOKR(editingOKR.id!, values);
        message.success('OKR更新成功');
      } else {
        await createOKR(values);
        message.success('OKR创建成功');
      }
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      message.error(editingOKR ? 'OKR更新失败' : 'OKR创建失败');
    }
  };

  const handleEdit = (okr: OKR) => {
    setEditingOKR(okr);
    form.setFieldsValue({
      title: okr.title,
      description: okr.description,
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
      message.success('OKR删除成功');
    } catch (error) {
      message.error('OKR删除失败');
    }
  };

  const handleProgressUpdate = async (id: number, progress: number) => {
    try {
      await updateOKR(id, { progress });
      message.success('进度更新成功');
    } catch (error) {
      message.error('进度更新失败');
    }
  };

  const resetForm = () => {
    form.resetFields();
    setEditingOKR(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'active': return 'processing';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
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
    if (progress >= 80) return '#52c41a';
    if (progress >= 60) return '#1890ff';
    if (progress >= 40) return '#faad14';
    return '#ff4d4f';
  };

  // 过滤数据
  const filteredOKRs = okrs.filter(okr => {
    const statusMatch = filterStatus === 'all' || okr.status === filterStatus;
    const yearMatch = okr.year === filterYear;
    return statusMatch && yearMatch;
  });

  const columns: ColumnsType<OKR> = [
    {
      title: '目标',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: OKR) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: '季度',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 100,
      render: (quarter: string, record: OKR) => (
        <Text>{record.year} {quarter}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, record: OKR) => (
        <div>
          <Progress
            percent={progress}
            size="small"
            strokeColor={getProgressColor(progress)}
            format={(percent) => `${percent}%`}
          />
          {record.status === 'active' && (
            <InputNumber
              size="small"
              min={0}
              max={100}
              value={progress}
              formatter={(value) => `${value}%`}
               parser={(value) => value ? parseInt(value.replace('%', '')) : 0}
               onChange={(value) => handleProgressUpdate(record.id!, value ?? 0)}
              style={{ marginTop: 4, width: '100%' }}
            />
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: OKR) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个OKR吗？"
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
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
            <TrophyOutlined style={{ marginRight: '8px' }} />
            OKR管理
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            新建OKR
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
              <Option value="draft">草稿</Option>
              <Option value="active">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="筛选年份"
              value={filterYear}
              onChange={setFilterYear}
              style={{ width: '100%' }}
            >
              {[2024, 2025, 2026].map(year => (
                <Option key={year} value={year}>{year}年</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredOKRs}
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
        title={editingOKR ? '编辑OKR' : '新建OKR'}
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
            year: new Date().getFullYear(),
            quarter: 'Q1',
            progress: 0,
            status: 'draft'
          }}
        >
          <Form.Item
            label="目标标题"
            name="title"
            rules={[{ required: true, message: '请输入目标标题' }]}
          >
            <Input placeholder="请输入目标标题" />
          </Form.Item>

          <Form.Item
            label="目标描述"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="请输入目标描述（可选）"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="年份"
                name="year"
                rules={[{ required: true, message: '请选择年份' }]}
              >
                <Select>
                  {[2024, 2025, 2026].map(year => (
                    <Option key={year} value={year}>{year}年</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="季度"
                name="quarter"
                rules={[{ required: true, message: '请选择季度' }]}
              >
                <Select>
                  <Option value="Q1">第一季度</Option>
                  <Option value="Q2">第二季度</Option>
                  <Option value="Q3">第三季度</Option>
                  <Option value="Q4">第四季度</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="draft">草稿</Option>
                  <Option value="active">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="cancelled">已取消</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="进度 (%)"
                name="progress"
                rules={[{ required: true, message: '请输入进度' }]}
              >
                <InputNumber
                   min={0}
                   max={100}
                   style={{ width: '100%' }}
                   formatter={(value) => `${value}%`}
                   parser={(value) => {
                     if (!value) return 0;
                     const num = parseInt(value.replace('%', ''));
                     return Math.min(Math.max(num, 0), 100) as 0 | 100;
                   }}
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
                {editingOKR ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OKRs;