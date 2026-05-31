import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { ITEM } from '../utils/constants';
import {
    cellDate,
    cellLinkedNames,
    cellMultiSelectNames,
    cellSelectName,
    cellStr,
} from '../utils/cells';

export interface LibraryItemRow {
    id: string;
    title: string;
    canonicalText: string;
    category: string;
    appliesTo: string[];
    owner: string;
    status: string;
    authority: string;
    freshness: string;
    confirmedByHuman: string;
    packNames: string[];
    lastReviewed: Date | null;
    createdAt: Date | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLibraryItems(itemsTable: any): LibraryItemRow[] | null {
    const records = useRecords(itemsTable);

    return useMemo<LibraryItemRow[] | null>(() => {
        if (records === null) return null;
        return records.map(record => ({
            id: record.id,
            title: cellStr(record, ITEM.TITLE),
            canonicalText: cellStr(record, ITEM.CANONICAL_TEXT),
            category: cellSelectName(record, ITEM.CATEGORY) ?? '',
            appliesTo: cellMultiSelectNames(record, ITEM.APPLIES_TO),
            owner: cellSelectName(record, ITEM.OWNER) ?? '',
            status: cellSelectName(record, ITEM.STATUS) ?? '',
            authority: cellSelectName(record, ITEM.AUTHORITY) ?? '',
            freshness: cellSelectName(record, ITEM.FRESHNESS) ?? '',
            confirmedByHuman: cellSelectName(record, ITEM.CONFIRMED_BY_HUMAN) ?? '',
            packNames: cellLinkedNames(record, ITEM.CONTEXT_PACK),
            lastReviewed: cellDate(record, ITEM.LAST_REVIEWED),
            createdAt: cellDate(record, ITEM.CREATED_AT),
            raw: record,
        }));
    }, [records]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useContextPackNames(packsTable: any): Map<string, string> {
    const records = useRecords(packsTable);

    return useMemo(() => {
        const map = new Map<string, string>();
        if (!records) return map;
        for (const record of records) {
            const name = cellStr(record, 'fld15pwGYHLUZjhsx');
            if (name) map.set(record.id, name);
        }
        return map;
    }, [records]);
}
