@echo off
echo Testing API endpoints...
echo.

echo 1. Testing /api/ping:
curl -v http://localhost:3000/api/ping
echo.
echo.

echo 2. Testing /api/simple:
curl -v http://localhost:3000/api/simple
echo.
echo.

echo 3. Testing /api/health:
curl -v http://localhost:3000/api/health
echo.
echo.

echo 4. Testing /api/test:
curl -v http://localhost:3000/api/test
echo.
echo.

echo 5. Testing /api/admin/works/simple:
curl -v http://localhost:3000/api/admin/works/simple
echo.
echo.

pause