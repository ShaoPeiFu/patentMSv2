import axios from 'axios';

async function testServerRoutes() {
  try {
    // 1. 登录
    console.log('🔐 登录...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
      username: 'testuser',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ 登录成功');

    // 2. 测试各种路由
    const routes = [
      { method: 'GET', path: '/api/health', name: '健康检查' },
      { method: 'GET', path: '/api/tasks', name: '任务列表', auth: true },
      { method: 'POST', path: '/api/tasks', name: '创建任务', auth: true, data: { title: '测试任务' } },
      { method: 'GET', path: '/api/users', name: '用户列表', auth: true },
    ];

    for (const route of routes) {
      console.log(`\n🔍 测试 ${route.name}...`);
      try {
        const config = {
          method: route.method.toLowerCase(),
          url: `http://localhost:5173${route.path}`,
          headers: route.auth ? { 'Authorization': `Bearer ${token}` } : {},
          ...(route.data && { data: route.data })
        };

        const response = await axios(config);
        console.log(`✅ ${route.name} 成功 - 状态: ${response.status}`);
        if (route.method === 'GET' && response.data) {
          console.log(`📊 响应数据:`, response.data);
        }
      } catch (error) {
        console.error(`❌ ${route.name} 失败 - 状态: ${error.response?.status}`);
        if (error.response?.data) {
          console.error(`📊 错误数据:`, error.response.data);
        }
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testServerRoutes();
