"use client";

/**
 * The quiet AJ crest — a live binding ornament centred exactly above the
 * folio binding. Kathryn's K8 master deliberately ships with NO baked centre
 * crest (the generation engine kept moving it to the far-right rail), so the
 * crest is a separately positioned overlay that stays perfectly centred at
 * every breakpoint. Engraved-brass socket, quiet — an ornament, not dominant.
 */
export function FolioCrest() {
  return (
    <div className="folio-crest" aria-hidden>
      <svg viewBox="0 0 64 64" className="folio-crest__svg" focusable="false">
        {/* socket ring */}
        <circle cx="32" cy="32" r="29" fill="none" stroke="#cba056" strokeWidth="1.5" opacity="0.8" />
        <circle cx="32" cy="32" r="25" fill="none" stroke="#cba056" strokeWidth="0.6" opacity="0.5" />
        {/* rivets */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x = 32 + Math.cos(rad) * 27;
          const y = 32 + Math.sin(rad) * 27;
          return <circle key={deg} cx={x} cy={y} r="1.4" fill="#cba056" opacity="0.7" />;
        })}
        {/* AJ monogram — engraved, quiet */}
        <text
          x="32"
          y="40"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="22"
          fontWeight="600"
          fill="#e7d1ad"
          letterSpacing="0.5"
        >
          AJ
        </text>
        {/* laurel whisper under the monogram */}
        <path
          d="M 22 46 Q 32 51 42 46"
          fill="none"
          stroke="#cba056"
          strokeWidth="1"
          opacity="0.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
