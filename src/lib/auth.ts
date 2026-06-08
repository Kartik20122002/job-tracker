import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { LoginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;

        const { data: user } = await supabaseAdmin
          .from("User")
          .select("id, username, email, passwordHash")
          .or(`email.eq.${identifier},username.eq.${identifier}`)
          .single();

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.username, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

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
      // On initial sign-in (account is only defined then), fetch DB id by email
      if (account) {
        const { data } = await supabaseAdmin
          .from("User")
          .select("id")
          .eq("email", token.email!)
          .single();
        if (data) token.id = data.id;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
