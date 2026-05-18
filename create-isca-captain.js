const { createClient } = require('@supabase/supabase-js');

// Replace this with your SERVICE_ROLE key from the pfcrlnhvdpeqbaixlgbm project API settings
const supabaseUrl = 'https://fhzehqztfiufypuzevrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoemVocXp0Zml1ZnlwdXpldnJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTkwMiwiZXhwIjoyMDk0MTk1OTAyfQ.XpeYO4GlKNY1v1nNtintwlIcrG1sxHnp_JOafw0dlAA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createIscaCaptain() {
  console.log('Creating Barangay Captain account for Isca...');

  // 1. Create the user in the authentication system
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'captain.isca@csu.edu.ph',
    password: 'password123',
    email_confirm: true // Automatically confirm email
  });

  if (authError) {
    console.error('Failed to create auth user:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Auth user created successfully! ID:', userId);

  // 2. Create the user profile in the public.users table
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: userId,
      full_name: 'Brgy. Captain (Isca)',
      role: 'brgy_captain',
      barangay: 'Isca',
      verification_status: 'verified', // Bypass the ID upload requirement
      is_active: true
    });

  if (profileError) {
    console.error('Failed to create public profile:', profileError.message);
    return;
  }

  console.log('\n✅ SUCCESS! Barangay Captain account created.');
  console.log('-------------------------------------------');
  console.log('Email:    captain.isca@csu.edu.ph');
  console.log('Password: password123');
  console.log('Barangay: Isca');
  console.log('-------------------------------------------');
  console.log('You can now log in with these credentials!');
}

createIscaCaptain();
