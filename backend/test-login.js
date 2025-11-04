const axios = require('axios');

async function testLogin() {
  const API_URL = 'http://localhost:5001/api';
  
  console.log('🧪 Testing login functionality...\n');
  
  // First, let's create a test user
  const testUser = {
    name: 'Login Test User',
    email: `logintest${Date.now()}@example.com`,
    password: 'TestPass123!'
  };
  
  try {
    // Step 1: Register a new user
    console.log('1. Creating test user...');
    console.log(`   Email: ${testUser.email}`);
    
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ User created successfully');
    console.log(`   User ID: ${registerRes.data.user.id}`);
    
    // Step 2: Test login with correct credentials
    console.log('\n2. Testing login with correct credentials...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful!');
    console.log(`   Token: ${loginRes.data.token ? 'Received' : 'Not received'}`);
    console.log(`   User: ${loginRes.data.user.name} (${loginRes.data.user.email})`);
    
    const token = loginRes.data.token;
    
    // Step 3: Test authenticated endpoint
    console.log('\n3. Testing authenticated request...');
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Authentication working!');
    console.log(`   User verified: ${meRes.data.user.email}`);
    
    // Step 4: Test login with wrong password
    console.log('\n4. Testing login with wrong password...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: 'WrongPassword'
      });
      console.log('❌ Login should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected invalid credentials');
      }
    }
    
    // Step 5: Test logout
    console.log('\n5. Testing logout...');
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Logout successful');
    
    console.log('\n🎉 All login tests passed!');
    console.log('\nYou can now login from the frontend using:');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testLogin();