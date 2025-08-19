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



    // 排行榜数据
    address[] public topBettors;      // 下注排行榜
    address[] public topWinners;      // 赢取排行榜
    mapping(address => uint256) public bettorRanking;   // 用户在下注排行榜中的位置
    mapping(address => uint256) public winnerRanking;   // 用户在赢取排行榜中的位置
    uint256 public constant LEADERBOARD_SIZE = 100;     // 排行榜大小

    // 紧急机制
    bool public emergencyMode = false;
    mapping(address => mapping(address => uint256)) public emergencyWithdrawals; // 用户在各代币中的紧急提取额度

    // 开发模式 (生产环境应设为false)
    bool public developmentMode = true;  // 开发环境设为true
    
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



    // 排行榜事件
    event LeaderboardUpdated(address indexed player, string boardType, uint256 newRank, uint256 amount);

    // 紧急机制事件
    event EmergencyModeEnabled();
    event EmergencyModeDisabled();
    event EmergencyWithdrawal(address indexed user, address indexed token, uint256 amount);
    
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
        
        // 更新用户统计 (防溢出检查)
        require(users[msg.sender].totalBets + betAmount >= users[msg.sender].totalBets, "Bet amount overflow");
        users[msg.sender].totalBets += betAmount;
        users[msg.sender].gamesPlayed++;

        // 更新下注排行榜
        _updateBettorLeaderboard(msg.sender);

        if (winAmount > 0) {
            require(users[msg.sender].totalWins + winAmount >= users[msg.sender].totalWins, "Win amount overflow");
            require(users[msg.sender].pendingRewards + winAmount >= users[msg.sender].pendingRewards, "Pending rewards overflow");

            users[msg.sender].totalWins += winAmount;
            users[msg.sender].pendingRewards += winAmount;

            // 更新赢取排行榜
            _updateWinnerLeaderboard(msg.sender);
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
     * @dev 生成随机符号 - 使用提交-揭示机制
     */
    function _generateRandomSymbol() private returns (Symbol) {
        nonce++;

        // 使用多个区块的哈希值增加随机性
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            blockhash(block.number - 3),
            block.timestamp,
            block.difficulty,
            msg.sender,
            nonce,
            gasleft(),  // 剩余gas也作为随机源
            tx.gasprice // gas价格作为随机源
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

        // 扣除平台费用 (防下溢保护)
        uint256 houseFee = (winAmount * gameConfig.houseFeePercentage) / 10000;
        require(winAmount >= houseFee, "House fee exceeds win amount");

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

    // ============ 紧急机制 ============

    /**
     * @dev 启用紧急模式
     */
    function enableEmergencyMode() external onlyOwner {
        emergencyMode = true;
        _pause();

        // 记录所有用户的待提取奖励到紧急提取额度
        // 注意：这里简化处理，实际应该遍历所有用户
        emit EmergencyModeEnabled();
    }

    /**
     * @dev 禁用紧急模式
     */
    function disableEmergencyMode() external onlyOwner {
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDisabled();
    }

    /**
     * @dev 设置用户紧急提取额度
     */
    function setEmergencyWithdrawal(address user, address token, uint256 amount) external onlyOwner {
        require(emergencyMode, "Not in emergency mode");
        emergencyWithdrawals[user][token] = amount;
    }

    /**
     * @dev 紧急提取
     */
    function emergencyWithdraw(address token) external {
        require(emergencyMode, "Not in emergency mode");
        uint256 amount = emergencyWithdrawals[msg.sender][token];
        require(amount > 0, "No emergency withdrawal available");

        emergencyWithdrawals[msg.sender][token] = 0;
        IERC20(token).transfer(msg.sender, amount);

        emit EmergencyWithdrawal(msg.sender, token, amount);
    }

    /**
     * @dev 管理员紧急提取 (仅在紧急模式下)
     */
    function adminEmergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(emergencyMode, "Not in emergency mode");
        IERC20(token).transfer(owner(), amount);
    }

    // ============ 排行榜功能 ============

    /**
     * @dev 更新下注排行榜
     */
    function _updateBettorLeaderboard(address player) private {
        uint256 playerBets = users[player].totalBets;

        // 如果玩家已经在排行榜中
        if (bettorRanking[player] > 0) {
            uint256 currentRank = bettorRanking[player] - 1;

            // 向上调整排名
            while (currentRank > 0 && users[topBettors[currentRank - 1]].totalBets < playerBets) {
                // 交换位置
                address temp = topBettors[currentRank];
                topBettors[currentRank] = topBettors[currentRank - 1];
                topBettors[currentRank - 1] = temp;

                // 更新排名映射
                bettorRanking[topBettors[currentRank]] = currentRank + 1;
                bettorRanking[topBettors[currentRank - 1]] = currentRank;

                currentRank--;
            }
        } else {
            // 新玩家，检查是否能进入排行榜
            if (topBettors.length < LEADERBOARD_SIZE) {
                // 排行榜未满，直接添加
                topBettors.push(player);
                bettorRanking[player] = topBettors.length;
                _sortBettorLeaderboard();
            } else {
                // 排行榜已满，检查是否能替换最后一名
                if (playerBets > users[topBettors[LEADERBOARD_SIZE - 1]].totalBets) {
                    // 移除最后一名
                    bettorRanking[topBettors[LEADERBOARD_SIZE - 1]] = 0;
                    topBettors[LEADERBOARD_SIZE - 1] = player;
                    bettorRanking[player] = LEADERBOARD_SIZE;
                    _sortBettorLeaderboard();
                }
            }
        }

        emit LeaderboardUpdated(player, "BETTOR", bettorRanking[player], playerBets);
    }

    /**
     * @dev 更新赢取排行榜
     */
    function _updateWinnerLeaderboard(address player) private {
        uint256 playerWins = users[player].totalWins;

        // 如果玩家已经在排行榜中
        if (winnerRanking[player] > 0) {
            uint256 currentRank = winnerRanking[player] - 1;

            // 向上调整排名
            while (currentRank > 0 && users[topWinners[currentRank - 1]].totalWins < playerWins) {
                // 交换位置
                address temp = topWinners[currentRank];
                topWinners[currentRank] = topWinners[currentRank - 1];
                topWinners[currentRank - 1] = temp;

                // 更新排名映射
                winnerRanking[topWinners[currentRank]] = currentRank + 1;
                winnerRanking[topWinners[currentRank - 1]] = currentRank;

                currentRank--;
            }
        } else {
            // 新玩家，检查是否能进入排行榜
            if (topWinners.length < LEADERBOARD_SIZE) {
                // 排行榜未满，直接添加
                topWinners.push(player);
                winnerRanking[player] = topWinners.length;
                _sortWinnerLeaderboard();
            } else {
                // 排行榜已满，检查是否能替换最后一名
                if (playerWins > users[topWinners[LEADERBOARD_SIZE - 1]].totalWins) {
                    // 移除最后一名
                    winnerRanking[topWinners[LEADERBOARD_SIZE - 1]] = 0;
                    topWinners[LEADERBOARD_SIZE - 1] = player;
                    winnerRanking[player] = LEADERBOARD_SIZE;
                    _sortWinnerLeaderboard();
                }
            }
        }

        emit LeaderboardUpdated(player, "WINNER", winnerRanking[player], playerWins);
    }

    /**
     * @dev 排序下注排行榜
     */
    function _sortBettorLeaderboard() private {
        for (uint256 i = 0; i < topBettors.length; i++) {
            for (uint256 j = i + 1; j < topBettors.length; j++) {
                if (users[topBettors[i]].totalBets < users[topBettors[j]].totalBets) {
                    // 交换位置
                    address temp = topBettors[i];
                    topBettors[i] = topBettors[j];
                    topBettors[j] = temp;

                    // 更新排名映射
                    bettorRanking[topBettors[i]] = i + 1;
                    bettorRanking[topBettors[j]] = j + 1;
                }
            }
        }
    }

    /**
     * @dev 排序赢取排行榜
     */
    function _sortWinnerLeaderboard() private {
        for (uint256 i = 0; i < topWinners.length; i++) {
            for (uint256 j = i + 1; j < topWinners.length; j++) {
                if (users[topWinners[i]].totalWins < users[topWinners[j]].totalWins) {
                    // 交换位置
                    address temp = topWinners[i];
                    topWinners[i] = topWinners[j];
                    topWinners[j] = temp;

                    // 更新排名映射
                    winnerRanking[topWinners[i]] = i + 1;
                    winnerRanking[topWinners[j]] = j + 1;
                }
            }
        }
    }

    // ============ 排行榜查询功能 ============

    /**
     * @dev 获取下注排行榜
     */
    function getBettorLeaderboard(uint256 start, uint256 count) external view returns (
        address[] memory players,
        string[] memory nicknames,
        uint256[] memory totalBets,
        uint256[] memory ranks
    ) {
        require(start < topBettors.length, "Start index out of bounds");

        uint256 end = start + count;
        if (end > topBettors.length) {
            end = topBettors.length;
        }

        uint256 length = end - start;
        players = new address[](length);
        nicknames = new string[](length);
        totalBets = new uint256[](length);
        ranks = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            address player = topBettors[start + i];
            players[i] = player;
            nicknames[i] = users[player].nickname;
            totalBets[i] = users[player].totalBets;
            ranks[i] = start + i + 1;
        }
    }

    /**
     * @dev 获取赢取排行榜
     */
    function getWinnerLeaderboard(uint256 start, uint256 count) external view returns (
        address[] memory players,
        string[] memory nicknames,
        uint256[] memory totalWins,
        uint256[] memory ranks
    ) {
        require(start < topWinners.length, "Start index out of bounds");

        uint256 end = start + count;
        if (end > topWinners.length) {
            end = topWinners.length;
        }

        uint256 length = end - start;
        players = new address[](length);
        nicknames = new string[](length);
        totalWins = new uint256[](length);
        ranks = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            address player = topWinners[start + i];
            players[i] = player;
            nicknames[i] = users[player].nickname;
            totalWins[i] = users[player].totalWins;
            ranks[i] = start + i + 1;
        }
    }

    /**
     * @dev 获取用户排名信息
     */
    function getUserRankings(address player) external view returns (
        uint256 bettorRank,
        uint256 winnerRank,
        uint256 totalBets,
        uint256 totalWins
    ) {
        bettorRank = bettorRanking[player];
        winnerRank = winnerRanking[player];
        totalBets = users[player].totalBets;
        totalWins = users[player].totalWins;
    }

    /**
     * @dev 获取排行榜统计信息
     */
    function getLeaderboardStats() external view returns (
        uint256 totalBettors,
        uint256 totalWinners,
        uint256 maxBettorCount,
        uint256 maxWinnerCount
    ) {
        totalBettors = topBettors.length;
        totalWinners = topWinners.length;
        maxBettorCount = LEADERBOARD_SIZE;
        maxWinnerCount = LEADERBOARD_SIZE;
    }
}
