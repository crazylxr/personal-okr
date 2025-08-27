#!/bin/bash

# Windows 发布脚本
echo "🪟 开始发布 Windows 版本..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 有未提交的更改，请先提交代码"
    exit 1
fi

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 当前版本: $CURRENT_VERSION"

# 询问新版本号
read -p "请输入新版本号 (当前: $CURRENT_VERSION): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    echo "❌ 版本号不能为空"
    exit 1
fi

# 更新 package.json 版本号
npm version $NEW_VERSION --no-git-tag-version
echo "✅ 版本号已更新为: $NEW_VERSION"

# 提交版本更新
git add package.json
git commit -m "chore: 版本更新至 $NEW_VERSION"

# 创建标签
git tag v$NEW_VERSION-win
echo "✅ 标签已创建: v$NEW_VERSION-win"

# 推送到 GitHub
git push origin main
git push origin v$NEW_VERSION-win
echo "✅ 代码已推送到 GitHub"

echo "🎉 Windows 版本发布完成！"
echo "📋 查看: https://github.com/crazylxr/personal-okr/releases"
echo "🔧 或者手动触发 Windows 构建:"
echo "   1. 访问: https://github.com/crazylxr/personal-okr/actions"
echo "   2. 选择 'Build and Release' 工作流"
echo "   3. 点击 'Run workflow' 并选择平台: win"