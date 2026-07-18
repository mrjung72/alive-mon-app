@echo off
setlocal

REM Read version from package.json using PowerShell
for /f "delims=" %%a in ('powershell -Command "(Get-Content package.json -Raw | ConvertFrom-Json).version"') do set VERSION=%%a

echo.
echo ========================================
echo   Alive Mon App Release Script
echo ========================================
echo.
set RELEASE_BASE=release
set PACKAGE_NAME=AliveMonApp-v%VERSION%-win-x64
set RELEASE_DIR=%RELEASE_BASE%\%PACKAGE_NAME%

echo Release Information:
echo    Version: %VERSION%
echo    Package: %PACKAGE_NAME%
echo.

REM Step 1: Clean previous deployments
echo Step 1: Cleaning previous release...
if exist "%RELEASE_DIR%" (
    rmdir /s /q "%RELEASE_DIR%"
    echo Previous release cleaned
)

REM Step 2: Build the application
echo.
echo Step 2: Building application...
echo.
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo Build failed. Release aborted.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.

REM Step 3: Create release directory structure
echo Step 3: Creating release directory structure...
mkdir "%RELEASE_DIR%" 2>nul
mkdir "%RELEASE_DIR%\results" 2>nul
mkdir "%RELEASE_DIR%\request" 2>nul

echo.
echo Step 4: Copying files...
echo.

REM Copy executable
if exist "dist\alive-mon-app-v%VERSION%.exe" (
    copy "dist\alive-mon-app-v%VERSION%.exe" "%RELEASE_DIR%\" >nul
    echo Executable copied
) else (
    echo Executable not found: dist\alive-mon-app-v%VERSION%.exe
    pause
    exit /b 1
)

REM Copy request folder
if exist "request" (
    xcopy "request" "%RELEASE_DIR%\request\" /e /i /h /y >nul
    echo Request folder copied
)

REM Copy documentation files
echo.
echo Copying documentation...
copy "README*.md" "%RELEASE_DIR%\" >nul 2>&1
echo Documentation copied

REM Create launcher scripts
echo.
echo Creating launcher scripts...

REM Create version info file
echo.
echo Creating version info...
echo Alive Mon App - Server Telnet Connection Monitor > "%RELEASE_DIR%\VERSION_INFO.txt"
echo Version: %VERSION% >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo. >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo Package Contents: >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo - alive-mon-app.exe : Main executable >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo - request/ : Sample CSV files for server list >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo - results/ : Output directory for check results >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo - run.bat : Launcher script (English) >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo. >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo Documentation: >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo - README.md : Project overview >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo. >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo Key Features: >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo 1. Server Telnet Connection Check >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo    - Network connectivity testing >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo    - Port accessibility verification >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo    - CSV file based batch processing >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo. >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo 2. Lightweight and Offline-Ready >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo    - No external dependencies >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo    - Works in completely isolated networks >> "%RELEASE_DIR%\VERSION_INFO.txt"
echo VERSION_INFO.txt created

REM Step 5: Create release notes
echo.
echo Creating release notes...
echo ======================================== > "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   Alive Mon App >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   Server Telnet Connection Monitor >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   Release v%VERSION% >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo ======================================== >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo [Initial Release] >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo Server Telnet Connection Check >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - Check connectivity to remote servers >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - Verify port accessibility >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - CSV file based batch processing >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo [Features] >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo Lightweight Design >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - No external dependencies >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - Works in completely isolated networks >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - Single executable file >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo Multi-language Support >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - English interface >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo   - Korean interface >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo [Installation] >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo 1. Extract the package to your desired location >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo 2. Add your server list CSV files to request/ >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo 3. Run run.bat (English) >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo [CSV File Format] >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo Required columns: >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo - server_ip: Server IP address or domain >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo - port: Port number >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo Optional columns: >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo - server_name: Server description >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo ======================================== >> "%RELEASE_DIR%\RELEASE_NOTES.txt"
echo RELEASE_NOTES.txt created

REM Step 6: Create ZIP archive
echo.
echo Step 6: Creating ZIP archive...
powershell -Command "Compress-Archive -Path '%RELEASE_DIR%' -DestinationPath '%RELEASE_BASE%\%PACKAGE_NAME%.zip' -Force"
if %errorlevel% equ 0 (
    echo ZIP archive created
) else (
    echo ZIP creation failed, but release folder is ready
)

echo.
echo ========================================
echo Release Package Created Successfully!
echo ========================================
echo.
echo Location: %RELEASE_DIR%\
if exist "%RELEASE_BASE%\%PACKAGE_NAME%.zip" (
    echo ZIP Archive: %RELEASE_BASE%\%PACKAGE_NAME%.zip
)
echo.
echo Package Contents:
echo    - Executable (alive-mon-app.exe)
echo    - Sample CSV files
echo    - Documentation (README.md)
echo    - Launcher script (English)
echo    - Release notes
echo.
echo Ready for distribution!
echo.
pause
