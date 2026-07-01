type BrainNameplateProps = {
  mode: "view" | "create";
  name: string;
  onNameChange?: (value: string) => void;
  onConfirmCreate?: () => void;
};

export function BrainNameplate({
  mode,
  name,
  onNameChange,
  onConfirmCreate,
}: BrainNameplateProps) {
  if (mode === "create") {
    return (
      <div className="brain-shrine__nameplate brain-shrine__nameplate--create">
        <label className="sr-only" htmlFor="brain-shrine-name">
          Name your brain
        </label>
        <input
          id="brain-shrine-name"
          type="text"
          value={name}
          autoFocus
          onChange={(event) => onNameChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && name.trim()) {
              event.preventDefault();
              onConfirmCreate?.();
            }
          }}
          placeholder="Name your brain…"
          className="brain-shrine__nameplate-input"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="brain-shrine__nameplate" aria-label={`Brain name: ${name}`}>
      <span className="brain-shrine__nameplate-text">{name}</span>
    </div>
  );
}
