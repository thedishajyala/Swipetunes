import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// We can add SpotifyProvider later
// import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Mock Login",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "test" },
            },
            async authorize(credentials, req) {
                // Simple mock login: Always returns a user if username is provided
                // In real app, check DB password here
                if (credentials.username) {
                    return { id: "1", name: "Test User", email: "test@example.com" };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // Pass the user ID to the session
            if (token && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "super_secret_mock_key",
};

export default NextAuth(authOptions);
