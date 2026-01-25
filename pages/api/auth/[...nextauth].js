import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import SpotifyProvider from "next-auth/providers/spotify";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../lib/prisma";

import { syncSpotifyData } from "../../../lib/sync";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    // ... providers ...
    events: {
        async signIn({ user, account, profile, isNewUser }) {
            if (account?.provider === "spotify" && account.access_token) {
                // Run async sync (don't await to not block sign in)
                syncSpotifyData(user.id, account.access_token);
            }
        },
    },
    providers: [
        // ... rest of file (needs context to splice correctly)

        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "user-read-email user-top-read user-read-recently-played playlist-read-private playlist-modify-public playlist-modify-private user-follow-read user-follow-modify",
                },
            },
        }),
        ...(process.env.NEXT_PUBLIC_MOCK_MODE === "true" ? [
            CredentialsProvider({
                name: "Mock Login",
                credentials: {
                    username: { label: "Username", type: "text", placeholder: "test" },
                },
                async authorize(credentials, req) {
                    // Basic mock user
                    if (credentials.username) {
                        return { id: "1", name: "Test User", email: "test@example.com", image: "https://i.pravatar.cc/150?u=test" };
                    }
                    return null;
                },
            })
        ] : []),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub;
                session.accessToken = token.accessToken; // Pass access token to client
            }
            return session;
        },
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                token.accessToken = account.access_token;
                token.id = user.id;
            }
            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "super_secret_mock_key",
};

export default NextAuth(authOptions);

