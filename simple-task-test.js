import axios from 'axios';

async function simpleTaskTest() {
  try {
    // 1. 登录
    console.log('🔐 登录...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
      username: 'testuser',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ 登录成功');

    // 2. 测试健康检查
    console.log('🏥 测试健康检查...');
    try {
      const healthResponse = await axios.get('http://localhost:5173/api/health');
      console.log('✅ 健康检查成功:', healthResponse.data);
    } catch (error) {
      console.error('❌ 健康检查失败:', error.response?.status);
    }

    // 3. 测试任务列表
    console.log('📋 测试任务列表...');
    try {
      const listResponse = await axios.get('http://localhost:5173/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 任务列表成功，状态:', listResponse.status);
    } catch (error) {
      console.error('❌ 任务列表失败:', error.response?.status, error.response?.data);
    }

    // 4. 测试任务创建
    console.log('📝 测试任务创建...');
    const taskData = { title: '简单测试任务' };
    
    try {
      const createResponse = await axios.post('http://localhost:5173/api/tasks', taskData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 任务创建成功:', createResponse.status);
    } catch (error) {
      console.error('❌ 任务创建失败:', error.response?.status, error.response?.data);
      if (error.response?.data?.details) {
        console.error('详细错误:', error.response.data.details);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

simpleTaskTest();
