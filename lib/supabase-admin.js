import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin;

try {
    if (supabaseUrl && supabaseServiceKey) {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } else {
        console.warn('Supabase Admin: Missing credentials. Background tasks will be skipped.');
    }
} catch (e) {
    console.error('Supabase Admin: Initialization error:', e);
}

export { supabaseAdmin };
