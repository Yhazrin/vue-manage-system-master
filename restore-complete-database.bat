@echo off
chcp 65001 >nul
title 导入完整示例数据库

echo.
echo ========================================
echo           导入完整示例数据库
echo ========================================
echo.

echo 🔍 检查环境...

REM 检查 node_modules
if not exist "node_modules" (
    echo ❌ 未找到 node_modules 目录
    echo 💡 请先运行: npm install
    pause
    exit /b 1
)

REM 检查 .env 文件
if not exist "backend\server\.env" (
    echo ❌ 未找到环境配置文件
    echo 💡 请先配置 backend\server\.env 文件
    pause
    exit /b 1
)

REM 检查 SQL 文件
if not exist "backend\sql\database_complete.sql" (
    echo ❌ 未找到完整数据库文件
    echo 💡 请确保 backend\sql\database_complete.sql 文件存在
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

echo ⚠️  警告: 此操作将完全重置数据库并导入示例数据！
echo.
echo 📋 将导入以下示例数据:
echo    - 2个管理员账户 (admin, manager)
echo    - 2个客服账户 (cs001, cs002) 
echo    - 2个玩家账户 (player001, player002)
echo    - 4个游戏 (王者荣耀、和平精英、原神、英雄联盟)
echo    - 4个礼品 (游戏币、皮肤礼包等)
echo    - 完整的系统配置和优化
echo.

set /p confirm="确定要继续吗？(y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 🚀 开始导入完整示例数据库...
echo.

REM 切换到项目根目录
cd /d "%~dp0"

REM 执行导入脚本
node import-complete-database.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ 完整示例数据库导入成功！
    echo.
    echo 📋 默认账户信息:
    echo 管理员: admin/password, manager/password
    echo 客服: cs001/password123, cs002/password123  
    echo 玩家: player001/password, player002/password
    echo.
    echo 🌐 现在可以启动系统进行测试了！
) else (
    echo.
    echo ❌ 导入失败，请检查错误信息
)

echo.
pause