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
      const data = (await response.json()) as {
        proof?: string | null;
        error?: string;
      };
      if (!response.ok) {
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setProof(data.proof ?? null);
      setStage("code");
      setMessage(
        "If that address is recognised, a sign-in code is on its way.",
      );
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (!proof) {
      setMessage(
        "That address isn’t on the operator list, or the code step lost its proof. Check the email you used, then request a fresh code.",
      );
      return;
    }
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setMessage("Enter the six digits from the email (spaces are fine).");
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await signIn("email-code", {
      email: email.trim().toLowerCase(),
      code: digits,
      proof,
      redirect: false,
    });
    setBusy(false);
    // Auth.js v5 may return a URL string or an object — only treat explicit errors as failure.
    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error
    ) {
      const codeHint =
        "code" in result && typeof result.code === "string" ? result.code : "";
      if (codeHint === "store_unavailable") {
        setMessage(
          "Your code was accepted, but we couldn’t open your house record. That’s an operator-store credential problem — not the code. Ask for BRAIN_REGISTRY_WRITE_TOKEN to be checked on Vercel, then try again.",
        );
        return;
      }
      setMessage(
        "That code didn’t match this sign-in attempt, or it expired (10 minutes). Request a fresh code and use the newest email only.",
      );
      return;
    }
    window.location.assign("/enter");
  }

  return (
    <section
      className="operator-sign-in__plate"
      aria-labelledby="operator-sign-in-title"
    >
      <p className="section-label operator-sign-in__eyebrow">
        Operator entrance
      </p>
      <h1 id="operator-sign-in-title" className="operator-sign-in__title">
        Enter AstraJax
      </h1>
      <p className="operator-sign-in__lede">
        Sign in with your operator email. We&rsquo;ll send a six-digit code.
      </p>

      {stage === "email" && (
        <form className="operator-sign-in__form" onSubmit={requestCode}>
          <label htmlFor="operator-email" className="operator-sign-in__label">
            Email
          </label>
          <input
            id="operator-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="platform-gate-input operator-sign-in__input"
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-primary operator-sign-in__submit"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {stage === "code" && (
        <form className="operator-sign-in__form" onSubmit={submitCode}>
          <label htmlFor="operator-code" className="operator-sign-in__label">
            Six-digit code
          </label>
          <input
            id="operator-code"
            inputMode="numeric"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="platform-gate-input operator-sign-in__input operator-sign-in__input--code"
          />
          <div className="operator-sign-in__actions">
            <button
              type="submit"
              disabled={busy}
              className="btn-primary operator-sign-in__submit"
            >
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
              className="btn-secondary operator-sign-in__secondary"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      {message ? (
        <p role="status" className="operator-sign-in__status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
