/**
 * Delivery for sign-in codes. Resend in production (RESEND_API_KEY +
 * AUTH_EMAIL_FROM); server-console fallback for local dev so the loop
 * works before env is configured. The code never appears in any HTTP
 * response — email or server log only.
 */

export async function sendSignInCode(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    console.info(`[dev sign-in] code for ${email}: ${code}`);
    return;
  }

  const from = process.env.AUTH_EMAIL_FROM ?? "AstraJax <sign-in@astrajax.com>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Your AstraJax sign-in code: ${code}`,
      text: [
        `Your sign-in code is ${code}.`,
        "",
        "It expires in 10 minutes. If you didn't request it, ignore this email.",
      ].join("\n"),
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Sign-in email failed (${response.status}): ${detail}`);
  }
}
