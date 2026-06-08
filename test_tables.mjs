import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vwcqovrbvhztpkultqjl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  const { data: ads, error: adsError } = await supabase.from('ads').select('*').limit(1);
  console.log('Ads Table:', adsError ? 'ERROR: ' + adsError.message : 'EXISTS');

  const { data: pages, error: pagesError } = await supabase.from('pages').select('*').limit(1);
  console.log('Pages Table:', pagesError ? 'ERROR: ' + pagesError.message : 'EXISTS');
}

checkTables();
