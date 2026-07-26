import type { PlatformRouteManifest } from "./types";

export const NO_CONTEXT_MANIFEST: PlatformRouteManifest = {
  kind: "none",
  recordIds: [],
  urls: [],
  promptVersion: "code:none",
  source: "none",
};

export function codeManifest(input: {
  source: string;
  promptVersion: string;
  urls?: string[];
}): PlatformRouteManifest {
  return {
    kind: "code",
    recordIds: [],
    urls: input.urls ?? [],
    promptVersion: input.promptVersion,
    source: input.source,
  };
}

export function brainManifest(input: {
  recordIds: string[];
  source: string;
  promptVersion: string;
  urls?: string[];
}): PlatformRouteManifest {
  return {
    kind: input.recordIds.length > 0 ? "brain" : "none",
    recordIds: input.recordIds,
    urls: input.urls ?? [],
    promptVersion: input.promptVersion,
    source: input.source,
  };
}

export function contextReferenced(manifest: PlatformRouteManifest): string {
  const parts = [
    ...manifest.recordIds.map((id) => `record:${id}`),
    ...manifest.urls.map((url) => `url:${url}`),
    `prompt:${manifest.promptVersion}`,
    `source:${manifest.source}`,
  ];
  return parts.join("\n") || "none";
}
