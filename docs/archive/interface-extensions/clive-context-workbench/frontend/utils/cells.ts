// Safe cell accessors for Airtable Interface Extensions.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellRaw(record: any, fieldId: string): any {
    if (!record || !fieldId) return null;
    try {
        return record.getCellValue?.(fieldId) ?? null;
    } catch {
        return null;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellStr(record: any, fieldId: string): string {
    if (!record || !fieldId) return '';
    try {
        const s = record.getCellValueAsString?.(fieldId);
        if (typeof s === 'string') return s;
        const v = record.getCellValue?.(fieldId);
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
        if (typeof v === 'object' && 'name' in v) return String(v.name ?? '');
        return String(v);
    } catch {
        return '';
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellSelectName(record: any, fieldId: string): string | null {
    const v = cellRaw(record, fieldId);
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'name' in v) return String(v.name ?? '') || null;
    return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellMultiSelectNames(record: any, fieldId: string): string[] {
    const v = cellRaw(record, fieldId);
    if (!Array.isArray(v)) return [];
    return v
        .map(item => (typeof item === 'object' && item && 'name' in item ? String(item.name ?? '') : String(item)))
        .filter(Boolean);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellLinkedNames(record: any, fieldId: string): string[] {
    const v = cellRaw(record, fieldId);
    if (!Array.isArray(v)) return [];
    return v
        .map(item => {
            if (typeof item === 'object' && item && 'name' in item) return String(item.name ?? '');
            return '';
        })
        .filter(Boolean);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellCheckbox(record: any, fieldId: string): boolean {
    return cellRaw(record, fieldId) === true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cellDate(record: any, fieldId: string): Date | null {
    const v = cellRaw(record, fieldId);
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'string' || typeof v === 'number') {
        const d = new Date(v);
        return Number.isNaN(d.valueOf()) ? null : d;
    }
    return null;
}

export function formatRelative(d: Date | null): string {
    if (!d) return '';
    const diffMs = Date.now() - d.valueOf();
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.round(hr / 24);
    if (day < 30) return `${day}d ago`;
    return d.toISOString().slice(0, 10);
}

export function truncate(text: string, max = 160): string {
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

export function normalizeSearch(text: string): string {
    return text.trim().toLowerCase();
}

export function matchesSearch(query: string, ...parts: Array<string | null | undefined>): boolean {
    const q = normalizeSearch(query);
    if (!q) return true;
    return parts.some(part => normalizeSearch(part ?? '').includes(q));
}
