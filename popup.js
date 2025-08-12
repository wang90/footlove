// 弹出窗口的主要逻辑
class PopupManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadInitialData();
    }

    initializeElements() {
        this.getCurrentTabBtn = document.getElementById('getCurrentTab');
        this.saveDataBtn = document.getElementById('saveData');
        this.loadDataBtn = document.getElementById('loadData');
        this.statusElement = document.getElementById('status');
    }

    bindEvents() {
        this.getCurrentTabBtn.addEventListener('click', () => this.getCurrentTab());
        this.saveDataBtn.addEventListener('click', () => this.saveData());
        this.loadDataBtn.addEventListener('click', () => this.loadData());
    }

    async loadInitialData() {
        try {
            const data = await chrome.storage.local.get(['lastSaved']);
            if (data.lastSaved) {
                this.updateStatus(`上次保存时间: ${new Date(data.lastSaved).toLocaleString()}`);
            }
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                this.updateStatus(`当前标签页: ${tab.title}\nURL: ${tab.url}`);
                
                // 向内容脚本发送消息
                chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, (response) => {
                    if (response && response.success) {
                        this.updateStatus(`页面标题: ${response.title}\n页面URL: ${response.url}`);
                    }
                });
            }
        } catch (error) {
            this.updateStatus('获取当前标签页失败: ' + error.message);
        }
    }

    async saveData() {
        try {
            const data = {
                timestamp: Date.now(),
                message: '这是保存的测试数据',
                version: '1.0.0'
            };

            await chrome.storage.local.set({
                savedData: data,
                lastSaved: Date.now()
            });

            this.updateStatus('数据保存成功!');
        } catch (error) {
            this.updateStatus('保存数据失败: ' + error.message);
        }
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get(['savedData', 'lastSaved']);
            
            if (result.savedData) {
                const data = result.savedData;
                this.updateStatus(`加载的数据:\n时间戳: ${new Date(data.timestamp).toLocaleString()}\n消息: ${data.message}\n版本: ${data.version}`);
            } else {
                this.updateStatus('没有找到保存的数据');
            }
        } catch (error) {
            this.updateStatus('加载数据失败: ' + error.message);
        }
    }

    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.innerHTML = `<p>${message}</p>`;
        }
    }
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateStatus') {
        // 这里可以更新弹出窗口的状态
        console.log('收到来自内容脚本的消息:', request.data);
    }
});

// 初始化弹出窗口管理器
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
}); 