/**
 * Auth.js (NextAuth v5) — operator identity for the state contract.
 * JWT session strategy (signed httpOnly cookie); identity is proven by an
 * emailed one-time code (see email-code.ts), gated by the operator
 * allow-list. First successful sign-in writes the initial operator state —
 * so a verified identity with no state record is genuinely anomalous and
 * /enter treats it as a recovery case.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { randomUUID } from "node:crypto";
import { initialOperatorState } from "../platform/operator-state";
import { getOperatorStore } from "../platform/operator-store/get-store";
import { isAllowedOperatorEmail } from "./allow-list";
import { verifyEmailCode } from "./email-code";

declare module "next-auth" {
  interface Session {
    operator?: { operatorId: string; email: string; role: string };
    user: DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "email-code",
      name: "Email code",
      credentials: {
        email: {},
        code: {},
        proof: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const code = String(credentials?.code ?? "");
        const proof = String(credentials?.proof ?? "");
        if (!email || !code || !proof) return null;
        if (!isAllowedOperatorEmail(email)) return null;
        if (!verifyEmailCode({ email, code, proof })) return null;

        const store = getOperatorStore();
        let state = await store.getByEmail(email);
        if (!state) {
          state = await store.create(
            initialOperatorState({ operatorId: `op_${randomUUID().slice(0, 12)}`, email }),
          );
        }
        return { id: state.operatorId, email: state.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.operatorId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (typeof token.operatorId === "string" && session.user?.email) {
        const state = await getOperatorStore().getById(token.operatorId);
        session.operator = state
          ? { operatorId: state.operatorId, email: state.email, role: state.role }
          : undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/enter/sign-in",
  },
});
