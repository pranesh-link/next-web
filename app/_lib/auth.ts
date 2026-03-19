import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prismaBase, prisma } from "@/_lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prismaBase),
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
        return token;
      }

      // On subsequent requests, verify the user ID still exists in DB.
      // If the DB was reset, the old UUID is stale — resolve by email instead.
      if (token.sub && token.email) {
        const exists = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true },
        });
        if (!exists) {
          const byEmail = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true },
          });
          if (byEmail) {
            token.sub = byEmail.id;
          }
        }
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
});
