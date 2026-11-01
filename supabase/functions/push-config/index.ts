import { createClient } from 'npm:@supabase/supabase-js@2.110.6';

Deno.serve(async request => {
  const headers = {
    'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || '',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin'
  };
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: request.headers.get('Authorization') || '' } }
  });
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  const { data: profile } = await db.from('users').select('role,is_active,verification_status').eq('id', user.id).single();
  if (profile?.role !== 'brgy_captain' || !profile.is_active || profile.verification_status !== 'verified') {
    return Response.json({ error: 'Approved captain account required' }, { status: 403, headers });
  }
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  if (!publicKey) return Response.json({ error: 'Mobile notifications are not configured yet' }, { status: 503, headers });
  return Response.json({ publicKey }, { headers });
});
