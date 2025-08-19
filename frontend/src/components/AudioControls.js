import React, { useState, useEffect } from 'react';
import audioManager from '../utils/audioManager';

const AudioControls = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    // 不在组件挂载时自动播放，等待用户交互
    // audioManager.playBackgroundMusic();
    // setIsMusicPlaying(true);
  }, []);

  const toggleSound = () => {
    const newState = audioManager.toggleSound();
    setIsEnabled(newState);
    setIsMusicPlaying(newState ? isMusicPlaying : false);
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      audioManager.stopBackgroundMusic();
      setIsMusicPlaying(false);
    } else {
      try {
        audioManager.playBackgroundMusic();
        setIsMusicPlaying(true);
      } catch (error) {
        console.warn('音频播放失败，可能需要用户交互:', error);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  const testSound = (soundName) => {
    audioManager.playSound(soundName);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* 主控制面板 */}
      <div className="bg-black/80 backdrop-blur-lg rounded-lg border border-purple-400/30 transition-all duration-300">
        {/* 标题栏 - 始终显示 */}
        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors rounded-lg" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{isMusicPlaying && isEnabled ? '🎵' : '🔇'}</span>
            {!isMinimized && <h3 className="text-white font-semibold text-sm">音效控制</h3>}
          </div>
          <button className="text-white hover:text-purple-300 transition-colors text-sm">
            {isMinimized ? '⬇️' : '⬆️'}
          </button>
        </div>

        {/* 详细控制面板 - 可收起 */}
        {!isMinimized && (
          <div className="px-3 pb-3 border-t border-purple-400/20">
            {/* 音效开关 */}
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={toggleSound}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isEnabled
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <span className="text-white text-xs">
                  {isEnabled ? '🔊' : '🔇'}
                </span>
              </button>
              <span className="text-gray-300 text-xs">
                {isEnabled ? '音效开启' : '音效关闭'}
              </span>
            </div>

        {/* 背景音乐控制 */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={toggleMusic}
            disabled={!isEnabled}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isMusicPlaying && isEnabled
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            <span className="text-white text-xs">
              {isMusicPlaying && isEnabled ? '🎵' : '⏸️'}
            </span>
          </button>
          <span className="text-gray-300 text-xs">
            {isMusicPlaying && isEnabled ? 'BGM播放中' : 'BGM已暂停'}
          </span>
        </div>

        {/* 音量控制 */}
        <div className="mb-3">
          <label className="text-gray-300 text-xs block mb-1">音量</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            disabled={!isEnabled}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${volume * 100}%, #4B5563 ${volume * 100}%, #4B5563 100%)`
            }}
          />
          <div className="text-gray-400 text-xs text-center mt-1">
            {Math.round(volume * 100)}%
          </div>
        </div>

        {/* 音效测试按钮 */}
        <div className="space-y-1">
          <div className="text-gray-300 text-xs mb-2">音效测试:</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => testSound('click')}
              disabled={!isEnabled}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              🔘 点击
            </button>
            <button
              onClick={() => testSound('spin')}
              disabled={!isEnabled}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              🎰 转轮
            </button>
            <button
              onClick={() => testSound('win')}
              disabled={!isEnabled}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              💰 中奖
            </button>
            <button
              onClick={() => testSound('jackpot')}
              disabled={!isEnabled}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              🎊 大奖
            </button>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* 音效状态指示器 */}
      <div className="mt-2 flex justify-center">
        <div className={`w-3 h-3 rounded-full ${
          isEnabled && isMusicPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
        }`}></div>
      </div>
    </div>
  );
};

export default AudioControls;
