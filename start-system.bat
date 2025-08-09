@echo off
echo ================================
echo    客服管理系统启动脚本
echo ================================
echo.

echo [1/3] 启动后端服务器...
cd /d "d:\PROJECT\vue-manage-system-master\backend\server"
start "后端服务器" cmd /k "npm run dev"
echo 后端服务器启动中... (http://localhost:3000)
echo.

timeout /t 3 /nobreak >nul

echo [2/3] 启动前端服务器...
cd /d "d:\PROJECT\vue-manage-system-master\frontend"
start "前端服务器" cmd /k "pnpm run dev"
echo 前端服务器启动中... (http://localhost:3006)
echo.

timeout /t 5 /nobreak >nul

echo [3/3] 打开浏览器...
start http://localhost:3006
echo.

echo ================================
echo    系统启动完成！
echo ================================
echo.
echo 🌐 前端地址: http://localhost:3006
echo 🔧 后端地址: http://localhost:3000
echo 👤 客服登录: http://localhost:3006/customer-service/login
echo.
echo 测试账号:
echo   用户名: cs_test
echo   密码: 123456
echo.
echo 按任意键退出...
pause >nul