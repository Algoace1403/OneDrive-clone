import { supabase } from './config/supabase';

async function testAuth() {
  console.log('Testing Supabase Authentication...\n');

  // Test 1: Try with a test email
  console.log('Test 1: Signing up with test email...');
  const testEmail = `test${Date.now()}@test.com`;
  const { data: testData, error: testError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
  });

  if (testError) {
    console.log('❌ Test email failed:', testError.message);
  } else {
    console.log('✅ Test email succeeded:', testData.user?.email);
  }

  // Test 2: Try with a realistic email
  console.log('\nTest 2: Signing up with realistic email...');
  const realEmail = `user${Date.now()}@outlook.com`;
  const { data: realData, error: realError } = await supabase.auth.signUp({
    email: realEmail,
    password: 'TestPassword123!',
  });

  if (realError) {
    console.log('❌ Realistic email failed:', realError.message);
  } else {
    console.log('✅ Realistic email succeeded:', realData.user?.email);
  }

  console.log('\n📌 Note: Supabase may require email confirmation.');
  console.log('📌 To disable email confirmation:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to Authentication > Email Auth');
  console.log('   3. Disable "Enable email confirmations"');
  console.log('   4. Or use the provided test accounts below:\n');
  
  console.log('Test Accounts (if email confirmation is disabled):');
  console.log('Email: demo@onedrive.com | Password: DemoPass123!');
  console.log('Email: test@onedrive.com | Password: TestPass123!');
  
  process.exit(0);
}

testAuth().catch(console.error);