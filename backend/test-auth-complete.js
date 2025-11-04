const axios = require('axios');

async function testCompleteAuthFlow() {
  const API_URL = 'http://localhost:5001/api';
  const timestamp = Date.now();
  
  // Use a unique email for this test
  const testUser = {
    name: 'Test User',
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!'
  };
  
  console.log('🧪 Testing Complete Auth Flow\n');
  console.log('Test user:', testUser);
  
  try {
    // Step 1: Register
    console.log('\n1. Testing Registration...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    
    console.log('✅ Registration successful');
    console.log('   User ID:', registerRes.data.user.id);
    console.log('   Token received:', !!registerRes.data.token);
    
    // Wait a bit for the user to be fully created
    console.log('\n⏳ Waiting 2 seconds for user creation to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Login with the same credentials
    console.log('\n2. Testing Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful!');
    console.log('   User:', loginRes.data.user.name);
    console.log('   Email:', loginRes.data.user.email);
    console.log('   Token:', loginRes.data.token ? 'Received' : 'Not received');
    
    // Step 3: Test authenticated request
    console.log('\n3. Testing Authenticated Request...');
    const token = loginRes.data.token;
    
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Authentication working!');
    console.log('   User verified:', meRes.data.user.email);
    
    console.log('\n🎉 All tests passed! Authentication is working correctly.');
    console.log('\nYou can now login from the frontend with:');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check backend logs for detailed error messages');
    console.log('2. Ensure Supabase is properly configured');
    console.log('3. Try logging in to Supabase dashboard to check user creation');
  }
}

testCompleteAuthFlow();