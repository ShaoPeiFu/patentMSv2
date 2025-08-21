import axios from 'axios';

async function debugTaskCreation() {
  try {
    // 1. 先登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
      username: 'testuser',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token');
    console.log('👤 用户信息:', loginResponse.data.user);

    // 2. 测试任务创建
    console.log('📝 正在创建任务...');
    const taskData = {
      title: '测试任务',
      description: '这是一个测试任务',
      assigneeId: 1,
      priority: 'high'
    };

    console.log('📦 发送的任务数据:', JSON.stringify(taskData, null, 2));

    // 3. 先测试一个简单的GET请求
    console.log('🔍 测试获取任务列表...');
    try {
      const listResponse = await axios.get('http://localhost:5173/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ 获取任务列表成功，状态:', listResponse.status);
      console.log('📊 任务数量:', listResponse.data.tasks?.length || 0);
    } catch (error) {
      console.error('❌ 获取任务列表失败:', error.response?.status, error.response?.data);
    }

    // 4. 测试任务创建
    console.log('📝 测试任务创建...');
    const taskResponse = await axios.post('http://localhost:5173/api/tasks', taskData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 响应状态:', taskResponse.status);
    console.log('📡 响应数据:', taskResponse.data);
    console.log('✅ 任务创建成功');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📡 响应状态:', error.response.status);
      console.error('📡 响应数据:', error.response.data);
      console.error('📡 响应头:', error.response.headers);
    }
    if (error.request) {
      console.error('📡 请求错误:', error.request);
    }
  }
}

debugTaskCreation();
