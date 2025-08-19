// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title XLuckyCoin
 * @dev ERC20 代币合约 - XLuckyCoin (XLC)
 * 
 * 特性：
 * - 总供应量：1,000,000,000 XLC (10亿枚)
 * - 18位小数精度
 * - 可燃烧 (Burnable)
 * - 可暂停 (Pausable)
 * - 所有者权限管理
 * - 批量转账功能
 * - 防重入攻击保护
 */
contract XLuckyCoin is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // ============ 常量 ============
    
    /// @dev 总供应量：10亿枚 XLC
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    /// @dev 最大批量转账数量
    uint256 public constant MAX_BATCH_SIZE = 200;
    
    // ============ 事件 ============
    
    /// @dev 批量转账事件
    event BatchTransfer(address indexed from, uint256 totalAmount, uint256 recipientCount);
    
    /// @dev 紧急提取事件
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
    
    // ============ 构造函数 ============
    
    /**
     * @dev 构造函数
     * @param initialOwner 初始所有者地址
     */
    constructor(address initialOwner) ERC20("XLuckyCoin", "XLC") Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid owner address");

        // 铸造全部代币给所有者
        _mint(initialOwner, TOTAL_SUPPLY);
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @dev 暂停合约
     * 只有所有者可以调用
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     * 只有所有者可以调用
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 铸造新代币
     * @param to 接收地址
     * @param amount 铸造数量
     * 
     * 注意：这个功能被禁用，因为总供应量是固定的
     */
    function mint(address to, uint256 amount) public pure {
        // 禁用铸造功能以保持固定供应量
        revert("Minting is disabled - fixed supply token");
    }
    
    // ============ 批量操作 ============
    
    /**
     * @dev 批量转账
     * @param recipients 接收者地址数组
     * @param amounts 对应的转账金额数组
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        require(recipients.length <= MAX_BATCH_SIZE, "Batch size too large");
        
        uint256 totalAmount = 0;
        
        // 计算总金额并验证
        for (uint256 i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            require(amounts[i] > 0, "Invalid amount");
            totalAmount += amounts[i];
        }
        
        // 检查余额
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // 执行批量转账
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
        
        emit BatchTransfer(msg.sender, totalAmount, recipients.length);
    }
    
    /**
     * @dev 批量转账（相同金额）
     * @param recipients 接收者地址数组
     * @param amount 每个接收者的转账金额
     */
    function batchTransferSameAmount(
        address[] calldata recipients,
        uint256 amount
    ) external whenNotPaused {
        require(recipients.length > 0, "Empty array");
        require(recipients.length <= MAX_BATCH_SIZE, "Batch size too large");
        require(amount > 0, "Invalid amount");
        
        uint256 totalAmount = amount * recipients.length;
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // 执行批量转账
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            _transfer(msg.sender, recipients[i], amount);
        }
        
        emit BatchTransfer(msg.sender, totalAmount, recipients.length);
    }
    
    // ============ 紧急功能 ============
    
    /**
     * @dev 紧急提取误发送到合约的代币
     * @param token 代币合约地址 (address(0) 表示 ETH)
     * @param to 提取到的地址
     * @param amount 提取数量
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            // 提取 ETH
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(to).transfer(amount);
        } else {
            // 提取 ERC20 代币
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(tokenContract.transfer(to, amount), "Token transfer failed");
        }
        
        emit EmergencyWithdraw(token, to, amount);
    }
    
    // ============ 查询功能 ============
    
    /**
     * @dev 获取代币基本信息
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenCirculatingSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            totalSupply() // 由于没有锁定机制，流通量等于总供应量
        );
    }
    
    /**
     * @dev 批量查询余额
     * @param accounts 账户地址数组
     * @return balances 对应的余额数组
     */
    function batchBalanceOf(address[] calldata accounts) 
        external 
        view 
        returns (uint256[] memory balances) 
    {
        balances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            balances[i] = balanceOf(accounts[i]);
        }
    }
    
    // ============ 重写函数 ============

    /**
     * @dev 重写更新函数，添加暂停检查
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused override {
        super._update(from, to, amount);
    }
    
    /**
     * @dev 接收 ETH
     */
    receive() external payable {
        // 允许接收 ETH，但不做任何操作
    }
    
    /**
     * @dev 回退函数
     */
    fallback() external payable {
        revert("Function not found");
    }
}
