import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error('⚠️ SUPABASE ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing!');
    console.error('Locally: Check your .env file.');
    console.error('Production: Add these variables in your hosting provider\'s dashboard (Environment Variables).');
}

export const supabase = createClient<Database>(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_PUBLISHABLE_KEY || 'placeholder',
    {
        auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
        }
    });
