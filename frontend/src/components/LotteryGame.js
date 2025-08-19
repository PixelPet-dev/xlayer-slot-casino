import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Web3Config from '../config/web3';
import LotteryResultModal from './LotteryResultModal';
import SlotReels from './SlotReels';
import AudioControls from './AudioControls';
import audioManager from '../utils/audioManager';

const LotteryGame = ({ account, onGameComplete }) => {
  const { t } = useTranslation();
  const [gameConfig, setGameConfig] = useState(null);
  const [quickBetOptions, setQuickBetOptions] = useState([]);
  const [payoutRates, setPayoutRates] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [userBalance, setUserBalance] = useState('0');
  const [userAllowance, setUserAllowance] = useState('0');
  
  const [betAmount, setBetAmount] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [error, setError] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // 转轮动画状态
  const [reelSymbols, setReelSymbols] = useState(['0', '0', '0']);
  const [isReelSpinning, setIsReelSpinning] = useState(false);

  useEffect(() => {
    loadGameData();
    loadGameHistory();
    const interval = setInterval(loadUserBalance, 10000); // 每10秒更新余额
    return () => clearInterval(interval);
  }, [account]);

  // 加载游戏数据
  const loadGameData = async () => {
    try {
      const web3 = Web3Config.getWeb3();
      const contract = new web3.eth.Contract(
        Web3Config.CONTRACT_CONFIG.abi,
        Web3Config.CONTRACT_CONFIG.address
      );

      // 获取游戏配置
      const config = await contract.methods.gameConfig().call();
      setGameConfig(config);

      // 获取快捷下注选项
      const options = await contract.methods.getQuickBetOptions().call();
      setQuickBetOptions(options);

      // 获取赔率
      const rates = await contract.methods.getAllPayoutRates().call();
      setPayoutRates(rates);

      // 获取当前代币合约
      let tokenAddress;
      try {
        tokenAddress = await contract.methods.currentToken().call();
      } catch (error) {
        tokenAddress = process.env.REACT_APP_TOKEN_ADDRESS || '0x181236a3422aB68d70728fF9F35a834E7c6b5551';
      }
      setCurrentToken(tokenAddress);

      // 获取代币信息
      if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
        await loadTokenInfo(tokenAddress);
        await loadUserBalance(tokenAddress);
      }

      // 生成模拟结果并初始化转轮
      const simulation = await contract.methods.simulateLottery(Date.now()).call();
      setSimulationResult(simulation);
      setReelSymbols(simulation.map(s => s.toString()));
    } catch (error) {
      console.error('Load game data failed:', error);
      setError(t('game.loadGameDataFailed'));
    }
  };

  // 加载代币信息
  const loadTokenInfo = async (tokenAddress) => {
    try {
      const web3 = Web3Config.getWeb3();
      const tokenContract = new web3.eth.Contract(Web3Config.ERC20_ABI, tokenAddress);

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.methods.name().call(),
        tokenContract.methods.symbol().call(),
        tokenContract.methods.decimals().call()
      ]);

      setTokenInfo({ name, symbol, decimals, address: tokenAddress });
    } catch (error) {
      console.error('Load token info failed:', error);
    }
  };

  // 加载用户余额和授权
  const loadUserBalance = async (tokenAddress = currentToken) => {
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') return;

    try {
      const web3 = Web3Config.getWeb3();
      const tokenContract = new web3.eth.Contract(Web3Config.ERC20_ABI, tokenAddress);

      const [balance, allowance] = await Promise.all([
        tokenContract.methods.balanceOf(account).call(),
        tokenContract.methods.allowance(account, Web3Config.CONTRACT_CONFIG.address).call()
      ]);

      setUserBalance(balance);
      setUserAllowance(allowance);
    } catch (error) {
      console.error('加载用户余额失败:', error);
    }
  };

  // 加载游戏记录
  const loadGameHistory = async () => {
    if (!account) {
      console.log('没有连接钱包，跳过加载游戏记录');
      return;
    }

    setHistoryLoading(true);
    try {
      console.log('开始加载游戏记录，账户:', account);

      const web3 = Web3Config.getWeb3();
      const contract = new web3.eth.Contract(
        Web3Config.CONTRACT_CONFIG.abi,
        Web3Config.CONTRACT_CONFIG.address
      );

      console.log('合约地址:', Web3Config.CONTRACT_CONFIG.address);

      // 测试合约是否可访问
      try {
        const gameConfig = await contract.methods.gameConfig().call();
        console.log('合约状态 gameConfig:', gameConfig);
        console.log('游戏是否激活:', gameConfig.isActive);
      } catch (testError) {
        console.error('合约访问测试失败:', testError);
        setGameHistory([]);
        return;
      }

      // 获取当前区块号
      const currentBlock = await web3.eth.getBlockNumber();
      console.log('当前区块号:', currentBlock);

      // X Layer 网络限制：单次查询不能超过100个区块
      const fromBlock = Math.max(0, Number(currentBlock) - 99); // 查询最近99个区块（保险起见）
      console.log('查询区块范围:', fromBlock, 'to latest');

      // 通过事件日志获取用户游戏记录
      console.log('开始查询 GamePlayed 事件...');

      // 分步查询，先不使用过滤器
      const events = await contract.getPastEvents('GamePlayed', {
        fromBlock: fromBlock,
        toBlock: 'latest'
      });

      console.log('查询到的所有事件:', events.length);

      // 手动过滤用户事件
      const userEvents = events.filter(event => {
        const eventPlayer = event.returnValues.player;
        return eventPlayer && eventPlayer.toLowerCase() === account.toLowerCase();
      });

      console.log('找到用户事件数量:', userEvents.length);

      if (userEvents.length === 0) {
        console.log('没有找到用户的游戏记录');
        setGameHistory([]);
        return;
      }

      // 转换事件数据为游戏记录格式
      const gameHistory = userEvents.slice(-10).map((event) => {
        console.log('处理事件:', event);
        const { player, gameId, symbols, betAmount, winAmount, tokenContract } = event.returnValues;

        const record = {
          gameId: `${event.blockNumber}_${event.transactionIndex}`,
          player: player,
          symbols: Array.isArray(symbols) ? symbols : [symbols],
          betAmount: betAmount ? betAmount.toString() : '0',
          winAmount: winAmount ? winAmount.toString() : '0',
          timestamp: Date.now().toString(), // 使用当前时间作为时间戳
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };

        console.log('转换后的记录:', record);
        return record;
      }).reverse(); // 最新的在前面

      console.log('最终游戏记录:', gameHistory);
      setGameHistory(gameHistory);
    } catch (error) {
      console.error('加载游戏记录失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      console.error('完整错误对象:', JSON.stringify(error, null, 2));

      // 尝试最简化的查询方式
      try {
        console.log('尝试最简化查询...');
        const web3 = Web3Config.getWeb3();
        const contract = new web3.eth.Contract(
          Web3Config.CONTRACT_CONFIG.abi,
          Web3Config.CONTRACT_CONFIG.address
        );

        // 只查询最近50个区块
        const currentBlock = await web3.eth.getBlockNumber();
        const fromBlock = Math.max(0, Number(currentBlock) - 50);

        console.log('最简化查询区块范围:', fromBlock, 'to', currentBlock);

        const events = await contract.getPastEvents('GamePlayed', {
          fromBlock: fromBlock,
          toBlock: Number(currentBlock)
        });

        console.log('最简化查询找到事件:', events.length);

        // 过滤出当前用户的记录
        const userEvents = events.filter(event =>
          event.returnValues.player &&
          event.returnValues.player.toLowerCase() === account.toLowerCase()
        );

        console.log('最简化查询找到用户事件:', userEvents.length);

        if (userEvents.length > 0) {
          const gameHistory = userEvents.slice(-10).map((event) => ({
            gameId: `${event.blockNumber}_${event.transactionIndex}`,
            player: event.returnValues.player,
            symbols: Array.isArray(event.returnValues.symbols) ? event.returnValues.symbols : [event.returnValues.symbols],
            betAmount: event.returnValues.betAmount ? event.returnValues.betAmount.toString() : '0',
            winAmount: event.returnValues.winAmount ? event.returnValues.winAmount.toString() : '0',
            timestamp: Date.now().toString(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash
          })).reverse();

          setGameHistory(gameHistory);
        } else {
          // 如果还是没有找到，显示一个提示信息
          console.log('没有找到任何游戏记录，可能是新用户或者还没有游戏');
          setGameHistory([]);
        }
      } catch (fallbackError) {
        console.error('最简化查询也失败了:', fallbackError);
        console.error('最终错误详情:', JSON.stringify(fallbackError, null, 2));

        // 最后的备用方案：如果是开发环境，显示一些模拟数据
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'pixelpet-dev.github.io') {
          console.log('显示模拟游戏记录用于测试');
          const mockHistory = [
            {
              gameId: 'mock_1',
              player: account,
              symbols: ['0', '1', '2'],
              betAmount: '1000000000000000000', // 1 token
              winAmount: '0',
              timestamp: (Date.now() - 300000).toString(), // 5分钟前
              blockNumber: 12345,
              transactionHash: '0x1234567890abcdef'
            },
            {
              gameId: 'mock_2',
              player: account,
              symbols: ['1', '1', '1'],
              betAmount: '2000000000000000000', // 2 tokens
              winAmount: '10000000000000000000', // 10 tokens
              timestamp: (Date.now() - 600000).toString(), // 10分钟前
              blockNumber: 12344,
              transactionHash: '0xabcdef1234567890'
            }
          ];
          setGameHistory(mockHistory);
        } else {
          setGameHistory([]);
        }
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // 授权代币
  const handleApprove = async () => {
    if (!currentToken || !betAmount) {
      setError('请等待游戏数据加载完成或输入下注金额');
      return;
    }

    // 播放点击音效
    audioManager.playSound('click');

    setIsApproving(true);
    setError(null);

    try {
      const web3 = Web3Config.getWeb3();
      const tokenContract = new web3.eth.Contract(Web3Config.ERC20_ABI, currentToken);
      const amount = Web3Config.parseTokenAmount(betAmount);

      const gasEstimate = await tokenContract.methods
        .approve(Web3Config.CONTRACT_CONFIG.address, amount)
        .estimateGas({ from: account });

      // 获取当前 Gas 价格
      const gasPrice = await web3.eth.getGasPrice();

      await tokenContract.methods
        .approve(Web3Config.CONTRACT_CONFIG.address, amount)
        .send({
          from: account,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: gasPrice,
        });

      await loadUserBalance();
    } catch (error) {
      console.error('授权失败:', error);
      setError('授权失败: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  // 开始抽奖
  const handlePlay = async () => {
    if (!betAmount || !gameConfig) return;

    // 播放点击音效
    audioManager.playSound('click');

    const amount = Web3Config.parseTokenAmount(betAmount);

    // 验证下注金额
    if (BigInt(amount) < BigInt(gameConfig.minBet)) {
      setError(`下注金额不能少于 ${Web3Config.formatTokenAmountInteger(gameConfig.minBet)} ${tokenInfo?.symbol || 'tokens'}`);
      return;
    }

    if (BigInt(amount) > BigInt(gameConfig.maxBet)) {
      setError(`下注金额不能超过 ${Web3Config.formatTokenAmountInteger(gameConfig.maxBet)} ${tokenInfo?.symbol || 'tokens'}`);
      return;
    }

    // 验证余额
    if (BigInt(amount) > BigInt(userBalance)) {
      setError('余额不足');
      return;
    }

    // 验证授权
    if (BigInt(amount) > BigInt(userAllowance)) {
      setError('请先授权代币');
      return;
    }

    // 第一阶段：准备交易，但不开始转轮
    setIsPlaying(true);
    setError(null);
    setGameResult(null);

    try {
      const web3 = Web3Config.getWeb3();
      const contract = new web3.eth.Contract(
        Web3Config.CONTRACT_CONFIG.abi,
        Web3Config.CONTRACT_CONFIG.address
      );

      const gasEstimate = await contract.methods
        .playLottery(amount)
        .estimateGas({ from: account });

      // 获取当前 Gas 价格
      const gasPrice = await web3.eth.getGasPrice();

      // 第二阶段：发送交易，用户确认支付后才开始转轮
      const receipt = await contract.methods
        .playLottery(amount)
        .send({
          from: account,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: gasPrice,
        });

      // 第三阶段：交易确认成功，现在开始转轮动画
      setIsReelSpinning(true);

      // 第四阶段：解析游戏结果
      const gameEvent = receipt.events.GamePlayed;
      if (gameEvent) {
        const { symbols, betAmount: betAmt, winAmount } = gameEvent.returnValues;
        const result = {
          symbols: symbols.map(s => parseInt(s)),
          betAmount: betAmt,
          winAmount: winAmount,
          isWin: BigInt(winAmount) > BigInt(0)
        };

        // 设置转轮最终结果
        setReelSymbols(symbols.map(s => s.toString()));
        setGameResult(result);

        // 让转轮转动一段时间后再停止
        setTimeout(() => {
          setIsReelSpinning(false);

          // 等待转轮停止动画完成后显示结果弹窗和播放音效
          setTimeout(() => {
            // 根据结果播放不同音效
            if (result.isWin) {
              // 检查是否是大奖（三个相同符号）
              const isJackpot = symbols[0] === symbols[1] && symbols[1] === symbols[2];
              if (isJackpot) {
                audioManager.playSound('jackpot');
              } else {
                audioManager.playSound('win');
              }
            }

            setShowResultModal(true);
            setIsPlaying(false);
          }, 2500);
        }, 1500); // 转轮转动1.5秒后开始停止
      } else {
        // 如果没有获取到游戏事件，立即停止
        setIsReelSpinning(false);
        setIsPlaying(false);
      }

      await loadUserBalance();
      await loadGameHistory(); // 刷新游戏记录
      onGameComplete();
    } catch (error) {
      console.error('抽奖失败:', error);
      setError('抽奖失败: ' + error.message);

      // 发生错误时立即停止转轮
      setIsReelSpinning(false);
      setIsPlaying(false);
    }
  };

  // 快捷下注
  const handleQuickBet = (amount) => {
    setBetAmount(Web3Config.formatTokenAmountInteger(amount));
  };

  // 转轮动画完成回调
  const handleSpinComplete = () => {
    console.log('转轮动画完成');
  };

  if (!gameConfig || !tokenInfo) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">{t('game.loadingGameData')}</p>
        </div>
      </div>
    );
  }

  if (!currentToken || currentToken === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('game.gameNotAvailable')}</h3>
          <p className="text-gray-300">{t('game.gameNotAvailableDesc')}</p>
        </div>
      </div>
    );
  }

  const needsApproval = betAmount && BigInt(Web3Config.parseTokenAmount(betAmount)) > BigInt(userAllowance);

  return (
    <div className="space-y-6">
      {/* 音频控制组件 */}
      <AudioControls />

      {/* 游戏主界面 */}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{t('game.title')}</h2>
          <p className="text-gray-300">
            {t('game.subtitle', { symbol: tokenInfo.symbol })}
          </p>
        </div>

        {/* 老虎机转轮 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            {isReelSpinning ? '🎰 转轮旋转中...' : '🎯 准备开始'}
          </h3>
          <SlotReels
            isSpinning={isReelSpinning}
            symbols={reelSymbols}
            onSpinComplete={handleSpinComplete}
          />
        </div>

        {/* 用户余额 */}
        <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-blue-200">钱包余额:</span>
            <span className="text-blue-100 font-semibold">
              {Web3Config.formatTokenAmountInteger(userBalance)} {tokenInfo.symbol}
            </span>
          </div>
        </div>

        {/* 下注区域 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              下注金额 ({tokenInfo.symbol})
            </label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder={`最小: ${Web3Config.formatTokenAmountInteger(gameConfig.minBet)}, 最大: ${Web3Config.formatTokenAmountInteger(gameConfig.maxBet)}`}
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isPlaying || isApproving}
            />
          </div>

          {/* 快捷下注选项 */}
          <div>
            <p className="text-sm text-gray-200 mb-2">快捷下注:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {quickBetOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickBet(option)}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                  disabled={isPlaying || isApproving}
                >
                  {Web3Config.formatTokenAmountInteger(option)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-3">
          {needsApproval && (
            <button
              onClick={handleApprove}
              disabled={isApproving || !betAmount}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              {isApproving ? '授权中...' : `授权 ${betAmount} ${tokenInfo.symbol}`}
            </button>
          )}

          <button
            onClick={handlePlay}
            disabled={isPlaying || !betAmount || needsApproval || !gameConfig.isActive}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isPlaying ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isReelSpinning ? '🎰 转轮旋转中...' : '💳 等待交易确认...'}</span>
              </div>
            ) : (
              `开始抽奖 (${betAmount || '0'} ${tokenInfo.symbol})`
            )}
          </button>
        </div>


      </div>

      {/* 赔率表 */}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
        <h3 className="text-xl font-bold text-white mb-4 text-center">赔率表</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {payoutRates.map((rate, index) => (
            <div key={index} className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
              <div className="text-2xl mb-2">
                {Web3Config.SYMBOL_EMOJIS[Web3Config.SYMBOL_NAMES[index]]}
              </div>
              <div className="text-white font-semibold">
                {(parseInt(rate) / 100).toFixed(1)}x
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          * 三个相同符号获得完整赔率，两个相同符号获得1/4赔率
        </p>
      </div>

      {/* 游戏记录 - 移动到赔率表下方 */}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">🕒 游戏记录</h3>
          <button
            onClick={loadGameHistory}
            disabled={historyLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm px-3 py-1 rounded transition-colors"
          >
            {historyLoading ? '🔄' : '🔄 刷新'}
          </button>
        </div>

        {historyLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 animate-spin">⏳</div>
            <p className="text-gray-300">加载游戏记录中...</p>
          </div>
        ) : gameHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎲</div>
            <p className="text-gray-300">暂无游戏记录</p>
            <p className="text-xs text-gray-400 mt-2">开始你的第一次游戏吧！</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {gameHistory.map((record, index) => {
              const isWin = BigInt(record.winAmount) > BigInt(0);
              const getSymbolDisplay = (symbols) => {
                if (!symbols || !Array.isArray(symbols)) return '❓ ❓ ❓';
                return symbols.slice(0, 3).map((s) => {
                  const symbolIndex = parseInt(s);
                  return Web3Config.SYMBOL_EMOJIS[Web3Config.SYMBOL_NAMES[symbolIndex]] || '❓';
                }).join(' ');
              };

              return (
                <div
                  key={record.gameId || index}
                  className={`bg-white bg-opacity-5 rounded-lg p-4 border-l-4 ${
                    isWin ? 'border-green-400' : 'border-red-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getSymbolDisplay(record.symbols)}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">
                          下注: {Web3Config.formatTokenAmountInteger(record.betAmount)} {tokenInfo?.symbol || 'tokens'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(Number(record.timestamp) * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isWin ? (
                        <div className="text-green-300 font-bold">
                          +{Web3Config.formatTokenAmountInteger(record.winAmount)} {tokenInfo?.symbol || 'tokens'}
                        </div>
                      ) : (
                        <div className="text-red-300">
                          <span>未中奖</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 抽奖结果弹窗 */}
      <LotteryResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        gameResult={gameResult}
        tokenInfo={tokenInfo}
      />
    </div>
  );
};

export default LotteryGame;
