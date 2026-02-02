import { NextResponse } from 'next/server';

export async function GET(req) {
    const url = new URL(req.url);
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'http';

    const expectedCallback = `${proto}://${host}/api/auth/callback/spotify`;

    return NextResponse.json({
        message: "Copy the 'expectedCallback' URL below and paste it into your Spotify Developer Dashboard under Redirect URIs.",
        expectedCallback: expectedCallback,
        debug_info: {
            host: host,
            protocol: proto,
            env_nextauth_url: process.env.NEXTAUTH_URL || "Not set",
            vercel_url: process.env.VERCEL_URL || "Not set"
        }
    });
}
