@echo off
set PATH=C:\Users\TUF02\git-portable\cmd;%PATH%
git reset --soft HEAD~1
git add .
git commit -m "Add 3D Mapbox Buildings and POIs map component with Clean Light Styling"
git push origin main
