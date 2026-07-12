import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Check profiles columns
  const { rows: profileCols } = await pool.query(
    `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position`
  );
  console.log('\n=== PROFILES TABLE ===');
  profileCols.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default}`));

  // Check departments columns
  const { rows: deptCols } = await pool.query(
    `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'departments' ORDER BY ordinal_position`
  );
  console.log('\n=== DEPARTMENTS TABLE ===');
  deptCols.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default}`));

  // Check categories columns
  const { rows: catCols } = await pool.query(
    `SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'categories' ORDER BY ordinal_position`
  );
  console.log('\n=== CATEGORIES TABLE ===');
  catCols.forEach((c: any) => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default}`));

  // Check existing data
  const { rows: profiles } = await pool.query('SELECT * FROM profiles LIMIT 3');
  console.log('\n=== SAMPLE PROFILES ===');
  console.log(profiles);

  const { rows: depts } = await pool.query('SELECT * FROM departments LIMIT 3');
  console.log('\n=== SAMPLE DEPARTMENTS ===');
  console.log(depts);

  await pool.end();
}

check();
