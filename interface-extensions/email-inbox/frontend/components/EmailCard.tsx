import React, { useState } from 'react';
import { EmailDetail } from './EmailDetail';
import {
    formatRelative,
    previewText,
    truncate,
} from '../utils/cells';
import {
    colors,
    emailCategoryColor,
    fonts,
    microLabel,
    scannerStatusColor,
    space,
} from '../utils/theme';
import type { EmailRow } from '../hooks/useEmails';

interface EmailCardProps {
    row: EmailRow;
}

export const EmailCard = React.memo(function EmailCard({ row }: EmailCardProps) {
    const [expanded, setExpanded] = useState(false);
    const categoryColor = emailCategoryColor(row.emailCategory);
    const scannerColor = scannerStatusColor(row.scannerStatus);
    const preview = previewText(row.bodyExcerpt, row.body, row.aiSummary);

    return (
        <article
            className="clive-card"
            style={{
                padding: space(4),
                paddingLeft: space(5),
                fontFamily: fonts.sans,
                borderLeft: `2px solid ${categoryColor}`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: space(2),
                    alignItems: 'center',
                    marginBottom: space(3),
                }}
            >
                <span
                    style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.64rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: categoryColor,
                        background: `${categoryColor}1A`,
                        border: `1px solid ${categoryColor}55`,
                        padding: '4px 10px',
                    }}
                >
                    {row.emailCategory || 'Uncategorised'}
                </span>

                {row.emailCategory === 'Hyperagent Release' && row.scannerStatus ? (
                    <span
                        style={{
                            fontFamily: fonts.mono,
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: scannerColor,
                            background: `${scannerColor}1A`,
                            border: `1px solid ${scannerColor}55`,
                            padding: '2px 8px',
                        }}
                    >
                        Scanner: {row.scannerStatus}
                    </span>
                ) : null}

                {row.hasAttachments ? (
                    <span style={{ ...microLabel, textTransform: 'none', letterSpacing: 0 }}>
                        Attachment
                    </span>
                ) : null}

                <span style={{ ...microLabel, marginLeft: 'auto' }}>
                    {formatRelative(row.receivedAt)}
                </span>
            </div>

            <h3
                style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.text,
                    lineHeight: 1.35,
                }}
            >
                {row.subject || '(No subject)'}
            </h3>

            <p
                style={{
                    margin: `${space(2)} 0 0`,
                    fontSize: '0.78rem',
                    color: colors.clive,
                    fontFamily: fonts.mono,
                    wordBreak: 'break-word',
                }}
            >
                {row.from || row.fromEmail || 'Unknown sender'}
            </p>

            <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.55 }}>
                {truncate(preview, 280)}
            </p>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: space(2),
                    marginTop: space(3),
                    paddingTop: space(3),
                    borderTop: `1px solid ${colors.border}`,
                }}
            >
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="clive-btn"
                    style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                    aria-expanded={expanded}
                >
                    {expanded ? 'Hide details' : 'Show details'}
                </button>

                {row.gmailLink ? (
                    <a
                        href={row.gmailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clive-btn"
                        style={{
                            fontSize: '0.7rem',
                            padding: `${space(2)} ${space(3)}`,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                        }}
                    >
                        Open in Gmail
                    </a>
                ) : null}
            </div>

            {expanded ? <EmailDetail row={row} /> : null}
        </article>
    );
});
