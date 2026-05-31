import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { ITEM } from '../utils/constants';
import {
    cellDate,
    cellSelectName,
    cellStr,
} from '../utils/cells';

export interface ContextItemRow {
    id: string;
    title: string;
    canonicalText: string;
    category: string;
    owner: string;
    status: string;
    authority: string;
    freshness: string;
    createdBy: string;
    proposedByAgent: string;
    confirmedByHuman: string;
    confirmationMethod: string;
    bootstrapSource: string;
    sourceNotes: string;
    createdAt: Date | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useContextItems(itemsTable: any): ContextItemRow[] {
    const records = useRecords(itemsTable);

    return useMemo<ContextItemRow[]>(() => {
        if (!records) return [];
        const rows: ContextItemRow[] = [];

        for (const record of records) {
            rows.push({
                id: record.id,
                title: cellStr(record, ITEM.TITLE),
                canonicalText: cellStr(record, ITEM.CANONICAL_TEXT),
                category: cellSelectName(record, ITEM.CATEGORY) ?? '',
                owner: cellSelectName(record, ITEM.OWNER) ?? '',
                status: cellSelectName(record, ITEM.STATUS) ?? '',
                authority: cellSelectName(record, ITEM.AUTHORITY) ?? '',
                freshness: cellSelectName(record, ITEM.FRESHNESS) ?? '',
                createdBy: cellSelectName(record, ITEM.CREATED_BY) ?? '',
                proposedByAgent: cellStr(record, ITEM.PROPOSED_BY_AGENT),
                confirmedByHuman: cellSelectName(record, ITEM.CONFIRMED_BY_HUMAN) ?? '',
                confirmationMethod: cellSelectName(record, ITEM.CONFIRMATION_METHOD) ?? '',
                bootstrapSource: cellStr(record, ITEM.BOOTSTRAP_SOURCE),
                sourceNotes: cellStr(record, ITEM.SOURCE_NOTES),
                createdAt: cellDate(record, ITEM.CREATED_AT),
                raw: record,
            });
        }

        return rows;
    }, [records]);
}

export function sortByAgentThenNewest(rows: ContextItemRow[]): ContextItemRow[] {
    return [...rows].sort((a, b) => {
        const agentA = (a.proposedByAgent || '—').toLowerCase();
        const agentB = (b.proposedByAgent || '—').toLowerCase();
        if (agentA !== agentB) return agentA.localeCompare(agentB);
        const at = a.createdAt?.valueOf() ?? 0;
        const bt = b.createdAt?.valueOf() ?? 0;
        return bt - at;
    });
}

export function uniqueAgents(rows: ContextItemRow[]): string[] {
    const values = new Set<string>();
    for (const row of rows) {
        const agent = row.proposedByAgent.trim();
        values.add(agent || '— unset —');
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
}
