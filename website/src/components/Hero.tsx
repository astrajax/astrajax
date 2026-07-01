import Image from "next/image";
import { FoundingCastHero } from "@/components/FoundingCastHero";

export function Hero() {
  return (
    <section id="story" className="hero-victorian-wall">
      {/* The generated Victorian study wall is the wall — full-bleed, edge to edge. */}
      <Image
        src="/agent-cast/victorian-wall.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="hero-victorian-wall__bg"
      />
      {/* Restrained depth pass layered over the photo: warm centre lift + edge vignette. */}
      <div className="hero-victorian-wall__lighting" aria-hidden />

      <div id="agent-cast" className="hero-victorian-wall__stage scroll-mt-24">
        <FoundingCastHero />
      </div>

      {/* Baseboard rail — thin top moulding swapped to the bottom of the wall. */}
      <div className="hero-baseboard-rail" aria-hidden />

      <h1 className="sr-only">AstraJax — founding cast: Clive, Pam, Doc, and Clive&apos;s Man</h1>
    </section>
  );
}
