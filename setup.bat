@echo off
setlocal EnableDelayedExpansion
title BW Procurement System - Setup
color 0A

echo ============================================================
echo    BW Procurement System - Automated Setup
echo ============================================================
echo.

:: ---- Check for Admin privileges ----
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] This script needs Administrator privileges to install Node.js.
    echo     Right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

:: ---- Check if Node.js is already installed ----
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo [OK] Node.js is already installed: !NODE_VER!
    goto :INSTALL_DEPS
)

echo [*] Node.js is not installed. Downloading Node.js LTS...
echo.

:: ---- Download Node.js LTS installer ----
set "NODE_URL=https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
set "NODE_INSTALLER=%TEMP%\nodejs_installer.msi"

echo [*] Downloading from: %NODE_URL%
echo [*] Saving to: %NODE_INSTALLER%
echo.

powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_INSTALLER%' -UseBasicParsing }"

if not exist "%NODE_INSTALLER%" (
    echo [X] Download failed. Please check your internet connection and try again.
    pause
    exit /b 1
)

echo [OK] Download complete.
echo.

:: ---- Install Node.js silently ----
echo [*] Installing Node.js (this may take a minute)...
msiexec /i "%NODE_INSTALLER%" /qn /norestart

if %errorlevel% neq 0 (
    echo [X] Installation failed. Trying interactive install...
    msiexec /i "%NODE_INSTALLER%"
)

:: ---- Refresh PATH so node/npm are available ----
echo [*] Refreshing system PATH...
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"

:: Verify installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js installation could not be verified.
    echo     Please restart your computer and run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js installed successfully: !NODE_VER!
echo.

:: ---- Clean up installer ----
del "%NODE_INSTALLER%" >nul 2>&1

:INSTALL_DEPS
echo.
echo [*] Installing project dependencies (npm install)...
echo     This may take a few minutes on first run...
echo.

:: Navigate to the script's directory (the project root)
cd /d "%~dp0"

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [X] npm install failed. Please check the errors above.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

:: ---- Check for .env.local ----
if not exist ".env.local" (
    if exist ".env.example" (
        echo [*] Creating .env.local from .env.example...
        copy ".env.example" ".env.local" >nul
        echo [!] IMPORTANT: Edit .env.local with your Firebase credentials before running.
        echo.
    )
)

echo ============================================================
echo    Setup Complete!
echo ============================================================
echo.
echo    To start the development server, run:
echo        npm run dev
echo.
echo    The app will open at: http://localhost:3000
echo.
echo ============================================================
echo.

set /p START="Would you like to start the development server now? (y/n): "
if /i "%START%"=="y" (
    echo.
    echo [*] Starting development server...
    call npm run dev
)

pause
