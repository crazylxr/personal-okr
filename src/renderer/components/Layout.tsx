import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  CheckSquareOutlined,
  AimOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../stores/themeStore';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/todos',
      icon: <CheckSquareOutlined />,
      label: '待办事项',
    },
    {
      key: '/okrs',
      icon: <AimOutlined />,
      label: 'OKR管理',
    },
    {
      key: '/tasks',
      icon: <ClockCircleOutlined />,
      label: '任务管理',
    },
    {
      key: '/notes',
      icon: <FileTextOutlined />,
      label: '笔记',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <AntLayout style={{ height: '100vh' }}>
      <Sider width={250} theme={isDark ? 'dark' : 'light'}>
        <Header
          style={{
            padding: '0 20px',
            background: 'transparent',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Title level={4} style={{ margin: 0, color: isDark ? '#fff' : '#000' }}>
            OKR Manager
          </Title>
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ color: isDark ? '#fff' : '#000' }}
          />
        </Header>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;