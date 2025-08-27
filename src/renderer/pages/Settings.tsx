import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { UpdateIcon, MixIcon, CheckIcon, GitHubLogoIcon, EyeOpenIcon, EyeClosedIcon, UploadIcon, DownloadIcon, InfoCircledIcon, FileTextIcon, PlusIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import webdavService, { WebDAVConfig } from '../services/webdavService';
import { gitSyncService } from '../services/gitSyncService';
import { rendererS3BackupService } from '../services/s3BackupService';
import { GitConfig, S3Config } from '../../types/database';

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
  const [gitTestLoading, setGitTestLoading] = useState(false);
  const [proxyTestLoading, setProxyTestLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [s3TestLoading, setS3TestLoading] = useState(false);
  const [s3BackupLoading, setS3BackupLoading] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupList, setBackupList] = useState<any[]>([]);
  const [showBackupList, setShowBackupList] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'database' | 'json' | 'merge'>('json');
  const [configExportLoading, setConfigExportLoading] = useState(false);
  const [configImportLoading, setConfigImportLoading] = useState(false);
  const [s3Config, setS3Config] = useState<S3Config>({
    enabled: false,
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucket: '',
    endpoint: '',
    pathPrefix: 'backups/',
    backupInterval: 60,
    autoBackup: false,
    maxBackups: 30,
    compression: true,
    encryption: false,
    backupTypes: {
      database: true,
      json: true,
    },
  });
  const [config, setConfig] = useState<WebDAVConfig>({
    enabled: false,
    url: '',
    username: '',
    password: '',
    syncInterval: 30,
    autoSync: false
  });
  const [gitConfig, setGitConfig] = useState<GitConfig>({
    enabled: false,
    remoteUrl: '',
    branch: 'main',
    authMethod: 'token',
    credentials: {
      token: '',
      username: '',
      password: '',
      sshKey: ''
    },
    syncInterval: 30,
    autoSync: false,
    autoCreateRepo: false,
    repoName: 'personal-okr-data',
    repoDescription: 'Personal OKR Manager Data Repository',
    gitProvider: 'github',
    repoVisibility: 'private',
    proxy: {
      enabled: false,
      type: 'http',
      host: '127.0.0.1',
      port: 7890,
      username: '',
      password: ''
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
    loadGitConfig();
    loadS3Config();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = webdavService.getConfig();
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

  const loadGitConfig = async () => {
    try {
      const savedConfig = await gitSyncService.loadConfig();
      if (savedConfig) {
        setGitConfig(savedConfig);
      }
    } catch (error) {
      console.error('加载Git配置失败:', error);
      toast({
        title: "错误",
        description: "加载Git配置失败",
        variant: "destructive",
      });
    }
  };

  const loadS3Config = async () => {
    try {
      const savedConfig = localStorage.getItem('s3-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setS3Config(parsed);
      }
    } catch (error) {
      console.error('加载S3配置失败:', error);
      toast({
        title: "错误",
        description: "加载S3配置失败",
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
    
    // 为重要配置变更添加提示
    if (field === 'enabled') {
      toast({
        title: value ? "WebDAV 已启用" : "WebDAV 已禁用",
        description: value ? "WebDAV 同步功能已启用" : "WebDAV 同步功能已禁用",
      });
    }
  };

  const handleS3ConfigChange = (field: keyof S3Config, value: any) => {
    setS3Config(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 为重要配置变更添加提示
    if (field === 'enabled') {
      toast({
        title: value ? "S3 备份已启用" : "S3 备份已禁用",
        description: value ? "S3 备份功能已启用" : "S3 备份功能已禁用",
      });
    }
  };

  const handleS3BackupTypeChange = (type: 'database' | 'json', value: boolean) => {
    setS3Config(prev => ({
      ...prev,
      backupTypes: {
        ...prev.backupTypes!,
        [type]: value
      }
    }));
    
    // 为备份类型变更添加提示
    const typeName = type === 'database' ? '数据库文件' : 'JSON 数据';
    toast({
      title: value ? `${typeName} 备份已启用` : `${typeName} 备份已禁用`,
      description: value ? `已启用 ${typeName} 备份功能` : `已禁用 ${typeName} 备份功能`,
    });
  };

  const saveS3Config = async () => {
    if (s3Config.enabled) {
      const validationErrors = validateS3Config(s3Config);
      if (validationErrors.length > 0) {
        toast({
          title: "配置错误",
          description: validationErrors.join('; '),
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      localStorage.setItem('s3-config', JSON.stringify(s3Config));
      
      if (s3Config.enabled) {
        await rendererS3BackupService.initialize(s3Config);
      }
      
      toast({
        title: "成功",
        description: "S3 配置保存成功",
      });
    } catch (error) {
      console.error('保存S3配置失败:', error);
      toast({
        title: "错误",
        description: "保存S3配置失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateS3Config = (config: S3Config): string[] => {
    const errors: string[] = [];
    
    if (!config.accessKeyId.trim()) {
      errors.push('Access Key ID 不能为空');
    }
    
    if (!config.secretAccessKey.trim()) {
      errors.push('Secret Access Key 不能为空');
    }
    
    if (!config.bucket.trim()) {
      errors.push('存储桶名称不能为空');
    }
    
    if (!config.region.trim()) {
      errors.push('区域不能为空');
    }
    
    // 验证 endpoint URL 格式（如果提供的话）
    if (config.endpoint && config.endpoint.trim()) {
      try {
        new URL(config.endpoint.trim());
      } catch {
        errors.push('端点 URL 格式无效，请使用正确的 URL 格式，如：https://s3.amazonaws.com');
      }
    }
    
    return errors;
  };

  const testS3Connection = async () => {
    const validationErrors = validateS3Config(s3Config);
    if (validationErrors.length > 0) {
      toast({
        title: "配置错误",
        description: validationErrors.join('; '),
        variant: "destructive",
      });
      return;
    }

    setS3TestLoading(true);
    try {
      await rendererS3BackupService.initialize(s3Config);
      const result = await rendererS3BackupService.testConnection();
      
      if (result) {
        toast({
          title: "成功",
          description: "S3 连接测试成功",
        });
      } else {
        toast({
          title: "失败",
          description: "S3 连接测试失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('S3连接测试失败:', error);
      toast({
        title: "错误",
        description: `S3连接测试失败: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setS3TestLoading(false);
    }
  };

  const performS3Backup = async () => {
    const validationErrors = validateS3Config(s3Config);
    if (validationErrors.length > 0) {
      toast({
        title: "配置错误",
        description: validationErrors.join('; '),
        variant: "destructive",
      });
      return;
    }

    setS3BackupLoading(true);
    try {
      await rendererS3BackupService.initialize(s3Config);
      await rendererS3BackupService.performBackup();
      
      toast({
        title: "成功",
        description: "S3 备份完成",
      });
    } catch (error) {
      console.error('S3备份失败:', error);
      toast({
        title: "错误",
        description: `S3备份失败: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setS3BackupLoading(false);
    }
  };

  const loadBackupList = async () => {
    try {
      console.log('开始加载备份列表...');
      console.log('当前 S3 配置:', {
        ...s3Config,
        secretAccessKey: s3Config.secretAccessKey ? '***' : ''
      });
      
      await rendererS3BackupService.initialize(s3Config);
      const backups = await rendererS3BackupService.getBackupList();
      console.log('获取到备份列表:', backups);
      setBackupList(backups);
      setShowBackupList(true);
      
      if (backups.length === 0) {
        toast({
          title: "调试信息",
          description: `没有找到备份文件。配置的路径前缀: "${s3Config.pathPrefix || ''}"`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "成功",
          description: `找到 ${backups.length} 个备份文件`,
        });
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
      toast({
        title: "错误",
        description: `加载备份列表失败: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const performS3Restore = async () => {
    if (!selectedBackup) {
      toast({
        title: "错误",
        description: "请选择要恢复的备份文件",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validateS3Config(s3Config);
    if (validationErrors.length > 0) {
      toast({
        title: "配置错误",
        description: validationErrors.join('; '),
        variant: "destructive",
      });
      return;
    }

    setRestoreLoading(true);
    try {
      await rendererS3BackupService.initialize(s3Config);
      
      // 确认对话框
      if (confirm(`确定要恢复备份 "${selectedBackup}" 吗？\n\n恢复模式: ${restoreMode}\n\n注意：这将覆盖当前数据，请确保已备份重要数据！`)) {
        await rendererS3BackupService.performRestore(selectedBackup, restoreMode);
        
        toast({
          title: "成功",
          description: "数据恢复完成，请重启应用查看恢复的数据",
        });
        
        setShowBackupList(false);
        setSelectedBackup('');
      }
    } catch (error) {
      console.error('S3恢复失败:', error);
      toast({
        title: "错误",
        description: `S3恢复失败: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleGitConfigChange = (field: keyof GitConfig, value: any) => {
    setGitConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 为重要配置变更添加提示
    if (field === 'enabled') {
      toast({
        title: value ? "Git 同步已启用" : "Git 同步已禁用",
        description: value ? "Git 同步功能已启用" : "Git 同步功能已禁用",
      });
    }
  };

  const handleGitCredentialsChange = (field: string, value: string) => {
    setGitConfig(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }));
  };

  const handleGitProxyChange = (field: string, value: any) => {
    setGitConfig(prev => ({
      ...prev,
      proxy: {
        ...prev.proxy,
        [field]: value
      } as any
    }));
    
    // 为代理配置变更添加提示
    if (field === 'enabled') {
      toast({
        title: value ? "Git 代理已启用" : "Git 代理已禁用",
        description: value ? "Git 代理功能已启用" : "Git 代理功能已禁用",
      });
    }
  };

  const saveGitConfig = async () => {
    setLoading(true);
    try {
      let configToSave = { ...gitConfig };
      
      // 如果启用自动创建仓库且没有远程URL，则先创建仓库
      if (gitConfig.autoCreateRepo && !gitConfig.remoteUrl && gitConfig.credentials.token) {
        try {
          const remoteUrl = await gitSyncService.createRepository(gitConfig);
          configToSave.remoteUrl = remoteUrl;
          setGitConfig(prev => ({ ...prev, remoteUrl }));
          toast({
            title: "成功",
            description: `远程仓库创建成功: ${remoteUrl}`,
          });
        } catch (createError) {
          console.error('创建仓库失败:', createError);
          toast({
            title: "错误",
            description: `创建仓库失败: ${(createError as Error).message}`,
            variant: "destructive",
          });
          return;
        }
      }
      
      await gitSyncService.updateConfig(configToSave);
      toast({
        title: "成功",
        description: "Git配置保存成功",
      });
    } catch (error) {
      console.error('保存Git配置失败:', error);
      toast({
        title: "错误",
        description: "保存Git配置失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testGitConnection = async () => {
    setGitTestLoading(true);
    try {
      const result = await gitSyncService.testConnection();
      if (result) {
        toast({
          title: "成功",
          description: "Git连接测试成功",
        });
      } else {
        toast({
          title: "错误",
          description: "Git连接测试失败，请检查配置信息",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Git连接测试失败:', error);
      const errorMessage = (error as Error).message || 'Git连接测试失败';
      toast({
        title: "错误",
        description: `Git连接测试失败: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setGitTestLoading(false);
    }
  };

  const triggerGitSync = async () => {
    console.log('111')
    try {
      await gitSyncService.syncData();
      toast({
        title: "成功",
        description: "Git数据同步完成",
      });
    } catch (error) {
      console.error('Git同步失败:', error);
      toast({
        title: "错误",
        description: "Git数据同步失败",
        variant: "destructive",
      });
    }
  };

  const exportConfig = async () => {
    setConfigExportLoading(true);
    try {
      const configData = {
        webdav: {
          ...config,
          password: '***',
        },
        git: {
          ...gitConfig,
          credentials: {
            ...gitConfig.credentials,
            token: gitConfig.credentials.token ? '***' : '',
            password: gitConfig.credentials.password ? '***' : '',
            sshKey: gitConfig.credentials.sshKey ? '***' : '',
          },
        },
        s3: {
          ...s3Config,
          accessKeyId: s3Config.accessKeyId ? '***' : '',
          secretAccessKey: s3Config.secretAccessKey ? '***' : '',
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const configJson = JSON.stringify(configData, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-okr-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "成功",
        description: "配置文件已导出",
      });
    } catch (error) {
      console.error('导出配置失败:', error);
      toast({
        title: "错误",
        description: "导出配置失败",
        variant: "destructive",
      });
    } finally {
      setConfigExportLoading(false);
    }
  };

  const importConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setConfigImportLoading(true);
    try {
      const text = await file.text();
      const configData = JSON.parse(text);
      
      if (!configData.webdav || !configData.git || !configData.s3) {
        throw new Error('配置文件格式不正确');
      }
      
      setConfig(prev => ({
        ...configData.webdav,
        password: prev.password,
      }));
      setGitConfig(prev => ({
        ...configData.git,
        credentials: {
          ...configData.git.credentials,
          token: prev.credentials.token,
          password: prev.credentials.password,
          sshKey: prev.credentials.sshKey,
        },
      }));
      setS3Config(prev => ({
        ...configData.s3,
        accessKeyId: prev.accessKeyId,
        secretAccessKey: prev.secretAccessKey,
      }));
      
      await saveConfig();
      await saveGitConfig();
      await saveS3Config();
      
      toast({
        title: "成功",
        description: "配置文件导入成功",
      });
      
      event.target.value = '';
    } catch (error) {
      console.error('导入配置失败:', error);
      toast({
        title: "错误",
        description: `导入配置失败: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setConfigImportLoading(false);
    }
  };

  const testProxyConnection = async () => {
    setProxyTestLoading(true);
    try {
      const result = await gitSyncService.testProxyConnection(gitConfig.proxy!);
      if (result) {
        toast({
          title: "成功",
          description: "代理连接测试成功",
        });
      } else {
        toast({
          title: "错误",
          description: "代理连接测试失败，请检查代理配置",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('代理连接测试失败:', error);
      const errorMessage = (error as Error).message || '代理连接测试失败';
      toast({
        title: "错误",
        description: `代理连接测试失败: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setProxyTestLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">设置</h1>
          <p className="text-muted-foreground">
            配置应用的各种同步和备份选项
          </p>
        </div>
        
        <Tabs defaultValue="s3" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="s3" className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              S3 备份
            </TabsTrigger>
            <TabsTrigger value="webdav" className="flex items-center gap-2">
              <MixIcon className="h-4 w-4" />
              WebDAV 同步
            </TabsTrigger>
            <TabsTrigger value="git" className="flex items-center gap-2">
              <GitHubLogoIcon className="h-4 w-4" />
              Git 同步
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="s3" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  S3 备份设置
                </CardTitle>
                <CardDescription>
                  配置AWS S3存储服务，实现数据云端备份
                </CardDescription>
              </CardHeader>
              <CardContent>
          <SwitchGroup>
            <Switch
              id="s3-enabled"
              checked={s3Config.enabled}
              onCheckedChange={(checked: boolean) => handleS3ConfigChange('enabled', checked)}
            />
            <Label htmlFor="s3-enabled">启用S3备份</Label>
          </SwitchGroup>

          <FormGroup>
            <Label htmlFor="s3-access-key">Access Key ID *</Label>
            <div className="relative">
              <Input
                id="s3-access-key"
                type={showAccessKey ? "text" : "password"}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={s3Config.accessKeyId}
                onChange={(e) => handleS3ConfigChange('accessKeyId', e.target.value)}
                disabled={!s3Config.enabled}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => {
                setShowAccessKey(!showAccessKey);
                toast({
                  title: !showAccessKey ? "显示 Access Key" : "隐藏 Access Key",
                  description: !showAccessKey ? "Access Key 现在可见" : "Access Key 现在已隐藏",
                });
              }}
                disabled={!s3Config.enabled}
              >
                {showAccessKey ? (
                  <EyeClosedIcon className="h-4 w-4" />
                ) : (
                  <EyeOpenIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-secret-key">Secret Access Key *</Label>
            <div className="relative">
              <Input
                id="s3-secret-key"
                type={showSecretKey ? "text" : "password"}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                value={s3Config.secretAccessKey}
                onChange={(e) => handleS3ConfigChange('secretAccessKey', e.target.value)}
                disabled={!s3Config.enabled}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => {
                setShowSecretKey(!showSecretKey);
                toast({
                  title: !showSecretKey ? "显示 Secret Key" : "隐藏 Secret Key",
                  description: !showSecretKey ? "Secret Key 现在可见" : "Secret Key 现在已隐藏",
                });
              }}
                disabled={!s3Config.enabled}
              >
                {showSecretKey ? (
                  <EyeClosedIcon className="h-4 w-4" />
                ) : (
                  <EyeOpenIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-region">区域 *</Label>
            <Input
              id="s3-region"
              placeholder="us-east-1"
              value={s3Config.region}
              onChange={(e) => handleS3ConfigChange('region', e.target.value)}
              disabled={!s3Config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-bucket">存储桶名称 *</Label>
            <Input
              id="s3-bucket"
              placeholder="my-backup-bucket"
              value={s3Config.bucket}
              onChange={(e) => handleS3ConfigChange('bucket', e.target.value)}
              disabled={!s3Config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-endpoint">自定义端点（可选）</Label>
            <Input
              id="s3-endpoint"
              placeholder="https://s3.amazonaws.com"
              value={s3Config.endpoint}
              onChange={(e) => handleS3ConfigChange('endpoint', e.target.value)}
              disabled={!s3Config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-path-prefix">路径前缀</Label>
            <Input
              id="s3-path-prefix"
              placeholder="backups/"
              value={s3Config.pathPrefix}
              onChange={(e) => handleS3ConfigChange('pathPrefix', e.target.value)}
              disabled={!s3Config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-backup-interval">备份间隔（分钟）</Label>
            <Input
              id="s3-backup-interval"
              type="number"
              min="1"
              value={s3Config.backupInterval}
              onChange={(e) => handleS3ConfigChange('backupInterval', parseInt(e.target.value))}
              disabled={!s3Config.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="s3-max-backups">最大备份数量</Label>
            <Input
              id="s3-max-backups"
              type="number"
              min="1"
              value={s3Config.maxBackups}
              onChange={(e) => handleS3ConfigChange('maxBackups', parseInt(e.target.value))}
              disabled={!s3Config.enabled}
            />
          </FormGroup>

          <SwitchGroup>
            <Switch
              id="s3-auto-backup"
              checked={s3Config.autoBackup}
              onCheckedChange={(checked: boolean) => {
                handleS3ConfigChange('autoBackup', checked);
                toast({
                  title: checked ? "S3 自动备份已启用" : "S3 自动备份已禁用",
                  description: checked ? "将自动备份到 S3 存储" : "已停止 S3 自动备份",
                });
              }}
              disabled={!s3Config.enabled}
            />
            <Label htmlFor="s3-auto-backup">自动备份</Label>
          </SwitchGroup>

          <SwitchGroup>
            <Switch
              id="s3-compression"
              checked={s3Config.compression}
              onCheckedChange={(checked: boolean) => {
                handleS3ConfigChange('compression', checked);
                toast({
                  title: checked ? "S3 压缩备份已启用" : "S3 压缩备份已禁用",
                  description: checked ? "备份文件将被压缩以节省空间" : "备份文件将不被压缩",
                });
              }}
              disabled={!s3Config.enabled}
            />
            <Label htmlFor="s3-compression">压缩备份</Label>
          </SwitchGroup>

          <SwitchGroup>
            <Switch
              id="s3-encryption"
              checked={s3Config.encryption}
              onCheckedChange={(checked: boolean) => {
                handleS3ConfigChange('encryption', checked);
                toast({
                  title: checked ? "S3 加密备份已启用" : "S3 加密备份已禁用",
                  description: checked ? "备份文件将被加密保护" : "备份文件将不被加密",
                });
              }}
              disabled={!s3Config.enabled}
            />
            <Label htmlFor="s3-encryption">加密备份</Label>
          </SwitchGroup>

          <FormGroup>
            <Label>备份类型</Label>
            <div className="space-y-2">
              <SwitchGroup>
                <Switch
                  id="s3-backup-database"
                  checked={s3Config.backupTypes.database}
                  onCheckedChange={(checked: boolean) => handleS3BackupTypeChange('database', checked)}
                  disabled={!s3Config.enabled}
                />
                <Label htmlFor="s3-backup-database">备份数据库文件</Label>
              </SwitchGroup>
              <SwitchGroup>
                <Switch
                  id="s3-backup-json"
                  checked={s3Config.backupTypes.json}
                  onCheckedChange={(checked: boolean) => handleS3BackupTypeChange('json', checked)}
                  disabled={!s3Config.enabled}
                />
                <Label htmlFor="s3-backup-json">备份JSON数据</Label>
              </SwitchGroup>
            </div>
          </FormGroup>

          <ButtonGroup>
            <Button
              onClick={saveS3Config}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {loading ? '保存中...' : '保存配置'}
            </Button>
            <Button
              variant="outline"
              onClick={testS3Connection}
              disabled={!s3Config.enabled || s3TestLoading}
              className="flex items-center gap-2"
            >
              <MixIcon className="h-4 w-4" />
              {s3TestLoading ? '测试中...' : '测试连接'}
            </Button>
            <Button
              variant="outline"
              onClick={performS3Backup}
              disabled={!s3Config.enabled || s3BackupLoading}
              className="flex items-center gap-2"
            >
              <UpdateIcon className="h-4 w-4" />
              {s3BackupLoading ? '备份中...' : '立即备份'}
            </Button>
          </ButtonGroup>

          {/* 恢复功能 */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <DownloadIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">数据恢复</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <InfoCircledIcon className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  从 S3 备份中恢复数据到本地，适用于在新电脑上同步数据
                </p>
              </div>

              <ButtonGroup>
                <Button
                  onClick={loadBackupList}
                  disabled={!s3Config.enabled}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  选择备份文件
                </Button>
              </ButtonGroup>

              {showBackupList && (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                  {/* 调试信息 */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <InfoCircledIcon className="h-4 w-4 text-blue-600" />
                    <div className="text-sm text-blue-800">
                      <p>当前路径前缀: <strong>"{s3Config.pathPrefix || ''}"</strong></p>
                      <p className="text-xs mt-1">如果备份文件在其他路径，请尝试修改路径前缀设置</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>选择备份文件</Label>
                    {backupList.length > 0 ? (
                      <select
                        value={selectedBackup}
                        onChange={(e) => setSelectedBackup(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">选择要恢复的备份文件</option>
                        {backupList.map((backup) => (
                          <option key={backup.key} value={backup.key}>
                            {backup.key} - {backup.type} - {new Date(backup.lastModified).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                        <InfoCircledIcon className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          没有找到可用的备份文件
                        </p>
                      </div>
                    )}
                  </div>

                  {backupList.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <Label>恢复模式</Label>
                        <Select.Root 
                          value={restoreMode} 
                          onValueChange={(value: 'database' | 'json' | 'merge') => setRestoreMode(value)}
                        >
                          <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <Select.Value placeholder="选择恢复模式" />
                            <Select.Icon asChild>
                              <ChevronDownIcon className="h-4 w-4 opacity-50" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                              <Select.Item value="json" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Select.ItemText>JSON 数据恢复 (推荐)</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="database" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Select.ItemText>数据库文件恢复</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="merge" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Select.ItemText>合并模式 (保留现有数据)</Select.ItemText>
                              </Select.Item>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>

                      <ButtonGroup>
                        <Button
                          onClick={performS3Restore}
                          disabled={!selectedBackup || restoreLoading}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          {restoreLoading ? '恢复中...' : '开始恢复'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowBackupList(false);
                            setSelectedBackup('');
                            toast({
                              title: "已取消",
                              description: "已取消数据恢复操作",
                            });
                          }}
                        >
                          取消
                        </Button>
                      </ButtonGroup>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
          </TabsContent>
          
          <TabsContent value="webdav" className="space-y-4">
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
              onCheckedChange={(checked: boolean) => {
                handleConfigChange('autoSync', checked);
                toast({
                  title: checked ? "WebDAV 自动同步已启用" : "WebDAV 自动同步已禁用",
                  description: checked ? "将自动同步数据到 WebDAV 服务器" : "已停止 WebDAV 自动同步",
                });
              }}
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
          </TabsContent>
          
          <TabsContent value="git" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitHubLogoIcon className="h-5 w-5" />
                  Git 同步设置
                </CardTitle>
                <CardDescription>
                  配置Git仓库信息，实现版本控制和数据同步
                </CardDescription>
              </CardHeader>
        <CardContent>
          <SwitchGroup>
            <Switch
              id="git-enabled"
              checked={gitConfig.enabled}
              onCheckedChange={(checked: boolean) => handleGitConfigChange('enabled', checked)}
            />
            <Label htmlFor="git-enabled">启用Git同步</Label>
          </SwitchGroup>

          <SwitchGroup>
            <Switch
              id="git-auto-create"
              checked={gitConfig.autoCreateRepo || false}
              onCheckedChange={(checked: boolean) => {
                handleGitConfigChange('autoCreateRepo', checked);
                toast({
                  title: checked ? "自动创建仓库已启用" : "自动创建仓库已禁用",
                  description: checked ? "保存配置时将自动创建远程仓库" : "需要手动提供远程仓库地址",
                });
              }}
              disabled={!gitConfig.enabled}
            />
            <Label htmlFor="git-auto-create">自动创建私有仓库</Label>
          </SwitchGroup>

          {gitConfig.autoCreateRepo ? (
            <>
              <FormGroup>
                <Label>Git服务提供商 *</Label>
                <Select.Root 
                  value={gitConfig.gitProvider || 'github'} 
                  onValueChange={(value: 'github' | 'gitlab') => handleGitConfigChange('gitProvider', value)}
                  disabled={!gitConfig.enabled}
                >
                  <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <Select.Value placeholder="选择Git服务提供商" />
                    <Select.Icon asChild>
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                      <Select.Item value="github" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>GitHub</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="gitlab" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>GitLab</Select.ItemText>
                      </Select.Item>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="git-repo-name">仓库名称 *</Label>
                <Input
                  id="git-repo-name"
                  placeholder="personal-okr-data"
                  value={gitConfig.repoName || ''}
                  onChange={(e) => handleGitConfigChange('repoName', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="git-repo-description">仓库描述</Label>
                <Input
                  id="git-repo-description"
                  placeholder="Personal OKR Manager Data Repository"
                  value={gitConfig.repoDescription || ''}
                  onChange={(e) => handleGitConfigChange('repoDescription', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>

              <FormGroup>
                <Label>仓库可见性 *</Label>
                <Select.Root 
                  value={gitConfig.repoVisibility || 'private'} 
                  onValueChange={(value: 'private' | 'public') => handleGitConfigChange('repoVisibility', value)}
                  disabled={!gitConfig.enabled}
                >
                  <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <Select.Value placeholder="选择仓库可见性" />
                    <Select.Icon asChild>
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                      <Select.Item value="private" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>私有仓库</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="public" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>公开仓库</Select.ItemText>
                      </Select.Item>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </FormGroup>
            </>
          ) : (
            <FormGroup>
              <Label htmlFor="git-url">Git仓库地址 *</Label>
              <Input
                id="git-url"
                type="url"
                placeholder="https://github.com/username/repo.git"
                value={gitConfig.remoteUrl}
                onChange={(e) => handleGitConfigChange('remoteUrl', e.target.value)}
                disabled={!gitConfig.enabled}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="git-branch">分支名称 *</Label>
            <Input
              id="git-branch"
              placeholder="main"
              value={gitConfig.branch}
              onChange={(e) => handleGitConfigChange('branch', e.target.value)}
              disabled={!gitConfig.enabled}
            />
          </FormGroup>

          <FormGroup>
            <Label>认证方式 *</Label>
            <Select.Root 
              value={gitConfig.authMethod} 
              onValueChange={(value: 'token' | 'ssh' | 'https') => handleGitConfigChange('authMethod', value)}
              disabled={!gitConfig.enabled}
            >
              <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <Select.Value placeholder="选择认证方式" />
                <Select.Icon asChild>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                  <Select.Item value="token" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Select.ItemText>Personal Access Token</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="https" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Select.ItemText>HTTPS (用户名/密码)</Select.ItemText>
                  </Select.Item>
                  <Select.Item value="ssh" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Select.ItemText>SSH Key</Select.ItemText>
                  </Select.Item>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </FormGroup>

          {gitConfig.authMethod === 'token' && (
            <FormGroup>
              <Label htmlFor="git-token">Personal Access Token *</Label>
              <div className="relative">
                <Input
                  id="git-token"
                  type={showToken ? "text" : "password"}
                  placeholder="输入GitHub/GitLab Token"
                  value={gitConfig.credentials.token || ''}
                  onChange={(e) => handleGitCredentialsChange('token', e.target.value)}
                  disabled={!gitConfig.enabled}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => {
                    setShowToken(!showToken);
                    toast({
                      title: !showToken ? "显示 Token" : "隐藏 Token",
                      description: !showToken ? "Token 现在可见" : "Token 现在已隐藏",
                    });
                  }}
                  disabled={!gitConfig.enabled}
                >
                  {showToken ? (
                    <EyeClosedIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOpenIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </FormGroup>
          )}

          {gitConfig.authMethod === 'https' && (
            <>
              <FormGroup>
                <Label htmlFor="git-username">用户名 *</Label>
                <Input
                  id="git-username"
                  placeholder="输入Git用户名"
                  value={gitConfig.credentials.username || ''}
                  onChange={(e) => handleGitCredentialsChange('username', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="git-password">密码 *</Label>
                <Input
                  id="git-password"
                  type="password"
                  placeholder="输入Git密码"
                  value={gitConfig.credentials.password || ''}
                  onChange={(e) => handleGitCredentialsChange('password', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>
            </>
          )}

          {gitConfig.authMethod === 'ssh' && (
            <FormGroup>
              <Label htmlFor="git-ssh-key">SSH私钥路径 *</Label>
              <Textarea
                id="git-ssh-key"
                placeholder="输入SSH私钥文件路径或私钥内容"
                value={gitConfig.credentials.sshKey || ''}
                onChange={(e) => handleGitCredentialsChange('sshKey', e.target.value)}
                disabled={!gitConfig.enabled}
                rows={3}
              />
            </FormGroup>
          )}

          {/* 代理配置部分 */}
          <FormGroup>
            <SwitchGroup>
              <Switch
                id="git-proxy-enabled"
                checked={gitConfig.proxy?.enabled || false}
                onCheckedChange={(checked: boolean) => {
                    handleGitProxyChange('enabled', checked);
                    toast({
                      title: checked ? "Git 代理已启用" : "Git 代理已禁用",
                      description: checked ? "将通过代理服务器连接 Git" : "已禁用 Git 代理连接",
                    });
                  }}
                disabled={!gitConfig.enabled}
              />
              <Label htmlFor="git-proxy-enabled">启用代理</Label>
            </SwitchGroup>
          </FormGroup>

          {gitConfig.proxy?.enabled && (
            <>
              <FormGroup>
                <Label>代理类型 *</Label>
                <Select.Root 
                  value={gitConfig.proxy?.type || 'http'} 
                  onValueChange={(value: 'http' | 'https' | 'socks5') => handleGitProxyChange('type', value)}
                  disabled={!gitConfig.enabled}
                >
                  <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <Select.Value placeholder="选择代理类型" />
                    <Select.Icon asChild>
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                      <Select.Item value="http" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>HTTP</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="https" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>HTTPS</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="socks5" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Select.ItemText>SOCKS5</Select.ItemText>
                      </Select.Item>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="git-proxy-host">代理主机 *</Label>
                <Input
                  id="git-proxy-host"
                  placeholder="127.0.0.1"
                  value={gitConfig.proxy?.host || ''}
                  onChange={(e) => handleGitProxyChange('host', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="git-proxy-port">代理端口 *</Label>
                <Input
                  id="git-proxy-port"
                  type="number"
                  min={1}
                  max={65535}
                  placeholder="7890"
                  value={gitConfig.proxy?.port || ''}
                  onChange={(e) => handleGitProxyChange('port', parseInt(e.target.value) || 7890)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="git-proxy-username">代理用户名（可选）</Label>
                <Input
                  id="git-proxy-username"
                  placeholder="输入代理用户名"
                  value={gitConfig.proxy?.username || ''}
                  onChange={(e) => handleGitProxyChange('username', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="git-proxy-password">代理密码（可选）</Label>
                <Input
                  id="git-proxy-password"
                  type="password"
                  placeholder="输入代理密码"
                  value={gitConfig.proxy?.password || ''}
                  onChange={(e) => handleGitProxyChange('password', e.target.value)}
                  disabled={!gitConfig.enabled}
                />
              </FormGroup>

              <FormGroup>
                <Button
                  variant="outline"
                  onClick={testProxyConnection}
                  disabled={!gitConfig.enabled || proxyTestLoading}
                  className="flex items-center gap-2"
                >
                  <MixIcon className="h-4 w-4" />
                  {proxyTestLoading ? '测试中...' : '测试代理连接'}
                </Button>
              </FormGroup>
            </>
          )}

          <FormGroup>
            <Label htmlFor="git-sync-interval">同步间隔（分钟）*</Label>
            <Input
              id="git-sync-interval"
              type="number"
              min={5}
              max={1440}
              placeholder="30"
              value={gitConfig.syncInterval}
              onChange={(e) => handleGitConfigChange('syncInterval', parseInt(e.target.value) || 30)}
              disabled={!gitConfig.enabled}
            />
          </FormGroup>

          <SwitchGroup>
            <Switch
              id="git-auto-sync"
              checked={gitConfig.autoSync}
              onCheckedChange={(checked: boolean) => {
                handleGitConfigChange('autoSync', checked);
                toast({
                  title: checked ? "Git 自动同步已启用" : "Git 自动同步已禁用",
                  description: checked ? "将自动同步数据到 Git 仓库" : "已停止 Git 自动同步",
                });
              }}
              disabled={!gitConfig.enabled}
            />
            <Label htmlFor="git-auto-sync">自动同步</Label>
          </SwitchGroup>

          <ButtonGroup>
            <Button
              onClick={saveGitConfig}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {loading ? '保存中...' : '保存配置'}
            </Button>
            <Button
              variant="outline"
              onClick={testGitConnection}
              disabled={!gitConfig.enabled || gitTestLoading}
              className="flex items-center gap-2"
            >
              <MixIcon className="h-4 w-4" />
              {gitTestLoading ? '测试中...' : '测试连接'}
            </Button>
            <Button
              variant="outline"
              onClick={triggerGitSync}
              disabled={!gitConfig.enabled}
              className="flex items-center gap-2"
            >
              <UpdateIcon className="h-4 w-4" />
              立即同步
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              配置导入导出
            </CardTitle>
            <CardDescription>
              导入和导出配置文件，方便在不同电脑间同步配置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <InfoCircledIcon className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  导出配置文件包含所有同步设置，可在其他电脑上导入使用
                </p>
              </div>
              
              <ButtonGroup>
                <Button
                  onClick={exportConfig}
                  disabled={configExportLoading}
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="h-4 w-4" />
                  {configExportLoading ? '导出中...' : '导出配置'}
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importConfig}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={configImportLoading}
                  />
                  <Button
                    variant="outline"
                    disabled={configImportLoading}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {configImportLoading ? '导入中...' : '导入配置'}
                  </Button>
                </div>
              </ButtonGroup>
              
              <div className="text-sm text-muted-foreground mt-4">
                <p><strong>配置文件包含：</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>S3 备份配置（不含敏感信息）</li>
                  <li>WebDAV 同步配置（不含敏感信息）</li>
                  <li>Git 同步配置（不含敏感信息）</li>
                </ul>
                <p className="mt-2 text-yellow-600">
                  <strong>注意：</strong>密码和密钥等敏感信息不会导出，导入后需要重新配置
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Settings;