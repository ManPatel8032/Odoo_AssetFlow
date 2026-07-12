require('dotenv').config({path: './.env'});
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const sql = `
  INSERT INTO public.profiles (id, full_name, email) 
  SELECT id, split_part(email, '@', 1), email 
  FROM auth.users 
  ON CONFLICT (id) DO NOTHING;
  
  CREATE OR REPLACE FUNCTION public.handle_new_user() 
  RETURNS trigger AS $$ 
  BEGIN 
    INSERT INTO public.profiles (id, full_name, email) 
    VALUES (new.id, split_part(new.email, '@', 1), new.email); 
    RETURN new; 
  END; 
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
`;

client.connect()
  .then(() => client.query(sql))
  .then(() => console.log('Successfully synced users and created trigger!'))
  .catch(console.error)
  .finally(() => client.end());
