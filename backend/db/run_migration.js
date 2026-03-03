#!/usr/bin/env node
/**
 * SwipeTunes DB Migration Runner
 * Applies migration_001.sql against Supabase via HTTP REST API
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://iivazputkeifeiilkoqr.supabase.co';
const SERVICE_KEY = 'sb_secret_NoISBgc_nUXfJtorr7yE3Q_xI_uOKaZ';

function httpPost(url, headers, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: 443,
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                ...headers
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Run a single SQL statement via Supabase's pg REST endpoint
async function runSQL(sql) {
    const body = JSON.stringify({ query: sql });
    const res = await httpPost(
        `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body
    );
    return res;
}

// Parse SQL file: split into individual statements, preserve $$ blocks
function splitStatements(sql) {
    // Remove single-line comments, then split by ;
    const normalized = sql
        .split('\n')
        .map(line => line.replace(/^--.*$/, '').trimEnd())
        .join('\n');

    const stmts = [];
    let current = '';
    let inDollar = false;

    for (let i = 0; i < normalized.length; i++) {
        if (normalized[i] === '$' && normalized[i + 1] === '$') {
            inDollar = !inDollar;
            current += '$$';
            i++;
            continue;
        }
        if (normalized[i] === ';' && !inDollar) {
            const s = current.trim();
            if (s) stmts.push(s);
            current = '';
        } else {
            current += normalized[i];
        }
    }
    const last = current.trim();
    if (last) stmts.push(last);
    return stmts.filter(s => s.replace(/\s/g, '').length > 0);
}

async function main() {
    console.log('🚀 SwipeTunes DB Migration 001\n');

    const sqlFile = path.join(__dirname, 'db', 'migration_001.sql');
    const rawSql = fs.readFileSync(sqlFile, 'utf8');
    const stmts = splitStatements(rawSql);

    console.log(`Found ${stmts.length} statements to execute\n`);

    let ok = 0, fail = 0;

    for (const stmt of stmts) {
        const label = stmt.replace(/\s+/g, ' ').slice(0, 70);
        try {
            const res = await runSQL(stmt);
            if (res.status >= 200 && res.status < 300) {
                console.log(`✅ ${label}`);
                ok++;
            } else {
                const parsed = JSON.parse(res.body);
                const msg = parsed?.message || parsed?.error || res.body;
                // "already exists" type errors are fine
                if (msg.includes('already exists') || msg.includes('duplicate')) {
                    console.log(`⚠️  Already exists (OK): ${label}`);
                    ok++;
                } else {
                    console.error(`❌ ${label}`);
                    console.error(`   → ${msg}\n`);
                    fail++;
                }
            }
        } catch (e) {
            console.error(`💥 ${label}`);
            console.error(`   → ${e.message}\n`);
            fail++;
        }
    }

    console.log(`\n📊 Result: ${ok} succeeded, ${fail} failed`);
    if (fail === 0) console.log('🎉 Migration complete!');
    else console.log('⚠️  Some statements failed — check logs above.');
}

main();
