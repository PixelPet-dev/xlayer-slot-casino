# BONK Games 完整部署脚本
# 在 PowerShell 中运行此脚本

Write-Host "🚀 开始完整部署流程..." -ForegroundColor Green

# 步骤 1: 部署抽奖合约
Write-Host "`n1️⃣ 部署抽奖合约..." -ForegroundColor Yellow
npm run deploy:mainnet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 抽奖合约部署失败" -ForegroundColor Red
    exit 1
}

# 从用户输入获取合约地址
Write-Host "`n📝 请输入部署的抽奖合约地址:" -ForegroundColor Cyan
$LOTTERY_ADDRESS = Read-Host

# 验证地址格式
if (-not $LOTTERY_ADDRESS.StartsWith("0x") -or $LOTTERY_ADDRESS.Length -ne 42) {
    Write-Host "❌ 合约地址格式不正确" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 抽奖合约地址: $LOTTERY_ADDRESS" -ForegroundColor Green

# 步骤 2: 询问是否需要部署测试代币
Write-Host "`n2️⃣ 是否需要部署测试代币? (y/n)" -ForegroundColor Yellow
$DEPLOY_TOKEN = Read-Host

$TOKEN_ADDRESS = ""
if ($DEPLOY_TOKEN -eq "y" -or $DEPLOY_TOKEN -eq "Y") {
    Write-Host "部署测试代币..." -ForegroundColor Cyan
    npm run deploy:test-token
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 测试代币部署失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📝 请输入部署的代币合约地址:" -ForegroundColor Cyan
    $TOKEN_ADDRESS = Read-Host
} else {
    Write-Host "📝 请输入现有的代币合约地址:" -ForegroundColor Cyan
    $TOKEN_ADDRESS = Read-Host
}

# 验证代币地址格式
if (-not $TOKEN_ADDRESS.StartsWith("0x") -or $TOKEN_ADDRESS.Length -ne 42) {
    Write-Host "❌ 代币地址格式不正确" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 代币合约地址: $TOKEN_ADDRESS" -ForegroundColor Green

# 步骤 3: 配置代币
Write-Host "`n3️⃣ 配置代币合约..." -ForegroundColor Yellow
$env:LOTTERY_CONTRACT_ADDRESS = $LOTTERY_ADDRESS
$env:TOKEN_CONTRACT_ADDRESS = $TOKEN_ADDRESS

npm run setup:token

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 代币配置失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 代币配置完成" -ForegroundColor Green

# 步骤 4: 设置前端
Write-Host "`n4️⃣ 设置前端..." -ForegroundColor Yellow

# 进入前端目录
Set-Location frontend

# 安装前端依赖
Write-Host "安装前端依赖..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端依赖安装失败" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 创建前端环境变量
Write-Host "创建前端配置..." -ForegroundColor Cyan
"REACT_APP_CONTRACT_ADDRESS=$LOTTERY_ADDRESS" | Out-File -FilePath .env -Encoding utf8

Write-Host "✅ 前端配置完成" -ForegroundColor Green

# 返回根目录
Set-Location ..

# 步骤 5: 显示部署摘要
Write-Host "`n🎉 部署完成!" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Cyan
Write-Host "📋 部署摘要:" -ForegroundColor White
Write-Host "抽奖合约地址: $LOTTERY_ADDRESS" -ForegroundColor Yellow
Write-Host "代币合约地址: $TOKEN_ADDRESS" -ForegroundColor Yellow
Write-Host "网络: X Layer 主网 (Chain ID: 196)" -ForegroundColor Yellow
Write-Host "区块浏览器: https://www.oklink.com/xlayer" -ForegroundColor Yellow
Write-Host "`n=====================================`n" -ForegroundColor Cyan

Write-Host "🚀 启动前端:" -ForegroundColor White
Write-Host "cd frontend" -ForegroundColor Gray
Write-Host "npm start" -ForegroundColor Gray

Write-Host "`n🔗 查看合约:" -ForegroundColor White
Write-Host "https://www.oklink.com/xlayer/address/$LOTTERY_ADDRESS" -ForegroundColor Gray

Write-Host "`n📝 下一步:" -ForegroundColor White
Write-Host "1. 启动前端应用" -ForegroundColor Gray
Write-Host "2. 连接钱包测试" -ForegroundColor Gray
Write-Host "3. 注册用户并开始游戏" -ForegroundColor Gray

Write-Host "`n✨ 部署流程全部完成!" -ForegroundColor Green
