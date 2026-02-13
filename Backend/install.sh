#!/bin/bash

# 安装脚本 - 解决 better-sqlite3 编译问题

echo "🔍 检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -ge 25 ]; then
    echo "⚠️  检测到 Node.js v25+，可能存在编译问题"
    echo ""
    echo "推荐解决方案："
    echo "1. 使用 nvm 安装 LTS 版本："
    echo "   nvm install --lts"
    echo "   nvm use --lts"
    echo ""
    echo "2. 或者继续使用当前版本（将尝试配置 C++20）"
    echo ""
    read -p "是否继续安装？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 安装依赖..."
export CXXFLAGS="-std=c++20"
export CPPFLAGS="-std=c++20"

npm install

if [ $? -eq 0 ]; then
    echo "✅ 安装成功！"
else
    echo "❌ 安装失败，请尝试："
    echo "1. 使用 Node.js LTS 版本（推荐）"
    echo "2. 查看 TROUBLESHOOTING.md 获取更多帮助"
fi
