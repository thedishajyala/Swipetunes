import SpotifyProvider from "next-auth/providers/spotify";
import { supabaseAdmin } from "./supabase-admin";

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

export const authOptions = {
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
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                    user: user,
                    id: user.id
                };
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id || token.sub;
            session.accessToken = token.accessToken;
            session.error = token.error;

            // Sync user to Supabase
            try {
                if (session.user?.email) {
                    const { error } = await supabaseAdmin.from('profiles').upsert({
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.name,
                        avatar: session.user.image,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'email' });

                    if (error) console.error("Supabase Profile Sync Error:", error);
                }
            } catch (e) {
                console.error("Critical Profile Sync Error:", e);
            }

            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
