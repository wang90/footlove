// 内容脚本 - 在网页中运行
class ContentScript {
    constructor() {
        this.initialize();
        this.setupMessageListener();
        this.injectCustomStyles();
    }

    initialize() {
        console.log('Chrome扩展内容脚本已加载');
        
        // 添加扩展标识
        this.addExtensionBadge();
        
        // 初始化页面观察器
        this.setupPageObserver();
    }

    setupMessageListener() {
        // 监听来自弹出窗口和后台脚本的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 保持消息通道开放
        });
    }

    handleMessage(request, sender, sendResponse) {
        console.log('内容脚本收到消息:', request);

        switch (request.action) {
            case 'getPageInfo':
                this.getPageInfo().then(sendResponse);
                break;
                
            case 'modifyPage':
                this.modifyPage(request.data).then(sendResponse);
                break;
                
            case 'extractData':
                this.extractData().then(sendResponse);
                break;
                
            default:
                sendResponse({ success: false, error: '未知操作' });
        }
    }

    async getPageInfo() {
        try {
            const pageInfo = {
                title: document.title,
                url: window.location.href,
                domain: window.location.hostname,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };

            return {
                success: true,
                data: pageInfo
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async modifyPage(data) {
        try {
            // 这里可以修改页面内容
            console.log('修改页面:', data);
            
            // 示例：添加一个高亮效果
            if (data.highlight) {
                this.highlightElements(data.highlight);
            }

            return {
                success: true,
                message: '页面修改成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async extractData() {
        try {
            const data = {
                title: document.title,
                description: this.getMetaDescription(),
                keywords: this.getMetaKeywords(),
                links: this.extractLinks(),
                images: this.extractImages(),
                text: this.extractText()
            };

            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    getMetaDescription() {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute('content') : '';
    }

    getMetaKeywords() {
        const meta = document.querySelector('meta[name="keywords"]');
        return meta ? meta.getAttribute('content') : '';
    }

    extractLinks() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links.map(link => ({
            text: link.textContent.trim(),
            href: link.href,
            title: link.title
        })).slice(0, 10); // 限制数量
    }

    extractImages() {
        const images = Array.from(document.querySelectorAll('img[src]'));
        return images.map(img => ({
            src: img.src,
            alt: img.alt,
            title: img.title,
            width: img.width,
            height: img.height
        })).slice(0, 10); // 限制数量
    }

    extractText() {
        // 提取页面主要文本内容
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
        return Array.from(textElements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0)
            .slice(0, 20)
            .join('\n');
    }

    addExtensionBadge() {
        // 添加一个小的扩展标识到页面
        const badge = document.createElement('div');
        badge.id = 'chrome-extension-badge';
        badge.innerHTML = '🔧';
        badge.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            z-index: 999999;
            opacity: 0.8;
            transition: opacity 0.3s;
        `;
        
        badge.addEventListener('mouseenter', () => {
            badge.style.opacity = '1';
        });
        
        badge.addEventListener('mouseleave', () => {
            badge.style.opacity = '0.8';
        });
        
        badge.addEventListener('click', () => {
            this.showExtensionInfo();
        });
        
        document.body.appendChild(badge);
    }

    showExtensionInfo() {
        const info = document.createElement('div');
        info.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 999998;
            max-width: 300px;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        info.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #333;">Chrome Extension</h3>
            <p style="margin: 0; color: #666;">页面: ${document.title}</p>
            <p style="margin: 5px 0 0 0; color: #666;">URL: ${window.location.href}</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
        `;
        
        document.body.appendChild(info);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (info.parentElement) {
                info.remove();
            }
        }, 3000);
    }

    setupPageObserver() {
        // 观察页面变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 页面DOM发生变化时的处理
                    console.log('页面DOM已更新');
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    injectCustomStyles() {
        // 注入自定义样式
        const style = document.createElement('style');
        style.textContent = `
            .chrome-extension-highlight {
                background-color: yellow !important;
                transition: background-color 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    highlightElements(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.classList.add('chrome-extension-highlight');
            setTimeout(() => {
                el.classList.remove('chrome-extension-highlight');
            }, 2000);
        });
    }
}

// 初始化内容脚本
new ContentScript(); 