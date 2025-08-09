@echo off
chcp 65001 >nul
title 增强版数据库一键导入工具

echo.
echo ========================================
echo    增强版数据库一键导入工具
echo ========================================
echo.
echo 🎯 本工具将导入包含完整真实数据的增强版数据库
echo.
echo 📊 数据内容包括：
echo    ✨ 6个客服账户（不同等级和权限）
echo    ✨ 10个陪玩账户（覆盖6款热门游戏）
echo    ✨ 10个用户账户（完整个人信息）
echo    ✨ 15个订单（不同状态和类型）
echo    ✨ 完整的礼物、收藏、评论数据
echo    ✨ 真实的打卡和提现记录
echo    ✨ 详细的统计和收益数据
echo.

REM 检查必要文件
echo 🔍 正在检查必要文件...

if not exist "node_modules" (
    echo ❌ 错误：未找到 node_modules 目录
    echo 💡 请先运行 npm install 安装依赖
    pause
    exit /b 1
)

if not exist ".env" (
    echo ❌ 错误：未找到 .env 配置文件
    echo 💡 请确保 .env 文件存在并配置了数据库连接信息
    pause
    exit /b 1
)

if not exist "database_enhanced_with_real_data.sql" (
    echo ❌ 错误：未找到 database_enhanced_with_real_data.sql 文件
    echo 💡 请确保增强版数据库文件存在
    pause
    exit /b 1
)

if not exist "import-enhanced-database.js" (
    echo ❌ 错误：未找到 import-enhanced-database.js 脚本
    echo 💡 请确保导入脚本文件存在
    pause
    exit /b 1
)

echo ✅ 所有必要文件检查完成
echo.

REM 确认操作
echo ⚠️  警告：此操作将会：
echo    1. 向数据库中插入大量测试数据
echo    2. 包含客服、陪玩、用户、订单等完整信息
echo    3. 适合开发测试和演示环境使用
echo.
set /p confirm="确定要继续吗？(y/N): "

if /i not "%confirm%"=="y" (
    echo 🚫 操作已取消
    pause
    exit /b 0
)

echo.
echo 🚀 开始导入增强版数据库...
echo ========================================

REM 执行导入脚本
node import-enhanced-database.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 🎉 增强版数据库导入成功！
    echo ========================================
    echo.
    echo 🔑 默认账户信息：
    echo.
    echo 👑 管理员账户：
    echo    用户名: admin
    echo    密码: admin123
    echo    权限: 超级管理员
    echo.
    echo 👨‍💼 客服账户示例：
    echo    用户名: cs_manager_001
    echo    密码: cs123456
    echo    权限: 高级客服
    echo.
    echo 🎮 陪玩账户示例：
    echo    用户名: 甜心小雨
    echo    密码: player123
    echo    游戏: 王者荣耀
    echo.
    echo 👤 用户账户示例：
    echo    用户名: 张三
    echo    密码: user123
    echo    类型: 普通用户
    echo.
    echo 💡 提示：
    echo    - 现在可以启动系统进行测试
    echo    - 数据库包含完整的业务数据
    echo    - 适合功能演示和开发测试
    echo.
    echo 🚀 启动系统：
    echo    后端: npm run dev
    echo    前端: npm run serve
    echo.
) else (
    echo.
    echo ❌ 增强版数据库导入失败！
    echo 💡 请检查错误信息并重试
    echo.
)

pause