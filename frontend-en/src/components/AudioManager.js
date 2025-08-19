import React, { useState, useEffect, useRef } from 'react';
import { playSpinSoundEffect, playWinSoundEffect, playLoseSoundEffect, playJackpotSoundEffect, createKungFuBGM } from '../utils/audioUtils';

const AudioManager = React.forwardRef(({ isPlaying, onToggle }, ref) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3); // 默认音量30%
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
      const bgmAudio = new Audio(`/xlayerslot/audio/${filename}`);
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
      winSoundRef.current = new Audio('/xlayerslot/audio/win.mp3');
      winSoundRef.current.volume = volume;
      winSoundRef.current.addEventListener('ended', () => {
        console.log('中奖音效播放完毕，恢复BGM');
        setCurrentlyPlaying('bgm');
      });

      // 未中奖音效
      loseSoundRef.current = new Audio('/xlayerslot/audio/lose.mp3');
      loseSoundRef.current.volume = volume;
      loseSoundRef.current.addEventListener('ended', () => {
        console.log('未中奖音效播放完毕，恢复BGM');
        setCurrentlyPlaying('bgm');
      });

      // 可选的转轮音效
      spinSoundRef.current = new Audio('/xlayerslot/audio/spin-sound.mp3');
      spinSoundRef.current.volume = volume * 0.8;

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
    if (isMuted) {
      // 静音时停止所有音频
      stopAllAudio();
      return;
    }

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
  }, [isPlaying, isMuted, bgmLoaded, currentlyPlaying]);

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
      bgmRef.current.volume = isMuted ? 0 : volume;
    }
    if (spinSoundRef.current) {
      spinSoundRef.current.volume = isMuted ? 0 : volume * 0.8;
    }
    if (winSoundRef.current) {
      winSoundRef.current.volume = isMuted ? 0 : volume;
    }
    if (loseSoundRef.current) {
      loseSoundRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 播放音效的方法
  const playSpinSound = () => {
    if (isMuted || !isPlaying) return;

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
    console.log('🎉 playWinSound 被调用', { isMuted, isPlaying });
    if (isMuted || !isPlaying) {
      console.log('🔇 音效被跳过 - 静音或BGM关闭');
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
    console.log('😔 playLoseSound 被调用', { isMuted, isPlaying });
    if (isMuted || !isPlaying) {
      console.log('🔇 音效被跳过 - 静音或BGM关闭');
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-okx-dark/90 backdrop-blur-sm rounded-xl p-4 border border-okx-border">
      <div className="flex items-center space-x-3">
        {/* BGM控制按钮 */}
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors ${
            isPlaying 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
          title={isPlaying ? '暂停BGM' : '播放BGM'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* 静音按钮 */}
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors ${
            isMuted 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
          }`}
          title={isMuted ? '取消静音' : '静音'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* 音量滑块 */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-okx-muted">🎵</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-okx-gray rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
            }}
          />
          <span className="text-xs text-okx-muted w-8">{Math.round(volume * 100)}%</span>
        </div>

        {/* BGM标题和状态 */}
        <div className="text-xs text-okx-muted">
          <div>🎵 游戏BGM</div>
          <div className="text-xs text-gray-500">
            {bgmLoaded ? '音频文件' : '生成音效'}
          </div>
          {isPlaying && (
            <div className="flex items-center space-x-1 mt-1">
              <div className={`w-1 h-1 rounded-full animate-pulse ${
                currentlyPlaying === 'bgm' ? 'bg-green-400' :
                currentlyPlaying === 'win' ? 'bg-yellow-400' :
                currentlyPlaying === 'lose' ? 'bg-red-400' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs">
                {currentlyPlaying === 'bgm' ? 'BGM播放中' :
                 currentlyPlaying === 'win' ? '中奖音效' :
                 currentlyPlaying === 'lose' ? '未中奖音效' : '待机'}
              </span>
            </div>
          )}
        </div>
      </div>
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
