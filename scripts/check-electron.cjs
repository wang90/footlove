const fs = require("fs");
const path = require("path");

let electronPkgDir = "";
try {
  const pkgPath = require.resolve("electron/package.json", {
    paths: [path.join(__dirname, "..")]
  });
  electronPkgDir = path.dirname(pkgPath);
} catch (_error) {
  console.error("未找到 electron 依赖，请先安装依赖：pnpm install 或 npm install");
  process.exit(1);
}

const pathFile = path.join(electronPkgDir, "path.txt");

if (fs.existsSync(pathFile)) {
  process.exit(0);
}

console.error("");
console.error("Electron 二进制未安装完成，无法启动桌面窗口。");
console.error("请先执行以下任一方案：");
console.error("1) pnpm 用户：pnpm approve-builds（勾选 electron）后再运行 pnpm install");
console.error("2) npm 用户：删除 node_modules 后执行 npm install");
console.error("");
console.error("临时继续前端开发可使用：npm run dev");
console.error("完整桌面联调请使用：npm run dev:all");
process.exit(1);
