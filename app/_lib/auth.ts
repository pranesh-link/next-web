import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prismaBase } from "@/_lib/prisma";

/**
 * Builds an aggregated device info string from the request's User-Agent and
 * timezone hint. Format: "BrowserOS | locale | timezone"
 * Stored on Session.deviceInfo for web sessions.
 */
function buildWebDeviceInfo(userAgent: string | null, locale?: string, timezone?: string): string {
  const ua = userAgent ?? 'Unknown browser';
  // Extract a simplified browser/OS hint from UA (no heavy parsing)
  const short = ua.length > 120 ? ua.substring(0, 120) + '…' : ua;
  const parts = [short];
  if (locale) parts.push(locale);
  if (timezone) parts.push(timezone);
  return parts.join(' | ');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prismaBase),
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
        prismaBase.user.update({
          where: { id: user.id },
          data: {
            lastSeenAt: new Date(),
            lastDeviceInfo: `web | ${account?.provider ?? 'unknown'}`,
          },
        }).catch(() => {});
      }
    },
  },
});
