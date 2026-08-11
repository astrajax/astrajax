import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Enter — AstraJax",
  description: "Operator sign-in for the AstraJax house.",
};

/**
 * Operator sign-in — painted-world entrance shell. Functional email → code
 * flow; visual register matches the Victorian front-of-house without marketing
 * furniture or global nav.
 */
export default function SignInPage() {
  return (
    <main className="operator-sign-in">
      <Image
        src="/agent-cast/victorian-wall.png"
        alt=""
        aria-hidden
        fill
        priority
        quality={85}
        sizes="100vw"
        className="operator-sign-in__wall"
      />
      <div className="operator-sign-in__lighting" aria-hidden />

      <header className="operator-sign-in__header">
        <Link href="/" className="operator-sign-in__brand" aria-label="AstraJax home">
          <Image
            src="/astrajax-logo.png"
            alt=""
            width={1024}
            height={929}
            className="operator-sign-in__logo"
          />
          <span>AstraJax</span>
        </Link>
        <Link href="/" className="operator-sign-in__back">
          Front of house
        </Link>
      </header>

      <div className="operator-sign-in__stage">
        <SignInForm />
      </div>
    </main>
  );
}
