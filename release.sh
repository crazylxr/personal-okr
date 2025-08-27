#!/bin/bash

# 发布脚本
echo "🚀 开始发布 Personal OKR Manager..."

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
git tag v$NEW_VERSION
echo "✅ 标签已创建: v$NEW_VERSION"

# 推送到 GitHub
git push origin main
git push origin v$NEW_VERSION
echo "✅ 代码已推送到 GitHub"

echo "🎉 发布完成！GitHub Actions 将自动构建和发布应用"
echo "📋 查看: https://github.com/crazylxr/personal-okr/releases"