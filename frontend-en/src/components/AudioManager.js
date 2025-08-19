import React, { useState, useEffect, useRef } from 'react';
import { playSpinSoundEffect, playWinSoundEffect, playLoseSoundEffect, playJackpotSoundEffect, createKungFuBGM } from '../utils/audioUtils';

const AudioManager = React.forwardRef(({ isPlaying, onToggle }, ref) => {
  const [volume] = useState(0.3); // 固定音量30%
  const [bgmLoaded, setBgmLoaded] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState('none'); // 'bgm', 'win', 'lose', 'none'
  const bgmRef = useRef(null);
  const bgmIntervalRef = useRef(null);
  const winSoundRef = useRef(null);
  const loseSoundRef = useRef(null);
  const spinSoundRef = useRef(null);

  // 初始化音频
  useEffect(() => {
    // 尝试创建BGM音频对象 (优先使用 bgm.mp3，备用 kung-fu-bgm.mp3)
    const tryLoadBGM = (filename) => {
      const bgmAudio = new Audio(`${process.env.PUBLIC_URL}/audio/${filename}`);
      bgmAudio.loop = true;
      bgmAudio.volume = volume;

      bgmAudio.addEventListener('canplaythrough', () => {
        console.log(`BGM加载成功: ${filename}`);
        setBgmLoaded(true);
        bgmRef.current = bgmAudio;
      });

      bgmAudio.addEventListener('error', () => {
        console.log(`BGM文件未找到: ${filename}`);
        if (filename === 'bgm.mp3') {
          // 尝试备用文件名
          tryLoadBGM('kung-fu-bgm.mp3');
        } else {
          console.log('所有BGM文件都未找到，将使用生成的音乐');
          setBgmLoaded(false);
        }
      });

      bgmAudio.load();
    };

    // 开始加载BGM
    tryLoadBGM('bgm.mp3');

    // 创建中奖/未中奖音效对象
    try {
      // 中奖音效
      winSoundRef.current = new Audio(`${process.env.PUBLIC_URL}/audio/win.mp3`);
      winSoundRef.current.volume = volume;
      winSoundRef.current.addEventListener('ended', () => {
        console.log('中奖音效播放完毕，恢复BGM');
        setCurrentlyPlaying('bgm');
      });

      // 未中奖音效
      loseSoundRef.current = new Audio(`${process.env.PUBLIC_URL}/audio/lose.mp3`);
      loseSoundRef.current.volume = volume;
      loseSoundRef.current.addEventListener('ended', () => {
        console.log('未中奖音效播放完毕，恢复BGM');
        setCurrentlyPlaying('bgm');
      });

      // 可选的转轮音效 (如果文件存在)
      try {
        spinSoundRef.current = new Audio(`${process.env.PUBLIC_URL}/audio/spin-sound.mp3`);
        spinSoundRef.current.volume = volume * 0.8;
        spinSoundRef.current.addEventListener('error', () => {
          console.log('转轮音效文件不存在，将使用生成音效');
          spinSoundRef.current = null;
        });
      } catch (error) {
        console.log('转轮音效初始化失败，将使用生成音效');
        spinSoundRef.current = null;
      }

    } catch (error) {
      console.log('音效文件加载失败，将使用生成的音效');
    }

    // 清理函数
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      if (bgmIntervalRef.current) {
        clearInterval(bgmIntervalRef.current);
      }
    };
  }, []);

  // 控制音频播放状态
  useEffect(() => {
    if (!isPlaying) {
      // BGM关闭时停止所有音频
      stopAllAudio();
      setCurrentlyPlaying('none');
      return;
    }

    // 根据当前播放状态控制音频
    switch (currentlyPlaying) {
      case 'bgm':
        playBGM();
        break;
      case 'win':
        pauseBGM();
        break;
      case 'lose':
        pauseBGM();
        break;
      case 'none':
        if (isPlaying) {
          setCurrentlyPlaying('bgm');
        }
        break;
    }
  }, [isPlaying, bgmLoaded, currentlyPlaying]);

  // 播放BGM
  const playBGM = () => {
    if (bgmLoaded && bgmRef.current) {
      bgmRef.current.play().catch(e => {
        console.log('BGM播放失败:', e);
      });
    } else {
      // 使用生成的音乐循环
      if (!bgmIntervalRef.current) {
        const playGeneratedBGM = () => {
          createKungFuBGM();
        };

        playGeneratedBGM();
        bgmIntervalRef.current = setInterval(playGeneratedBGM, 2000);
      }
    }
  };

  // 暂停BGM
  const pauseBGM = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
  };

  // 停止所有音频
  const stopAllAudio = () => {
    pauseBGM();
    if (winSoundRef.current) {
      winSoundRef.current.pause();
      winSoundRef.current.currentTime = 0;
    }
    if (loseSoundRef.current) {
      loseSoundRef.current.pause();
      loseSoundRef.current.currentTime = 0;
    }
  };

  // 更新音量
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = volume;
    }
    if (spinSoundRef.current) {
      spinSoundRef.current.volume = volume * 0.8;
    }
    if (winSoundRef.current) {
      winSoundRef.current.volume = volume;
    }
    if (loseSoundRef.current) {
      loseSoundRef.current.volume = volume;
    }
  }, [volume]);

  // 播放音效的方法
  const playSpinSound = () => {
    if (!isPlaying) return;

    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      spinSoundRef.current.play().catch(e => {
        console.log('转轮音效文件播放失败，使用备用音效:', e);
        playSpinSoundEffect();
      });
    } else {
      playSpinSoundEffect();
    }
  };

  // 播放中奖音效 (暂停BGM，播放完毕后恢复)
  const playWinSound = () => {
    console.log('🎉 playWinSound 被调用', { isPlaying });
    if (!isPlaying) {
      console.log('🔇 音效被跳过 - BGM关闭');
      return;
    }

    console.log('🎵 开始播放中奖音效');
    setCurrentlyPlaying('win');

    if (winSoundRef.current) {
      winSoundRef.current.currentTime = 0;
      winSoundRef.current.play().catch(e => {
        console.log('中奖音效文件播放失败，使用备用音效:', e);
        playWinSoundEffect();
        // 备用音效播放完毕后恢复BGM
        setTimeout(() => {
          setCurrentlyPlaying('bgm');
        }, 1000);
      });
    } else {
      playWinSoundEffect();
      // 备用音效播放完毕后恢复BGM
      setTimeout(() => {
        setCurrentlyPlaying('bgm');
      }, 1000);
    }
  };

  // 播放未中奖音效 (暂停BGM，播放完毕后恢复)
  const playLoseSound = () => {
    console.log('😔 playLoseSound 被调用', { isPlaying });
    if (!isPlaying) {
      console.log('🔇 音效被跳过 - BGM关闭');
      return;
    }

    console.log('🎵 开始播放未中奖音效');
    setCurrentlyPlaying('lose');

    if (loseSoundRef.current) {
      loseSoundRef.current.currentTime = 0;
      loseSoundRef.current.play().catch(e => {
        console.log('未中奖音效文件播放失败，使用备用音效:', e);
        playLoseSoundEffect(); // 使用失败音效作为备用
        // 备用音效播放完毕后恢复BGM
        setTimeout(() => {
          setCurrentlyPlaying('bgm');
        }, 800);
      });
    } else {
      playLoseSoundEffect(); // 使用失败音效作为备用
      // 备用音效播放完毕后恢复BGM
      setTimeout(() => {
        setCurrentlyPlaying('bgm');
      }, 800);
    }
  };

  // 暴露音效播放方法给父组件
  React.useImperativeHandle(ref, () => ({
    playSpinSound,
    playWinSound,
    playLoseSound
  }));

  // 设置全局实例
  React.useEffect(() => {
    const instance = {
      playSpinSound,
      playWinSound,
      playLoseSound
    };
    setAudioManagerInstance(instance);
    console.log('🎵 音频管理器实例已设置');
  }, [playSpinSound, playWinSound, playLoseSound]);



  return (
    <div className="fixed top-4 right-4 z-50 bg-okx-dark/90 backdrop-blur-sm rounded-lg p-3 border border-okx-border">
      {/* 简化的播放/暂停按钮 */}
      <button
        onClick={onToggle}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          isPlaying
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
        }`}
        title={isPlaying ? 'Pause BGM' : 'Play BGM'}
      >
        <span className="text-lg">
          {isPlaying ? '⏸️' : '▶️'}
        </span>
        <span className="text-xs text-okx-muted">
          {isPlaying ? 'BGM' : 'BGM'}
        </span>
      </button>
    </div>
  );
});

// 创建一个全局的音频管理器实例
let audioManagerInstance = null;

export const useAudioManager = () => {
  return {
    playSpinSound: () => {
      console.log('🎰 useAudioManager.playSpinSound 被调用', { instance: !!audioManagerInstance });
      audioManagerInstance?.playSpinSound();
    },
    playWinSound: () => {
      console.log('🎉 useAudioManager.playWinSound 被调用', { instance: !!audioManagerInstance });
      audioManagerInstance?.playWinSound();
    },
    playLoseSound: () => {
      console.log('😔 useAudioManager.playLoseSound 被调用', { instance: !!audioManagerInstance });
      audioManagerInstance?.playLoseSound();
    }
  };
};

export const setAudioManagerInstance = (instance) => {
  audioManagerInstance = instance;
};

export default AudioManager;
