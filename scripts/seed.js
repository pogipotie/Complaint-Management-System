const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// WARNING: To bypass RLS and create users, we need the SERVICE_ROLE_KEY, not the ANON_KEY
// Ensure SUPABASE_SERVICE_ROLE_KEY is in your .env file
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
  console.log('Note: You must use the Service Role Key to bypass RLS and auto-confirm emails.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedData() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Departments
    console.log('\n🏢 Creating Departments...');
    const departments = [
      { name: 'Engineering Office', description: 'Handles infrastructure, roads, and public works.' },
      { name: 'Health Office', description: 'Handles medical, sanitation, and health-related concerns.' },
      { name: 'Environment and Natural Resources', description: 'Handles waste management and pollution.' },
      { name: 'Public Order and Safety', description: 'Handles traffic, security, and DRRMO.' }
    ];

    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .upsert(departments, { onConflict: 'name' })
      .select();

    if (deptError) throw deptError;
    console.log(`✅ Created ${deptData.length} departments.`);

    // 2. Seed Categories
    console.log('\n📂 Creating Categories...');
    const categories = [
      { name: 'Potholes / Road Damage', default_department_id: deptData.find(d => d.name === 'Engineering Office').id },
      { name: 'Uncollected Garbage', default_department_id: deptData.find(d => d.name === 'Environment and Natural Resources').id },
      { name: 'Noise Nuisance', default_department_id: deptData.find(d => d.name === 'Public Order and Safety').id },
      { name: 'Health/Sanitation Hazard', default_department_id: deptData.find(d => d.name === 'Health Office').id },
      { name: 'Flooding / Drainage', default_department_id: deptData.find(d => d.name === 'Engineering Office').id }
    ];

    const { data: catData, error: catError } = await supabase
      .from('complaint_categories')
      .upsert(categories, { onConflict: 'name' })
      .select();

    if (catError) throw catError;
    console.log(`✅ Created ${catData.length} categories.`);

    return deptData;

  } catch (error) {
    console.error('❌ Error during seeding data:', error);
    throw error;
  }
}

async function createUser(email, password, role, profileData) {
  console.log(`\n👤 Creating user: ${email} (${role})...`);
  
  // Create user in auth.users using admin api
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Auto confirm so they can login immediately
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log(`⚠️ User ${email} already exists in auth. Skipping creation.`);
      return;
    }
    throw authError;
  }

  const userId = authData.user.id;
  console.log(`   Created auth user with ID: ${userId}`);

  // Create public profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([
      {
        id: userId,
        role: role,
        ...profileData
      }
    ]);

  if (profileError) {
    console.error(`❌ Failed to create public profile for ${email}`);
    throw profileError;
  }

  console.log(`✅ Successfully provisioned ${role}: ${email}`);
}

async function seedUsers(departments) {
  try {
    // 1. Create Admin
    await createUser('admin@municipality.gov.ph', 'AdminPass123!', 'admin', {
      full_name: 'System Administrator',
      phone: '09170000000',
      city_municipality: 'Sample City'
    });

    // 2. Create Staff (Engineering)
    const engDept = departments.find(d => d.name === 'Engineering Office');
    if (engDept) {
      await createUser('staff.engineering@municipality.gov.ph', 'StaffPass123!', 'staff', {
        full_name: 'Engr. Juan Dela Cruz',
        department_id: engDept.id,
        city_municipality: 'Sample City'
      });
    }

    // 3. Create Staff (Environment)
    const envDept = departments.find(d => d.name === 'Environment and Natural Resources');
    if (envDept) {
      await createUser('staff.enro@municipality.gov.ph', 'StaffPass123!', 'staff', {
        full_name: 'Maria Santos (ENRO)',
        department_id: envDept.id,
        city_municipality: 'Sample City'
      });
    }

    // 4. Create a sample Citizen
    await createUser('citizen@gmail.com', 'CitizenPass123!', 'citizen', {
      full_name: 'Pedro Penduko',
      phone: '09181234567',
      barangay: 'Barangay 1',
      city_municipality: 'Sample City'
    });

  } catch (error) {
    console.error('❌ Error during seeding users:', error);
  }
}

async function run() {
  try {
    const departments = await seedData();
    await seedUsers(departments);
    console.log('\n🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('\n💥 Seeding failed.');
  }
}

run();
