import type { FoundingCastProductSlug } from "@/lib/agent-cast-assets";
import { DEFAULT_BRAIN_SLUG } from "@/lib/platform/brains";

export type CommandRoomSlug = Extract<FoundingCastProductSlug, "clive" | "doc" | "pam">;

export type RoomStation = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  badge?: string;
};

export type RoomConfig = {
  slug: CommandRoomSlug;
  path: `/command/${CommandRoomSlug}`;
  roomLabel: string;
  roomTitle: string;
  tagline: string;
  accentClass: "room-shell--clive" | "room-shell--doc" | "room-shell--pam";
  stations: RoomStation[];
  stewardNote?: string;
};

export const COMMAND_ROOM_ORDER: CommandRoomSlug[] = ["clive", "doc", "pam"];

export const COMMAND_ROOMS: Record<CommandRoomSlug, RoomConfig> = {
  clive: {
    slug: "clive",
    path: "/command/clive",
    roomLabel: "Clive's study",
    roomTitle: "Reasoning & context",
    tagline: "Map the human, draft the brain, hear Pam — you decide.",
    accentClass: "room-shell--clive",
    stations: [
      {
        id: "chapter-1",
        title: "Build the brain",
        description:
          "Chapter 1 — structured interview, Pam sniff test, human approval, Doc promote.",
        href: "/command/clive",
        cta: "Choose a book",
        badge: "Live",
      },
      {
        id: "context-review",
        title: "Brain review",
        description: "Score agent answers and flag suspect context from the review shortlist.",
        href: `/brain/${DEFAULT_BRAIN_SLUG}?tab=review`,
        cta: "Open review",
        badge: "Live",
      },
    ],
  },
  doc: {
    slug: "doc",
    path: "/command/doc",
    roomLabel: "Doc's workshop",
    roomTitle: "Agent building",
    tagline: "Approved brief received. I'll write it properly and leave a trail.",
    accentClass: "room-shell--doc",
    stations: [
      {
        id: "fleet",
        title: "Design the fleet",
        description: "Task-scoped agents — personality editable, competence locked.",
        href: "/fleet",
        cta: "Open fleet design",
        badge: "Live",
      },
      {
        id: "deploy",
        title: "Package and deploy",
        description: "HyperAgent-ready packages with governed defaults.",
        href: "/deploy",
        cta: "Open deploy",
        badge: "Live",
      },
      {
        id: "dispatch",
        title: "Doc dispatch",
        description: "Implementation jobs — routing, Composer builds, publish gates.",
        href: "/dispatch",
        cta: "Open dispatch",
        badge: "Live",
      },
      {
        id: "agents",
        title: "Agent bases",
        description: "Persona config and persona memories across agent bases.",
        href: "/agents",
        cta: "Open agent bases",
        badge: "Live",
      },
    ],
  },
  pam: {
    slug: "pam",
    path: "/command/pam",
    roomLabel: "Pam's desk",
    roomTitle: "Brain bases & challenge",
    tagline: "This looks stale or thin. Stress-test before you fix it.",
    accentClass: "room-shell--pam",
    stewardNote:
      "Clive's Man proposes repairs and upkeep behind this desk — humans approve before Trusted truth changes.",
    stations: [
      {
        id: "outstanding-actions",
        title: "Outstanding actions",
        description:
          "Clive's Man proposals — context repairs waiting for your approve or dismiss.",
        href: `/brain/${DEFAULT_BRAIN_SLUG}?tab=review&view=actionProposed`,
        cta: "Open proposals",
        badge: "Live",
      },
      {
        id: "health",
        title: "Brain health",
        description: "Maturity ladder, efficiency credit, leaderboard, promote gate.",
        href: `/brain/${DEFAULT_BRAIN_SLUG}?tab=overview`,
        cta: "Open brain health",
        badge: "Live",
      },
      {
        id: "context-health",
        title: "Context Health",
        description:
          "Importance mix, risk tolerance, retire queue — spot bloat before it spreads.",
        href: `/brain/${DEFAULT_BRAIN_SLUG}?tab=context-health`,
        cta: "Open context health",
        badge: "Live",
      },
      {
        id: "review",
        title: "Brain review queue",
        description: "Needs-review shortlist — score answers, flag suspect context.",
        href: `/brain/${DEFAULT_BRAIN_SLUG}?tab=review`,
        cta: "Open review",
        badge: "Live",
      },
      {
        id: "agents",
        title: "Agent bases",
        description: "Review persona config and memories — spot drift before it spreads.",
        href: "/agents",
        cta: "Open agent bases",
        badge: "Live",
      },
    ],
  },
};

export function getCommandRoom(slug: string): RoomConfig | undefined {
  if (slug in COMMAND_ROOMS) {
    return COMMAND_ROOMS[slug as CommandRoomSlug];
  }
  return undefined;
}
