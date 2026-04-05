@echo off
echo.
echo ============================================
echo   DEPLOY SHformacions a Vercel
echo ============================================
echo.

echo [1/5] Compilant l'app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR en npm run build
    pause
    exit /b 1
)

echo.
echo [2/5] Preparant fitxers...
git add -A

echo.
echo [3/5] Creant commit...
git commit -m "deploy: build %date% %time%"
if %errorlevel% neq 0 (
    echo Res nou per pujar - continuant igualment...
    git commit --allow-empty -m "force deploy %date% %time%"
)

echo.
echo [4/5] Pujant a GitHub (inclou dist compilada)...
git push origin master --force
if %errorlevel% neq 0 (
    echo ERROR en git push
    pause
    exit /b 1
)

echo.
echo ============================================
echo   COMPLETAT!
echo   Vercel serveix directament la dist.
echo   Obre en mode incognit:
echo   https://sh-formacions.vercel.app
echo ============================================
echo.
pause
