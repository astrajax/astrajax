import Image from "next/image";

const agents = [
  {
    name: "Professor Iris Mortimer",
    role: "Context Curator",
    tag: "Query",
    image: "/agent-cast/professor-iris-mortimer.png",
  },
  {
    name: "Juan Vasquez",
    role: "Staffing System Support",
    tag: "Query",
    image: "/agent-cast/juan-vasquez.png",
  },
  {
    name: "Marcel Beaujolais",
    role: "Booking System Editor",
    tag: "Operational",
    image: "/agent-cast/marcel-beaujolais.png",
  },
  {
    name: "KK Kingsford",
    role: "XP Engine - Scorekeeper",
    tag: "Gamification",
    image: "/agent-cast/kk-kingsford.png",
  },
  {
    name: "Reggie Bramble",
    role: "Payroll Processing",
    tag: "Operational",
    image: "/agent-cast/reggie-bramble.png",
  },
  {
    name: "Marlowe Vance",
    role: "Ops Action Proposer",
    tag: "Intake",
    image: "/agent-cast/marlowe-vance.png",
  },
  {
    name: "Doc Albright",
    role: "Agent Engineer",
    tag: "Engineering",
    image: "/agent-cast/doc-albright.png",
  },
  {
    name: "Brother Tashi",
    role: "Email Linker",
    tag: "Intake",
    image: "/agent-cast/brother-tashi.png",
  },
  {
    name: "Vera Vinegar-Toes",
    role: "Weekly Reporter",
    tag: "Reporting",
    image: "/agent-cast/vera-vinegar-toes.png",
  },
  {
    name: "Clive Wigglesworth",
    role: "Platform Coach",
    tag: "Query",
    image: "/agent-cast/clive-wigglesworth.png",
  },
];

export function AgentCastGallery() {
  return (
    <section id="agent-cast" className="border-b border-ink/10 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          The DS Agent Cast
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {agents.map((agent) => (
            <figure key={agent.name} className="group">
              <div className="relative overflow-hidden rounded-xl border border-ink/10 bg-cream shadow-sm">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  width={768}
                  height={432}
                  className="aspect-video h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 right-3 rounded-full bg-white/92 px-3 py-1 font-mono text-[0.62rem] font-bold tracking-[0.12em] text-apricot uppercase shadow-sm ring-1 ring-ink/10">
                  {agent.tag}
                </span>
              </div>
              <figcaption className="mt-3 text-center">
                <p className="font-display text-lg font-semibold text-ink">{agent.name}</p>
                <p className="mt-1 text-sm italic text-ink-muted">{agent.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
