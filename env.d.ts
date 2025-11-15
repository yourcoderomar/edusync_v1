declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase Configuration (Public - accessible in browser)
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    
    // App Configuration (Public)
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_APP_DESCRIPTION: string;
    
    // Server-side only (NEVER expose to client)
    SUPABASE_SERVICE_ROLE_KEY?: string;
    
    // Node Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

