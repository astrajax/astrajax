/** Chapter 1 rail — human identity beside the input. */
export function formatArchitectLabel(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? `Architect ${trimmed}` : "Architect";
}
