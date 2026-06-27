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

const frameClass =
  "rounded-sm bg-white p-1.5 shadow-[0_8px_32px_rgba(26,26,26,0.12)] ring-1 ring-ink/8 sm:p-2";

function PortraitFrame({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={frameClass}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className={`block h-auto w-full object-contain ${className ?? ""}`}
      />
    </div>
  );
}

export function FoundingCastHero() {
  return (
    <figure className="w-full">
      <figcaption className="sr-only">
        Founding cast: {triptych.map((c) => c.name).join(", ")}
      </figcaption>

      {/* Desktop: Doc | Clive | Pam — distinct frames on a gallery wall */}
      <div className="hidden w-full items-end justify-center gap-4 lg:flex xl:gap-6">
        <div className="w-[27%] shrink-0 self-end">
          <PortraitFrame
            src={doc.src}
            alt={HERO_ALT[doc.slug]}
            width={640}
            height={800}
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw"
            className="object-bottom"
          />
        </div>
        <div className="w-[34%] shrink-0 self-end">
          <PortraitFrame
            src={clive.src}
            alt={HERO_ALT[clive.slug]}
            width={768}
            height={960}
            priority
            sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 28vw"
            className="object-bottom"
          />
        </div>
        <div className="w-[27%] shrink-0 self-end">
          <PortraitFrame
            src={pam.src}
            alt={HERO_ALT[pam.slug]}
            width={640}
            height={800}
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw"
            className="object-bottom"
          />
        </div>
      </div>

      {/* Mobile: Clive prominent, Pam + Doc in a row below */}
      <div className="flex w-full flex-col gap-4 lg:hidden">
        <PortraitFrame
          src={clive.src}
          alt={HERO_ALT[clive.slug]}
          width={768}
          height={960}
          priority
          sizes="100vw"
          className="object-center"
        />
        <div className="grid grid-cols-2 gap-3">
          <PortraitFrame
            src={pam.src}
            alt={HERO_ALT[pam.slug]}
            width={640}
            height={800}
            sizes="50vw"
            className="object-bottom"
          />
          <PortraitFrame
            src={doc.src}
            alt={HERO_ALT[doc.slug]}
            width={640}
            height={800}
            sizes="50vw"
            className="object-bottom"
          />
        </div>
      </div>
    </figure>
  );
}
