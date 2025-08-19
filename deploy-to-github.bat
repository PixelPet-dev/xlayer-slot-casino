@echo off
echo 🚀 XLayer Slot - GitHub 部署脚本
echo ================================

echo.
echo 📋 部署选项:
echo 1. 初始化新的 Git 仓库并推送到 GitHub
echo 2. 更新现有的 GitHub 仓库 (强制覆盖)
echo 3. 查看当前 Git 状态
echo 4. 退出
echo.

set /p choice="请选择 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🔧 初始化新的 Git 仓库...
    
    REM 删除可能存在的 .git 目录
    if exist ".git" (
        echo 删除现有的 .git 目录...
        rmdir /s /q .git
    )
    
    REM 初始化 Git 仓库
    git init
    
    REM 添加 .gitignore
    echo 创建 .gitignore 文件...
    echo node_modules/ > .gitignore
    echo .env >> .gitignore
    echo .env.local >> .gitignore
    echo dist/ >> .gitignore
    echo build/ >> .gitignore
    echo cache/ >> .gitignore
    echo artifacts/build-info/ >> .gitignore
    echo *.log >> .gitignore
    echo .DS_Store >> .gitignore
    echo Thumbs.db >> .gitignore
    
    REM 添加所有文件
    echo 添加项目文件...
    git add .
    
    REM 提交
    echo 创建初始提交...
    git commit -m "🎰 XLayer Slot - Complete Casino Game with Audio System

✨ Features:
- 🎮 Blockchain-based slot machine game
- 🎵 Complete audio system (BGM + sound effects)
- 💰 Real-time prize pool display
- 🏆 User registration and rewards system
- 📱 Responsive design with OKX theme
- 🔊 Audio controls (play/pause, volume, mute)
- 🎯 Smart contract integration on XLayer

🎵 Audio System:
- BGM auto-play with user controls
- Win/lose sound effects with BGM pause/resume
- Volume control and mute functionality
- Fallback generated audio if files missing

💎 Smart Contracts:
- LotteryGame.sol - Main game logic
- XLuckyCoin.sol - Game token (XLC)
- Deployed on XLayer Mainnet

🚀 Ready for production deployment!"
    
    echo.
    echo 📝 请输入 GitHub 仓库 URL (例如: https://github.com/username/xlayer-slot.git):
    set /p repo_url="GitHub URL: "
    
    if not "%repo_url%"=="" (
        echo 添加远程仓库...
        git remote add origin %repo_url%
        
        echo 推送到 GitHub...
        git push -u origin main
        
        echo.
        echo ✅ 项目已成功推送到 GitHub!
        echo 🌐 仓库地址: %repo_url%
    ) else (
        echo ❌ 未提供 GitHub URL，跳过推送
    )
    
) else if "%choice%"=="2" (
    echo.
    echo 🔄 更新现有 GitHub 仓库...
    
    REM 检查是否有 Git 仓库
    if not exist ".git" (
        echo ❌ 当前目录不是 Git 仓库，请先选择选项 1
        goto end
    )
    
    REM 添加所有更改
    echo 添加所有更改...
    git add .
    
    REM 提交更改
    echo 创建更新提交...
    git commit -m "🎰 XLayer Slot - Major Update

🆕 Latest Features:
- 🎵 Enhanced audio system with BGM controls
- 🏆 Real-time prize pool display
- 🎮 Improved game mechanics and UI
- 📱 Better responsive design
- 🔊 Professional audio experience
- 💰 Live contract balance tracking

🔧 Technical Improvements:
- Optimized smart contract integration
- Enhanced error handling
- Better user experience
- Audio fallback system
- Real-time data synchronization

Updated: $(date)"
    
    REM 强制推送到 GitHub (覆盖远程版本)
    echo 强制推送到 GitHub (这将覆盖远程版本)...
    git push --force origin main
    
    echo.
    echo ✅ GitHub 仓库已成功更新!
    
) else if "%choice%"=="3" (
    echo.
    echo 📊 当前 Git 状态:
    echo.
    
    if exist ".git" (
        echo 🔍 Git 仓库状态:
        git status
        echo.
        echo 📝 最近的提交:
        git log --oneline -5
        echo.
        echo 🌐 远程仓库:
        git remote -v
    ) else (
        echo ❌ 当前目录不是 Git 仓库
    )
    
) else if "%choice%"=="4" (
    echo 退出部署脚本
    goto end
) else (
    echo ❌ 无效选择，请重新运行脚本
)

:end
echo.
echo 💡 提示:
echo - 确保已安装 Git 并配置了 GitHub 账户
echo - 推送前请确认 GitHub 仓库已创建
echo - 强制推送会覆盖远程仓库的所有内容
echo.
pause
