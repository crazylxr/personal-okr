"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWebDAVService = void 0;
const webdav_1 = require("webdav");
const databaseService_1 = require("./databaseService");
class MainWebDAVService {
    constructor() {
        this.client = null;
        this.SYNC_FILE_PATH = '/okr-manager-data.json';
    }
    async initializeClient(config) {
        try {
            this.client = (0, webdav_1.createClient)(config.url, {
                username: config.username,
                password: config.password,
            });
        }
        catch (error) {
            console.error('初始化WebDAV客户端失败:', error);
            throw new Error('WebDAV客户端初始化失败');
        }
    }
    async testConnection() {
        if (!this.client) {
            throw new Error('WebDAV客户端未初始化');
        }
        try {
            await this.client.getDirectoryContents('/');
            return true;
        }
        catch (error) {
            console.error('WebDAV连接测试失败:', error);
            throw new Error('WebDAV连接测试失败');
        }
    }
    async uploadData(data) {
        if (!this.client) {
            throw new Error('WebDAV客户端未初始化');
        }
        try {
            const jsonData = JSON.stringify({
                ...data,
                lastSync: new Date().toISOString(),
                version: '1.0.0'
            }, null, 2);
            await this.client.putFileContents(this.SYNC_FILE_PATH, jsonData, {
                overwrite: true
            });
            console.log('数据上传到WebDAV成功');
        }
        catch (error) {
            console.error('上传数据到WebDAV失败:', error);
            throw new Error('数据上传失败');
        }
    }
    async downloadData() {
        if (!this.client) {
            throw new Error('WebDAV客户端未初始化');
        }
        try {
            const exists = await this.client.exists(this.SYNC_FILE_PATH);
            if (!exists) {
                console.log('WebDAV服务器上没有找到同步文件');
                return null;
            }
            const fileContent = await this.client.getFileContents(this.SYNC_FILE_PATH, {
                format: 'text'
            });
            const data = JSON.parse(fileContent);
            console.log('从WebDAV下载数据成功');
            return data;
        }
        catch (error) {
            console.error('从WebDAV下载数据失败:', error);
            throw new Error('数据下载失败');
        }
    }
    async syncData() {
        if (!this.client) {
            throw new Error('WebDAV客户端未初始化');
        }
        try {
            // 获取本地数据
            const [todos, okrs, tasks, notes] = await Promise.all([
                databaseService_1.databaseService.getTodos(),
                databaseService_1.databaseService.getOKRs(),
                databaseService_1.databaseService.getTasks(),
                databaseService_1.databaseService.getNotes()
            ]);
            const localData = {
                todos,
                okrs,
                tasks,
                notes,
                lastSync: new Date().toISOString(),
                version: '1.0.0'
            };
            const remoteData = await this.downloadData();
            if (!remoteData) {
                // 如果远程没有数据，直接上传本地数据
                await this.uploadData(localData);
                return localData;
            }
            // 简单的冲突解决策略：使用最新的数据
            const localTime = new Date(localData.lastSync).getTime();
            const remoteTime = new Date(remoteData.lastSync).getTime();
            if (localTime > remoteTime) {
                // 本地数据更新，上传到远程
                await this.uploadData(localData);
                return localData;
            }
            else if (remoteTime > localTime) {
                // 远程数据更新，同步到本地
                await this.syncRemoteToLocal(remoteData);
                return remoteData;
            }
            else {
                // 时间相同，使用本地数据
                await this.uploadData(localData);
                return localData;
            }
        }
        catch (error) {
            console.error('数据同步失败:', error);
            throw new Error('数据同步失败');
        }
    }
    async syncRemoteToLocal(remoteData) {
        try {
            // 这里应该实现更复杂的同步逻辑
            // 暂时简化为直接替换本地数据
            console.log('同步远程数据到本地（功能待完善）');
            // 实际实现时，这里应该：
            // 1. 比较本地和远程数据的差异
            // 2. 合并或替换数据
            // 3. 处理冲突
            // 4. 更新本地数据库
        }
        catch (error) {
            console.error('同步远程数据到本地失败:', error);
            throw error;
        }
    }
}
exports.mainWebDAVService = new MainWebDAVService();
exports.default = exports.mainWebDAVService;
