@echo off
echo Pokemon MMO Admin Features Test Suite
echo ======================================

echo.
echo 1. Verifying test setup...
echo -------------------------
node verify-admin-test-setup.js
if %errorlevel% neq 0 (
    echo.
    echo Setup verification failed. Please fix the issues before running tests.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Running basic admin map test...
echo --------------------------------
node playwright-admin-map-test.js
if %errorlevel% neq 0 (
    echo.
    echo Basic admin map test failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 3. Running full admin feature test...
echo ------------------------------------
node playwright-full-admin-test.js
if %errorlevel% neq 0 (
    echo.
    echo Full admin feature test failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 4. Running comprehensive admin test...
echo --------------------------------------
node comprehensive-admin-test.js
if %errorlevel% neq 0 (
    echo.
    echo Comprehensive admin test failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 5. Running MCP endpoint tests...
echo -------------------------------
node test-admin-mcp-endpoints.js
if %errorlevel% neq 0 (
    echo.
    echo MCP endpoint tests failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ======================================
echo 🎉 All admin tests completed successfully!
echo ======================================
pause