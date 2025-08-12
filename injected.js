// 可注入脚本 - 通过web_accessible_resources访问
(function() {
    'use strict';
    
    // 防止重复注入
    if (window.chromeExtensionInjected) {
        return;
    }
    window.chromeExtensionInjected = true;
    
    class InjectedScript {
        constructor() {
            this.initialize();
        }
        
        initialize() {
            console.log('Chrome扩展注入脚本已加载');
            this.setupGlobalFunctions();
        }
        
        setupGlobalFunctions() {
            // 在全局作用域中提供一些有用的函数
            window.chromeExtensionUtils = {
                // 获取页面信息
                getPageInfo: () => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        domain: window.location.hostname,
                        timestamp: Date.now()
                    };
                },
                
                // 高亮元素
                highlight: (selector) => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        el.style.backgroundColor = 'yellow';
                        el.style.transition = 'background-color 0.3s ease';
                        setTimeout(() => {
                            el.style.backgroundColor = '';
                        }, 2000);
                    });
                    return elements.length;
                },
                
                // 提取文本
                extractText: (selector = 'body') => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                },
                
                // 添加样式
                addStyle: (css) => {
                    const style = document.createElement('style');
                    style.textContent = css;
                    document.head.appendChild(style);
                },
                
                // 监听DOM变化
                observeDOM: (callback) => {
                    const observer = new MutationObserver(callback);
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    return observer;
                }
            };
        }
    }
    
    // 初始化注入脚本
    new InjectedScript();
})(); 