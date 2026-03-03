# 中超赛程助手（React + Electron）

这是一个 mac 桌面应用，前端使用 React（Vite），当前实现了：

- 读取懂球帝公开中超数据（`/data/231` 对应的数据接口）
- 选择你喜欢的中超球队
- 显示该球队距离今天最近的一场比赛（时间、对阵、轮次、主客场）

## 开发运行

```bash
cd /Users/wang90/Works/footlove
npm install
npm run dev
```

`npm run dev` 只启动 React（更稳定，便于先做页面开发）。

如果要同时启动桌面窗口：

```bash
npm run dev:all
```

`dev:all` 下已经启用 Electron 自动重启，修改桌面端代码后会自动重新打开窗口。

## pnpm 用户注意（Electron 安装）

如果你使用 `pnpm`，第一次安装可能会看到 `Ignored build scripts: electron`，导致桌面端报错 `Electron failed to install correctly`。  
需要手动放行构建脚本：

```bash
pnpm approve-builds
pnpm install
```

然后再运行 `npm run dev:all` 或 `pnpm run dev:all`。

启动 `dev:all` 会同时运行：

- React 开发服务器（Vite）
- Electron 桌面窗口（自动重启）

## 打包前构建前端

```bash
npm run build:web
```

`npm start` 会读取 `dist/index.html` 启动 Electron。
