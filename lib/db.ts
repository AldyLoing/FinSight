import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

// Supabase client for browser/client-side
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createSupabaseBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`));
        return cookie ? cookie.split('=')[1] : undefined;
      },
      set(name: string, value: string, options: any) {
        document.cookie = `${name}=${value}; path=/; ${options?.maxAge ? `max-age=${options.maxAge}` : ''}`;
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; max-age=0`;
      },
    },
  });
}
