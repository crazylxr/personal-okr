#!/bin/bash

# 快速构建脚本（不发布到 GitHub）
echo "🔨 开始构建 Personal OKR Manager..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改，可能会影响构建结果"
    read -p "继续构建? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# 询问构建平台
echo "📋 选择构建平台:"
echo "1) 全部平台 (all)"
echo "2) 仅 macOS (mac)"
echo "3) 仅 Windows (win)"
echo "4) 仅 Linux (linux)"

read -p "请选择 (1-4): " PLATFORM_CHOICE

case $PLATFORM_CHOICE in
    1) 
        echo "🔨 构建所有平台..."
        npm run build
        npm run dist
        ;;
    2) 
        echo "🔨 构建 macOS..."
        npm run build
        npm run dist:mac
        ;;
    3) 
        echo "🔨 构建 Windows..."
        npm run build
        npm run dist:win
        ;;
    4) 
        echo "🔨 构建 Linux..."
        npm run build
        npm run dist:linux
        ;;
    *) echo "❌ 无效选择"; exit 1;;
esac

echo "✅ 构建完成！"
echo "📦 输出目录: release/"

# 显示构建结果
if [ -d "release" ]; then
    echo "📋 构建产物:"
    ls -la release/
else
    echo "❌ 构建失败，请检查错误信息"
fi