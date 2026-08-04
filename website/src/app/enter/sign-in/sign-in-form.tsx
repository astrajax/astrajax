"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Stage = "email" | "code" | "error";

export function SignInForm() {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { proof?: string | null; error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setProof(data.proof ?? null);
      setStage("code");
      setMessage("If that address is recognised, a sign-in code is on its way.");
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (!proof) {
      setMessage("That code can't be verified. Request a fresh one.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await signIn("email-code", {
      email,
      code,
      proof,
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setMessage("That code didn't match or has expired. Request a fresh one.");
      return;
    }
    window.location.assign("/enter");
  }

  return (
    <section style={{ maxWidth: "24rem", width: "100%" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Enter AstraJax</h1>
      <p style={{ marginBottom: "1.5rem" }}>
        Sign in with your operator email. We&rsquo;ll send a six-digit code.
      </p>

      {stage === "email" && (
        <form onSubmit={requestCode}>
          <label htmlFor="operator-email" style={{ display: "block", marginBottom: "0.25rem" }}>
            Email
          </label>
          <input
            id="operator-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit" disabled={busy} style={{ padding: "0.5rem 1.25rem" }}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={submitCode}>
          <label htmlFor="operator-code" style={{ display: "block", marginBottom: "0.25rem" }}>
            Six-digit code
          </label>
          <input
            id="operator-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <button type="submit" disabled={busy} style={{ padding: "0.5rem 1.25rem" }}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("email");
              setCode("");
              setProof(null);
              setMessage(null);
            }}
            style={{ marginLeft: "0.75rem", padding: "0.5rem 1rem" }}
          >
            Use a different email
          </button>
        </form>
      )}

      {message && (
        <p role="status" style={{ marginTop: "1rem" }}>
          {message}
        </p>
      )}
    </section>
  );
}
