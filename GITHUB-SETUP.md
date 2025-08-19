# 🔐 GitHub 推送权限设置指南

## 问题描述
推送到GitHub时遇到403权限错误，需要配置认证。

## 🚀 解决方案

### 方法1: 使用Personal Access Token (推荐)

#### 步骤1: 创建Personal Access Token
1. 访问 GitHub Settings: https://github.com/settings/tokens
2. 点击 "Generate new token" > "Generate new token (classic)"
3. 设置Token名称: `XLayer Slot Casino`
4. 选择权限:
   - ✅ `repo` (完整仓库访问权限)
   - ✅ `workflow` (GitHub Actions权限)
5. 点击 "Generate token"
6. **重要**: 复制生成的token (只显示一次)

#### 步骤2: 使用Token推送
```bash
# 删除现有的远程仓库
git remote remove origin

# 使用token添加远程仓库 (替换YOUR_TOKEN)
git remote add origin https://YOUR_TOKEN@github.com/PixelPet-dev/xlayer-slot-casino.git

# 推送到GitHub
git push -u origin main
```

### 方法2: 使用SSH Key

#### 步骤1: 生成SSH Key
```bash
# 生成新的SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 启动ssh-agent
eval "$(ssh-agent -s)"

# 添加SSH key到ssh-agent
ssh-add ~/.ssh/id_ed25519
```

#### 步骤2: 添加SSH Key到GitHub
1. 复制公钥内容:
```bash
cat ~/.ssh/id_ed25519.pub
```
2. 访问 GitHub SSH Settings: https://github.com/settings/keys
3. 点击 "New SSH key"
4. 粘贴公钥内容
5. 保存

#### 步骤3: 使用SSH推送
```bash
# 删除现有的远程仓库
git remote remove origin

# 使用SSH添加远程仓库
git remote add origin git@github.com:PixelPet-dev/xlayer-slot-casino.git

# 推送到GitHub
git push -u origin main
```

### 方法3: 使用GitHub CLI

#### 安装GitHub CLI
- Windows: 下载 https://cli.github.com/
- 或使用包管理器: `winget install GitHub.cli`

#### 认证和推送
```bash
# 登录GitHub
gh auth login

# 推送代码
git push -u origin main
```

## 🎯 推荐流程

### 最简单的方法 (Personal Access Token):
1. 创建Personal Access Token
2. 运行以下命令 (替换YOUR_TOKEN):

```bash
git remote remove origin
git remote add origin https://YOUR_TOKEN@github.com/PixelPet-dev/xlayer-slot-casino.git
git push -u origin main
```

## 📋 推送成功后的步骤

### 1. 启用GitHub Pages
1. 访问仓库: https://github.com/PixelPet-dev/xlayer-slot-casino
2. 点击 Settings > Pages
3. 选择 "GitHub Actions" 作为源
4. 保存设置

### 2. 等待自动部署
- GitHub Actions会自动构建和部署
- 查看Actions标签页了解部署状态
- 部署完成后访问: https://pixelpet-dev.github.io/xlayer-slot-casino/

### 3. 验证部署
- 检查网站是否正常加载
- 测试音频系统是否工作
- 验证钱包连接功能

## 🔧 故障排除

### 如果推送仍然失败:
1. 检查token权限是否正确
2. 确认仓库名称拼写正确
3. 验证网络连接
4. 尝试使用SSH方式

### 如果GitHub Pages不工作:
1. 检查Actions是否成功运行
2. 确认Pages设置正确
3. 等待几分钟让DNS生效

## 📞 需要帮助?
如果遇到问题，请提供:
1. 错误信息截图
2. 使用的认证方法
3. Git版本: `git --version`

成功推送后，你的XLayer Slot Casino就会在GitHub上线了！🎰🚀
