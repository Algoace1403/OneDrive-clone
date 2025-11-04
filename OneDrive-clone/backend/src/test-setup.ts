import { supabase, supabaseAdmin } from './config/supabase';

async function testSetup() {
  console.log('🧪 Testing Supabase Setup...\n');
  
  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Database test failed:', tablesError.message);
    } else {
      console.log('✅ Database connection successful');
    }
    
    // Test 2: Storage bucket
    console.log('\n2. Testing storage bucket...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage test failed:', bucketsError.message);
    } else {
      const filesBucket = buckets?.find(b => b.name === 'files');
      if (filesBucket) {
        console.log('✅ Storage bucket "files" exists');
      } else {
        console.error('❌ Storage bucket "files" not found');
      }
    }
    
    // Test 3: Auth configuration
    console.log('\n3. Testing auth configuration...');
    const testEmail = `test${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Auth configuration working');
      // Cleanup test user
      if (authData.user) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
    }
    
    console.log('\n✨ Setup verification complete!');
    console.log('\nYou can now:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Start the frontend: cd ../frontend && npm run dev');
    console.log('3. Register a new user and start using the app!');
    
  } catch (error) {
    console.error('\n❌ Setup test failed:', error);
    console.log('\nPlease check:');
    console.log('1. Your .env file has correct Supabase credentials');
    console.log('2. You ran the SQL schema in Supabase');
    console.log('3. Your Supabase project is active');
  }
}

testSetup();