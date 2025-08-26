import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useToast } from '../components/ui/use-toast';
import { UpdateIcon, MixIcon, CheckIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import webdavService, { WebDAVConfig } from '../services/webdavService';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  space-y: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const SwitchGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Settings: React.FC = () => {
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
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await webdavService.getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      toast({
        title: "错误",
        description: "加载配置失败",
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      webdavService.updateConfig(config);
      localStorage.setItem('webdav-config', JSON.stringify(config));
      toast({
        title: "成功",
        description: "配置保存成功",
      });
    } catch (error) {
      console.error('保存配置失败:', error);
      toast({
        title: "错误",
        description: "保存配置失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestLoading(true);
    try {
      await webdavService.testConnection();
      toast({
        title: "成功",
        description: "WebDAV连接测试成功",
      });
    } catch (error) {
      console.error('连接测试失败:', error);
      toast({
        title: "错误",
        description: "WebDAV连接测试失败",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      await webdavService.syncData();
      toast({
        title: "成功",
        description: "数据同步完成",
      });
    } catch (error) {
      console.error('同步失败:', error);
      toast({
        title: "错误",
        description: "数据同步失败",
        variant: "destructive",
      });
    }
  };

  const handleConfigChange = (field: keyof WebDAVConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UpdateIcon className="h-5 w-5" />
            WebDAV 同步设置
          </CardTitle>
          <CardDescription>
            配置WebDAV服务器信息，实现数据云端同步
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SwitchGroup>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked: boolean) => handleConfigChange('enabled', checked)}
            />
            <Label htmlFor="enabled">启用WebDAV同步</Label>
          </SwitchGroup>

          <FormGroup>
            <Label htmlFor="url">WebDAV服务器地址 *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://your-webdav-server.com/dav/"
              value={config.url}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              disabled={!config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="username">用户名 *</Label>
            <Input
              id="username"
              placeholder="输入WebDAV用户名"
              value={config.username}
              onChange={(e) => handleConfigChange('username', e.target.value)}
              disabled={!config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">密码 *</Label>
            <Input
              id="password"
              type="password"
              placeholder="输入WebDAV密码"
              value={config.password}
              onChange={(e) => handleConfigChange('password', e.target.value)}
              disabled={!config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="syncInterval">同步间隔（分钟）*</Label>
            <Input
              id="syncInterval"
              type="number"
              min={5}
              max={1440}
              placeholder="30"
              value={config.syncInterval}
              onChange={(e) => handleConfigChange('syncInterval', parseInt(e.target.value) || 30)}
              disabled={!config.enabled}
            />
          </FormGroup>

          <SwitchGroup>
            <Switch
              id="autoSync"
              checked={config.autoSync}
              onCheckedChange={(checked: boolean) => handleConfigChange('autoSync', checked)}
              disabled={!config.enabled}
            />
            <Label htmlFor="autoSync">自动同步</Label>
          </SwitchGroup>

          <ButtonGroup>
            <Button
              onClick={saveConfig}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {loading ? '保存中...' : '保存配置'}
            </Button>
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={!config.enabled || testLoading}
              className="flex items-center gap-2"
            >
              <MixIcon className="h-4 w-4" />
              {testLoading ? '测试中...' : '测试连接'}
            </Button>
            <Button
              variant="outline"
              onClick={triggerSync}
              disabled={!config.enabled}
              className="flex items-center gap-2"
            >
              <UpdateIcon className="h-4 w-4" />
              立即同步
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>其他设置</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            更多设置功能正在开发中，包括主题设置、快捷键配置等...
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Settings;