export const CONFIRMED_BY_OPTIONS = ['Matthew', 'TL'] as const;
export type ConfirmedByHuman = (typeof CONFIRMED_BY_OPTIONS)[number];

interface SessionUser {
    name?: string | null;
    email?: string | null;
}

/** Map the logged-in Airtable collaborator to a Confirmed By Human select value. */
export function resolveConfirmedByHuman(user: SessionUser | null): ConfirmedByHuman | null {
    if (!user) return null;

    const name = (user.name ?? '').trim().toLowerCase();
    const email = (user.email ?? '').trim().toLowerCase();

    if (name.includes('matthew') || email.includes('matthew') || email.includes('hopkinson')) {
        return 'Matthew';
    }
    if (name === 'tl' || name.includes('team lead') || email.startsWith('tl@')) {
        return 'TL';
    }

    for (const option of CONFIRMED_BY_OPTIONS) {
        if (name === option.toLowerCase()) return option;
    }

    return null;
}
