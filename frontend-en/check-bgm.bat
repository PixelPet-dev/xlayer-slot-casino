@echo off
echo 🔍 BGM 文件检查工具
echo ===================

echo.
echo 正在检查 BGM 文件...

if exist "public\audio\kung-fu-bgm.mp3" (
    echo ✅ 找到 BGM 文件: kung-fu-bgm.mp3
    
    for %%A in ("public\audio\kung-fu-bgm.mp3") do (
        echo 📁 文件大小: %%~zA 字节
        echo 📅 修改时间: %%~tA
    )
    
    echo.
    echo 🎵 BGM 状态: 已就绪
    echo 🎮 游戏将使用真实的 Yie Ar Kung-Fu BGM
    echo.
    echo 🚀 下一步:
    echo 1. 启动游戏: npm start
    echo 2. 打开浏览器: http://localhost:3000/xlayerslot
    echo 3. 点击右上角播放按钮测试 BGM
    
) else (
    echo ❌ 未找到 BGM 文件
    echo.
    echo 📋 需要下载 BGM 文件:
    echo 1. 运行 download-bgm.bat 获取下载指南
    echo 2. 或手动下载并放置到 public\audio\kung-fu-bgm.mp3
    echo.
    echo 🎵 当前状态: 使用生成的备用音效
)

echo.
echo 📂 音频目录内容:
if exist "public\audio" (
    dir "public\audio" /b
) else (
    echo 音频目录不存在
)

echo.
pause
