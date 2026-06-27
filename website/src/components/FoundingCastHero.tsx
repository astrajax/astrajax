import Image from "next/image";
import { foundingCastHeroTriptych } from "@/lib/agent-cast-assets";

const HERO_ALT: Record<string, string> = {
  "doc-albright":
    "Doc Albright — Jack Russell terrier in a workshop portrait, tools and blueprints at paw",
  "clive-wigglesworth":
    "Clive Wigglesworth — golden retriever in a warm Victorian library portrait",
  "pam-portiscue":
    "Pam Portiscue — grey cat with a map and compass, challenger at the chart table",
};

const triptych = foundingCastHeroTriptych();
const [doc, clive, pam] = triptych;

export function FoundingCastHero() {
  return (
    <figure className="w-full">
      <figcaption className="sr-only">
        Founding cast: {triptych.map((c) => c.name).join(", ")}
      </figcaption>

      {/* Desktop: Doc | Clive | Pam — Clive front and larger */}
      <div className="hidden w-full items-end justify-center lg:flex">
        <div className="relative flex w-full max-w-none items-end justify-center">
          <div className="relative z-10 w-[30%] shrink-0 -mr-[4%] origin-bottom scale-[0.88]">
            <Image
              src={doc.src}
              alt={HERO_ALT[doc.slug]}
              width={480}
              height={600}
              sizes="(min-width: 1024px) 30vw, 0px"
              className="block h-auto w-full object-contain object-bottom"
            />
          </div>
          <div className="relative z-20 w-[38%] shrink-0">
            <Image
              src={clive.src}
              alt={HERO_ALT[clive.slug]}
              width={560}
              height={700}
              priority
              sizes="(min-width: 1024px) 38vw, 0px"
              className="block h-auto w-full object-contain object-bottom"
            />
          </div>
          <div className="relative z-10 w-[30%] shrink-0 -ml-[4%] origin-bottom scale-[0.88]">
            <Image
              src={pam.src}
              alt={HERO_ALT[pam.slug]}
              width={480}
              height={600}
              sizes="(min-width: 1024px) 30vw, 0px"
              className="block h-auto w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>

      {/* Mobile: Clive full width, Pam + Doc below */}
      <div className="flex w-full flex-col gap-3 lg:hidden">
        <Image
          src={clive.src}
          alt={HERO_ALT[clive.slug]}
          width={560}
          height={700}
          priority
          sizes="100vw"
          className="block h-auto w-full object-contain object-center"
        />
        <div className="grid grid-cols-2 gap-2">
          <Image
            src={pam.src}
            alt={HERO_ALT[pam.slug]}
            width={480}
            height={600}
            sizes="50vw"
            className="block h-auto w-full object-contain object-bottom"
          />
          <Image
            src={doc.src}
            alt={HERO_ALT[doc.slug]}
            width={480}
            height={600}
            sizes="50vw"
            className="block h-auto w-full object-contain object-bottom"
          />
        </div>
      </div>
    </figure>
  );
}
