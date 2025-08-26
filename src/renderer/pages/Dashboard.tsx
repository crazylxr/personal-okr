import React, { useEffect, useMemo } from 'react';
import { Row, Col, Card, Statistic, Typography, Checkbox, Progress, Spin, Empty } from 'antd';
import { CheckSquareOutlined, AimOutlined, TrophyOutlined, PercentageOutlined } from '@ant-design/icons';
import { useDataStore } from '../stores/dataStore';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { 
    todos, 
    okrs, 
    loading, 
    loadTodos, 
    loadOKRs, 
    updateTodo 
  } = useDataStore();

  useEffect(() => {
    loadTodos();
    loadOKRs();
  }, [loadTodos, loadOKRs]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.status === 'completed').length;
    const activeOKRs = okrs.filter(okr => okr.status === 'active').length;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return {
      totalTodos,
      completedTodos,
      activeOKRs,
      completionRate
    };
  }, [todos, okrs]);

  // 获取今日待办（这里简化为最近的待办）
  const todayTodos = useMemo(() => {
    return todos
      .filter(todo => todo.status !== 'completed')
      .slice(0, 5); // 显示前5个未完成的待办
  }, [todos]);

  // 获取OKR进度
  const okrProgress = useMemo(() => {
    return okrs
      .filter(okr => okr.status === 'active')
      .slice(0, 3); // 显示前3个活跃的OKR
  }, [okrs]);

  const handleTodoToggle = async (todoId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateTodo(todoId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={1} style={{ marginBottom: 8 }}>仪表板</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>欢迎回来！这里是您的工作概览</Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总待办事项"
              value={stats.totalTodos}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedTodos}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃OKR"
              value={stats.activeOKRs}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="完成率"
              value={stats.completionRate}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={12}>
          <Card title="今日待办" style={{ height: '100%' }}>
            {todayTodos.length === 0 ? (
              <Empty description="暂无待办事项" />
            ) : (
              <div>
                {todayTodos.map(todo => (
                  <div key={todo.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Checkbox 
                      checked={todo.status === 'completed'}
                      onChange={() => handleTodoToggle(todo.id!, todo.status)}
                    />
                    <span style={{ 
                      marginLeft: 12,
                      textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                      opacity: todo.status === 'completed' ? 0.6 : 1
                    }}>
                      {todo.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="OKR 进度" style={{ height: '100%' }}>
            {okrProgress.length === 0 ? (
              <Empty description="暂无活跃的OKR" />
            ) : (
              <div>
                {okrProgress.map(okr => (
                  <div key={okr.id} style={{ 
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{okr.title}</div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                      {okr.progress}% 完成
                    </div>
                    <Progress percent={okr.progress} size="small" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;