"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainGitSyncService = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const path_1 = require("path");
const electron_1 = require("electron");
const fs_1 = require("fs");
const databaseService_1 = require("./databaseService");
const https_1 = __importDefault(require("https"));
const https_proxy_agent_1 = require("https-proxy-agent");
class MainGitSyncService {
    constructor() {
        this.git = null;
        this.config = null;
        this.syncTimer = null;
        this.repoPath = (0, path_1.join)(electron_1.app.getPath('userData'), 'git-sync');
        this.dataDir = (0, path_1.join)(this.repoPath, 'data');
    }
    /**
     * 创建远程仓库
     */
    async createRemoteRepository(config) {
        if (!config.autoCreateRepo || !config.credentials.token) {
            throw new Error('自动创建仓库需要启用并提供访问令牌');
        }
        try {
            const repoName = config.repoName || 'personal-okr-data';
            const description = config.repoDescription || 'Personal OKR Manager Data Repository';
            const isPrivate = config.repoVisibility === 'private';
            // 先检查仓库是否已存在
            let existingRepoUrl = null;
            if (config.gitProvider === 'github') {
                existingRepoUrl = await this.checkGitHubRepositoryExists(config.credentials.token, repoName);
            }
            else if (config.gitProvider === 'gitlab') {
                existingRepoUrl = await this.checkGitLabRepositoryExists(config.credentials.token, repoName);
            }
            else {
                throw new Error('不支持的 Git 服务提供商');
            }
            // 如果仓库已存在，直接返回其 URL
            if (existingRepoUrl) {
                console.log(`仓库 ${repoName} 已存在，使用现有仓库: ${existingRepoUrl}`);
                return existingRepoUrl;
            }
            // 仓库不存在，创建新仓库
            console.log(`仓库 ${repoName} 不存在，正在创建新仓库...`);
            if (config.gitProvider === 'github') {
                return await this.createGitHubRepository(config.credentials.token, repoName, description, isPrivate);
            }
            else if (config.gitProvider === 'gitlab') {
                return await this.createGitLabRepository(config.credentials.token, repoName, description, isPrivate);
            }
            else {
                throw new Error('不支持的 Git 服务提供商');
            }
        }
        catch (error) {
            console.error('创建远程仓库失败:', error);
            throw new Error(`创建远程仓库失败: ${error.message}`);
        }
    }
    /**
     * 检查 GitHub 仓库是否存在
     */
    async checkGitHubRepositoryExists(token, name) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                port: 443,
                path: `/user/repos?visibility=all&per_page=100`,
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'Personal-OKR-Manager'
                }
            };
            // 添加代理支持
            if (this.config?.proxy?.enabled) {
                const proxyUrl = this.buildProxyUrl(this.config.proxy);
                options.agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
                console.log(`GitHub API 使用代理: ${proxyUrl}`);
            }
            console.log(`检查 GitHub 仓库是否存在的 options: ${JSON.stringify(options)}`);
            const req = https_1.default.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const repos = JSON.parse(responseData);
                            console.log(`检查 GitHub 仓库是否存在的响应: ${JSON.stringify(repos.map((e) => e.name))}`);
                            const existingRepo = repos.find((repo) => repo.name === name);
                            if (existingRepo) {
                                resolve(existingRepo.clone_url);
                            }
                            else {
                                resolve(null);
                            }
                        }
                        else {
                            reject(new Error(`检查 GitHub 仓库失败，状态码: ${res.statusCode}`));
                        }
                    }
                    catch (error) {
                        reject(new Error('解析 GitHub API 响应失败'));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`GitHub API 请求失败: ${error.message}`));
            });
            req.end();
        });
    }
    /**
     * 检查 GitLab 仓库是否存在
     */
    async checkGitLabRepositoryExists(token, name) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'gitlab.com',
                port: 443,
                path: `/api/v4/projects?owned=true&search=${encodeURIComponent(name)}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            // 添加代理支持
            if (this.config?.proxy?.enabled) {
                const proxyUrl = this.buildProxyUrl(this.config.proxy);
                options.agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
                console.log(`GitLab API 使用代理: ${proxyUrl}`);
            }
            const req = https_1.default.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            const projects = JSON.parse(responseData);
                            const existingProject = projects.find((project) => project.name === name);
                            if (existingProject) {
                                resolve(existingProject.http_url_to_repo);
                            }
                            else {
                                resolve(null);
                            }
                        }
                        else {
                            reject(new Error(`检查 GitLab 仓库失败，状态码: ${res.statusCode}`));
                        }
                    }
                    catch (error) {
                        reject(new Error('解析 GitLab API 响应失败'));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`GitLab API 请求失败: ${error.message}`));
            });
            req.end();
        });
    }
    /**
     * 创建 GitHub 仓库
     */
    async createGitHubRepository(token, name, description, isPrivate) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                name,
                description,
                private: isPrivate,
                auto_init: true
            });
            const options = {
                hostname: 'api.github.com',
                port: 443,
                path: '/user/repos',
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'Personal-OKR-Manager',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            // 添加代理支持
            if (this.config?.proxy?.enabled) {
                const proxyUrl = this.buildProxyUrl(this.config.proxy);
                options.agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
                console.log(`GitHub API 使用代理: ${proxyUrl}`);
            }
            const req = https_1.default.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        if (res.statusCode === 201) {
                            resolve(response.clone_url);
                        }
                        else {
                            reject(new Error(response.message || '创建 GitHub 仓库失败'));
                        }
                    }
                    catch (error) {
                        reject(new Error('解析 GitHub API 响应失败'));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`GitHub API 请求失败: ${error.message}`));
            });
            req.write(data);
            req.end();
        });
    }
    /**
     * 创建 GitLab 仓库
     */
    async createGitLabRepository(token, name, description, isPrivate) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                name,
                description,
                visibility: isPrivate ? 'private' : 'public',
                initialize_with_readme: true
            });
            const options = {
                hostname: 'gitlab.com',
                port: 443,
                path: '/api/v4/projects',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            // 添加代理支持
            if (this.config?.proxy?.enabled) {
                const proxyUrl = this.buildProxyUrl(this.config.proxy);
                options.agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
                console.log(`GitLab API 使用代理: ${proxyUrl}`);
            }
            const req = https_1.default.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        if (res.statusCode === 201) {
                            resolve(response.http_url_to_repo);
                        }
                        else {
                            reject(new Error(response.message || '创建 GitLab 仓库失败'));
                        }
                    }
                    catch (error) {
                        reject(new Error('解析 GitLab API 响应失败'));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`GitLab API 请求失败: ${error.message}`));
            });
            req.write(data);
            req.end();
        });
    }
    /**
     * 初始化 Git 仓库和配置
     */
    async initializeRepository(config) {
        try {
            // 如果启用自动创建仓库且没有远程URL，则先创建仓库
            if (config.autoCreateRepo && !config.remoteUrl) {
                console.log('正在自动创建远程仓库...');
                const remoteUrl = await this.createRemoteRepository(config);
                config.remoteUrl = remoteUrl;
                console.log(`远程仓库创建成功: ${remoteUrl}`);
            }
            this.config = config;
            // 确保目录存在
            await this.ensureDirectories();
            // 设置代理环境变量
            await this.setupProxyEnvironment();
            // 初始化 Git，配置超时和其他选项
            const gitConfig = [
                'http.timeout=60',
                'http.lowSpeedLimit=1000',
                'http.lowSpeedTime=60',
                'http.postBuffer=524288000'
            ];
            // 添加代理配置
            if (config.proxy?.enabled) {
                const proxyUrl = this.buildProxyUrl(config.proxy);
                gitConfig.push(`http.proxy=${proxyUrl}`);
                gitConfig.push(`https.proxy=${proxyUrl}`);
                console.log(`已配置 Git 代理: ${proxyUrl}`);
            }
            this.git = (0, simple_git_1.default)(this.repoPath, {
                timeout: {
                    block: 60000, // 60秒超时
                },
                config: gitConfig
            });
            // 检查是否已经是 Git 仓库
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                // 初始化新仓库
                await this.git.init();
                await this.git.addConfig('user.name', 'OKR Manager');
                await this.git.addConfig('user.email', 'okr-manager@local');
                // 添加远程仓库
                if (config.remoteUrl) {
                    await this.git.addRemote('origin', config.remoteUrl);
                }
            }
            // 设置认证
            await this.setupAuthentication();
            console.log('Git 仓库初始化成功');
        }
        catch (error) {
            console.error('Git 仓库初始化失败:', error);
            throw new Error(`Git 仓库初始化失败: ${error.message}`);
        }
    }
    /**
     * 设置 Git 认证
     */
    async setupAuthentication() {
        if (!this.config || !this.git)
            return;
        try {
            // 清理 URL，移除末尾多余的斜杠
            let cleanUrl = this.config.remoteUrl.replace(/\/+$/, '');
            // 检测并转换 URL 格式
            cleanUrl = this.normalizeGitUrl(cleanUrl);
            this.config.remoteUrl = cleanUrl;
            if (this.config.authMethod === 'token' && this.config.credentials.token) {
                // 使用 Personal Access Token - 强制使用 HTTPS 格式
                let remoteUrl;
                if (cleanUrl.startsWith('git@')) {
                    // SSH URL 格式，转换为 HTTPS 格式
                    if (cleanUrl.includes('github.com')) {
                        const repoPath = cleanUrl.replace('git@github.com:', '').replace('.git', '');
                        remoteUrl = `https://${this.config.credentials.token}@github.com/${repoPath}.git`;
                    }
                    else if (cleanUrl.includes('gitlab.com')) {
                        const repoPath = cleanUrl.replace('git@gitlab.com:', '').replace('.git', '');
                        remoteUrl = `https://${this.config.credentials.token}@gitlab.com/${repoPath}.git`;
                    }
                    else {
                        // 其他 SSH URL，尝试转换
                        remoteUrl = cleanUrl;
                    }
                }
                else {
                    // HTTPS URL 格式，添加 token
                    remoteUrl = cleanUrl.replace('https://', `https://${this.config.credentials.token}@`);
                }
                await this.git.removeRemote('origin').catch(() => { });
                await this.git.addRemote('origin', remoteUrl);
                console.log('已设置 token 认证，使用 HTTPS 协议');
            }
            else if (this.config.authMethod === 'https' &&
                this.config.credentials.username &&
                this.config.credentials.password) {
                // 使用用户名密码
                const remoteUrl = cleanUrl.replace('https://', `https://${this.config.credentials.username}:${this.config.credentials.password}@`);
                await this.git.removeRemote('origin').catch(() => { });
                await this.git.addRemote('origin', remoteUrl);
            }
            else if (this.config.authMethod === 'ssh') {
                // SSH 认证，确保使用 SSH URL 格式
                const sshUrl = this.convertToSshUrl(cleanUrl);
                await this.git.removeRemote('origin').catch(() => { });
                await this.git.addRemote('origin', sshUrl);
            }
            // 默认情况下使用原始 URL
        }
        catch (error) {
            console.error('设置 Git 认证失败:', error);
            throw error;
        }
    }
    /**
     * 标准化 Git URL 格式
     */
    normalizeGitUrl(url) {
        // 确保 GitHub/GitLab URL 使用正确的协议
        if (url.includes('github.com') || url.includes('gitlab.com')) {
            // 如果是 HTTP，转换为 HTTPS
            if (url.startsWith('http://')) {
                url = url.replace('http://', 'https://');
            }
            // 确保 URL 以 .git 结尾
            if (!url.endsWith('.git')) {
                url += '.git';
            }
        }
        return url;
    }
    /**
     * 转换 HTTPS URL 为 SSH URL
     */
    convertToSshUrl(httpsUrl) {
        if (httpsUrl.startsWith('git@')) {
            return httpsUrl; // 已经是 SSH 格式
        }
        // 转换 HTTPS 为 SSH 格式
        if (httpsUrl.includes('github.com')) {
            const repoPath = httpsUrl.replace('https://github.com/', '').replace('.git', '');
            return `git@github.com:${repoPath}.git`;
        }
        else if (httpsUrl.includes('gitlab.com')) {
            const repoPath = httpsUrl.replace('https://gitlab.com/', '').replace('.git', '');
            return `git@gitlab.com:${repoPath}.git`;
        }
        return httpsUrl; // 其他情况保持原样
    }
    /**
     * 尝试不同的连接协议
     */
    async tryDifferentProtocols(operation) {
        if (!this.config)
            throw new Error('Git 配置未初始化');
        const originalAuthMethod = this.config.authMethod;
        const protocols = ['token', 'ssh']; // 优先尝试 token，然后 SSH
        for (const protocol of protocols) {
            try {
                console.log(`尝试使用 ${protocol} 协议...`);
                this.config.authMethod = protocol;
                await this.setupAuthentication();
                await operation();
                console.log(`${protocol} 协议连接成功`);
                return; // 成功则返回
            }
            catch (error) {
                console.log(`${protocol} 协议失败:`, error.message);
                if (protocol === protocols[protocols.length - 1]) {
                    // 如果是最后一个协议，恢复原始设置并抛出错误
                    this.config.authMethod = originalAuthMethod;
                    await this.setupAuthentication();
                    throw error;
                }
            }
        }
    }
    /**
     * 确保必要的目录存在
     */
    async ensureDirectories() {
        try {
            await fs_1.promises.mkdir(this.repoPath, { recursive: true });
            await fs_1.promises.mkdir(this.dataDir, { recursive: true });
        }
        catch (error) {
            console.error('创建目录失败:', error);
            throw error;
        }
    }
    /**
     * 导出数据到 JSON 文件
     */
    async exportData() {
        if (!this.git) {
            throw new Error('Git 未初始化');
        }
        try {
            // 获取所有数据
            const [todos, okrs, keyResults, tasks, notes] = await Promise.all([
                databaseService_1.databaseService.getTodos(),
                databaseService_1.databaseService.getOKRs(),
                databaseService_1.databaseService.getKeyResults(),
                databaseService_1.databaseService.getTasks(),
                databaseService_1.databaseService.getNotes()
            ]);
            const syncData = {
                todos,
                okrs,
                keyResults,
                tasks,
                notes,
                lastSync: new Date().toISOString(),
                version: '1.0.0'
            };
            // 分别保存到不同文件
            await Promise.all([
                this.writeJsonFile('todos.json', {
                    version: '1.0',
                    lastSync: syncData.lastSync,
                    data: todos
                }),
                this.writeJsonFile('okrs.json', {
                    version: '1.0',
                    lastSync: syncData.lastSync,
                    data: okrs
                }),
                this.writeJsonFile('keyResults.json', {
                    version: '1.0',
                    lastSync: syncData.lastSync,
                    data: keyResults
                }),
                this.writeJsonFile('tasks.json', {
                    version: '1.0',
                    lastSync: syncData.lastSync,
                    data: tasks
                }),
                this.writeJsonFile('notes.json', {
                    version: '1.0',
                    lastSync: syncData.lastSync,
                    data: notes
                }),
                this.writeJsonFile('metadata.json', {
                    appVersion: '1.0.0',
                    schemaVersion: '1.0',
                    lastSync: syncData.lastSync,
                    syncStrategy: 'git'
                })
            ]);
            console.log('数据导出完成');
        }
        catch (error) {
            console.error('数据导出失败:', error);
            throw new Error(`数据导出失败: ${error.message}`);
        }
    }
    /**
     * 写入 JSON 文件
     */
    async writeJsonFile(filename, data) {
        const filePath = (0, path_1.join)(this.dataDir, filename);
        await fs_1.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    /**
     * 提交更改
     */
    async commitChanges(message) {
        if (!this.git) {
            throw new Error('Git 未初始化');
        }
        try {
            // 检查是否有更改
            const status = await this.git.status();
            if (status.files.length === 0) {
                console.log('没有需要提交的更改');
                return;
            }
            // 添加所有更改
            await this.git.add('.');
            // 提交更改
            const commitMessage = message || `数据同步 - ${new Date().toISOString()}`;
            await this.git.commit(commitMessage);
            console.log('更改提交成功:', commitMessage);
        }
        catch (error) {
            console.error('提交更改失败:', error);
            throw new Error(`提交更改失败: ${error.message}`);
        }
    }
    /**
     * 推送到远程仓库
     */
    async pushChanges() {
        if (!this.git || !this.config) {
            throw new Error('Git 未初始化');
        }
        const maxRetries = 3;
        let lastError = null;
        let protocolSwitched = false;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`推送尝试 ${attempt}/${maxRetries}...`);
                // 确保远程 URL 正确设置
                await this.setupAuthentication();
                const branch = this.config.branch || 'main';
                // 创建带超时的推送操作
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('推送操作超时（60秒）'));
                    }, 60000); // 60秒超时
                });
                const pushPromise = this.git.push('origin', branch);
                await Promise.race([pushPromise, timeoutPromise]);
                console.log('推送到远程仓库成功');
                return; // 成功则直接返回
            }
            catch (error) {
                lastError = error;
                const errorMessage = lastError.message;
                console.error(`推送尝试 ${attempt} 失败:`, errorMessage);
                // 检查是否是 Connection reset by peer 错误，如果是且未尝试过协议切换，则尝试切换协议
                const isConnectionResetError = errorMessage.includes('Connection reset by peer') ||
                    errorMessage.includes('Recv failure');
                if (isConnectionResetError && !protocolSwitched && attempt < maxRetries) {
                    console.log('检测到连接重置错误，尝试切换到不同的协议...');
                    try {
                        await this.tryDifferentProtocols(async () => {
                            const branch = this.config.branch || 'main';
                            await this.git.push('origin', branch);
                        });
                        console.log('协议切换成功，推送完成');
                        protocolSwitched = true;
                        return;
                    }
                    catch (protocolError) {
                        console.log('协议切换失败:', protocolError.message);
                        protocolSwitched = true; // 标记已尝试过协议切换
                    }
                }
                // 检查是否是网络相关错误，如果是则重试
                const isNetworkError = errorMessage.includes('Connection reset') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('ECONNRESET') ||
                    errorMessage.includes('ENOTFOUND') ||
                    errorMessage.includes('network') ||
                    errorMessage.includes('unable to access');
                // 如果不是网络错误，或者已经是最后一次尝试，则抛出错误
                if (!isNetworkError || attempt === maxRetries) {
                    break;
                }
                // 等待一段时间后重试
                const waitTime = attempt * 2000; // 递增等待时间：2s, 4s, 6s
                console.log(`等待 ${waitTime / 1000} 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        // 如果所有重试都失败了，抛出详细的错误信息
        const errorMessage = lastError?.message || '未知错误';
        console.error('推送最终失败:', errorMessage);
        if (errorMessage.includes('Authentication failed') || errorMessage.includes('authentication failed')) {
            throw new Error('认证失败，请检查 Token 或用户名密码是否正确');
        }
        else if (errorMessage.includes('Repository not found') || errorMessage.includes('repository not found')) {
            throw new Error('仓库不存在，请检查仓库地址是否正确');
        }
        else if (errorMessage.includes('Connection reset') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('ECONNRESET') ||
            errorMessage.includes('ENOTFOUND') ||
            errorMessage.includes('network') ||
            errorMessage.includes('unable to access')) {
            throw new Error(`网络连接失败，已重试 ${maxRetries} 次并尝试了协议切换。可能的解决方案：\n1. 检查网络连接是否正常\n2. 尝试访问 GitHub/GitLab 网站确认服务可用\n3. 检查防火墙或代理设置\n4. 确保 SSH 密钥已正确配置（如果使用 SSH）\n5. 稍后重试或尝试使用其他网络环境\n\n错误详情: ${errorMessage}`);
        }
        else {
            throw new Error(`推送失败: ${errorMessage}`);
        }
    }
    /**
     * 从远程仓库拉取
     */
    async pullChanges() {
        if (!this.git || !this.config) {
            throw new Error('Git 未初始化');
        }
        const maxRetries = 3;
        let lastError = null;
        let protocolSwitched = false;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`拉取尝试 ${attempt}/${maxRetries}...`);
                // 确保远程 URL 正确设置
                await this.setupAuthentication();
                const branch = this.config.branch || 'main';
                // 创建带超时的拉取操作
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('拉取操作超时（60秒）'));
                    }, 60000); // 60秒超时
                });
                const pullPromise = (async () => {
                    try {
                        await this.git.pull('origin', branch);
                    }
                    catch (pullError) {
                        // 如果是首次拉取，可能需要设置上游分支
                        await this.git.pull('origin', branch, { '--set-upstream': null });
                    }
                })();
                await Promise.race([pullPromise, timeoutPromise]);
                console.log('从远程仓库拉取成功');
                return; // 成功则直接返回
            }
            catch (error) {
                lastError = error;
                const errorMessage = lastError.message;
                console.error(`拉取尝试 ${attempt} 失败:`, errorMessage);
                // 检查是否是 Connection reset by peer 错误，如果是且未尝试过协议切换，则尝试切换协议
                const isConnectionResetError = errorMessage.includes('Connection reset by peer') ||
                    errorMessage.includes('Recv failure');
                if (isConnectionResetError && !protocolSwitched && attempt < maxRetries) {
                    console.log('检测到连接重置错误，尝试切换到不同的协议...');
                    try {
                        await this.tryDifferentProtocols(async () => {
                            const branch = this.config.branch || 'main';
                            try {
                                await this.git.pull('origin', branch);
                            }
                            catch (pullError) {
                                await this.git.pull('origin', branch, { '--set-upstream': null });
                            }
                        });
                        console.log('协议切换成功，拉取完成');
                        protocolSwitched = true;
                        return;
                    }
                    catch (protocolError) {
                        console.log('协议切换失败:', protocolError.message);
                        protocolSwitched = true; // 标记已尝试过协议切换
                    }
                }
                // 检查是否是网络相关错误，如果是则重试
                const isNetworkError = errorMessage.includes('Connection reset') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('ECONNRESET') ||
                    errorMessage.includes('ENOTFOUND') ||
                    errorMessage.includes('network') ||
                    errorMessage.includes('unable to access');
                // 如果不是网络错误，或者已经是最后一次尝试，则抛出错误
                if (!isNetworkError || attempt === maxRetries) {
                    break;
                }
                // 等待一段时间后重试
                const waitTime = attempt * 2000; // 递增等待时间：2s, 4s, 6s
                console.log(`等待 ${waitTime / 1000} 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        // 如果所有重试都失败了，抛出详细的错误信息
        const errorMessage = lastError?.message || '未知错误';
        console.error('拉取最终失败:', errorMessage);
        if (errorMessage.includes('Authentication failed') || errorMessage.includes('authentication failed')) {
            throw new Error('认证失败，请检查 Token 或用户名密码是否正确');
        }
        else if (errorMessage.includes('Repository not found') || errorMessage.includes('repository not found')) {
            throw new Error('仓库不存在，请检查仓库地址是否正确');
        }
        else if (errorMessage.includes('Connection reset') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('ECONNRESET') ||
            errorMessage.includes('ENOTFOUND') ||
            errorMessage.includes('network') ||
            errorMessage.includes('unable to access')) {
            throw new Error(`网络连接失败，已重试 ${maxRetries} 次并尝试了协议切换。可能的解决方案：\n1. 检查网络连接是否正常\n2. 尝试访问 GitHub/GitLab 网站确认服务可用\n3. 检查防火墙或代理设置\n4. 确保 SSH 密钥已正确配置（如果使用 SSH）\n5. 稍后重试或尝试使用其他网络环境\n\n错误详情: ${errorMessage}`);
        }
        else {
            throw new Error(`拉取失败: ${errorMessage}`);
        }
    }
    /**
     * 完整同步流程
     */
    async syncData() {
        if (!this.git || !this.config) {
            throw new Error('Git 未初始化');
        }
        try {
            // 1. 先拉取远程更改
            await this.pullChanges();
            // 2. 导出本地数据
            await this.exportData();
            // 3. 提交更改
            await this.commitChanges();
            // 4. 推送到远程
            await this.pushChanges();
            // 5. 返回同步后的数据
            const [todos, okrs, keyResults, tasks, notes] = await Promise.all([
                databaseService_1.databaseService.getTodos(),
                databaseService_1.databaseService.getOKRs(),
                databaseService_1.databaseService.getKeyResults(),
                databaseService_1.databaseService.getTasks(),
                databaseService_1.databaseService.getNotes()
            ]);
            return {
                todos,
                okrs,
                keyResults,
                tasks,
                notes,
                lastSync: new Date().toISOString(),
                version: '1.0.0'
            };
        }
        catch (error) {
            console.error('Git 同步失败:', error);
            throw new Error(`Git 同步失败: ${error.message}`);
        }
    }
    /**
     * 获取同步状态
     */
    async getStatus() {
        try {
            if (!this.git) {
                return {
                    isInitialized: false,
                    hasChanges: false,
                    syncInProgress: false
                };
            }
            const status = await this.git.status();
            return {
                isInitialized: true,
                hasChanges: status.files.length > 0,
                syncInProgress: false, // 这里可以根据实际情况设置
                lastSync: this.config ? new Date().toISOString() : undefined
            };
        }
        catch (error) {
            return {
                isInitialized: false,
                hasChanges: false,
                syncInProgress: false,
                error: error.message
            };
        }
    }
    /**
     * 测试代理连接
     */
    async testProxyConnection(proxyConfig) {
        try {
            console.log('开始代理连接测试...', {
                type: proxyConfig.type,
                host: proxyConfig.host,
                port: proxyConfig.port,
                hasAuth: !!(proxyConfig.username && proxyConfig.password)
            });
            // 构建代理 URL
            const proxyUrl = this.buildProxyUrl(proxyConfig);
            // 测试代理连接 - 尝试通过代理访问一个简单的 HTTPS 端点
            const https = require('https');
            const { HttpsProxyAgent } = require('https-proxy-agent');
            return new Promise((resolve, reject) => {
                const agent = new HttpsProxyAgent(proxyUrl);
                const options = {
                    hostname: 'api.github.com',
                    port: 443,
                    path: '/zen',
                    method: 'GET',
                    agent: agent,
                    timeout: 30000 // 30秒超时
                };
                const req = https.request(options, (res) => {
                    console.log('代理连接测试响应状态:', res.statusCode);
                    if (res.statusCode === 200) {
                        console.log('代理连接测试成功');
                        resolve(true);
                    }
                    else {
                        console.log('代理连接测试失败，状态码:', res.statusCode);
                        reject(new Error(`代理连接测试失败，HTTP状态码: ${res.statusCode}`));
                    }
                });
                req.on('error', (error) => {
                    console.error('代理连接测试错误:', error.message);
                    if (error.message.includes('ECONNREFUSED')) {
                        reject(new Error('无法连接到代理服务器，请检查代理地址和端口'));
                    }
                    else if (error.message.includes('ENOTFOUND')) {
                        reject(new Error('代理服务器地址无法解析，请检查代理主机名'));
                    }
                    else if (error.message.includes('timeout')) {
                        reject(new Error('代理连接超时，请检查网络连接和代理设置'));
                    }
                    else if (error.message.includes('authentication')) {
                        reject(new Error('代理认证失败，请检查用户名和密码'));
                    }
                    else {
                        reject(new Error(`代理连接失败: ${error.message}`));
                    }
                });
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('代理连接超时'));
                });
                req.end();
            });
        }
        catch (error) {
            console.error('代理连接测试失败:', error);
            const errorMessage = error.message;
            throw new Error(`代理连接测试失败: ${errorMessage}`);
        }
    }
    /**
     * 使用 GitHub API 检测仓库连接
     */
    async testGitHubRepositoryConnection(owner, repo, token) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                port: 443,
                path: `/repos/${owner}/${repo}`,
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'Personal-OKR-Manager'
                }
            };
            // 添加代理支持
            if (this.config?.proxy?.enabled) {
                const proxyUrl = this.buildProxyUrl(this.config.proxy);
                options.agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
                console.log(`GitHub API 使用代理: ${proxyUrl}`);
            }
            console.log(`检测 GitHub 仓库连接: ${owner}/${repo}`);
            const req = https_1.default.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            console.log('GitHub 仓库连接测试成功');
                            resolve(true);
                        }
                        else if (res.statusCode === 404) {
                            reject(new Error('仓库不存在或无访问权限'));
                        }
                        else {
                            reject(new Error(`GitHub API 请求失败，状态码: ${res.statusCode}`));
                        }
                    }
                    catch (error) {
                        reject(new Error('解析 GitHub API 响应失败'));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`GitHub API 请求失败: ${error.message}`));
            });
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('GitHub API 请求超时'));
            });
            req.end();
        });
    }
    /**
     * 从 Git URL 中提取 owner 和 repo 信息
     */
    extractOwnerAndRepo(remoteUrl) {
        try {
            // 支持多种 GitHub URL 格式
            const patterns = [
                // HTTPS: https://github.com/owner/repo.git
                /https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/,
                // SSH: git@github.com:owner/repo.git
                /git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/,
                // 带认证信息的 HTTPS: https://token@github.com/owner/repo.git
                /https:\/\/[^@]+@github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/
            ];
            for (const pattern of patterns) {
                const match = remoteUrl.match(pattern);
                if (match) {
                    return {
                        owner: match[1],
                        repo: match[2]
                    };
                }
            }
            return null;
        }
        catch (error) {
            console.error('提取 owner 和 repo 失败:', error);
            return null;
        }
    }
    /**
     * 测试 Git 连接
     */
    async testConnection() {
        if (!this.git || !this.config) {
            throw new Error('Git 未初始化，请先保存 Git 配置');
        }
        if (!this.config.remoteUrl) {
            throw new Error('未配置远程仓库地址');
        }
        console.log('开始 Git 连接测试...');
        console.log('配置信息:', {
            remoteUrl: this.config.remoteUrl,
            authMethod: this.config.authMethod,
            hasToken: !!this.config.credentials.token,
            hasUsername: !!this.config.credentials.username,
            hasPassword: !!this.config.credentials.password
        });
        try {
            // 如果是 GitHub 仓库且有 token，优先使用 GitHub API 检测
            if (this.config.remoteUrl.includes('github.com') && this.config.credentials.token) {
                const repoInfo = this.extractOwnerAndRepo(this.config.remoteUrl);
                if (repoInfo) {
                    console.log('使用 GitHub API 检测仓库连接...');
                    return await this.testGitHubRepositoryConnection(repoInfo.owner, repoInfo.repo, this.config.credentials.token);
                }
            }
            // 回退到原有的 Git 命令检测方式
            console.log('使用 Git 命令检测仓库连接...');
            await this.setupAuthentication();
            // 检查当前远程配置
            const remotes = await this.git.getRemotes(true);
            console.log('当前远程配置:', remotes);
            // 尝试获取远程信息，设置超时时间
            console.log('正在测试远程连接...');
            // 创建一个带超时的 Promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('连接超时（60秒）'));
                }, 60000); // 60秒超时，与 Git 配置保持一致
            });
            const connectionPromise = this.git.fetch('origin', 'main', ['--dry-run']);
            const result = await Promise.race([connectionPromise, timeoutPromise]);
            console.log('远程连接测试成功:', result);
            return true;
        }
        catch (error) {
            console.error('Git 连接测试失败:', error);
            const errorMessage = error.message;
            console.error('详细错误信息:', errorMessage);
            // 检查是否是 Connection reset by peer 错误，如果是则尝试协议切换
            const isConnectionResetError = errorMessage.includes('Connection reset by peer') ||
                errorMessage.includes('Recv failure');
            if (isConnectionResetError) {
                console.log('检测到连接重置错误，尝试切换到不同的协议...');
                try {
                    await this.tryDifferentProtocols(async () => {
                        // 如果是 GitHub 仓库且有 token，使用 GitHub API 检测
                        if (this.config.remoteUrl.includes('github.com') && this.config.credentials.token) {
                            const repoInfo = this.extractOwnerAndRepo(this.config.remoteUrl);
                            if (repoInfo) {
                                await this.testGitHubRepositoryConnection(repoInfo.owner, repoInfo.repo, this.config.credentials.token);
                                return;
                            }
                        }
                        // 回退到 Git 命令方式
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => {
                                reject(new Error('连接超时（60秒）'));
                            }, 60000); // 60秒超时，与 Git 配置保持一致
                        });
                        const connectionPromise = this.git.fetch('origin', 'main', ['--dry-run']);
                        await Promise.race([connectionPromise, timeoutPromise]);
                    });
                    console.log('协议切换成功，连接测试通过');
                    return true;
                }
                catch (protocolError) {
                    console.log('协议切换失败:', protocolError.message);
                    // 继续执行原有的错误处理逻辑
                }
            }
            // 提供更具体的错误信息
            if (errorMessage.includes('Authentication failed') || errorMessage.includes('authentication failed')) {
                throw new Error('认证失败，请检查 Token 或用户名密码是否正确');
            }
            else if (errorMessage.includes('Repository not found') || errorMessage.includes('repository not found')) {
                throw new Error('仓库不存在，请检查仓库地址是否正确');
            }
            else if (errorMessage.includes('Network') || errorMessage.includes('Connection reset') ||
                errorMessage.includes('network') || errorMessage.includes('timeout') ||
                errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNRESET') ||
                errorMessage.includes('连接超时')) {
                throw new Error('网络连接失败，已尝试协议切换。可能的解决方案：\n1. 检查网络连接是否正常\n2. 尝试访问 GitHub/GitLab 网站确认服务可用\n3. 检查防火墙或代理设置\n4. 确保 SSH 密钥已正确配置（如果使用 SSH）\n5. 稍后重试或尝试使用其他网络环境');
            }
            else {
                throw new Error(`Git 连接测试失败: ${errorMessage}`);
            }
        }
    }
    /**
     * 启动自动同步
     */
    startAutoSync() {
        if (!this.config || this.syncTimer)
            return;
        const intervalMs = this.config.syncInterval * 60 * 1000;
        this.syncTimer = setInterval(() => {
            this.performAutoSync();
        }, intervalMs);
        console.log(`Git 自动同步已启动，间隔: ${this.config.syncInterval} 分钟`);
    }
    /**
     * 停止自动同步
     */
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('Git 自动同步已停止');
        }
    }
    /**
     * 执行自动同步
     */
    async performAutoSync() {
        try {
            await this.syncData();
            console.log('Git 自动同步完成');
        }
        catch (error) {
            console.error('Git 自动同步失败:', error);
        }
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = newConfig;
        if (newConfig.enabled && newConfig.autoSync) {
            this.startAutoSync();
        }
        else {
            this.stopAutoSync();
        }
    }
    /**
     * 获取配置
     */
    getConfig() {
        return this.config;
    }
    /**
     * 检查是否启用
     */
    isEnabled() {
        return this.config?.enabled ?? false;
    }
    /**
     * 设置代理环境变量
     */
    async setupProxyEnvironment() {
        if (!this.config?.proxy?.enabled) {
            return;
        }
        const proxyUrl = this.buildProxyUrl(this.config.proxy);
        // 设置环境变量
        process.env.http_proxy = proxyUrl;
        process.env.https_proxy = proxyUrl;
        process.env.HTTP_PROXY = proxyUrl;
        process.env.HTTPS_PROXY = proxyUrl;
        console.log(`已设置代理环境变量: ${proxyUrl}`);
    }
    /**
     * 构建代理 URL
     */
    buildProxyUrl(proxy) {
        const protocol = proxy.type.toLowerCase();
        const host = proxy.host;
        const port = proxy.port;
        let url = `${protocol}://`;
        // 添加认证信息（如果有）
        if (proxy.username && proxy.password) {
            url += `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`;
        }
        url += `${host}:${port}`;
        return url;
    }
}
exports.mainGitSyncService = new MainGitSyncService();
exports.default = exports.mainGitSyncService;
