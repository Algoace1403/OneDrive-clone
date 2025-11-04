import { supabaseAdmin } from '../config/supabase';

async function setupStorage() {
  try {
    console.log('Setting up storage buckets...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'files');
    
    if (!bucketExists) {
      // Create the files bucket
      const { data, error } = await supabaseAdmin
        .storage
        .createBucket('files', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: null // Allow all file types
        });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Successfully created "files" bucket');
      }
    } else {
      console.log('Bucket "files" already exists');
    }
    
    // Set bucket policies
    const policies = [
      {
        name: 'Users can upload their own files',
        definition: `(auth.uid() = owner)`,
        operation: 'INSERT'
      },
      {
        name: 'Users can view their own files',
        definition: `(auth.uid() = owner)`,
        operation: 'SELECT'
      },
      {
        name: 'Users can update their own files',
        definition: `(auth.uid() = owner)`,
        operation: 'UPDATE'
      },
      {
        name: 'Users can delete their own files',
        definition: `(auth.uid() = owner)`,
        operation: 'DELETE'
      }
    ];
    
    console.log('Storage bucket setup completed');
    
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

// Run the setup
setupStorage();