const axios = require('axios');

async function testBackend() {
  const API_URL = 'http://localhost:5001/api';
  
  console.log('🧪 Testing backend connectivity...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthRes.data);
    
    // Test 2: Test registration with a simple request
    console.log('\n2. Testing registration endpoint (expecting validation error)...');
    try {
      await axios.post(`${API_URL}/auth/register`, {});
    } catch (error) {
      if (error.response) {
        console.log('✅ Registration endpoint accessible');
        console.log('   Status:', error.response.status);
        console.log('   Response:', error.response.data);
      } else {
        throw error;
      }
    }
    
    // Test 3: CORS headers
    console.log('\n3. Checking CORS headers...');
    const corsRes = await axios.get(`${API_URL}/health`, {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    console.log('✅ CORS headers:', corsRes.headers['access-control-allow-origin']);
    
    console.log('\n🎉 Backend is running correctly!');
    console.log('\nNow you can test registration from the frontend.');
    
  } catch (error) {
    console.error('\n❌ Backend connection failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend is running on port 5001');
    console.log('2. Run: cd backend && npm run dev');
    process.exit(1);
  }
}

testBackend();