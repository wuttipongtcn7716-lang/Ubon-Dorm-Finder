@echo off
set PATH=C:\Users\TUF02\git-portable\cmd;%PATH%
git init
git config user.name "Developer"
git config user.email "developer@example.com"
git add .
git commit -m "first commit for dorm app"
git status
git log -1 --stat
