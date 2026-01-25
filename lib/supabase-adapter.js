"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAdapter = exports.format = void 0;
const supabase_js_1 = require("@supabase/supabase-js");

function isDate(date) {
    return (new Date(date).toString() !== "Invalid Date" && !isNaN(Date.parse(date)));
}

function format(obj) {
    for (const [key, value] of Object.entries(obj)) {
        if (value === null) {
            delete obj[key];
        }
        if (isDate(value)) {
            obj[key] = new Date(value);
        }
    }
    return obj;
}
exports.format = format;

const SupabaseAdapter = ({ url, secret, }) => {
    // MODIFIED: Removed `db: { schema: "next_auth" }` to default to "public"
    const supabase = (0, supabase_js_1.createClient)(url, secret, {
        db: { schema: "public" },
        global: {
            headers: { "X-Client-Info": "custom-supabase-adapter@0.1.0" },
        },
    });
    return {
        async createUser(user) {
            var _a;
            const { data, error } = await supabase
                .from("users")
                .insert({
                    ...user,
                    emailVerified: (_a = user.emailVerified) === null || _a === void 0 ? void 0 : _a.toISOString(),
                })
                .select()
                .single();
            if (error)
                throw error;
            return format(data);
        },
        async getUser(id) {
            const { data, error } = await supabase
                .from("users")
                .select()
                .eq("id", id)
                .maybeSingle();
            if (error)
                throw error;
            if (!data)
                return null;
            return format(data);
        },
        async getUserByEmail(email) {
            const { data, error } = await supabase
                .from("users")
                .select()
                .eq("email", email)
                .maybeSingle();
            if (error)
                throw error;
            if (!data)
                return null;
            return format(data);
        },
        async getUserByAccount({ providerAccountId, provider }) {
            const { data, error } = await supabase
                .from("accounts")
                .select("users (*)")
                .match({ provider, providerAccountId })
                .maybeSingle();
            if (error)
                throw error;
            if (!data || !data.users)
                return null;
            return format(data.users);
        },
        async updateUser(user) {
            var _a;
            const { data, error } = await supabase
                .from("users")
                .update({
                    ...user,
                    emailVerified: (_a = user.emailVerified) === null || _a === void 0 ? void 0 : _a.toISOString(),
                })
                .eq("id", user.id)
                .select()
                .single();
            if (error)
                throw error;
            return format(data);
        },
        async deleteUser(userId) {
            const { error } = await supabase.from("users").delete().eq("id", userId);
            if (error)
                throw error;
        },
        async linkAccount(account) {
            const { error } = await supabase.from("accounts").insert(account);
            if (error)
                throw error;
        },
        async unlinkAccount({ providerAccountId, provider }) {
            const { error } = await supabase
                .from("accounts")
                .delete()
                .match({ provider, providerAccountId });
            if (error)
                throw error;
        },
        async createSession({ sessionToken, userId, expires }) {
            const { data, error } = await supabase
                .from("sessions")
                .insert({ sessionToken, userId, expires: expires.toISOString() })
                .select()
                .single();
            if (error)
                throw error;
            return format(data);
        },
        async getSessionAndUser(sessionToken) {
            const { data, error } = await supabase
                .from("sessions")
                .select("*, users(*)")
                .eq("sessionToken", sessionToken)
                .maybeSingle();
            if (error)
                throw error;
            if (!data)
                return null;
            const { users: user, ...session } = data;
            return {
                user: format(user),
                session: format(session),
            };
        },
        async updateSession(session) {
            var _a;
            const { data, error } = await supabase
                .from("sessions")
                .update({
                    ...session,
                    expires: (_a = session.expires) === null || _a === void 0 ? void 0 : _a.toISOString(),
                })
                .eq("sessionToken", session.sessionToken)
                .select()
                .single();
            if (error)
                throw error;
            return format(data);
        },
        async deleteSession(sessionToken) {
            const { error } = await supabase
                .from("sessions")
                .delete()
                .eq("sessionToken", sessionToken);
            if (error)
                throw error;
        },
        async createVerificationToken(token) {
            const { data, error } = await supabase
                .from("verification_tokens")
                .insert({
                    ...token,
                    expires: token.expires.toISOString(),
                })
                .select()
                .single();
            if (error)
                throw error;
            const { id, ...verificationToken } = data;
            return format(verificationToken);
        },
        async useVerificationToken({ identifier, token }) {
            const { data, error } = await supabase
                .from("verification_tokens")
                .delete()
                .match({ identifier, token })
                .select()
                .maybeSingle();
            if (error)
                throw error;
            if (!data)
                return null;
            const { id, ...verificationToken } = data;
            return format(verificationToken);
        },
    };
};
exports.SupabaseAdapter = SupabaseAdapter;
