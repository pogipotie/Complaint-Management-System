const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhzehqztfiufypuzevrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoemVocXp0Zml1ZnlwdXpldnJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTkwMiwiZXhwIjoyMDk0MTk1OTAyfQ.XpeYO4GlKNY1v1nNtintwlIcrG1sxHnp_JOafw0dlAA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateExistingCaptain() {
  console.log('Finding existing user...');

  // 1. Get the user's ID by finding them in the auth system
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  
  if (fetchError) {
    console.error('Failed to fetch users:', fetchError);
    return;
  }

  const targetUser = users.find(u => u.email === 'captain.isca@csu.edu.ph');

  if (!targetUser) {
    console.log('User captain.isca@csu.edu.ph not found in auth system.');
    return;
  }

  const userId = targetUser.id;
  console.log('Found user ID:', userId);

  // 2. Upsert (Update or Insert) their profile in public.users
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      full_name: 'Brgy. Captain (Isca)',
      role: 'brgy_captain',
      barangay: 'Isca',
      verification_status: 'verified',
      is_active: true
    });

  if (profileError) {
    console.error('Failed to update public profile:', profileError.message);
    return;
  }

  console.log('\n✅ SUCCESS! Existing account updated to Barangay Captain.');
  console.log('-------------------------------------------');
  console.log('Email:    captain.isca@csu.edu.ph');
  console.log('Password: (Whatever password you originally used to register it)');
  console.log('Barangay: Isca');
  console.log('-------------------------------------------');
}

updateExistingCaptain();
