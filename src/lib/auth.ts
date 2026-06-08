import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;

      const { data: existing } = await supabaseAdmin
        .from("User")
        .select("id, googleId")
        .eq("email", user.email!)
        .single();

      if (existing) {
        if (!existing.googleId) {
          await supabaseAdmin
            .from("User")
            .update({ googleId: account.providerAccountId })
            .eq("id", existing.id);
        }
        return true;
      }

      // New user — derive a unique username from their Google name/email
      const base = (user.name ?? user.email!.split("@")[0])
        .replace(/\s+/g, "_")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      const username = `${base}_${Math.random().toString(36).slice(2, 6)}`;

      const { error } = await supabaseAdmin.from("User").insert({
        username,
        email: user.email!,
        googleId: account.providerAccountId,
      });

      return !error;
    },

    async jwt({ token, account }) {
      // On initial sign-in fetch DB id + subscription and store in token
      if (account) {
        const { data } = await supabaseAdmin
          .from("User")
          .select("id, subscription")
          .eq("email", token.email!)
          .single();
        if (data) {
          token.id = data.id;
          token.subscription = data.subscription;
        }
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.subscription = (token.subscription ?? "free") as "pro" | "free";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
