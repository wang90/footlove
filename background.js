// 后台服务工作者脚本
class BackgroundService {
    constructor() {
        this.initializeEventListeners();
        this.setupAlarms();
    }

    initializeEventListeners() {
        // 扩展安装时的处理
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('扩展已安装:', details);
            
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onUpdate(details.previousVersion);
            }
        });

        // 处理来自弹出窗口和内容脚本的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 保持消息通道开放
        });

        // 标签页更新时的处理
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.onTabUpdated(tabId, tab);
            }
        });

        // 标签页激活时的处理
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.onTabActivated(activeInfo);
        });
    }

    setupAlarms() {
        // 设置定期任务（可选）
        chrome.alarms.create('periodicTask', { delayInMinutes: 1, periodInMinutes: 60 });
        
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'periodicTask') {
                this.performPeriodicTask();
            }
        });
    }

    onFirstInstall() {
        console.log('首次安装扩展');
        
        // 初始化存储
        chrome.storage.local.set({
            installDate: Date.now(),
            version: '1.0.0',
            settings: {
                enabled: true,
                notifications: true
            }
        });

        // 显示欢迎通知
        this.showNotification('Chrome Extension Scaffold', '扩展已成功安装！');
    }

    onUpdate(previousVersion) {
        console.log('扩展已更新:', previousVersion, '->', '1.0.0');
        
        // 更新存储中的版本信息
        chrome.storage.local.set({
            lastUpdate: Date.now(),
            version: '1.0.0'
        });
    }

    handleMessage(request, sender, sendResponse) {
        console.log('收到消息:', request, '来自:', sender);

        switch (request.action) {
            case 'getExtensionInfo':
                this.getExtensionInfo().then(sendResponse);
                break;
                
            case 'performAction':
                this.performAction(request.data).then(sendResponse);
                break;
                
            case 'updateSettings':
                this.updateSettings(request.settings).then(sendResponse);
                break;
                
            default:
                sendResponse({ success: false, error: '未知操作' });
        }
    }

    async getExtensionInfo() {
        const manifest = chrome.runtime.getManifest();
        const storage = await chrome.storage.local.get(['installDate', 'version', 'settings']);
        
        return {
            success: true,
            data: {
                name: manifest.name,
                version: manifest.version,
                installDate: storage.installDate,
                settings: storage.settings
            }
        };
    }

    async performAction(data) {
        try {
            // 这里可以执行各种后台操作
            console.log('执行操作:', data);
            
            return {
                success: true,
                message: '操作执行成功',
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateSettings(settings) {
        try {
            await chrome.storage.local.set({ settings });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    onTabUpdated(tabId, tab) {
        console.log('标签页已更新:', tabId, tab.url);
        
        // 可以在这里处理特定网站的逻辑
        if (tab.url.includes('google.com')) {
            console.log('检测到Google网站');
        }
    }

    onTabActivated(activeInfo) {
        console.log('标签页已激活:', activeInfo.tabId);
    }

    performPeriodicTask() {
        console.log('执行定期任务');
        
        // 这里可以执行定期维护任务
        // 比如清理旧数据、检查更新等
    }

    showNotification(title, message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message
        });
    }
}

// 初始化后台服务
new BackgroundService(); 