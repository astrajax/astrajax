import { NextResponse } from "next/server";
import { isAllowedOperatorEmail } from "@/lib/auth/allow-list";
import { issueEmailCode } from "@/lib/auth/email-code";
import { sendSignInCode } from "@/lib/auth/send-code-email";

/**
 * Issues a sign-in code for an allow-listed operator email. Responds
 * identically for unknown emails (no account enumeration); the code goes
 * out by email only — never in this response.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    /* fall through to validation */
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!isAllowedOperatorEmail(email)) {
    // Same shape as success: requesting a code reveals nothing about the list.
    return NextResponse.json({ ok: true, proof: null });
  }

  const { code, proof } = issueEmailCode(email);
  await sendSignInCode(email, code);
  return NextResponse.json({ ok: true, proof });
}
