const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testUserUpdate() {
  try {
    console.log("🧪 测试用户更新API权限验证...");

    // 1. 登录获取token
    console.log("1️⃣ 登录获取token...");
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "testadmin",
      password: "test123",
    });

    const token = loginResponse.data.token;
    console.log("✅ 登录成功");

    // 2. 测试管理员修改其他用户的部门和角色
    console.log("2️⃣ 测试管理员修改其他用户的部门和角色...");
    try {
      const updateResponse = await axios.put(
        `${BASE_URL}/api/users/1`,
        {
          department: "技术部",
          role: "reviewer",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ 管理员修改其他用户成功:", updateResponse.data);
    } catch (error) {
      console.log(
        "❌ 管理员修改其他用户失败:",
        error.response?.data?.error || error.message
      );
    }

    // 3. 测试管理员尝试修改其他用户的个人信息（应该失败）
    console.log("3️⃣ 测试管理员尝试修改其他用户的个人信息（应该失败）...");
    try {
      const updateResponse = await axios.put(
        `${BASE_URL}/api/users/1`,
        {
          realName: "测试姓名",
          email: "test@example.com",
          phone: "13800000000",
          department: "技术部",
          role: "reviewer",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(
        "❌ 管理员修改个人信息成功（不应该成功）:",
        updateResponse.data
      );
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(
          "✅ 管理员修改个人信息被正确拒绝:",
          error.response.data.error
        );
      } else {
        console.log(
          "❌ 意外的错误:",
          error.response?.data?.error || error.message
        );
      }
    }

    // 4. 测试用户列表API是否过滤掉已删除用户
    console.log("4️⃣ 测试用户列表API是否过滤掉已删除用户...");
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const deletedUsers = usersResponse.data.users.filter(
        (user) => user.role === "deleted" || user.username.includes("deleted")
      );

      if (deletedUsers.length === 0) {
        console.log("✅ 用户列表已正确过滤掉已删除用户");
      } else {
        console.log("❌ 用户列表仍包含已删除用户:", deletedUsers.length, "个");
        deletedUsers.forEach((user) => {
          console.log(
            `   - ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}`
          );
        });
      }

      console.log(
        `📊 总用户数: ${usersResponse.data.total}, 当前页用户数: ${usersResponse.data.users.length}`
      );
    } catch (error) {
      console.log(
        "❌ 获取用户列表失败:",
        error.response?.data?.error || error.message
      );
    }
  } catch (error) {
    console.error("❌ 测试失败:", error.response?.data || error.message);
  }
}

// 运行测试
testUserUpdate();
