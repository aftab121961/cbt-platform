import { createClient } from '@supabase/supabase-js';
import { 
  initialClasses, 
  initialSubjects, 
  initialChapters, 
  initialTopics, 
  initialQuestions, 
  samplePredefinedTests 
} from '../src/data/seedData.ts';

import fs from 'node:fs';
import path from 'node:path';

// Load .env dynamically if present
const envPath = path.resolve(process.cwd(), '.env');
let SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = trimmed.replace('VITE_SUPABASE_URL=', '').trim();
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_ANON_KEY = trimmed.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
  }
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log('--- Starting Supabase Database Cloud Seeding ---');

  // 1. Classes
  console.log(`Seeding ${initialClasses.length} classes...`);
  const { error: errClasses } = await supabase.from('classes').upsert(initialClasses);
  if (errClasses) console.error('Error classes:', errClasses);
  else console.log('✓ Classes seeded successfully.');

  // 2. Subjects
  console.log(`Seeding ${initialSubjects.length} subjects...`);
  const { error: errSubjects } = await supabase.from('subjects').upsert(initialSubjects);
  if (errSubjects) console.error('Error subjects:', errSubjects);
  else console.log('✓ Subjects seeded successfully.');

  // 3. Chapters
  console.log(`Seeding ${initialChapters.length} chapters...`);
  const { error: errChapters } = await supabase.from('chapters').upsert(initialChapters);
  if (errChapters) console.error('Error chapters:', errChapters);
  else console.log('✓ Chapters seeded successfully.');

  // 4. Topics
  console.log(`Seeding ${initialTopics.length} topics...`);
  const { error: errTopics } = await supabase.from('topics').upsert(initialTopics);
  if (errTopics) console.error('Error topics:', errTopics);
  else console.log('✓ Topics seeded successfully.');

  // 5. Questions in batches
  console.log(`Seeding ${initialQuestions.length} questions in batches...`);
  const batchSize = 25;
  for (let i = 0; i < initialQuestions.length; i += batchSize) {
    const batch = initialQuestions.slice(i, i + batchSize).map(q => ({
      ...q,
      exam_name: q.exam_name || null,
      exam_year: q.exam_year || null,
      image_url: q.image_url || null,
      created_by: q.created_by || null,
    }));
    const { error: errBatch } = await supabase.from('questions').upsert(batch);
    if (errBatch) {
      console.error(`Error seeding questions batch ${i / batchSize + 1}:`, errBatch);
    } else {
      console.log(`✓ Questions batch ${i / batchSize + 1} (${batch.length} items) seeded.`);
    }
  }

  // 6. Predefined Tests
  console.log(`Seeding ${samplePredefinedTests.length} tests...`);
  const { error: errTests } = await supabase.from('tests').upsert(samplePredefinedTests);
  if (errTests) console.error('Error tests:', errTests);
  else console.log('✓ Tests seeded successfully.');

  console.log('--- Seeding Complete! ---');
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
