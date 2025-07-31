@echo off
echo 测试礼物API功能...

echo.
echo 1. 登录管理员账户...
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" ^
  -o login_response.json

echo.
echo 2. 获取礼物列表...
for /f "tokens=2 delims=:" %%a in ('findstr "token" login_response.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN:}=%
set TOKEN=%TOKEN: =%

curl -X GET http://localhost:3000/api/gifts ^
  -H "Authorization: Bearer %TOKEN%"

echo.
echo 3. 创建新礼物...
curl -X POST http://localhost:3000/api/gifts ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"name\":\"测试礼物\",\"price\":99.99,\"imageUrl\":\"https://example.com/test.jpg\"}"

echo.
echo 测试完成！