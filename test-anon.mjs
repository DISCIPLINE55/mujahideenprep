import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hwubnqywcnvfnugdngvl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nQKXYk5_AiuXRzanPt1T2A_raKjw3g7'; // Anon key from .env

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAnonTest() {
  console.log('--- STARTING ANONYMOUS ACCESS TEST ---');
  
  // Test 1: Students
  const { data: students, error: errStudents } = await supabase.from('students').select('id').limit(1);
  console.log('Students Query Result:', errStudents ? `DENIED: ${errStudents.message}` : `ALLOWED: Found ${students.length} records`);

  // Test 2: Results
  const { data: results, error: errResults } = await supabase.from('results').select('id').limit(1);
  console.log('Results Query Result:', errResults ? `DENIED: ${errResults.message}` : `ALLOWED: Found ${results.length} records`);

  // Test 3: Settings
  const { data: settings, error: errSettings } = await supabase.from('settings').select('id').limit(1);
  console.log('Settings Query Result:', errSettings ? `DENIED: ${errSettings.message}` : `ALLOWED: Found ${settings.length} records`);
  
  console.log('--- END OF TEST ---');
}

runAnonTest();
