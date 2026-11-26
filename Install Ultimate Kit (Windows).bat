@echo off
setlocal
title Ultimate Kit - installer
echo.
echo  Ultimate Kit for After Effects 2024+ (Windows)
echo  ---------------------------------------------
echo.

set "SRC=%~dp0UltimateKit"
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.ultimatekit.panel"

if not exist "%SRC%\CSXS\manifest.xml" (
  echo  [!] Could not find the UltimateKit folder next to this installer.
  pause
  exit /b 1
)

echo  1/2  Allowing unsigned extensions (PlayerDebugMode) for CEP 9-16 ...
for %%V in (9 10 11 12 13 14 15 16) do (
  reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

echo  2/2  Copying the panel to:
echo       %DEST%
if exist "%DEST%" rmdir /s /q "%DEST%"
mkdir "%DEST%" >nul 2>&1
xcopy "%SRC%\*" "%DEST%\" /e /i /q /y >nul
if errorlevel 1 (
  echo  [!] Copy failed.
  pause
  exit /b 1
)

echo.
echo  Done.
echo  - Restart After Effects.
echo  - Open the panel: Window ^> Extensions ^> Ultimate Kit
echo.
pause
