import React from 'react';
import { BASE_ID, EMAILS_TABLE_ID } from '../utils/constants';
import { formatDateTime } from '../utils/cells';
import { DetailField, DetailSection } from './DetailField';
import { colors, fonts, space } from '../utils/theme';
import type { EmailRow } from '../hooks/useEmails';

interface EmailDetailProps {
    row: EmailRow;
}

export function EmailDetail({ row }: EmailDetailProps) {
    const airtableUrl = `https://airtable.com/${BASE_ID}/${EMAILS_TABLE_ID}/${row.id}`;

    return (
        <div
            style={{
                marginTop: space(3),
                padding: space(3),
                background: colors.bgInset,
                border: `1px solid ${colors.border}`,
            }}
        >
            {row.aiSummary ? (
                <DetailSection title="AI summary">
                    <DetailField label="Summary" value={row.aiSummary} multiline />
                </DetailSection>
            ) : null}

            <DetailSection title="Message">
                <DetailField label="From" value={row.from} />
                <DetailField label="From email" value={row.fromEmail} mono />
                <DetailField label="To" value={row.to} />
                <DetailField label="Cc" value={row.cc} />
                <DetailField label="Received" value={formatDateTime(row.receivedAt)} />
                <DetailField label="Ingest source" value={row.ingestSource} />
            </DetailSection>

            <DetailSection title="Body">
                <div style={{ gridColumn: '1 / -1' }}>
                    <DetailField
                        label="Full body"
                        value={row.body || row.bodyExcerpt}
                        multiline
                    />
                </div>
            </DetailSection>

            {row.hasAttachments || row.attachmentNames ? (
                <DetailSection title="Attachments">
                    <DetailField
                        label="Files"
                        value={row.attachmentNames || (row.hasAttachments ? 'Yes (names not listed)' : '')}
                        multiline
                    />
                </DetailSection>
            ) : null}

            {row.notes ? (
                <DetailSection title="Notes">
                    <DetailField label="Notes" value={row.notes} multiline />
                </DetailSection>
            ) : null}

            {row.aiStructuredJson ? (
                <DetailSection title="AI structured JSON">
                    <div style={{ gridColumn: '1 / -1' }}>
                        <DetailField label="Raw JSON" value={row.aiStructuredJson} mono multiline />
                    </div>
                </DetailSection>
            ) : null}

            <p style={{ margin: `${space(3)} 0 0`, fontSize: '0.68rem', color: colors.textDim, fontFamily: fonts.mono }}>
                Record ID: {row.id}
                {' · '}
                {row.gmailLink ? (
                    <a
                        href={row.gmailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: colors.textDim, textDecoration: 'underline' }}
                    >
                        Open in Gmail
                    </a>
                ) : null}
                {row.gmailLink ? ' · ' : null}
                <a
                    href={airtableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: colors.textDim, textDecoration: 'underline' }}
                >
                    Open in Airtable
                </a>
            </p>
        </div>
    );
}
