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
            const spotifyId = token.id || token.sub;
            session.accessToken = token.accessToken;
            session.error = token.error;

            // Merge user data from token
            if (token.user) {
                session.user = {
                    ...session.user,
                    ...token.user,
                    spotify_id: spotifyId
                };
            }

            if (!supabaseAdmin) {
                console.warn("Auth: supabaseAdmin not initialized");
                return session;
            }

            try {
                // 1. Try to find existing user by spotify_id
                let { data: profile, error: fetchError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('spotify_id', spotifyId)
                    .maybeSingle();

                if (!profile) {
                    console.log("Auth: User not found, creating new one for spotifyId:", spotifyId);
                    // 2. Create new user if not found
                    const { data: newUser, error: createError } = await supabaseAdmin
                        .from('users')
                        .insert({
                            spotify_id: spotifyId,
                            display_name: session.user.name,
                            email: session.user.email,
                            profile_pic_url: session.user.image,
                            updated_at: new Date().toISOString()
                        })
                        .select('id')
                        .single();

                    if (createError) {
                        console.error("Auth: User creation failed:", createError.message);
                    } else {
                        profile = newUser;
                        console.log("Auth: New user created with UUID:", profile.id);
                    }
                } else {
                    // 3. Update existing user's name/avatar/email
                    await supabaseAdmin.from('users').update({
                        display_name: session.user.name,
                        email: session.user.email,
                        profile_pic_url: session.user.image,
                        updated_at: new Date().toISOString()
                    }).eq('spotify_id', spotifyId);
                }

                if (profile) {
                    session.user.id = profile.id; // This is now the internal UUID
                }
            } catch (e) {
                console.error("Auth: Critical session callback error:", e.message);
            }

            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
