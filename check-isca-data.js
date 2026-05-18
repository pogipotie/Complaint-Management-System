const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhzehqztfiufypuzevrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoemVocXp0Zml1ZnlwdXpldnJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTkwMiwiZXhwIjoyMDk0MTk1OTAyfQ.XpeYO4GlKNY1v1nNtintwlIcrG1sxHnp_JOafw0dlAA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkData() {
  console.log('--- Checking Brgy Isca Captain ---');
  const { data: captain, error: capErr } = await supabase
    .from('users')
    .select('id, full_name, role, barangay')
    .eq('email', 'captain.isca@csu.edu.ph')
    .maybeSingle();
  
  if (capErr) console.error(capErr);
  console.log(captain || 'Not found!');

  console.log('\n--- Checking Complaints in Brgy Isca ---');
  const { data: complaints, error: compErr } = await supabase
    .from('complaints')
    .select('id, title, barangay, status, created_by')
    .eq('barangay', 'Isca');
    
  if (compErr) console.error(compErr);
  console.log(`Found ${complaints?.length || 0} complaints in Isca`);
  if (complaints?.length) console.log(complaints);

  console.log('\n--- Checking Citizens in Brgy Isca ---');
  const { data: citizens, error: citErr } = await supabase
    .from('users')
    .select('id, full_name, role, barangay')
    .eq('barangay', 'Isca')
    .eq('role', 'citizen');
    
  if (citErr) console.error(citErr);
  console.log(`Found ${citizens?.length || 0} citizens in Isca`);
  if (citizens?.length) console.log(citizens);
}

checkData();
