import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Define scopes for Spotify
const scopes = [
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-read",
    "user-library-modify",
    "user-top-read"
].join(",");

const handler = NextAuth({
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            authorization: {
                params: { scope: scopes },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            // Initial sign on
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                    user: user,
                };
            }
            return token;
        },
        async session({ session, token }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            session.error = token.error;

            // Sync user to Supabase if needed (basic upsert)
            try {
                if (session.user?.email) {
                    await supabaseAdmin.from('profiles').upsert({
                        id: token.sub || session.user.id, // Ensure we have an id
                        email: session.user.email,
                        name: session.user.name,
                        avatar: session.user.image,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'email' });
                }
            } catch (e) {
                console.error("Supabase sync error", e);
            }

            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
