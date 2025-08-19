const path = require('path');
const fs = require('fs');

console.log("🔍 调试环境变量问题...");

// 1. 检查当前工作目录
console.log("\n1️⃣ 当前工作目录:");
console.log("Current working directory:", process.cwd());

// 2. 检查 .env 文件是否存在
const envPath = path.join(process.cwd(), '.env');
console.log("\n2️⃣ .env 文件路径:");
console.log("Expected .env path:", envPath);
console.log(".env file exists:", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    // 3. 读取 .env 文件内容
    console.log("\n3️⃣ .env 文件内容:");
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log("File content:");
        console.log("---");
        console.log(envContent);
        console.log("---");
        console.log("File length:", envContent.length, "characters");
        
        // 检查是否包含 PRIVATE_KEY
        if (envContent.includes('PRIVATE_KEY')) {
            console.log("✅ PRIVATE_KEY found in file");
        } else {
            console.log("❌ PRIVATE_KEY not found in file");
        }
    } catch (error) {
        console.log("❌ Error reading .env file:", error.message);
    }
} else {
    console.log("❌ .env file does not exist");
}

// 4. 手动加载 dotenv
console.log("\n4️⃣ 手动加载 dotenv:");
try {
    require('dotenv').config();
    console.log("✅ dotenv loaded successfully");
} catch (error) {
    console.log("❌ Error loading dotenv:", error.message);
}

// 5. 检查环境变量
console.log("\n5️⃣ 环境变量检查:");
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
if (process.env.PRIVATE_KEY) {
    console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY.length);
    console.log("PRIVATE_KEY starts with 0x:", process.env.PRIVATE_KEY.startsWith('0x'));
} else {
    console.log("❌ PRIVATE_KEY is undefined");
}

// 6. 列出所有环境变量（仅显示键名）
console.log("\n6️⃣ 所有环境变量键名:");
const envKeys = Object.keys(process.env).filter(key => 
    key.includes('PRIVATE') || 
    key.includes('XLAYER') || 
    key.includes('BET') || 
    key.includes('TOKEN')
);
console.log("Relevant env keys:", envKeys);

console.log("\n🔍 调试完成");
