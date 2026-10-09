@echo off
setlocal
echo =======================================================================
echo   ClusterIQ: Push Code to GitHub for 24/7 Cloud Deployment
echo =======================================================================
echo.
echo Make sure you have created a new empty repository on https://github.com/new
echo.
set /p REPO_URL="Paste your GitHub Repo URL (e.g. https://github.com/username/clusteriq.git): "
if "%REPO_URL%"=="" (
    echo [ERROR] No URL entered. Aborted.
    pause
    exit /b
)

set GIT_CMD="%USERPROFILE%\.mingit\cmd\git.exe"
if not exist %GIT_CMD% (
    set GIT_CMD=git
)

%GIT_CMD% remote remove origin >nul 2>&1
%GIT_CMD% remote add origin %REPO_URL%
%GIT_CMD% branch -M main
echo.
echo Pushing project to GitHub...
%GIT_CMD% push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =======================================================================
    echo   SUCCESS! Your project is now on GitHub!
    echo =======================================================================
    echo Next step:
    echo 1. Open https://share.streamlit.io
    echo 2. Click "Create app"
    echo 3. Select this repository and click "Deploy"
    echo Your app will be live 24/7 on the internet!
) else (
    echo.
    echo [NOTICE] If push failed due to login, you may need a GitHub Personal Access Token
    echo or ensure you have write access to the repository.
)
echo.
pause
