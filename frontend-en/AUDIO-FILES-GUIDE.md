# 🎵 音频文件设置指南

## 📁 需要的音频文件

### 必需文件：
```
public/audio/
├── bgm.mp3          # 主背景音乐 (循环播放)
├── win.mp3          # 中奖音效 (2-5秒)
└── lose.mp3         # 未中奖音效 (1-3秒)
```

### 可选文件：
```
public/audio/
├── spin-sound.mp3   # 转轮音效 (可选)
└── kung-fu-bgm.mp3  # 备用BGM文件名
```

## 🎮 音频播放逻辑

### 正常流程：
1. **游戏开始** → 循环播放 `bgm.mp3`
2. **抽奖出结果** → 暂停BGM
3. **中奖** → 播放 `win.mp3`
4. **未中奖** → 播放 `lose.mp3`
5. **音效结束** → 自动恢复BGM播放

### 智能控制：
- BGM在音效播放时自动暂停
- 音效播放完毕后BGM自动恢复
- 支持音量控制和静音
- 文件不存在时使用生成的备用音效

## 🎵 推荐音频资源

### BGM (bgm.mp3)：
**推荐使用 Yie Ar Kung-Fu BGM**
- 下载链接：https://downloads.khinsider.com/game-soundtracks/album/yie-ar-kung-fu-nes
- 选择："Fight Theme" 或 "Stage 1"
- 重命名为：`bgm.mp3`

### 中奖音效 (win.mp3)：
**推荐音效类型**：
- 硬币掉落声
- 胜利音乐
- 庆祝音效
- 铃铛声

**在线资源**：
- Freesound.org: 搜索 "coin drop", "victory", "win"
- Zapsplat.com: 搜索 "casino win", "jackpot"
- YouTube: 搜索 "win sound effect" + 转换工具

### 未中奖音效 (lose.mp3)：
**推荐音效类型**：
- 失望的音调
- 简短的"哎"声
- 下降音调
- 轻微的错误音

**在线资源**：
- Freesound.org: 搜索 "fail", "lose", "wrong"
- 简单生成：使用在线音效生成器

## 🔧 音频格式要求

### 技术规格：
- **格式**: MP3 (推荐) 或 OGG
- **比特率**: 128kbps 或更高
- **采样率**: 44.1kHz
- **声道**: 立体声或单声道

### 文件大小：
- **BGM**: 1-5MB (1-3分钟循环)
- **中奖音效**: 50-500KB (2-5秒)
- **未中奖音效**: 20-300KB (1-3秒)

### 音频质量：
- 清晰无杂音
- 音量适中
- BGM能够无缝循环
- 音效开头结尾干净

## 🎯 快速设置方法

### 方法1: 下载现成文件
1. **BGM**: 从Khinsider下载Yie Ar Kung-Fu
2. **中奖音效**: 从Freesound下载硬币声
3. **未中奖音效**: 从Freesound下载失败音

### 方法2: 使用AI生成
1. 使用Suno AI或类似工具生成BGM
2. 使用音效生成器创建简短音效
3. 确保符合格式要求

### 方法3: 录制/编辑
1. 使用Audacity录制或编辑音频
2. 调整音量和长度
3. 导出为MP3格式

## 📋 具体下载链接

### BGM资源：
```
Yie Ar Kung-Fu BGM:
https://downloads.khinsider.com/game-soundtracks/album/yie-ar-kung-fu-nes

YouTube转换:
https://www.youtube.com/watch?v=28irBIgHNPg
使用 y2mate.com 转换
```

### 音效资源：
```
Freesound (免费):
https://freesound.org/search/?q=coin+drop
https://freesound.org/search/?q=win+sound
https://freesound.org/search/?q=fail+sound

Zapsplat (需注册):
https://www.zapsplat.com/
搜索 "casino", "win", "lose"
```

## 🔍 文件验证

### 检查清单：
- [ ] `bgm.mp3` 存在且能循环播放
- [ ] `win.mp3` 存在且时长合适 (2-5秒)
- [ ] `lose.mp3` 存在且时长合适 (1-3秒)
- [ ] 所有文件音量适中
- [ ] 文件格式为MP3
- [ ] 在游戏中测试播放正常

### 测试方法：
1. 启动游戏
2. 点击右上角播放按钮
3. 进行抽奖测试音效切换
4. 检查BGM是否正确恢复

## 🚀 自动化脚本

### Windows用户：
```bash
# 运行下载助手
download-bgm.bat

# 检查文件状态
check-bgm.bat
```

### 手动验证：
```bash
# 检查文件是否存在
dir public\audio\*.mp3

# 查看文件大小
dir public\audio\ /s
```

## 💡 提示

1. **优先级**: BGM > 中奖音效 > 未中奖音效
2. **备用方案**: 系统会自动使用生成的音效
3. **用户体验**: 确保音效不会太长或太短
4. **音量平衡**: 音效音量应略低于BGM
5. **循环友好**: BGM应该能够无缝循环

完成音频文件设置后，你的老虎机游戏将拥有完整的音频体验！🎰🎵
