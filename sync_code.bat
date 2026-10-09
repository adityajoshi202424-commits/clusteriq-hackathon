@echo off
setlocal
set PATH=%USERPROFILE%\.mingit\cmd;%USERPROFILE%\.gh\bin;%PATH%
echo =======================================================================
echo   ClusterIQ: Auto-Sync Local Code to 24/7 Live Website
echo =======================================================================
echo.
git add .
set /p MSG="Enter commit description (press Enter for default): "
if "%MSG%"=="" set MSG=update: sync changes to live cloud deployment
git commit -m "%MSG%"
git push origin main
echo.
echo =======================================================================
echo   SUCCESS! Code pushed to GitHub.
echo   Your live Streamlit app will auto-update in ~10 seconds!
echo =======================================================================
pause
