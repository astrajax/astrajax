import Image from "next/image";
import { agents } from "@/components/AgentCastGallery";

const reelAgents = [...agents, ...agents];

export function AgentCastReel() {
  return (
    <div className="relative h-full min-h-[16rem] overflow-hidden rounded-lg border border-ink/10 bg-cream sm:min-h-[20rem] lg:min-h-[28rem]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-cream to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-cream to-transparent" />

      <div className="agent-cast-reel flex h-full min-w-max items-center gap-4 px-4 py-5">
        {reelAgents.map((agent, index) => (
          <figure
            key={`${agent.name}-${index}`}
            className="w-48 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm sm:w-56"
          >
            <div className="relative">
              <Image
                src={agent.image}
                alt={agent.name}
                width={768}
                height={432}
                className="aspect-video h-auto w-full object-cover"
                priority={index < 5}
              />
              <span className="absolute top-2 right-2 rounded-full bg-white/92 px-2.5 py-1 font-mono text-[0.56rem] font-bold tracking-[0.1em] text-apricot uppercase shadow-sm ring-1 ring-ink/10">
                {agent.tag}
              </span>
            </div>
            <figcaption className="px-3 py-3">
              <p className="font-display text-base leading-tight font-semibold text-ink">
                {agent.name}
              </p>
              <p className="mt-1 text-xs italic text-ink-muted">{agent.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
