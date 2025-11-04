import { supabaseAdmin } from '../config/supabase.config';
import * as fs from 'fs';
import * as path from 'path';

async function setupPublicShares() {
  try {
    console.log('Setting up public shares table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-public-shares-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating public_shares table:', error);
      console.log('\nPlease run the following SQL manually in your Supabase SQL editor:');
      console.log('=' .repeat(50));
      console.log(sql);
      console.log('=' .repeat(50));
    } else {
      console.log('✅ Public shares table created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
    console.log('\nAlternatively, you can run the SQL script manually.');
  }
}

// Run if called directly
if (require.main === module) {
  setupPublicShares().then(() => process.exit(0));
}

export { setupPublicShares };