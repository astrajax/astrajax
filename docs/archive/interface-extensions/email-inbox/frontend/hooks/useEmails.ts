import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { EMAIL } from '../utils/constants';
import {
    cellBool,
    cellDate,
    cellSelectName,
    cellStr,
    cellUrl,
} from '../utils/cells';

export interface EmailRow {
    id: string;
    subject: string;
    from: string;
    fromEmail: string;
    receivedAt: Date | null;
    emailCategory: string;
    scannerStatus: string;
    aiSummary: string;
    body: string;
    bodyExcerpt: string;
    aiStructuredJson: string;
    gmailLink: string;
    ingestSource: string;
    notes: string;
    to: string;
    cc: string;
    hasAttachments: boolean;
    attachmentNames: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useEmails(emailsTable: any): EmailRow[] {
    const records = useRecords(emailsTable);

    return useMemo<EmailRow[]>(() => {
        if (!records) return [];
        const rows: EmailRow[] = [];

        for (const record of records) {
            rows.push({
                id: record.id,
                subject: cellStr(record, EMAIL.SUBJECT),
                from: cellStr(record, EMAIL.FROM),
                fromEmail: cellStr(record, EMAIL.FROM_EMAIL),
                receivedAt: cellDate(record, EMAIL.RECEIVED_AT),
                emailCategory: cellSelectName(record, EMAIL.EMAIL_CATEGORY) ?? 'Uncategorised',
                scannerStatus: cellSelectName(record, EMAIL.SCANNER_STATUS) ?? '',
                aiSummary: cellStr(record, EMAIL.AI_SUMMARY),
                body: cellStr(record, EMAIL.BODY),
                bodyExcerpt: cellStr(record, EMAIL.BODY_EXCERPT),
                aiStructuredJson: cellStr(record, EMAIL.AI_STRUCTURED_JSON),
                gmailLink: cellUrl(record, EMAIL.GMAIL_LINK),
                ingestSource: cellSelectName(record, EMAIL.INGEST_SOURCE) ?? '',
                notes: cellStr(record, EMAIL.NOTES),
                to: cellStr(record, EMAIL.TO),
                cc: cellStr(record, EMAIL.CC),
                hasAttachments: cellBool(record, EMAIL.HAS_ATTACHMENTS),
                attachmentNames: cellStr(record, EMAIL.ATTACHMENT_NAMES),
                raw: record,
            });
        }

        return rows;
    }, [records]);
}

export function sortByNewest(rows: EmailRow[]): EmailRow[] {
    return [...rows].sort((a, b) => {
        const at = a.receivedAt?.valueOf() ?? 0;
        const bt = b.receivedAt?.valueOf() ?? 0;
        return bt - at;
    });
}

export function countByCategory(rows: EmailRow[]): Record<string, number> {
    const counts: Record<string, number> = { all: rows.length };
    for (const row of rows) {
        const key = row.emailCategory || 'Uncategorised';
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
}
