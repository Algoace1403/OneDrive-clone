const axios = require('axios');

async function testRegistration() {
  const API_URL = 'http://localhost:5001/api';
  
  // Test data matching what was shown in the screenshot
  const testData = {
    name: 'Ankit',
    email: 'ankit@gmail.com',
    password: 'password123'  // More than 6 characters
  };
  
  console.log('🧪 Testing registration with:', testData);
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('\n✅ Registration successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.error('\n❌ Registration failed');
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      // Check backend logs for more details
      console.log('\n💡 Check the backend terminal for detailed error logs');
    } else {
      console.error('\n❌ Network error:', error.message);
    }
  }
}

testRegistration();