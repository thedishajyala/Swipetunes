const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

async function diagnostic() {
    try {
        const env = dotenv.parse(fs.readFileSync('.env'));
        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        console.log('--- TRACKS COLUMN TYPES ---');
        const res = await supabase.from('tracks').select('*').limit(1);
        if (res.error) {
            console.error('TRACKS FETCH FAILED:', res.error.message);
        } else {
            console.log('Tracks keys:', Object.keys(res.data[0] || {}));
            // I suspect popularity or energy might be causing issues if they are typed as integers but we send floats
        }

    } catch (e) {
        console.error('Diagnostic crashed:', e);
    }
}

diagnostic();
