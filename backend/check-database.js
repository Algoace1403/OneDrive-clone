require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase database setup...\n');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing Supabase connection...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    console.log('✅ Connected to Supabase');
    console.log(`   Total auth users: ${authData.users.length}`);
    
    // Test 2: Check if users table exists
    console.log('\n2. Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      if (usersError.code === '42P01') {
        console.error('❌ Users table does not exist!');
        console.log('   Run the schema.sql file in Supabase dashboard');
      } else {
        throw usersError;
      }
    } else {
      console.log('✅ Users table exists');
    }
    
    // Test 3: Check if files table exists
    console.log('\n3. Checking files table...');
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('count')
      .limit(1);
    
    if (filesError) {
      if (filesError.code === '42P01') {
        console.error('❌ Files table does not exist!');
        console.log('   Run the schema.sql file in Supabase dashboard');
      } else {
        throw filesError;
      }
    } else {
      console.log('✅ Files table exists');
    }
    
    // Test 4: Check RLS policies
    console.log('\n4. Checking Row Level Security...');
    console.log('⚠️  Make sure RLS is enabled on all tables in Supabase dashboard');
    
    console.log('\n✅ Database check complete!');
    console.log('\nIf any tables are missing:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of backend/supabase/schema.sql');
    
  } catch (error) {
    console.error('\n❌ Database check failed:', error.message);
    process.exit(1);
  }
}

checkDatabase();