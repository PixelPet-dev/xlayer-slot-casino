@echo off
echo 🧹 XLayer Slot - 准备干净的仓库
echo ================================

echo.
echo 📋 这个脚本将清理项目，只保留必要文件
echo 删除不需要的文件和目录，准备全新的仓库
echo.

set /p confirm="确认清理项目? (y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    goto end
)

echo.
echo 🗑️ 清理不需要的文件和目录...

REM 删除旧的前端目录
if exist "frontend" (
    echo 删除旧的 frontend 目录...
    rmdir /s /q frontend
)

REM 删除构建文件
if exist "frontend-en\build" (
    echo 删除构建文件...
    rmdir /s /q frontend-en\build
)

if exist "docs" (
    echo 删除 docs 目录...
    rmdir /s /q docs
)

REM 删除缓存和临时文件
if exist "cache" (
    echo 删除 cache 目录...
    rmdir /s /q cache
)

if exist "artifacts\build-info" (
    echo 删除构建信息...
    rmdir /s /q artifacts\build-info
)

REM 删除 node_modules (会重新安装)
if exist "node_modules" (
    echo 删除根目录 node_modules...
    rmdir /s /q node_modules
)

if exist "frontend-en\node_modules" (
    echo 删除前端 node_modules...
    rmdir /s /q frontend-en\node_modules
)

REM 删除日志文件
del /q *.log 2>nul
del /q frontend-en\*.log 2>nul

REM 删除临时文件
del /q *.tmp 2>nul
del /q *.temp 2>nul

echo.
echo 📝 创建项目说明文件...

REM 创建主 README
echo # 🎰 XLayer Slot - Blockchain Casino Game > README.md
echo. >> README.md
echo A professional blockchain-based slot machine game built on XLayer network. >> README.md
echo. >> README.md
echo ## ✨ Features >> README.md
echo - 🎮 Blockchain-based slot machine on XLayer >> README.md
echo - 🎵 Professional audio system (BGM + sound effects) >> README.md
echo - 💰 Real-time prize pool display >> README.md
echo - 🏆 User registration and rewards system >> README.md
echo - 📱 Responsive design with OKX theme >> README.md
echo - 🔊 Advanced audio controls >> README.md
echo. >> README.md
echo ## 🚀 Quick Start >> README.md
echo. >> README.md
echo ```bash >> README.md
echo # Install dependencies >> README.md
echo cd frontend-en >> README.md
echo npm install >> README.md
echo. >> README.md
echo # Start development server >> README.md
echo npm start >> README.md
echo ``` >> README.md
echo. >> README.md
echo ## 🌐 Live Demo >> README.md
echo. >> README.md
echo Visit: https://your-username.github.io/xlayer-slot-casino/ >> README.md
echo. >> README.md
echo ## 📁 Project Structure >> README.md
echo. >> README.md
echo - `/contracts` - Smart contracts >> README.md
echo - `/frontend-en` - React frontend >> README.md
echo - `/scripts` - Deployment scripts >> README.md
echo - `/deployments` - Contract addresses >> README.md

REM 创建前端 README
echo # XLayer Slot Frontend > frontend-en\README.md
echo. >> frontend-en\README.md
echo React-based frontend for XLayer Slot casino game. >> frontend-en\README.md
echo. >> frontend-en\README.md
echo ## Development >> frontend-en\README.md
echo. >> frontend-en\README.md
echo ```bash >> frontend-en\README.md
echo npm install >> frontend-en\README.md
echo npm start >> frontend-en\README.md
echo ``` >> frontend-en\README.md
echo. >> frontend-en\README.md
echo ## Audio Setup >> frontend-en\README.md
echo. >> frontend-en\README.md
echo Place audio files in `public/audio/`: >> frontend-en\README.md
echo - `bgm.mp3` - Background music >> frontend-en\README.md
echo - `win.mp3` - Win sound effect >> frontend-en\README.md
echo - `lose.mp3` - Lose sound effect >> frontend-en\README.md

echo.
echo 🔧 更新 GitHub Actions 工作流...

REM 确保 .github/workflows 目录存在
if not exist ".github\workflows" (
    mkdir .github\workflows
)

REM 创建简化的部署工作流
echo name: Deploy to GitHub Pages > .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo on: >> .github\workflows\deploy.yml
echo   push: >> .github\workflows\deploy.yml
echo     branches: [ main ] >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo permissions: >> .github\workflows\deploy.yml
echo   contents: read >> .github\workflows\deploy.yml
echo   pages: write >> .github\workflows\deploy.yml
echo   id-token: write >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo jobs: >> .github\workflows\deploy.yml
echo   build-and-deploy: >> .github\workflows\deploy.yml
echo     runs-on: ubuntu-latest >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     steps: >> .github\workflows\deploy.yml
echo     - name: Checkout >> .github\workflows\deploy.yml
echo       uses: actions/checkout@v4 >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     - name: Setup Node.js >> .github\workflows\deploy.yml
echo       uses: actions/setup-node@v4 >> .github\workflows\deploy.yml
echo       with: >> .github\workflows\deploy.yml
echo         node-version: '18' >> .github\workflows\deploy.yml
echo         cache: 'npm' >> .github\workflows\deploy.yml
echo         cache-dependency-path: frontend-en/package-lock.json >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     - name: Install dependencies >> .github\workflows\deploy.yml
echo       run: ^| >> .github\workflows\deploy.yml
echo         cd frontend-en >> .github\workflows\deploy.yml
echo         npm ci >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     - name: Build >> .github\workflows\deploy.yml
echo       run: ^| >> .github\workflows\deploy.yml
echo         cd frontend-en >> .github\workflows\deploy.yml
echo         npm run build >> .github\workflows\deploy.yml
echo       env: >> .github\workflows\deploy.yml
echo         CI: false >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     - name: Setup Pages >> .github\workflows\deploy.yml
echo       uses: actions/configure-pages@v4 >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     - name: Upload artifact >> .github\workflows\deploy.yml
echo       uses: actions/upload-pages-artifact@v3 >> .github\workflows\deploy.yml
echo       with: >> .github\workflows\deploy.yml
echo         path: ./frontend-en/build >> .github\workflows\deploy.yml
echo. >> .github\workflows\deploy.yml
echo     - name: Deploy to GitHub Pages >> .github\workflows\deploy.yml
echo       uses: actions/deploy-pages@v4 >> .github\workflows\deploy.yml

echo.
echo ✅ 项目清理完成!

echo.
echo 📊 清理结果:
echo ✅ 删除了旧的 frontend 目录
echo ✅ 删除了构建文件和缓存
echo ✅ 删除了 node_modules (需要重新安装)
echo ✅ 创建了新的 README 文件
echo ✅ 更新了 GitHub Actions 工作流
echo.

echo 📋 保留的重要文件:
echo ✅ contracts/ - 智能合约
echo ✅ frontend-en/ - React 前端 (不含 node_modules)
echo ✅ scripts/ - 部署脚本
echo ✅ deployments/ - 合约地址
echo ✅ frontend-en/public/audio/ - 音频文件
echo.

echo 🚀 下一步:
echo 1. 运行 create-new-repo.bat 创建新仓库
echo 2. 或者手动初始化 Git 并推送到新仓库
echo.

:end
pause
