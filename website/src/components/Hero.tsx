import Image from "next/image";
import { FoundingCastHero } from "@/components/FoundingCastHero";
import { castHeroVideoSrc } from "@/lib/agent-cast-assets";

const docHeroVideoSrc = castHeroVideoSrc("doc-albright");
const pamHeroVideoSrc = castHeroVideoSrc("pam-portiscue");

export function Hero() {
  return (
    <section id="story" className="hero-victorian-wall">
      {docHeroVideoSrc ? (
        <link rel="preload" href={docHeroVideoSrc} as="video" type="video/mp4" />
      ) : null}
      {pamHeroVideoSrc ? (
        <link rel="preload" href={pamHeroVideoSrc} as="video" type="video/mp4" />
      ) : null}
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

      {/* Brand wordmark hung on the wall — upper-left, separate from the nav, links home. */}
      <a href="/" aria-label="AstraJax — home" className="hero-wall-brand">
        <Image
          src="/astrajax-logo.png"
          alt=""
          aria-hidden
          width={60}
          height={60}
          className="hero-wall-brand__mark"
        />
        <span className="hero-wall-brand__word">ASTRAJAX</span>
      </a>

      <div id="agent-cast" className="hero-victorian-wall__stage scroll-mt-24">
        <FoundingCastHero />
      </div>

      {/* Baseboard rail — thin top moulding swapped to the bottom of the wall. */}
      <div className="hero-baseboard-rail" aria-hidden />

      <h1 className="sr-only">The AI Adoption Operating System</h1>
      {/* Visible page heading — lower-right on the wall, two lines. */}
      <p className="hero-wall-headline font-display" aria-hidden="true">
        The AI Adoption
        <br />
        Operating System
      </p>
    </section>
  );
}
