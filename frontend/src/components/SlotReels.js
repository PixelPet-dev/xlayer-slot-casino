import React, { useState, useEffect } from 'react';
import Web3Config from '../config/web3';
import audioManager from '../utils/audioManager';

const SlotReels = ({ isSpinning, symbols, onSpinComplete }) => {
  const [currentSymbols, setCurrentSymbols] = useState(['0', '0', '0']);
  const [reelStates, setReelStates] = useState([false, false, false]);
  const [spinPhase, setSpinPhase] = useState('idle'); // idle, spinning, stopping, stopped

  useEffect(() => {
    if (isSpinning) {
      startSpinAnimation();
    } else {
      stopSpinAnimation();
    }
  }, [isSpinning]);

  const startSpinAnimation = () => {
    setSpinPhase('spinning');
    setReelStates([true, true, true]);

    // 播放转轮音效序列
    audioManager.playSpinSequence();

    // 快速随机切换符号
    const spinInterval = setInterval(() => {
      setCurrentSymbols([
        Math.floor(Math.random() * 8).toString(),
        Math.floor(Math.random() * 8).toString(),
        Math.floor(Math.random() * 8).toString()
      ]);
    }, 100);

    // 模拟转轮逐个停止
    setTimeout(() => {
      setSpinPhase('stopping');
      
      // 第一个转轮停止
      setTimeout(() => {
        setReelStates([false, true, true]);
        setCurrentSymbols(prev => [symbols[0], prev[1], prev[2]]);
        audioManager.playSound('stop'); // 播放停止音效
      }, 500);

      // 第二个转轮停止
      setTimeout(() => {
        setReelStates([false, false, true]);
        setCurrentSymbols(prev => [symbols[0], symbols[1], prev[2]]);
        audioManager.playSound('stop'); // 播放停止音效
      }, 1000);

      // 第三个转轮停止
      setTimeout(() => {
        setReelStates([false, false, false]);
        setCurrentSymbols(symbols);
        setSpinPhase('stopped');
        clearInterval(spinInterval);

        // 停止转轮音效序列
        audioManager.stopSpinSequence();

        // 播放停止动画
        setTimeout(() => {
          setSpinPhase('idle');
          if (onSpinComplete) {
            onSpinComplete();
          }
        }, 500);
      }, 1500);
    }, 1000);
  };

  const stopSpinAnimation = () => {
    if (spinPhase === 'idle') {
      setCurrentSymbols(symbols);
    }
  };

  const getSymbolEmoji = (symbolIndex) => {
    const symbolName = Web3Config.SYMBOL_NAMES[parseInt(symbolIndex)];
    return Web3Config.SYMBOL_EMOJIS[symbolName] || '❓';
  };

  const getReelClassName = (index) => {
    const baseClass = "w-20 h-20 bg-white bg-opacity-20 rounded-lg flex items-center justify-center border-2 transition-all duration-300";
    
    if (reelStates[index]) {
      return `${baseClass} border-yellow-400 slot-spinning slot-glow`;
    } else if (spinPhase === 'stopped' && !reelStates[index]) {
      return `${baseClass} border-green-400 slot-bounce`;
    } else {
      return `${baseClass} border-purple-400`;
    }
  };

  const getMachineClassName = () => {
    const baseClass = "slot-machine-container bg-black rounded-lg p-6 border-4";
    
    if (spinPhase === 'spinning') {
      return `${baseClass} border-yellow-400 spinning`;
    } else if (spinPhase === 'stopped') {
      return `${baseClass} border-green-400`;
    } else {
      return `${baseClass} border-purple-400`;
    }
  };

  return (
    <div className="flex justify-center mb-8">
      <div className={getMachineClassName()}>
        {/* 转轮背景效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg"></div>
        
        {/* 转轮容器 */}
        <div className="relative flex space-x-4 slot-reel-3d">
          {currentSymbols.map((symbol, index) => (
            <div key={index} className="relative">
              {/* 转轮背景光效 */}
              {reelStates[index] && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-lg animate-pulse"></div>
              )}
              
              {/* 符号容器 */}
              <div className={getReelClassName(index)}>
                <div className={`text-4xl slot-symbol-3d ${reelStates[index] ? 'symbol-flipping' : ''}`}>
                  {getSymbolEmoji(symbol)}
                </div>
              </div>
              
              {/* 转轮编号 */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="text-xs text-gray-400 font-mono">
                  {index + 1}
                </div>
              </div>
              
              {/* 停止时的特效 */}
              {spinPhase === 'stopped' && !reelStates[index] && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-xs font-bold text-black">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 机器状态指示器 */}
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${
            spinPhase === 'spinning' ? 'bg-yellow-400 animate-pulse' :
            spinPhase === 'stopping' ? 'bg-orange-400 animate-pulse' :
            spinPhase === 'stopped' ? 'bg-green-400' :
            'bg-gray-400'
          }`}></div>
        </div>
        
        {/* 转轮分隔线 */}
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        {/* 侧边装饰 */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-r-full opacity-50"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-l-full opacity-50"></div>
      </div>
    </div>
  );
};

export default SlotReels;
