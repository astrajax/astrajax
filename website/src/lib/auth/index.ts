/**
 * Auth.js (NextAuth v5) — operator identity for the state contract.
 * JWT session strategy (signed httpOnly cookie); identity is proven by an
 * emailed one-time code (see email-code.ts), gated by the operator
 * allow-list. First successful sign-in writes the initial operator state —
 * so a verified identity with no state record is genuinely anomalous and
 * /enter treats it as a recovery case.
 */
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { randomUUID } from "node:crypto";
import { initialOperatorState } from "../platform/operator-state";
import { getOperatorStore } from "../platform/operator-store/get-store";
import { isAllowedOperatorEmail } from "./allow-list";
import { normaliseSignInCode, verifyEmailCode } from "./email-code";

declare module "next-auth" {
  interface Session {
    operator?: { operatorId: string; email: string; role: string };
    user: DefaultSession["user"];
  }
}

/** Wrong / expired / malformed code — safe to show as a code problem. */
class InvalidSignInCode extends CredentialsSignin {
  code = "invalid_code";
}

/**
 * Code was valid but the operator house record could not be read/written.
 * Previously this looked identical to a wrong code — that was the trap.
 */
class OperatorStoreUnavailable extends CredentialsSignin {
  code = "store_unavailable";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required for Auth.js host checks behind Vercel / proxies.
  trustHost: true,
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
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const code = normaliseSignInCode(String(credentials?.code ?? ""));
        const proof = String(credentials?.proof ?? "");
        if (!email || !code || !proof) throw new InvalidSignInCode();
        if (!isAllowedOperatorEmail(email)) throw new InvalidSignInCode();
        if (!verifyEmailCode({ email, code, proof }))
          throw new InvalidSignInCode();

        try {
          const store = getOperatorStore();
          let state = await store.getByEmail(email);
          if (!state) {
            try {
              state = await store.create(
                initialOperatorState({
                  operatorId: `op_${randomUUID().slice(0, 12)}`,
                  email,
                }),
              );
            } catch (createError) {
              // Concurrent sign-in can create the row between get and create —
              // that is a conflict, not a store outage. Reload the winner.
              if (
                !(createError instanceof Error) ||
                !/already exists/i.test(createError.message)
              ) {
                throw createError;
              }
              state = await store.getByEmail(email);
            }
          }
          if (!state) throw new OperatorStoreUnavailable();
          return { id: state.operatorId, email: state.email };
        } catch (error) {
          if (error instanceof OperatorStoreUnavailable) throw error;
          console.error(
            "[auth] operator store failed after valid sign-in code",
            error,
          );
          throw new OperatorStoreUnavailable();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.operatorId = user.id;
        if (typeof user.email === "string") token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Identity comes from the verified token; state enriches it. A missing
      // state record must NOT erase identity — /enter needs the identity to
      // route that case to recovery (§2 case 5a) instead of visitor.
      if (typeof token.operatorId === "string") {
        let stateEmail = "";
        let stateRole = "owner";
        try {
          const state = await getOperatorStore().getById(token.operatorId);
          stateEmail = state?.email ?? "";
          stateRole = state?.role ?? "owner";
        } catch (error) {
          console.error(
            "[auth] operator store lookup failed in session callback",
            error,
          );
        }
        session.operator = {
          operatorId: token.operatorId,
          email:
            stateEmail ||
            (typeof token.email === "string" ? token.email : "") ||
            session.user?.email ||
            "",
          role: stateRole,
        };
        if (session.operator.email && session.user) {
          session.user.email = session.operator.email;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/enter/sign-in",
  },
});
