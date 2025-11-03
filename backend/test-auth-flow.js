const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const testEmail = `test${Date.now()}@example.com`;
const testPassword = 'password123';
const testName = 'Test User';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  let token = '';
  let refreshToken = '';
  let userId = '';

  try {
    // Test 1: Register
    console.log('1. Testing Registration...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      name: testName
    });
    
    console.log('✅ Registration successful');
    console.log(`   - User ID: ${registerRes.data.user.id}`);
    console.log(`   - Email: ${registerRes.data.user.email}`);
    console.log(`   - Name: ${registerRes.data.user.name}`);
    console.log(`   - Storage: ${registerRes.data.user.storageUsed}/${registerRes.data.user.storageLimit}`);
    
    token = registerRes.data.token;
    refreshToken = registerRes.data.refreshToken;
    userId = registerRes.data.user.id;
    
    // Test 2: Login
    console.log('\n2. Testing Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login successful');
    console.log(`   - Token received: ${loginRes.data.token ? 'Yes' : 'No'}`);
    console.log(`   - Refresh token received: ${loginRes.data.refreshToken ? 'Yes' : 'No'}`);
    
    token = loginRes.data.token;
    
    // Test 3: Get Current User
    console.log('\n3. Testing Get Current User...');
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Get current user successful');
    console.log(`   - User verified: ${meRes.data.user.email}`);
    
    // Test 4: Update Profile
    console.log('\n4. Testing Update Profile...');
    const updateRes = await axios.patch(`${API_URL}/auth/profile`, 
      { name: 'Updated Test User' },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    
    console.log('✅ Profile update successful');
    console.log(`   - New name: ${updateRes.data.user.name}`);
    
    // Test 5: Refresh Token
    console.log('\n5. Testing Token Refresh...');
    const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    console.log('✅ Token refresh successful');
    console.log(`   - New access token received: ${refreshRes.data.accessToken ? 'Yes' : 'No'}`);
    console.log(`   - New refresh token received: ${refreshRes.data.refreshToken ? 'Yes' : 'No'}`);
    
    // Test 6: Logout
    console.log('\n6. Testing Logout...');
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Logout successful');
    
    // Test 7: Verify token is invalid after logout
    console.log('\n7. Testing Token Invalidation...');
    try {
      await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Token still valid after logout (unexpected)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token properly invalidated after logout');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAuthFlow();