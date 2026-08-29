@echo off
set PATH=C:\Users\TUF02\.gemini\antigravity\bin\git\cmd;%PATH%
cd /d "C:\Users\TUF02\.gemini\antigravity\scratch\Ubon-Dorm-Finder"
echo Setting remote origin...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/wuttipongtcn7716-lang/Ubon-Dorm-Finder.git
git branch -M main
echo Force Pushing to GitHub main branch...
git push -f -u origin main
echo.
pause