// 音频工具函数 - 用于生成临时音效

// 创建音频上下文
const createAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

// 生成简单的音调
const createTone = (frequency, duration, type = 'sine') => {
  const audioContext = createAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
  
  return audioContext;
};

// 生成转轮音效 (快速的滴答声)
export const playSpinSoundEffect = () => {
  try {
    const audioContext = createAudioContext();
    const duration = 0.1;
    
    // 创建多个快速的滴答声
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800 + i * 50, audioContext.currentTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
      }, i * 50);
    }
  } catch (error) {
    console.log('音效播放失败:', error);
  }
};

// 生成中奖音效 (欢快的上升音调)
export const playWinSoundEffect = () => {
  try {
    const audioContext = createAudioContext();

    // 播放一系列欢快的音符
    const notes = [523, 659, 784, 1047, 1319]; // C, E, G, C, E (高音)

    notes.forEach((frequency, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }, index * 100);
    });
  } catch (error) {
    console.log('中奖音效播放失败:', error);
  }
};

// 生成未中奖音效 (下降音调)
export const playLoseSoundEffect = () => {
  try {
    const audioContext = createAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 下降的音调 (失望的感觉)
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.8);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  } catch (error) {
    console.log('未中奖音效播放失败:', error);
  }
};

// 生成大奖音效 (庆祝音调)
export const playJackpotSoundEffect = () => {
  try {
    const audioContext = createAudioContext();
    
    // 播放一系列庆祝音调
    const notes = [523, 659, 784, 1047]; // C, E, G, C (高八度)
    
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }, index * 150);
    });
  } catch (error) {
    console.log('大奖音效播放失败:', error);
  }
};

// FC功夫风格的BGM生成器 (简化版)
export const createKungFuBGM = () => {
  try {
    const audioContext = createAudioContext();
    
    // FC功夫主题的简化旋律
    const melody = [
      { note: 330, duration: 0.25 }, // E4
      { note: 370, duration: 0.25 }, // F#4
      { note: 415, duration: 0.25 }, // G#4
      { note: 440, duration: 0.25 }, // A4
      { note: 494, duration: 0.5 },  // B4
      { note: 440, duration: 0.25 }, // A4
      { note: 415, duration: 0.25 }, // G#4
      { note: 370, duration: 0.5 },  // F#4
    ];
    
    let currentTime = audioContext.currentTime;
    
    melody.forEach(({ note, duration }) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note, currentTime);
      oscillator.type = 'square'; // FC风格的方波
      
      gainNode.gain.setValueAtTime(0.1, currentTime);
      gainNode.gain.setValueAtTime(0.1, currentTime + duration - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
      
      currentTime += duration;
    });
    
    return audioContext;
  } catch (error) {
    console.log('BGM生成失败:', error);
    return null;
  }
};
