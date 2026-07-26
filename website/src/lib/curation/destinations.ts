export type ContextDestination =
  | "workshop-draft-truth"
  | "workshop-source-document"
  | "workshop-interactions"
  | "household-activity"
  | "trusted-brain-truth"
  | "registry-change-log";

export type DestinationChipProps = {
  destination: ContextDestination;
  brainSlug?: string;
  recordId?: string;
  compact?: boolean;
};

export const DESTINATION_LABELS: Record<
  ContextDestination,
  { home: string; table: string; base: string }
> = {
  "workshop-draft-truth": {
    home: "Workshop draft bench",
    table: "Draft Brain Truth",
    base: "Brain Workshop",
  },
  "workshop-source-document": {
    home: "Workshop intake",
    table: "Source Documents",
    base: "Brain Workshop",
  },
  "workshop-interactions": {
    home: "Workshop review queue",
    table: "Brain Interactions",
    base: "Brain Workshop",
  },
  "household-activity": {
    home: "Household review queue",
    table: "Activity",
    base: "Household Activity",
  },
  "trusted-brain-truth": {
    home: "Trusted Brain",
    table: "Brain Truth",
    base: "Trusted Brain",
  },
  "registry-change-log": {
    home: "Registry audit",
    table: "Change Log",
    base: "Brain Registry",
  },
};

export function destinationConfirmLabel(destination: ContextDestination): string {
  const { home, table } = DESTINATION_LABELS[destination];
  return `File in ${home} → ${table}`;
}
