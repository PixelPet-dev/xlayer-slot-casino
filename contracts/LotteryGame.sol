// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LotteryGame
 * @dev 支持代币切换的抽奖游戏合约
 * 管理员可以随时更换游戏使用的代币合约
 */
contract LotteryGame is Ownable, Pausable, ReentrancyGuard {
    
    // 当前使用的代币合约
    IERC20 public currentToken;
    
    // 水果机符号
    enum Symbol { Cherry, Lemon, Orange, Plum, Bell, Bar, Seven, Jackpot }
    
    // 游戏配置
    struct GameConfig {
        uint256 minBet;
        uint256 maxBet;
        uint256 houseFeePercentage; // 基数10000
        bool isActive;
    }
    
    // 用户信息
    struct UserInfo {
        bool isRegistered;
        string nickname;
        uint256 registrationTime;
        uint256 totalBets;
        uint256 totalWins;
        uint256 gamesPlayed;
        uint256 pendingRewards; // 待领取奖励
    }
    
    // 游戏记录
    struct GameRecord {
        address player;
        uint256 betAmount;
        uint256 winAmount;
        uint256 timestamp;
        Symbol[3] symbols;
        address tokenContract; // 记录使用的代币合约
    }
    
    // 快捷下注选项
    uint256[] public quickBetOptions;
    
    // 状态变量
    GameConfig public gameConfig;
    mapping(Symbol => uint256) public payoutRates;
    mapping(address => UserInfo) public users;
    mapping(uint256 => GameRecord) public gameRecords;
    mapping(address => uint256[]) public playerGameHistory;
    uint256 public totalGameRecords;
    uint256 public totalUsers;
    uint256 private nonce;
    
    // 事件
    event TokenContractUpdated(address indexed oldToken, address indexed newToken);
    event UserRegistered(address indexed user, string nickname);
    event GamePlayed(
        address indexed player,
        uint256 indexed gameId,
        Symbol[3] symbols,
        uint256 betAmount,
        uint256 winAmount,
        address tokenContract
    );
    event RewardsClaimed(address indexed player, uint256 amount, address tokenContract);
    event QuickBetOptionsUpdated(uint256[] options);
    event GameConfigUpdated(uint256 minBet, uint256 maxBet, uint256 houseFee, bool isActive);
    
    modifier onlyRegisteredUser() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier gameIsActive() {
        require(gameConfig.isActive, "Game is not active");
        _;
    }
    
    modifier validBetAmount(uint256 amount) {
        require(amount >= gameConfig.minBet, "Bet amount too low");
        require(amount <= gameConfig.maxBet, "Bet amount too high");
        _;
    }
    
    constructor(
        address _tokenContract,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_tokenContract != address(0), "Token contract cannot be zero address");
        
        currentToken = IERC20(_tokenContract);
        
        // 初始化游戏配置
        gameConfig = GameConfig({
            minBet: 1 * 10**18,      // 1 token
            maxBet: 1000 * 10**18,   // 1000 tokens
            houseFeePercentage: 500,  // 5%
            isActive: true
        });
        
        // 初始化赔率
        _initializePayoutRates();
        
        // 初始化快捷下注选项
        quickBetOptions = [1 * 10**18, 5 * 10**18, 10 * 10**18, 50 * 10**18, 100 * 10**18];
    }
    
    /**
     * @dev 更换代币合约 (仅所有者)
     */
    function updateTokenContract(address _newTokenContract) external onlyOwner {
        require(_newTokenContract != address(0), "New token contract cannot be zero address");
        require(_newTokenContract != address(currentToken), "Same token contract");
        
        address oldToken = address(currentToken);
        currentToken = IERC20(_newTokenContract);
        
        emit TokenContractUpdated(oldToken, _newTokenContract);
    }
    
    /**
     * @dev 用户注册
     */
    function registerUser(string calldata nickname) external whenNotPaused {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(bytes(nickname).length > 0 && bytes(nickname).length <= 50, "Invalid nickname length");
        
        users[msg.sender] = UserInfo({
            isRegistered: true,
            nickname: nickname,
            registrationTime: block.timestamp,
            totalBets: 0,
            totalWins: 0,
            gamesPlayed: 0,
            pendingRewards: 0
        });
        
        totalUsers++;
        emit UserRegistered(msg.sender, nickname);
    }
    
    /**
     * @dev 抽奖游戏
     */
    function playLottery(uint256 betAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyRegisteredUser 
        gameIsActive 
        validBetAmount(betAmount) 
    {
        // 验证用户代币余额
        require(currentToken.balanceOf(msg.sender) >= betAmount, "Insufficient token balance");
        
        // 验证用户授权
        require(currentToken.allowance(msg.sender, address(this)) >= betAmount, "Insufficient allowance");
        
        // 转移下注代币到合约
        require(currentToken.transferFrom(msg.sender, address(this), betAmount), "Token transfer failed");
        
        // 生成随机结果
        Symbol[3] memory symbols = _generateSpinResult();
        
        // 计算奖金
        uint256 winAmount = _calculateWinAmount(symbols, betAmount);
        
        // 更新用户统计
        users[msg.sender].totalBets += betAmount;
        users[msg.sender].gamesPlayed++;
        
        if (winAmount > 0) {
            users[msg.sender].totalWins += winAmount;
            users[msg.sender].pendingRewards += winAmount;
        }
        
        // 记录游戏
        uint256 gameId = totalGameRecords++;
        gameRecords[gameId] = GameRecord({
            player: msg.sender,
            betAmount: betAmount,
            winAmount: winAmount,
            timestamp: block.timestamp,
            symbols: symbols,
            tokenContract: address(currentToken)
        });
        
        playerGameHistory[msg.sender].push(gameId);
        
        emit GamePlayed(msg.sender, gameId, symbols, betAmount, winAmount, address(currentToken));
    }
    
    /**
     * @dev 领取奖励
     */
    function claimRewards() external nonReentrant whenNotPaused onlyRegisteredUser {
        uint256 pendingAmount = users[msg.sender].pendingRewards;
        require(pendingAmount > 0, "No pending rewards");
        
        // 检查合约余额
        require(currentToken.balanceOf(address(this)) >= pendingAmount, "Insufficient contract balance");
        
        // 清零待领取奖励
        users[msg.sender].pendingRewards = 0;
        
        // 转移奖励给用户
        require(currentToken.transfer(msg.sender, pendingAmount), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, pendingAmount, address(currentToken));
    }
    
    /**
     * @dev 生成旋转结果
     */
    function _generateSpinResult() private returns (Symbol[3] memory symbols) {
        for (uint256 i = 0; i < 3; i++) {
            symbols[i] = _generateRandomSymbol();
        }
    }
    
    /**
     * @dev 生成随机符号
     */
    function _generateRandomSymbol() private returns (Symbol) {
        nonce++;
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            nonce,
            blockhash(block.number - 1)
        ))) % 1000;
        
        if (randomValue < 300) return Symbol.Cherry;      // 30%
        else if (randomValue < 500) return Symbol.Lemon;  // 20%
        else if (randomValue < 650) return Symbol.Orange; // 15%
        else if (randomValue < 750) return Symbol.Plum;   // 10%
        else if (randomValue < 850) return Symbol.Bell;   // 10%
        else if (randomValue < 920) return Symbol.Bar;    // 7%
        else if (randomValue < 980) return Symbol.Seven;  // 6%
        else return Symbol.Jackpot;                       // 2%
    }
    
    /**
     * @dev 计算奖金
     */
    function _calculateWinAmount(Symbol[3] memory symbols, uint256 betAmount) private view returns (uint256) {
        uint256 multiplier = 0;
        
        // 三个相同符号
        if (symbols[0] == symbols[1] && symbols[1] == symbols[2]) {
            multiplier = payoutRates[symbols[0]];
        }
        // 两个相同符号
        else if (symbols[0] == symbols[1] || symbols[1] == symbols[2] || symbols[0] == symbols[2]) {
            Symbol matchedSymbol = symbols[0] == symbols[1] ? symbols[0] : 
                                 (symbols[1] == symbols[2] ? symbols[1] : symbols[0]);
            multiplier = payoutRates[matchedSymbol] / 4; // 两个相同符号奖励为三个的1/4
        }
        
        if (multiplier == 0) return 0;
        
        uint256 winAmount = (betAmount * multiplier) / 100;
        
        // 扣除平台费用
        uint256 houseFee = (winAmount * gameConfig.houseFeePercentage) / 10000;
        return winAmount - houseFee;
    }
    
    /**
     * @dev 初始化赔率
     */
    function _initializePayoutRates() private {
        payoutRates[Symbol.Cherry] = 200;    // 2x
        payoutRates[Symbol.Lemon] = 300;     // 3x
        payoutRates[Symbol.Orange] = 500;    // 5x
        payoutRates[Symbol.Plum] = 800;      // 8x
        payoutRates[Symbol.Bell] = 1000;     // 10x
        payoutRates[Symbol.Bar] = 1500;      // 15x
        payoutRates[Symbol.Seven] = 2500;    // 25x
        payoutRates[Symbol.Jackpot] = 10000; // 100x
    }
    
    // ============ 管理功能 ============
    
    /**
     * @dev 更新游戏配置
     */
    function updateGameConfig(
        uint256 _minBet,
        uint256 _maxBet,
        uint256 _houseFeePercentage,
        bool _isActive
    ) external onlyOwner {
        require(_minBet > 0, "Min bet must be greater than zero");
        require(_maxBet >= _minBet, "Max bet must be greater than or equal to min bet");
        require(_houseFeePercentage <= 2000, "House fee too high"); // 最大20%
        
        gameConfig.minBet = _minBet;
        gameConfig.maxBet = _maxBet;
        gameConfig.houseFeePercentage = _houseFeePercentage;
        gameConfig.isActive = _isActive;
        
        emit GameConfigUpdated(_minBet, _maxBet, _houseFeePercentage, _isActive);
    }
    
    /**
     * @dev 更新快捷下注选项
     */
    function updateQuickBetOptions(uint256[] calldata _options) external onlyOwner {
        require(_options.length > 0, "Options cannot be empty");
        
        quickBetOptions = _options;
        emit QuickBetOptionsUpdated(_options);
    }
    
    /**
     * @dev 更新赔率
     */
    function updatePayoutRate(Symbol symbol, uint256 rate) external onlyOwner {
        require(rate > 0 && rate <= 20000, "Invalid payout rate");
        payoutRates[symbol] = rate;
    }
    
    /**
     * @dev 紧急提取代币
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= currentToken.balanceOf(address(this)), "Insufficient balance");
        require(currentToken.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev 向合约存入代币 (用于奖励池)
     */
    function depositTokens(uint256 amount) external onlyOwner {
        require(currentToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");
    }
    
    // ============ 查询功能 ============
    
    /**
     * @dev 获取快捷下注选项
     */
    function getQuickBetOptions() external view returns (uint256[] memory) {
        return quickBetOptions;
    }
    
    /**
     * @dev 获取用户游戏历史
     */
    function getPlayerGameHistory(address player) external view returns (uint256[] memory) {
        return playerGameHistory[player];
    }
    
    /**
     * @dev 获取所有赔率
     */
    function getAllPayoutRates() external view returns (uint256[8] memory rates) {
        for (uint256 i = 0; i < 8; i++) {
            rates[i] = payoutRates[Symbol(i)];
        }
    }

    /**
     * @dev 获取完整的游戏记录（包括 symbols）
     */
    function getGameRecord(uint256 gameId) external view returns (
        address player,
        uint256 betAmount,
        uint256 winAmount,
        uint256 timestamp,
        uint8[3] memory symbols,
        address tokenContract
    ) {
        require(gameId < totalGameRecords, "Game record does not exist");
        GameRecord storage record = gameRecords[gameId];

        // 将 Symbol 枚举转换为 uint8 数组
        uint8[3] memory symbolsArray;
        for (uint256 i = 0; i < 3; i++) {
            symbolsArray[i] = uint8(record.symbols[i]);
        }

        return (
            record.player,
            record.betAmount,
            record.winAmount,
            record.timestamp,
            symbolsArray,
            record.tokenContract
        );
    }
    
    /**
     * @dev 模拟抽奖 (只读函数，用于前端预览)
     */
    function simulateLottery(uint256 seed) external view returns (Symbol[3] memory symbols) {
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(seed, block.timestamp)));
        
        for (uint256 i = 0; i < 3; i++) {
            uint256 randomValue = uint256(keccak256(abi.encodePacked(randomSeed, i))) % 1000;
            
            if (randomValue < 300) symbols[i] = Symbol.Cherry;
            else if (randomValue < 500) symbols[i] = Symbol.Lemon;
            else if (randomValue < 650) symbols[i] = Symbol.Orange;
            else if (randomValue < 750) symbols[i] = Symbol.Plum;
            else if (randomValue < 850) symbols[i] = Symbol.Bell;
            else if (randomValue < 920) symbols[i] = Symbol.Bar;
            else if (randomValue < 980) symbols[i] = Symbol.Seven;
            else symbols[i] = Symbol.Jackpot;
        }
    }
    
    /**
     * @dev 暂停/恢复合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
