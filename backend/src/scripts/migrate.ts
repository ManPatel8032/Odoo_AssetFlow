import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env explicitly to ensure DATABASE_URL is available
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runMigrations = async () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('Error: DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log(`Connecting to database...`);
  
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const client = await pool.connect();

  try {
    const migrationsDir = path.join(__dirname, '../../db/migrations');
    
    // Read and sort SQL files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sorting ensures 0001 runs before 0002, etc.

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    console.log(`Found ${files.length} migration files. Executing...`);

    for (const file of files) {
      console.log(`\n-> Running ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Execute the raw SQL file
      await client.query(sql);
      console.log(`✓ Successfully executed ${file}`);
    }

    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations();
