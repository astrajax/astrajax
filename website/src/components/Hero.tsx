import { FoundingCastHero } from "@/components/FoundingCastHero";

export function Hero() {
  return (
    <section id="story" className="hero-victorian-wall">
      <h1 className="sr-only">AstraJax: The AI Adoption Operating System</h1>

      <div id="agent-cast" className="hero-victorian-wall__stage scroll-mt-24">
        <FoundingCastHero />
      </div>
    </section>
  );
}
