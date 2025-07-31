#!/bin/bash

echo "=== 专利管理系统 MySQL 数据库设置脚本 ==="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 已安装: $(npm --version)"

# 检查MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL 未安装，请先安装 MySQL 8.0+"
    echo "macOS: brew install mysql"
    echo "Ubuntu: sudo apt install mysql-server"
    exit 1
fi

echo "✅ MySQL 已安装"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

# 检查.env文件
if [ ! -f .env ]; then
    echo ""
    echo "📝 创建环境配置文件..."
    cat > .env << EOF
# 数据库配置
DATABASE_URL="mysql://root:password@localhost:3306/patent_ms"

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
EOF
    echo "✅ 已创建 .env 文件，请根据您的MySQL配置修改 DATABASE_URL"
else
    echo "✅ .env 文件已存在"
fi

# 生成Prisma客户端
echo ""
echo "🔧 生成 Prisma 客户端..."
npm run db:generate

# 推送数据库schema
echo ""
echo "🗄️  创建数据库表..."
npm run db:push

# 初始化数据
echo ""
echo "📊 初始化数据库数据..."
node scripts/init-db.js

echo ""
echo "🎉 设置完成！"
echo ""
echo "📋 下一步："
echo "1. 修改 .env 文件中的 DATABASE_URL 为您的MySQL连接信息"
echo "2. 启动后端服务器: npm run dev:server"
echo "3. 启动前端应用: npm run dev"
echo ""
echo "🔑 默认用户账号："
echo "- 管理员: admin / password"
echo "- 普通用户: user / password"
echo "- 审核员: reviewer / password"
echo ""
echo "📖 详细文档请查看 README-MYSQL.md" 