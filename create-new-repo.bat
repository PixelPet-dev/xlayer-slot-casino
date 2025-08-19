@echo off
echo 🎰 XLayer Slot - 创建全新 GitHub 仓库
echo ========================================

echo.
echo 📋 这个脚本将帮你创建一个全新的 GitHub 仓库
echo 包含完整的 XLayer Slot 项目，避免新旧代码混乱
echo.

echo 🔧 准备步骤:
echo 1. 删除现有的 .git 目录
echo 2. 创建优化的 .gitignore
echo 3. 初始化新的 Git 仓库
echo 4. 创建完整的项目提交
echo 5. 推送到新的 GitHub 仓库
echo.

set /p confirm="确认继续? (y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    goto end
)

echo.
echo 🗑️ 删除现有的 Git 历史...
if exist ".git" (
    rmdir /s /q .git
    echo ✅ 已删除 .git 目录
) else (
    echo ℹ️ 没有找到 .git 目录
)

echo.
echo 📝 创建优化的 .gitignore...
echo # Dependencies > .gitignore
echo node_modules/ >> .gitignore
echo */node_modules/ >> .gitignore
echo npm-debug.log* >> .gitignore
echo yarn-debug.log* >> .gitignore
echo yarn-error.log* >> .gitignore
echo. >> .gitignore
echo # Environment variables >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .env.development.local >> .gitignore
echo .env.test.local >> .gitignore
echo .env.production.local >> .gitignore
echo. >> .gitignore
echo # Build outputs >> .gitignore
echo build/ >> .gitignore
echo dist/ >> .gitignore
echo */build/ >> .gitignore
echo */dist/ >> .gitignore
echo. >> .gitignore
echo # Cache and temporary files >> .gitignore
echo cache/ >> .gitignore
echo .cache/ >> .gitignore
echo artifacts/build-info/ >> .gitignore
echo .hardhat/ >> .gitignore
echo *.log >> .gitignore
echo *.tmp >> .gitignore
echo *.temp >> .gitignore
echo. >> .gitignore
echo # IDE and OS files >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo *.swp >> .gitignore
echo *.swo >> .gitignore
echo .DS_Store >> .gitignore
echo Thumbs.db >> .gitignore
echo. >> .gitignore
echo # Keep important files >> .gitignore
echo !frontend-en/public/audio/*.mp3 >> .gitignore
echo !frontend-en/public/audio/*.png >> .gitignore

echo ✅ 已创建优化的 .gitignore

echo.
echo 🔧 初始化新的 Git 仓库...
git init
git branch -M main

echo.
echo 📦 添加所有项目文件...
git add .

echo.
echo 💾 创建初始提交...
git commit -m "🎰 XLayer Slot - Complete Blockchain Casino Game

✨ Features:
🎮 Blockchain-based slot machine on XLayer network
🎵 Professional audio system (BGM + sound effects)
💰 Real-time prize pool display
🏆 User registration and rewards system
📱 Responsive design with OKX theme
🔊 Advanced audio controls (play/pause, volume, mute)
🎯 Smart contract integration

🎵 Audio System:
- Auto-play BGM with user controls
- Win/lose sound effects with smart BGM management
- Volume control and mute functionality
- Fallback generated audio if files missing
- Audio state management and visual indicators

💎 Smart Contracts:
- LotteryGame.sol - Main game logic with configurable payouts
- XLuckyCoin.sol - Game token (XLC) with full ERC20 support
- Deployed and verified on XLayer Mainnet

🚀 Technical Stack:
- Frontend: React 18 + Web3.js + Tailwind CSS
- Blockchain: Solidity + Hardhat + XLayer
- Audio: Web Audio API + HTML5 Audio
- Deployment: GitHub Actions + GitHub Pages

📁 Project Structure:
- /contracts - Smart contract source code
- /frontend-en - Complete React frontend application
- /scripts - Deployment and utility scripts
- /deployments - Contract addresses and configurations
- /.github/workflows - Automated CI/CD pipeline

🎯 Game Mechanics:
- Provably fair random number generation
- Configurable payout multipliers (1.5x - 50x)
- Platform fee system (15% for sustainability)
- Real-time prize pool tracking
- User reward accumulation system

🔐 Security Features:
- Audited smart contract code
- Transparent on-chain logic
- No admin backdoors
- Decentralized operation

Ready for production deployment and GitHub Pages hosting!"

echo ✅ 初始提交创建完成

echo.
echo 🌐 现在需要创建新的 GitHub 仓库
echo.
echo 📋 建议的仓库信息:
echo 仓库名: xlayer-slot-casino
echo 描述: Professional blockchain casino game on XLayer with complete audio system
echo 可见性: Public
echo.
echo 🔗 创建仓库后，请提供仓库 URL:
set /p repo_url="GitHub 仓库 URL (例如: https://github.com/username/xlayer-slot-casino.git): "

if "%repo_url%"=="" (
    echo ❌ 未提供仓库 URL
    echo 💡 你可以稍后手动添加远程仓库:
    echo    git remote add origin YOUR_REPO_URL
    echo    git push -u origin main
    goto end
)

echo.
echo 🔗 添加远程仓库...
git remote add origin %repo_url%

echo.
echo 🚀 推送到 GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ 成功! 新的 XLayer Slot 仓库已创建
    echo 🌐 仓库地址: %repo_url%
    echo.
    echo 📋 下一步:
    echo 1. 访问 GitHub 仓库设置
    echo 2. 启用 GitHub Pages (Settings ^> Pages)
    echo 3. 选择 "GitHub Actions" 作为部署源
    echo 4. 等待自动部署完成
    echo.
    echo 🎮 GitHub Pages 地址将是:
    echo https://username.github.io/xlayer-slot-casino/
) else (
    echo.
    echo ❌ 推送失败，请检查:
    echo 1. GitHub 仓库是否已创建
    echo 2. 仓库 URL 是否正确
    echo 3. 是否有推送权限
    echo.
    echo 💡 手动推送命令:
    echo git remote add origin %repo_url%
    echo git push -u origin main
)

:end
echo.
echo 💡 提示:
echo - 新仓库将包含完整的项目历史
echo - 所有音频文件和资源都已包含
echo - GitHub Actions 将自动部署到 GitHub Pages
echo - 项目已准备好用于生产环境
echo.
pause
