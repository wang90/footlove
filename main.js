const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const https = require("https");
const http = require("http");

function requestJson(url, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https:") ? https : http;
        const req = client.get(
            url,
            {
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Referer": "https://www.dongqiudi.com/data/231",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Electron Safari/537.36"
                }
            },
            (res) => {
                const status = res.statusCode || 0;
                const location = res.headers.location;

                if ([301, 302, 303, 307, 308].includes(status) && location) {
                    if (redirectCount >= 5) {
                        reject(new Error("重定向次数过多"));
                        return;
                    }
                    const nextUrl = new URL(location, url).toString();
                    resolve(requestJson(nextUrl, redirectCount + 1));
                    return;
                }

                if (status < 200 || status >= 300) {
                    reject(new Error(`请求失败(${status})`));
                    return;
                }

                let raw = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => {
                    raw += chunk;
                });
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(raw));
                    } catch (error) {
                        reject(new Error("返回数据不是合法 JSON"));
                    }
                });
            }
        );

        req.on("error", (error) => {
            reject(error);
        });
    });
}

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 980,
        height: 760,
        minWidth: 760,
        minHeight: 640,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const startUrl = process.env.ELECTRON_START_URL;
    if (startUrl) {
        mainWindow.loadURL(startUrl);
        return;
    }

    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
}

ipcMain.handle("http:get-json", async (_event, url) => {
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) {
        throw new Error("无效的 URL");
    }
    return requestJson(url);
});

app.whenReady().then(() => {
    createMainWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
