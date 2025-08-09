@echo off
chcp 65001 >nul
echo =============================================
echo 🧹 恢复干净数据库（只包含管理员账户）
echo =============================================
echo.

cd /d "%~dp0backend\server"

echo 🔍 检查环境...
if not exist "node_modules" (
    echo ❌ 未找到 node_modules，请先运行 npm install
    pause
    exit /b 1
)

if not exist ".env" (
    echo ❌ 未找到 .env 文件，请确保数据库配置正确
    pause
    exit /b 1
)

if not exist "../sql/clean_database_with_admins.sql" (
    echo ❌ 未找到干净数据库SQL文件
    echo 💡 请先运行导出脚本生成该文件
    pause
    exit /b 1
)

echo.
echo ⚠️  警告：此操作将清空当前数据库并恢复到只包含管理员的状态
echo 📋 将保留的管理员账户：
echo    - 超级管理员1 (13800000001)
echo    - 超级管理员2 (13800000002) 
echo    - 超级管理员3 (13800000003)
echo    - 超级管理员4 (13800000004)
echo.
set /p confirm="确定要继续吗？(y/N): "
if /i not "%confirm%"=="y" (
    echo 🚫 操作已取消
    pause
    exit /b 0
)

echo.
echo 🚀 开始恢复数据库...
node import-clean-database.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ 数据库恢复成功！
    echo 🎯 现在可以重新开始使用系统了
) else (
    echo.
    echo ❌ 数据库恢复失败，请检查错误信息
)

echo.
pause