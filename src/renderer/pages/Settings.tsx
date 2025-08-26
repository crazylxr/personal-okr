import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, message, Divider, Space, Typography } from 'antd';
import { CloudSyncOutlined, SaveOutlined, ExperimentOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import webdavService, { WebDAVConfig } from '../services/webdavService';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 800px;
`;

const { Title, Text } = Typography;



const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [config, setConfig] = useState<WebDAVConfig>({
    enabled: false,
    url: '',
    username: '',
    password: '',
    syncInterval: 30,
    autoSync: false
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = localStorage.getItem('webdav-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        form.setFieldsValue(parsedConfig);
      }
    } catch (error) {
      console.error('加载WebDAV配置失败:', error);
    }
  };

  const saveConfig = async (values: WebDAVConfig) => {
    setLoading(true);
    try {
      webdavService.updateConfig(values);
      setConfig(values);
      message.success('WebDAV配置保存成功');
    } catch (error) {
      console.error('保存WebDAV配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestLoading(true);
    try {
      const values = form.getFieldsValue();
      if (!values.url || !values.username || !values.password) {
        message.warning('请填写完整的WebDAV连接信息');
        return;
      }

      // 临时更新配置以测试连接
      webdavService.updateConfig(values);
      await webdavService.testConnection();
      message.success('WebDAV连接测试成功');
    } catch (error) {
      console.error('WebDAV连接测试失败:', error);
      message.error('连接测试失败，请检查配置信息');
    } finally {
      setTestLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      message.info('开始同步数据...');
      await webdavService.syncData();
      message.success('数据同步完成');
    } catch (error) {
      console.error('同步失败:', error);
      message.error('数据同步失败');
    }
  };

  return (
    <PageContainer>
      <Title level={2}>设置</Title>
      
      <Card 
        title={<><CloudSyncOutlined /> WebDAV 同步配置</>}
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveConfig}
          initialValues={config}
        >
          <Form.Item
            name="enabled"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="启用" 
              unCheckedChildren="禁用" 
            />
            <Text style={{ marginLeft: 8 }}>启用WebDAV同步</Text>
          </Form.Item>

          <Form.Item
            label="WebDAV服务器地址"
            name="url"
            rules={[
              { required: true, message: '请输入WebDAV服务器地址' },
              { type: 'url', message: '请输入有效的URL地址' }
            ]}
          >
            <Input 
              placeholder="https://your-webdav-server.com/dav/"
              disabled={!form.getFieldValue('enabled')}
            />
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              placeholder="输入WebDAV用户名"
              disabled={!form.getFieldValue('enabled')}
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              placeholder="输入WebDAV密码"
              disabled={!form.getFieldValue('enabled')}
            />
          </Form.Item>

          <Form.Item
            label="同步间隔（分钟）"
            name="syncInterval"
            rules={[{ required: true, message: '请输入同步间隔' }]}
          >
            <Input 
              type="number"
              min={5}
              max={1440}
              placeholder="30"
              disabled={!form.getFieldValue('enabled')}
            />
          </Form.Item>

          <Form.Item
            name="autoSync"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="开启" 
              unCheckedChildren="关闭"
              disabled={!form.getFieldValue('enabled')}
            />
            <Text style={{ marginLeft: 8 }}>自动同步</Text>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存配置
              </Button>
              <Button 
                onClick={testConnection}
                loading={testLoading}
                icon={<ExperimentOutlined />}
                disabled={!form.getFieldValue('enabled')}
              >
                测试连接
              </Button>
              <Button 
                onClick={triggerSync}
                icon={<CloudSyncOutlined />}
                disabled={!config.enabled}
              >
                立即同步
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="其他设置">
        <Text type="secondary">
          更多设置功能正在开发中，包括主题设置、快捷键配置等...
        </Text>
      </Card>
    </PageContainer>
  );
};

export default Settings;