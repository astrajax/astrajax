/**
 * Agent cast media registry — hero stills and character animation loops.
 *
 * Files live under `website/public/agent-cast/{slug}/`. Flat legacy PNGs at
 * `website/public/agent-cast/{slug}.png` still work until migrated.
 *
 * Ops reference: `website/public/agent-cast/manifest.json` and README.md
 */

export type CastAssetSlug =
  | "clive-wigglesworth"
  | "pam-portiscue"
  | "doc-albright"
  | "professor-iris-mortimer"
  | "vera-vinegar-toes"
  | "juan-vasquez"
  | "marcel-beaujolais"
  | "kk-kingsford"
  | "reggie-bramble"
  | "marlowe-vance"
  | "brother-tashi";

export type FoundingCastProductSlug = "clive" | "pam" | "doc" | "iris" | "vera";

/** Where the hero still is stored for this character. */
export type HeroStatus = "legacy" | "canonical" | "pending";

export type AgentAnimationVariant = {
  /** Stable id — matches filename without extension, e.g. `idle-loop`. */
  id: string;
  /** Relative to `{slug}/animations/`. */
  file: string;
  purpose: string;
};

export type CastCharacterAssets = {
  slug: CastAssetSlug;
  name: string;
  role: string;
  /** Gallery tag pill (DS fleet page). */
  tag?: string;
  foundingCast: boolean;
  productSlug?: FoundingCastProductSlug;
  heroStatus: HeroStatus;
  animations: AgentAnimationVariant[];
};

const AGENT_CAST_BASE = "/agent-cast";

export const FOUNDING_CAST_PRODUCT_SLUGS: FoundingCastProductSlug[] = [
  "clive",
  "pam",
  "doc",
  "iris",
  "vera",
];

export const PRODUCT_TO_ASSET_SLUG: Record<FoundingCastProductSlug, CastAssetSlug> = {
  clive: "clive-wigglesworth",
  pam: "pam-portiscue",
  doc: "doc-albright",
  iris: "professor-iris-mortimer",
  vera: "vera-vinegar-toes",
};

export const CAST_CHARACTERS: CastCharacterAssets[] = [
  {
    slug: "clive-wigglesworth",
    name: "Clive Wigglesworth",
    role: "Platform Coach",
    tag: "Query",
    foundingCast: true,
    productSlug: "clive",
    heroStatus: "canonical",
    animations: [],
  },
  {
    slug: "pam-portiscue",
    name: "Pam Portiscue",
    role: "Challenger",
    tag: "Review",
    foundingCast: true,
    productSlug: "pam",
    heroStatus: "canonical",
    animations: [],
  },
  {
    slug: "doc-albright",
    name: "Doc Albright",
    role: "Agent Engineer",
    tag: "Engineering",
    foundingCast: true,
    productSlug: "doc",
    heroStatus: "canonical",
    animations: [],
  },
  {
    slug: "professor-iris-mortimer",
    name: "Professor Iris Mortimer",
    role: "Context Curator",
    tag: "Query",
    foundingCast: true,
    productSlug: "iris",
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "vera-vinegar-toes",
    name: "Vera Vinegar-Toes",
    role: "Weekly Reporter",
    tag: "Reporting",
    foundingCast: true,
    productSlug: "vera",
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "juan-vasquez",
    name: "Juan Vasquez",
    role: "Staffing System Support",
    tag: "Query",
    foundingCast: false,
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "marcel-beaujolais",
    name: "Marcel Beaujolais",
    role: "Booking System Editor",
    tag: "Operational",
    foundingCast: false,
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "kk-kingsford",
    name: "KK Kingsford",
    role: "XP Engine - Scorekeeper",
    tag: "Gamification",
    foundingCast: false,
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "reggie-bramble",
    name: "Reggie Bramble",
    role: "Payroll Processing",
    tag: "Operational",
    foundingCast: false,
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "marlowe-vance",
    name: "Marlowe Vance",
    role: "Ops Action Proposer",
    tag: "Intake",
    foundingCast: false,
    heroStatus: "legacy",
    animations: [],
  },
  {
    slug: "brother-tashi",
    name: "Brother Tashi",
    role: "Email Linker",
    tag: "Intake",
    foundingCast: false,
    heroStatus: "legacy",
    animations: [],
  },
];

const castBySlug = new Map(CAST_CHARACTERS.map((c) => [c.slug, c]));

export function getCastCharacter(slug: CastAssetSlug): CastCharacterAssets | undefined {
  return castBySlug.get(slug);
}

export function getCastByProduct(slug: FoundingCastProductSlug): CastCharacterAssets {
  return castBySlug.get(PRODUCT_TO_ASSET_SLUG[slug])!;
}

/** Founding triptych characters with delivered hero loop videos. */
const HERO_VIDEO_SLUGS = new Set<CastAssetSlug>([
  "clive-wigglesworth",
  "pam-portiscue",
  "doc-albright",
]);

/** Public URL for a character's hero still, or undefined when not yet delivered. */
export function castHeroSrc(slug: CastAssetSlug): string | undefined {
  const character = getCastCharacter(slug);
  if (!character || character.heroStatus === "pending") return undefined;

  if (character.heroStatus === "canonical") {
    return `${AGENT_CAST_BASE}/${slug}/hero.png`;
  }

  return `${AGENT_CAST_BASE}/${slug}.png`;
}

/** Public URL for a character's homepage hero loop video, when available. */
export function castHeroVideoSrc(slug: CastAssetSlug): string | undefined {
  if (!HERO_VIDEO_SLUGS.has(slug)) return undefined;
  const character = getCastCharacter(slug);
  if (!character || character.heroStatus !== "canonical") return undefined;
  return `${AGENT_CAST_BASE}/${slug}/hero.mp4`;
}

export function castHeroByProduct(slug: FoundingCastProductSlug): string | undefined {
  return castHeroSrc(PRODUCT_TO_ASSET_SLUG[slug]);
}

/** Public URL for a named animation variant, when registered. */
export function castAnimationSrc(
  slug: CastAssetSlug,
  variantId: string,
): string | undefined {
  const character = getCastCharacter(slug);
  const variant = character?.animations.find((a) => a.id === variantId);
  if (!variant) return undefined;
  return `${AGENT_CAST_BASE}/${slug}/animations/${variant.file}`;
}

/** All animation URLs for a character (empty until files are added + manifest updated). */
export function castAnimations(slug: CastAssetSlug): { id: string; src: string; purpose: string }[] {
  const character = getCastCharacter(slug);
  if (!character) return [];

  return character.animations.flatMap((variant) => {
    const src = castAnimationSrc(slug, variant.id);
    return src ? [{ id: variant.id, src, purpose: variant.purpose }] : [];
  });
}

export const foundingCastCharacters = CAST_CHARACTERS.filter((c) => c.foundingCast);

export const dsFleetGalleryCharacters = CAST_CHARACTERS.filter((c) => c.tag);

/** Homepage triptych order: Doc left, Clive centre, Pam right. */
export const FOUNDING_CAST_HERO_TRIPTYCH_ORDER: FoundingCastProductSlug[] = [
  "doc",
  "clive",
  "pam",
];

export type FoundingCastHeroEntry = {
  slug: CastAssetSlug;
  name: string;
  /** Poster still — hero.png */
  src: string;
  /** Looping hero video — hero.mp4, when delivered */
  videoSrc?: string;
  role: string;
};

export function foundingCastHeroTriptych(): FoundingCastHeroEntry[] {
  return FOUNDING_CAST_HERO_TRIPTYCH_ORDER.map((productSlug) => {
    const character = getCastByProduct(productSlug);
    const assetSlug = PRODUCT_TO_ASSET_SLUG[productSlug];
    const src = castHeroByProduct(productSlug);
    if (!src) {
      throw new Error(`Missing hero still for founding cast: ${productSlug}`);
    }
    return {
      slug: assetSlug,
      name: character.name,
      src,
      videoSrc: castHeroVideoSrc(assetSlug),
      role: character.role,
    };
  });
}
