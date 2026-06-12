import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@db";
import { users, authAccounts, verificationTokens } from "@db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: authAccounts,
      verificationTokensTable: verificationTokens,
    }),
    // Override createSession to capture deviceInfo from the request context.
    // NextAuth doesn't pass request headers into adapter methods directly, so
    // we stamp it asynchronously after session creation via the session callback.
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Stamp User.lastSeenAt on every web sign-in. deviceInfo for web sessions
      // is captured separately in the couple layout via the x-ua header set by
      // middleware, since NextAuth events don't expose request headers.
      if (user?.id) {
        db.update(users)
          .set({
            lastSeenAt: new Date(),
            lastDeviceInfo: `web | ${account?.provider ?? 'unknown'}`,
          })
          .where(eq(users.id, user.id))
          .catch(() => {});
      }
    },
  },
});
