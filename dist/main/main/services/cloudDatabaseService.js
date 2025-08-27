"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudDatabaseService = void 0;
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const electron_1 = require("electron");
class CloudDatabaseService {
    constructor() {
        this.sftp = null;
        this.config = null;
        // 本地临时数据库路径
        const isDev = process.env.NODE_ENV === 'development';
        this.localTempPath = isDev
            ? path_1.default.join(process.cwd(), 'cloud_data.db')
            : path_1.default.join(electron_1.app.getPath('userData'), 'cloud_data.db');
    }
    /**
     * 初始化 SFTP 连接
     */
    async init(config) {
        try {
            this.config = config;
            this.sftp = new ssh2_sftp_client_1.default();
            await this.sftp.connect({
                host: config.host,
                port: config.port,
                username: config.username,
                password: config.password,
                privateKey: config.privateKey ? await promises_1.default.readFile(config.privateKey) : undefined
            });
            console.log('SFTP 连接成功');
        }
        catch (error) {
            console.error('SFTP 连接失败:', error);
            throw error;
        }
    }
    /**
     * 下载云端数据库到本地
     */
    async downloadDatabase() {
        if (!this.sftp || !this.config) {
            throw new Error('SFTP 未初始化');
        }
        try {
            // 检查远程文件是否存在
            const remoteExists = await this.sftp.exists(this.config.remotePath);
            if (remoteExists) {
                // 下载远程数据库
                await this.sftp.get(this.config.remotePath, this.localTempPath);
                console.log('云端数据库下载成功:', this.localTempPath);
                return true;
            }
            else {
                console.log('云端数据库不存在，将创建新的');
                return false;
            }
        }
        catch (error) {
            console.error('下载云端数据库失败:', error);
            throw error;
        }
    }
    /**
     * 上传本地数据库到云端
     */
    async uploadDatabase() {
        if (!this.sftp || !this.config) {
            throw new Error('SFTP 未初始化');
        }
        try {
            // 确保远程目录存在
            const remoteDir = path_1.default.dirname(this.config.remotePath);
            try {
                await this.sftp.mkdir(remoteDir, true);
            }
            catch (error) {
                // 目录可能已存在
            }
            // 上传数据库文件
            await this.sftp.put(this.localTempPath, this.config.remotePath);
            console.log('数据库上传成功:', this.config.remotePath);
        }
        catch (error) {
            console.error('上传数据库失败:', error);
            throw error;
        }
    }
    /**
     * 获取本地临时数据库路径
     */
    getLocalPath() {
        return this.localTempPath;
    }
    /**
     * 关闭 SFTP 连接
     */
    async close() {
        if (this.sftp) {
            await this.sftp.end();
            this.sftp = null;
        }
    }
    /**
     * 测试连接
     */
    async testConnection() {
        try {
            if (!this.sftp || !this.config) {
                return false;
            }
            // 尝试列出远程目录
            const remoteDir = path_1.default.dirname(this.config.remotePath);
            await this.sftp.list(remoteDir);
            return true;
        }
        catch (error) {
            console.error('SFTP 连接测试失败:', error);
            return false;
        }
    }
}
exports.cloudDatabaseService = new CloudDatabaseService();
exports.default = exports.cloudDatabaseService;
