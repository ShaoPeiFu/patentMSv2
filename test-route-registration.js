import axios from 'axios';

async function testRouteRegistration() {
  try {
    // 1. 登录
    console.log('🔐 登录...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
      username: 'testuser',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ 登录成功');

    // 2. 测试任务路由的各个端点
    console.log('\n🔍 测试任务路由的各个端点...');
    
    // GET /api/tasks
    try {
      const listResponse = await axios.get('http://localhost:5173/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET /api/tasks 成功 - 状态:', listResponse.status);
    } catch (error) {
      console.error('❌ GET /api/tasks 失败:', error.response?.status, error.response?.data);
    }

    // POST /api/tasks
    try {
      const createResponse = await axios.post('http://localhost:5173/api/tasks', 
        { title: '路由测试任务' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ POST /api/tasks 成功 - 状态:', createResponse.status);
    } catch (error) {
      console.error('❌ POST /api/tasks 失败:', error.response?.status, error.response?.data);
      if (error.response?.data?.details) {
        console.error('详细错误:', error.response.data.details);
      }
    }

    // GET /api/tasks/1
    try {
      const detailResponse = await axios.get('http://localhost:5173/api/tasks/1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET /api/tasks/1 成功 - 状态:', detailResponse.status);
    } catch (error) {
      console.error('❌ GET /api/tasks/1 失败:', error.response?.status, error.response?.data);
    }

    // PUT /api/tasks/1
    try {
      const updateResponse = await axios.put('http://localhost:5173/api/tasks/1',
        { title: '更新的任务标题' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ PUT /api/tasks/1 成功 - 状态:', updateResponse.status);
    } catch (error) {
      console.error('❌ PUT /api/tasks/1 失败:', error.response?.status, error.response?.data);
    }

    // DELETE /api/tasks/1
    try {
      const deleteResponse = await axios.delete('http://localhost:5173/api/tasks/1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ DELETE /api/tasks/1 成功 - 状态:', deleteResponse.status);
    } catch (error) {
      console.error('❌ DELETE /api/tasks/1 失败:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testRouteRegistration();
