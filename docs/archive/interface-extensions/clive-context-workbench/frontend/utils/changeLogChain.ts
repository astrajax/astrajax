/** Client-side Change Log hash chain check (mirrors validate_context_architecture_v2.py). */

export interface ChangeLogChainFields {
    changeSummary: string;
    changeType: string;
    changedBy: string;
    status: string;
    createdAt: string;
    prevHash: string;
    entryHash: string;
    destination?: string;
    approvedBy?: string;
    publishedPath?: string;
    commitSha?: string;
    notes?: string;
    relatedIntake?: string;
    relatedContextItem?: string;
}

export interface ChainValidationResult {
    ok: boolean;
    detail: string;
    brokenAtId?: string;
}

function canonicalJson(data: unknown): string {
    if (data === null || typeof data !== 'object') {
        return JSON.stringify(data);
    }
    if (Array.isArray(data)) {
        return `[${data.map(item => canonicalJson(item)).join(',')}]`;
    }
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`).join(',')}}`;
}

async function sha256Hex(text: string): Promise<string> {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function buildCoreEntry(row: ChangeLogChainFields): Record<string, string> {
    const core: Record<string, string> = {
        'Change Summary': row.changeSummary,
        'Change Type': row.changeType,
        'Changed By': row.changedBy,
        Status: row.status,
        'Created at': row.createdAt,
    };
    const optional: Array<[keyof ChangeLogChainFields, string]> = [
        ['relatedIntake', 'Related Intake'],
        ['relatedContextItem', 'Related Context Item'],
        ['destination', 'Destination'],
        ['approvedBy', 'Approved By'],
        ['publishedPath', 'Published Path'],
        ['commitSha', 'Commit SHA'],
        ['notes', 'Notes'],
    ];
    for (const [key, label] of optional) {
        const value = row[key];
        if (typeof value === 'string' && value.trim()) {
            core[label] = value;
        }
    }
    return core;
}

async function computeEntryHash(entry: Record<string, string>, prevHash: string): Promise<string> {
    const payload = { entry, prev_hash: prevHash };
    return sha256Hex(canonicalJson(payload));
}

export async function validateChangeLogChain(
    rows: Array<{ id: string; fields: ChangeLogChainFields; sortKey: string }>,
): Promise<ChainValidationResult> {
    if (rows.length === 0) {
        return { ok: true, detail: 'No change log entries yet.' };
    }

    const sorted = [...rows].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    let prevHash = '';

    for (const row of sorted) {
        const { entryHash, prevHash: storedPrev } = row.fields;
        if (!entryHash.trim()) {
            return { ok: false, detail: `${row.id} missing Entry Hash`, brokenAtId: row.id };
        }
        if ((storedPrev ?? '') !== prevHash) {
            return { ok: false, detail: `${row.id} Prev Hash mismatch (chain broken)`, brokenAtId: row.id };
        }
        const expected = await computeEntryHash(buildCoreEntry(row.fields), prevHash);
        if (expected !== entryHash) {
            return { ok: false, detail: `${row.id} Entry Hash does not match payload (tamper detected)`, brokenAtId: row.id };
        }
        prevHash = entryHash;
    }

    return { ok: true, detail: `Chain intact across ${sorted.length} entries.` };
}
