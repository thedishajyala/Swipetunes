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

async function refreshAccessToken(token) {
    try {
        const url = "https://accounts.spotify.com/api/token";
        const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
        };
    } catch (error) {
        console.error("RefreshAccessTokenError", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

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
            // Initial sign in
            if (account && user) {
                return {
                    accessToken: account.access_token,
                    accessTokenExpires: Date.now() + account.expires_at * 1000,
                    refreshToken: account.refresh_token,
                    user,
                    id: user.id || token.sub
                };
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < token.accessTokenExpires) {
                return token;
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.user = token.user;
            session.user.id = token.id;
            session.accessToken = token.accessToken;
            session.error = token.error;

            // Sync user to Supabase
            try {
                if (session.user?.email && supabaseAdmin) {
                    const { error } = await supabaseAdmin.from('profiles').upsert({
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.name,
                        avatar: session.user.image,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'email' });

                    if (error) console.error("Supabase Profile Sync Error:", error.message);
                }
            } catch (e) {
                console.error("Critical Profile Sync Error:", e.message);
            }

            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
