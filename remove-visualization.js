const fs = require("fs");
const path = require("path");

// 读取文件
const filePath = path.join(__dirname, "server", "index.ts");
let content = fs.readFileSync(filePath, "utf8");

console.log("开始删除可视化相关代码...");

// 删除所有可视化相关的路由
const patterns = [
  // 删除从 "// 可视化数据API" 开始到下一个路由之前的所有代码
  /\/\/ 可视化数据API[\s\S]*?app\.get\(/g,

  // 删除所有包含 visualization 的路由
  /app\.get\(\s*"\/api\/visualization\/[^"]*"[\s\S]*?\);/g,
  /app\.post\(\s*"\/api\/visualization\/[^"]*"[\s\S]*?\);/g,
  /app\.put\(\s*"\/api\/visualization\/[^"]*"[\s\S]*?\);/g,
  /app\.delete\(\s*"\/api\/visualization\/[^"]*"[\s\S]*?\);/g,
];

let removedCount = 0;
patterns.forEach((pattern, index) => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`模式 ${index + 1} 找到 ${matches.length} 个匹配`);
    content = content.replace(pattern, "");
    removedCount += matches.length;
  }
});

// 清理多余的空行
content = content.replace(/\n\s*\n\s*\n/g, "\n\n");

// 写回文件
fs.writeFileSync(filePath, content, "utf8");

console.log(`删除完成！共删除了 ${removedCount} 个可视化相关代码块`);
console.log("文件已保存");
