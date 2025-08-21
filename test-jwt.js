import jwt from "jsonwebtoken";

const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production";

// 测试数据
const testUser = {
  userId: 15,
  username: "testuser",
  email: "test@example.com",
  realName: "测试用户",
  role: "user",
  department: "tech"
};

console.log("🧪 测试JWT生成和验证...\n");

try {
  // 1. 生成token
  console.log("1️⃣ 生成JWT token...");
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: "24h" });
  console.log("✅ Token生成成功:", token.substring(0, 50) + "...");

  // 2. 验证token
  console.log("\n2️⃣ 验证JWT token...");
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log("✅ Token验证成功:", decoded);

  // 3. 测试解码
  console.log("\n3️⃣ 解码JWT payload...");
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  console.log("✅ Payload解码成功:", payload);

  console.log("\n🎉 JWT测试完成！");

} catch (error) {
  console.error("❌ JWT测试失败:", error.message);
}
