import Image from "next/image";
import { FoundingCastHero } from "@/components/FoundingCastHero";

export function Hero() {
  return (
    <section id="story" className="hero-victorian-wall">
      <h1 className="sr-only">AstraJax: The AI Adoption Operating System</h1>

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
    </section>
  );
}
