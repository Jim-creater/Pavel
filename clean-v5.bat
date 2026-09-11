@echo off
setlocal
cd /d "%~dp0"

rem ============================================================
rem  PAVEL IZ TARSA - clean the site folder before upload
rem  Run this from inside pavel-site-v5.
rem  Nothing is deleted: unused files are MOVED to
rem  ..\_archive-v5-unused\  so you can still get them back.
rem  ASCII only on purpose: cmd garbles non-ASCII .bat files.
rem ============================================================

set "ARC=..\_archive-v5-unused"

if not exist "index.html" (
  echo ERROR: run this file from inside the pavel-site-v5 folder.
  pause
  exit /b 1
)

if not exist "%ARC%\assets\video" mkdir "%ARC%\assets\video"
if not exist "%ARC%\_opt"         mkdir "%ARC%\_opt"

echo [1/4] build leftovers
if exist "_opt" move /Y "_opt\*.webp" "%ARC%\_opt\" >nul 2>&1
if exist "_opt" rd "_opt" >nul 2>&1
if exist "assets\audio\*.txt" move /Y "assets\audio\*.txt" "%ARC%\" >nul 2>&1

echo [2/4] unused stills
for %%F in (
  01-hero-fg.webp
  02-tarsus-fg.webp
  03-jerusalem-bg.webp
  03-jerusalem-fg.webp
  04-damascus-after.webp
  04-damascus-fg.webp
  05-basket-fg.webp
  06-areopagus-bg.webp
  06-areopagus-fg.webp
  07-prison-bg.webp
  07-prison-fg.webp
  08-rome-fg.webp
  areopagus-full.webp
  cu-rome.webp
  finale.webp
) do if exist "assets\%%F" move /Y "assets\%%F" "%ARC%\assets\" >nul 2>&1

echo [3/4] unused video posters and the dropped Ephesus loop
for %%F in (
  ep-1.webp ep-2.webp ep-3.webp ep-4.webp
  ep-5.webp ep-6.webp ep-7.webp ep-8.webp
  ep-6.mp4 ep-6.webm
  dargavs.webp darkness.webp
) do if exist "assets\video\%%F" move /Y "assets\video\%%F" "%ARC%\assets\video\" >nul 2>&1

echo [4/4] done
echo.
echo Site folder is clean. Everything removed is in:
echo   %ARC%
echo Delete that folder yourself once you are sure you do not need it.
pause
