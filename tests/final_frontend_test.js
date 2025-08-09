const axios = require('axios');

// 模拟前端API调用测试
async function testFrontendAPI() {
  try {
    console.log('🚀 开始测试前端API调用...');
    
    // 模拟客服登录
    console.log('🔐 模拟客服登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/customer-service/login', {
      phone_num: '13501111113',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败，尝试其他账号...');
      // 如果默认账号不存在，可以尝试其他方式
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 2. 获取客服提现记录
    console.log('\n📋 获取客服提现记录...');
    const withdrawalResponse = await axios.get('http://localhost:3001/api/customer-service/withdrawal/records', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (withdrawalResponse.data.success) {
      const records = withdrawalResponse.data.data;
      console.log(`✅ 成功获取 ${records.length} 条提现记录`);
      
      // 3. 检查是否有重复记录
      console.log('\n🔍 检查重复记录...');
      const uniqueRecords = new Map();
      const duplicates = [];
      
      records.forEach((record, index) => {
        const key = `${record.amount}_${record.status}_${record.created_at}`;
        if (uniqueRecords.has(key)) {
          duplicates.push({
            original: uniqueRecords.get(key),
            duplicate: { ...record, index }
          });
        } else {
          uniqueRecords.set(key, { ...record, index });
        }
      });
      
      if (duplicates.length > 0) {
        console.log(`❌ 发现 ${duplicates.length} 组重复记录:`);
        duplicates.forEach((dup, i) => {
          console.log(`  ${i + 1}. 重复记录:`);
          console.log(`     原记录: ID=${dup.original.id}, 金额=¥${dup.original.amount}, 状态=${dup.original.status}`);
          console.log(`     重复记录: ID=${dup.duplicate.id}, 金额=¥${dup.duplicate.amount}, 状态=${dup.duplicate.status}`);
        });
      } else {
        console.log('✅ 没有发现重复记录');
      }
      
      // 4. 显示前5条记录详情
      console.log('\n📊 前5条提现记录:');
      records.slice(0, 5).forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id}`);
        console.log(`     金额: ¥${record.amount}`);
        console.log(`     状态: ${record.status}`);
        console.log(`     创建时间: ${record.created_at}`);
        console.log(`     描述: ${record.description || '无'}`);
        console.log('');
      });
      
    } else {
      console.log('❌ 获取提现记录失败:', withdrawalResponse.data.error);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API调用失败:', error.response.status, error.response.data);
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

// 运行测试
testFrontendAPI().then(() => {
  console.log('\n🎉 前端API测试完成!');
}).catch(console.error);