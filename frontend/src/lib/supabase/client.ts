import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use fallback URL and key to prevent URL parsing errors
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL! 
    : 'http://localhost:54321';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' 
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
    : 'dummy_key';

  const client = createBrowserClient(url, key);

  // ----------------------------------------------------
  // MOCK SUPABASE IMPLEMENTATION
  // ----------------------------------------------------
  client.auth.getUser = async () => ({ data: { user: { id: "mock-user-id", email: "mock@example.com" } }, error: null } as any);
  client.auth.signInWithPassword = async () => ({ data: {}, error: null } as any);
  client.auth.signUp = async () => ({ data: {}, error: null } as any);
  client.auth.resetPasswordForEmail = async () => ({ data: {}, error: null } as any);
  
  client.from = (table: string) => {
    return {
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === "profiles") {
              return { data: { role: "admin", department: "IT" }, error: null };
            }
            return { data: null, error: null };
          }
        })
      })
    } as any;
  };

  return client;
}
