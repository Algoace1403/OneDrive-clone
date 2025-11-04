import { supabaseAdmin } from '../config/supabase';
import { SupabaseService } from '../services/supabase.service';

async function seedUsers() {
  console.log('🌱 Seeding demo users...\n');

  const users = [
    {
      email: 'demo@outlook.com',
      password: 'DemoPass123!',
      name: 'Demo User'
    },
    {
      email: 'john.doe@outlook.com', 
      password: 'JohnPass123!',
      name: 'John Doe'
    },
    {
      email: 'jane.smith@outlook.com',
      password: 'JanePass123!', 
      name: 'Jane Smith'
    }
  ];

  for (const userData of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: userData.name
        }
      });

      if (authError) {
        console.log(`❌ Failed to create ${userData.email}:`, authError.message);
        continue;
      }

      if (authData.user) {
        // Create user profile
        await SupabaseService.createUser(
          authData.user.id,
          userData.email,
          userData.name
        );

        console.log(`✅ Created user: ${userData.email} (Password: ${userData.password})`);
      }
    } catch (error: any) {
      console.log(`❌ Error creating ${userData.email}:`, error.message);
    }
  }

  console.log('\n✨ Seeding completed!');
  console.log('📝 You can now login with any of the above credentials.');
  process.exit(0);
}

seedUsers().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});