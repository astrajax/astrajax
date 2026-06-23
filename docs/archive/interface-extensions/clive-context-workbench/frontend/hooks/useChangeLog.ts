import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { CHANGE_LOG } from '../utils/constants';
import type { ChangeLogChainFields } from '../utils/changeLogChain';
import {
    cellDate,
    cellMultiSelectNames,
    cellSelectName,
    cellStr,
} from '../utils/cells';

export interface ChangeLogRow {
    id: string;
    changeSummary: string;
    changeType: string;
    destination: string[];
    changedBy: string;
    approvedBy: string;
    publishedPath: string;
    commitSha: string;
    status: string;
    notes: string;
    prevHash: string;
    entryHash: string;
    createdAt: Date | null;
    sortKey: string;
    chainFields: ChangeLogChainFields;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useChangeLog(changeLogTable: any): ChangeLogRow[] | null {
    const records = useRecords(changeLogTable);

    return useMemo<ChangeLogRow[] | null>(() => {
        if (records === null) return null;
        return records.map(record => {
            const createdAt = cellDate(record, CHANGE_LOG.CREATED_AT);
            const createdAtRaw = cellStr(record, CHANGE_LOG.CREATED_AT);
            const sortKey = createdAt?.toISOString() ?? record.id;
            const changeSummary = cellStr(record, CHANGE_LOG.CHANGE_SUMMARY);
            const changeType = cellSelectName(record, CHANGE_LOG.CHANGE_TYPE) ?? '';
            const changedBy = cellSelectName(record, CHANGE_LOG.CHANGED_BY) ?? '';
            const status = cellSelectName(record, CHANGE_LOG.STATUS) ?? '';
            const destination = cellMultiSelectNames(record, CHANGE_LOG.DESTINATION);
            const approvedBy = cellSelectName(record, CHANGE_LOG.APPROVED_BY) ?? '';
            const publishedPath = cellStr(record, CHANGE_LOG.PUBLISHED_PATH);
            const commitSha = cellStr(record, CHANGE_LOG.COMMIT_SHA);
            const notes = cellStr(record, CHANGE_LOG.NOTES);
            const prevHash = cellStr(record, CHANGE_LOG.PREV_HASH);
            const entryHash = cellStr(record, CHANGE_LOG.ENTRY_HASH);

            return {
                id: record.id,
                changeSummary,
                changeType,
                destination,
                changedBy,
                approvedBy,
                publishedPath,
                commitSha,
                status,
                notes,
                prevHash,
                entryHash,
                createdAt,
                sortKey,
                chainFields: {
                    changeSummary,
                    changeType,
                    changedBy,
                    status,
                    createdAt: createdAtRaw,
                    prevHash,
                    entryHash,
                    destination: destination.join(', '),
                    approvedBy,
                    publishedPath,
                    commitSha,
                    notes,
                },
                raw: record,
            };
        });
    }, [records]);
}
