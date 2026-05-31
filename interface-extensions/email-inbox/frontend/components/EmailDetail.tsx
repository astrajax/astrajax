import { BASE_ID, EMAILS_TABLE_ID } from '../utils/constants';
import { formatDateTime } from '../utils/cells';
import { DetailField, DetailSection } from './DetailField';
import { colors, fonts, microLabel, space } from '../utils/theme';
import type { EmailRow } from '../hooks/useEmails';

interface EmailDetailProps {
    row: EmailRow;
}

function parseStructuredJson(value: string): Record<string, unknown> | null {
    if (!value.trim()) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : null;
    } catch {
        return null;
    }
}

function formatStructuredValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value, null, 2);
}

function formatStructuredLabel(key: string): string {
    return key
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function EmailDetail({ row }: EmailDetailProps) {
    const airtableUrl = `https://airtable.com/${BASE_ID}/${EMAILS_TABLE_ID}/${row.id}`;
    const structuredData = parseStructuredJson(row.aiStructuredJson);
    const structuredEntries = structuredData
        ? Object.entries(structuredData).filter(([, value]) => formatStructuredValue(value).trim())
        : [];
    const body = row.body || row.bodyExcerpt || 'No body captured for this email.';

    return (
        <div
            style={{
                marginTop: space(4),
                padding: space(5),
                background: colors.messageBg,
                border: `1px solid ${colors.border}`,
            }}
        >
            <section className="email-reader" aria-label="Email reader">
                <div style={{ ...microLabel, color: colors.accent, marginBottom: space(2) }}>
                    readable email view
                </div>
                <h2
                    style={{
                        margin: 0,
                        fontSize: 'clamp(1.35rem, 3vw, 2rem)',
                        lineHeight: 1.15,
                        letterSpacing: '-0.03em',
                        color: colors.text,
                    }}
                >
                    {row.subject || '(No subject)'}
                </h2>
                <p
                    style={{
                        margin: `${space(2)} 0 ${space(4)}`,
                        fontSize: '0.96rem',
                        lineHeight: 1.5,
                        color: colors.textMuted,
                    }}
                >
                    From <strong style={{ color: colors.text }}>{row.from || row.fromEmail || 'Unknown sender'}</strong>
                    {row.receivedAt ? ` on ${formatDateTime(row.receivedAt)}` : ''}
                </p>

                {row.aiSummary ? (
                    <aside
                        style={{
                            marginBottom: space(5),
                            padding: space(4),
                            background: colors.accentSoft,
                            border: `1px solid ${colors.accentLine}`,
                        }}
                    >
                        <div style={{ ...microLabel, color: colors.accent, marginBottom: space(2) }}>
                            AI summary
                        </div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '1rem',
                                lineHeight: 1.6,
                                color: colors.text,
                            }}
                        >
                            {row.aiSummary}
                        </p>
                    </aside>
                ) : null}

                <div className="email-body" style={{ color: colors.text }}>
                    {body}
                </div>
            </section>

            <DetailSection title="Review data">
                <DetailField label="Category" value={row.emailCategory} />
                <DetailField label="Scanner status" value={row.scannerStatus} />
                <DetailField label="Ingest source" value={row.ingestSource} />
            </DetailSection>

            <DetailSection title="Message metadata">
                <DetailField label="From" value={row.from} />
                <DetailField label="From email" value={row.fromEmail} mono />
                <DetailField label="To" value={row.to} />
                <DetailField label="Cc" value={row.cc} />
                <DetailField label="Received" value={formatDateTime(row.receivedAt)} />
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
                <DetailSection title="AI classification data">
                    {structuredEntries.length > 0 ? (
                        structuredEntries.map(([key, value]) => (
                            <DetailField
                                key={key}
                                label={formatStructuredLabel(key)}
                                value={formatStructuredValue(value)}
                                multiline={typeof value === 'object'}
                            />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <DetailField label="Raw JSON" value={row.aiStructuredJson} mono multiline />
                        </div>
                    )}
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
