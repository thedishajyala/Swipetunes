const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

async function diagnostic() {
    try {
        const env = dotenv.parse(fs.readFileSync('.env'));
        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        console.log('--- TYPE TEST: swipes.user_id ---');
        const testId = '31hqauxbjhrwdnuv4sorpg5htqey';
        const res = await supabase
            .from('swipes')
            .select('*')
            .eq('user_id', testId)
            .limit(1);

        if (res.error) {
            console.error('TYPE TEST FAILED:');
            console.error(JSON.stringify(res.error, null, 2));
        } else {
            console.log('TYPE TEST SUCCESS: swipes.user_id allows Spotify ID string');
            console.log('Data:', res.data);
        }

        console.log('--- TYPE TEST: profiles.id ---');
        const res2 = await supabase
            .from('profiles')
            .select('*')
            .eq('id', testId)
            .limit(1);

        if (res2.error) {
            console.error('PROFILE TYPE TEST FAILED:');
            console.error(JSON.stringify(res2.error, null, 2));
        } else {
            console.log('PROFILE TYPE TEST SUCCESS');
            console.log('Data:', res2.data);
        }

    } catch (e) {
        console.error('Diagnostic crashed:', e);
    }
}

diagnostic();
