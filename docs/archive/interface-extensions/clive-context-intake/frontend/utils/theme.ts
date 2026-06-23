// ============================================================
// Clive Context Intake — design tokens.
//
// Palette: Nocturne Orchard (astrajax_brand_colours.md).
// Sharp HUD chrome; colour is restrained and warm, not neon.
// ============================================================

import type { CSSProperties } from 'react';

/** Canonical AstraJax brand hex — source: astrajax_brand_colours.md */
export const brand = {
    deepMoss: '#202A1B',
    graphiteInk: '#171A18',
    blueberryBlack: '#111423',
    parchmentDim: '#E7D1AD',
    buttermilk: '#E4D3A3',
    burntApricot: '#D77545',
    sageSignal: '#9AA77A',
} as const;

export const colors = {
    // Surfaces (§6 system mapping)
    bg: brand.deepMoss,
    bgRaised: brand.graphiteInk,
    bgInset: brand.blueberryBlack,
    bgHover: '#1E211D',

    // Dividers — low-opacity Parchment Dim (§6)
    border: 'rgba(231, 209, 173, 0.12)',
    borderStrong: 'rgba(231, 209, 173, 0.28)',

    // Text — Parchment Dim + stepped opacity (§3)
    text: brand.parchmentDim,
    textMuted: 'rgba(231, 209, 173, 0.62)',
    textDim: 'rgba(231, 209, 173, 0.38)',

    // Sage Signal — active / ready / system state (§3)
    accent: brand.sageSignal,
    accentText: brand.deepMoss,
    accentSoft: 'rgba(154, 167, 122, 0.14)',
    accentLine: 'rgba(154, 167, 122, 0.48)',
    glow: 'rgba(154, 167, 122, 0.20)',

    // Buttermilk — warm emphasis, badges, selected (§3)
    warm: brand.buttermilk,
    warmSoft: 'rgba(228, 211, 163, 0.14)',
    warmText: brand.graphiteInk,

    // Burnt Apricot — Clive / human editorial (§3, §6)
    clive: brand.burntApricot,
    cliveSoft: 'rgba(215, 117, 69, 0.14)',

    // Semantic status — no neon amber/cyan/purple (§5 Avoid)
    success: brand.sageSignal,
    warning: brand.buttermilk,
    danger: '#A85A38',
    muted: 'rgba(231, 209, 173, 0.50)',
} as const;

export const fonts = {
    sans: "'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const radii = {
    sm: 0,
    md: 0,
    lg: 0,
    pill: 0,
} as const;

export const space = (n: number) => `${n * 4}px`;

export function cut(n = 10): CSSProperties {
    return {
        clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)`,
    };
}

export const microLabel: CSSProperties = {
    fontFamily: fonts.mono,
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: colors.textDim,
};

export function statusColor(status: string | null): string {
    switch (status) {
        case 'Ready for review': return colors.accent;
        case 'Needs clarification': return colors.warm;
        case 'Possible duplicate': return colors.muted;
        case 'Approved': return colors.success;
        case 'Rejected': return colors.danger;
        case 'Published':
        case 'Deployed': return colors.textMuted;
        default: return colors.textDim;
    }
}

export function destinationColor(destination: string | null): string {
    switch (destination) {
        case 'Hyperagent': return colors.accent;
        case 'Cursor/GitHub': return colors.warm;
        case 'Notion': return colors.clive;
        case 'Airtable': return colors.success;
        default: return colors.textDim;
    }
}
