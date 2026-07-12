import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let dbClient: any;

if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
  
  dbClient = pool;
} else {
  console.log('⚠️ DATABASE_URL not found. Using Mock DB Adapter for testing endpoints.');
  dbClient = {
    query: async (text: string, params?: any[]) => {
      // Return basic mock data so endpoints don't crash
      if (text.includes('INSERT') || text.includes('UPDATE')) {
         return { rows: [{ id: 'mock-id', status: 'mocked', tag: 'AF-0001' }] };
      }
      return { rows: [] };
    },
    connect: async () => ({
      query: async (text: string, params?: any[]) => {
        if (text.includes('INSERT') || text.includes('UPDATE')) {
           return { rows: [{ id: 'mock-id', status: 'mocked', tag: 'AF-0001' }] };
        }
        return { rows: [] };
      },
      release: () => {},
    }),
  };
}

export default dbClient;
