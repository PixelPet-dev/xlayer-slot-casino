class AudioManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.7;
    this.backgroundMusic = null;
    this.isMusicPlaying = false;
    
    // 初始化音频
    this.initAudio();
  }

  initAudio() {
    // 背景音乐 - 使用Web Audio API生成
    this.backgroundMusic = this.createBackgroundMusic();
    
    // 转轮音效
    this.sounds.spin = this.createSpinSound();
    
    // 中奖音效
    this.sounds.win = this.createWinSound();
    
    // 大奖音效
    this.sounds.jackpot = this.createJackpotSound();
    
    // 按钮点击音效
    this.sounds.click = this.createClickSound();
    
    // 转轮停止音效
    this.sounds.stop = this.createStopSound();
  }

  // 创建背景音乐 - 电子舞曲风格
  createBackgroundMusic() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 8; // 8秒循环
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(2, frameCount, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        
        // 主旋律 - 电子音
        const melody = Math.sin(2 * Math.PI * (220 + 110 * Math.sin(time * 0.5)) * time) * 0.3;
        
        // 低音 - 节拍
        const bass = Math.sin(2 * Math.PI * 55 * time) * 0.4 * (Math.floor(time * 4) % 2);
        
        // 高频装饰音
        const decoration = Math.sin(2 * Math.PI * 880 * time) * 0.1 * Math.sin(time * 8);
        
        // 混合
        channelData[i] = (melody + bass + decoration) * 0.3;
      }
    }
    
    return { audioContext, buffer };
  }

  // 创建转轮旋转音效
  createSpinSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.5;
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      const frequency = 200 + 300 * time; // 频率上升
      const amplitude = Math.exp(-time * 2); // 衰减
      channelData[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude * 0.3;
    }
    
    return { audioContext, buffer };
  }

  // 创建中奖音效
  createWinSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 1.5;
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      // 上升音阶
      const note1 = Math.sin(2 * Math.PI * 523 * time); // C5
      const note2 = Math.sin(2 * Math.PI * 659 * time); // E5
      const note3 = Math.sin(2 * Math.PI * 784 * time); // G5
      
      const envelope = Math.exp(-time * 1.5);
      channelData[i] = (note1 + note2 + note3) * envelope * 0.2;
    }
    
    return { audioContext, buffer };
  }

  // 创建大奖音效
  createJackpotSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 3;
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(2, frameCount, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        
        // 华丽的和弦
        const chord = 
          Math.sin(2 * Math.PI * 523 * time) + // C5
          Math.sin(2 * Math.PI * 659 * time) + // E5
          Math.sin(2 * Math.PI * 784 * time) + // G5
          Math.sin(2 * Math.PI * 1047 * time); // C6
        
        // 颤音效果
        const tremolo = 1 + 0.3 * Math.sin(2 * Math.PI * 6 * time);
        
        const envelope = Math.exp(-time * 0.8);
        channelData[i] = chord * tremolo * envelope * 0.15;
      }
    }
    
    return { audioContext, buffer };
  }

  // 创建点击音效
  createClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.1;
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      const frequency = 800;
      const amplitude = Math.exp(-time * 50);
      channelData[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude * 0.3;
    }
    
    return { audioContext, buffer };
  }

  // 创建停止音效
  createStopSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.3;
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      const frequency = 400 - 200 * time; // 频率下降
      const amplitude = Math.exp(-time * 3);
      channelData[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude * 0.4;
    }
    
    return { audioContext, buffer };
  }

  // 播放音效
  playSound(soundName, loop = false) {
    if (!this.isEnabled || !this.sounds[soundName]) return;

    try {
      const { audioContext, buffer } = this.sounds[soundName];
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.loop = loop;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start();
      return source;
    } catch (error) {
      console.warn('音频播放失败:', error);
    }
  }

  // 播放背景音乐
  playBackgroundMusic() {
    if (!this.isEnabled || this.isMusicPlaying || !this.backgroundMusic) return;

    try {
      const { audioContext, buffer } = this.backgroundMusic;
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.loop = true;
      gainNode.gain.value = this.volume * 0.3; // 背景音乐音量较低
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start();
      this.isMusicPlaying = true;
      this.currentMusicSource = source;
    } catch (error) {
      console.warn('背景音乐播放失败:', error);
    }
  }

  // 停止背景音乐
  stopBackgroundMusic() {
    if (this.currentMusicSource) {
      this.currentMusicSource.stop();
      this.currentMusicSource = null;
      this.isMusicPlaying = false;
    }
  }

  // 设置音量
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // 切换音效开关
  toggleSound() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.stopBackgroundMusic();
    }
    return this.isEnabled;
  }

  // 播放转轮音效序列
  playSpinSequence() {
    this.playSound('spin');
    
    // 循环播放转轮音效
    this.spinInterval = setInterval(() => {
      this.playSound('spin');
    }, 500);
  }

  // 停止转轮音效
  stopSpinSequence() {
    if (this.spinInterval) {
      clearInterval(this.spinInterval);
      this.spinInterval = null;
    }
    this.playSound('stop');
  }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();

export default audioManager;
