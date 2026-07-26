// ==========================================
// TalentIQ AI - Storage Bucket Setup Script
// Run: node supabase/setup-storage.js
// ==========================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Creating storage bucket: talentiq ...');

  const { data, error } = await supabase.storage.createBucket('talentiq', {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
  });

  if (error) {
    if (error.message?.includes('already exists')) {
      console.log('Bucket "talentiq" already exists — skipping creation.');
    } else {
      console.error('Error creating bucket:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Bucket "talentiq" created successfully.');
  }

  // Run RLS migration
  console.log('Applying storage RLS policies...');
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/002_storage_buckets.sql');
  try {
    const sql = readFileSync(migrationPath, 'utf-8');
    const { error: sqlError } = await supabase.rpc('exec_sql', { query: sql });
    if (sqlError) {
      console.warn('Could not apply RLS via RPC (expected if exec_sql function does not exist).');
      console.warn('Please run the migration SQL manually in the Supabase SQL Editor:');
      console.warn(`  → ${migrationPath}`);
    } else {
      console.log('Storage RLS policies applied.');
    }
  } catch {
    console.warn('Please run the migration SQL manually in the Supabase SQL Editor:');
    console.warn(`  → ${migrationPath}`);
  }

  console.log('\nSetup complete!');
}

setup();
