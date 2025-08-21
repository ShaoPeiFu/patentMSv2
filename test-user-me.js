import axios from 'axios';

const testUserMe = async () => {
  try {
    console.log('🔐 测试登录获取token...');
    
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'aaa',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n👤 测试获取当前用户信息...');
    const userMeResponse = await axios.get('http://localhost:3000/api/users/me', { headers });
    console.log('✅ 获取当前用户信息成功:');
    console.log('用户信息:', userMeResponse.data);
    
    console.log('\n✨ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
  }
};

testUserMe();
