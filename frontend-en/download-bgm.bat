@echo off
echo 🎵 Yie Ar Kung-Fu BGM 下载助手
echo ================================

echo.
echo 正在检查音频目录...
if not exist "public\audio" (
    echo 创建音频目录...
    mkdir "public\audio"
)

echo.
echo 🎯 音频文件下载选项:
echo.
echo 1. 下载BGM (bgm.mp3) - 主背景音乐
echo 2. 下载音效包 (win.mp3 + lose.mp3)
echo 3. 显示完整下载指南
echo 4. 退出
echo.

set /p choice="请选择 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🎵 正在打开BGM下载页面...
    start https://downloads.khinsider.com/game-soundtracks/album/yie-ar-kung-fu-nes
    echo.
    echo 📋 BGM下载指南:
    echo 1. 在打开的页面中找到 "Fight Theme"
    echo 2. 点击下载 MP3 文件
    echo 3. 将文件重命名为: bgm.mp3
    echo 4. 将文件放到: public\audio\ 目录
    echo.
    echo 🎮 这将成为游戏的主背景音乐！
) else if "%choice%"=="2" (
    echo.
    echo 🔊 正在打开音效资源页面...
    start https://freesound.org/search/?q=coin+drop
    echo.
    echo 📋 音效下载指南:
    echo 1. 下载中奖音效 (硬币声、胜利音等)
    echo 2. 重命名为: win.mp3 (2-5秒)
    echo 3. 下载未中奖音效 (失败音、叹气声等)
    echo 4. 重命名为: lose.mp3 (1-3秒)
    echo 5. 将两个文件都放到: public\audio\ 目录
    echo.
    echo 🎯 这些音效会在抽奖结果时播放！
) else if "%choice%"=="3" (
    echo.
    echo 📖 完整音频设置指南:
    echo.
    echo 🎵 需要的文件:
    echo 1. bgm.mp3 - 主背景音乐 (循环播放)
    echo 2. win.mp3 - 中奖音效 (2-5秒)
    echo 3. lose.mp3 - 未中奖音效 (1-3秒)
    echo.
    echo 🔗 推荐资源:
    echo BGM: https://downloads.khinsider.com/game-soundtracks/album/yie-ar-kung-fu-nes
    echo 音效: https://freesound.org (搜索 coin, win, fail)
    echo.
    echo 📁 文件放置: public\audio\ 目录
    echo.
    echo 🎮 播放逻辑:
    echo - 正常时播放BGM循环
    echo - 抽奖出结果时暂停BGM
    echo - 播放对应的中奖/未中奖音效
    echo - 音效结束后恢复BGM播放
) else if "%choice%"=="4" (
    echo 再见！
    exit /b
) else (
    echo 无效选择，请重新运行脚本
)

echo.
echo 💡 提示: 下载完成后运行 check-bgm.bat 验证文件
pause
