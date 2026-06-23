// Nocturne Orchard — AstraJax brand tokens (astrajax_brand_colours.md)

export const colors = {
    deepMoss: '#202A1B',
    graphiteInk: '#171A18',
    blueberryBlack: '#111423',
    parchment: '#E7D1AD',
    buttermilk: '#E4D3A3',
    burntApricot: '#D77545',
    sageSignal: '#9AA77A',
    textMuted: 'rgba(231, 209, 173, 0.72)',
    textDim: 'rgba(231, 209, 173, 0.48)',
    border: 'rgba(231, 209, 173, 0.12)',
    borderStrong: 'rgba(231, 209, 173, 0.22)',
} as const;

export const fonts = {
    sans: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
} as const;

export const space = (n: number) => `${n * 4}px`;
