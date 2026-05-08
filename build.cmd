@echo off
REM Script to build the frontend using local Node 20
REM This ensures compatibility and avoids Node 21+ issues

cd /d "%~dp0"
REM Set PATH to prioritize local node20
set PATH=%CD%\node20;%PATH%
node20\npm.cmd run build
pause
