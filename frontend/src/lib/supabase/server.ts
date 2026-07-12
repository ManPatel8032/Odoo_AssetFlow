import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  // Use fallback URL and key to prevent URL parsing errors
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL! 
    : 'http://localhost:54321';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' 
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
    : 'dummy_key';

  const client = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  // ----------------------------------------------------
  // MOCK SUPABASE IMPLEMENTATION
  // ----------------------------------------------------
  client.auth.getUser = async () => ({ data: { user: { id: "mock-user-id", email: "mock@example.com" } }, error: null } as any);
  
  return client;
}
