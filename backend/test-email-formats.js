const axios = require('axios');

async function testEmailFormats() {
  const API_URL = 'http://localhost:5001/api';
  
  const emailsToTest = [
    'test@example.com',
    'user@outlook.com',
    'demo@test.com',
    'ankit.test@gmail.com',
    'testuser123@gmail.com',
    `test${Date.now()}@example.com`
  ];
  
  console.log('🧪 Testing different email formats with Supabase...\n');
  
  for (const email of emailsToTest) {
    const testData = {
      name: 'Test User',
      email: email,
      password: 'password123'
    };
    
    try {
      console.log(`Testing: ${email}`);
      const response = await axios.post(`${API_URL}/auth/register`, testData, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });
      
      console.log(`✅ SUCCESS: ${email} - User created with ID: ${response.data.user.id}`);
      console.log('---');
      
      // Clean up - you might want to delete test users later
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${email}`);
        console.log(`   Error: ${error.response.data.error}`);
        if (error.response.data.details?.code) {
          console.log(`   Code: ${error.response.data.details.code}`);
        }
        console.log('---');
      }
    }
  }
  
  console.log('\n💡 If all emails fail, check your Supabase dashboard:');
  console.log('1. Go to Authentication > Settings');
  console.log('2. Check "Email Settings" for any domain restrictions');
  console.log('3. Make sure "Enable email confirmations" is appropriate for your setup');
}

testEmailFormats();