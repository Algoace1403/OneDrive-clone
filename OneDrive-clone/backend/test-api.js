const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testAuth() {
  console.log('🔐 Testing OneDrive Clone Authentication\n');

  // Test login with demo account
  try {
    console.log('📧 Logging in with demo@outlook.com...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@outlook.com',
      password: 'DemoPass123!'
    });

    console.log('✅ Login successful!');
    console.log('👤 User:', loginResponse.data.user.name);
    console.log('🔑 Token:', loginResponse.data.token.substring(0, 50) + '...');
    
    const token = loginResponse.data.token;
    
    // Test authenticated endpoint
    console.log('\n📁 Fetching files...');
    const filesResponse = await axios.get(`${API_URL}/files`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Files fetched:', filesResponse.data.length, 'files');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
  }
}

// Run the test
testAuth();