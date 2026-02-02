import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = session.user.id; // Internal UUID

    try {
        let supabaseQuery = supabaseAdmin
            .from('users')
            .select('id, display_name, profile_pic_url')
            .neq('id', userId) // Don't show current user
            .limit(20);

        if (query) {
            supabaseQuery = supabaseQuery.ilike('display_name', `%${query}%`);
        }

        const { data: users, error } = await supabaseQuery;

        if (error) throw error;

        return NextResponse.json(users);
    } catch (error) {
        console.error("API Users Error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
