import React, { useState } from 'react';
import { LibraryDetail } from './LibraryDetail';
import { formatRelative, truncate } from '../utils/cells';
import { colors, fonts, itemStatusColor, microLabel, space } from '../utils/theme';
import type { LibraryItemRow } from '../hooks/useLibraryItems';

interface LibraryCardProps {
    row: LibraryItemRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div style={microLabel}>{label}</div>
            <span style={{ fontSize: '0.78rem', color: colors.textMuted, fontFamily: fonts.mono, wordBreak: 'break-word' }}>
                {value || '—'}
            </span>
        </div>
    );
}

export const LibraryCard = React.memo(function LibraryCard({ row, itemsTable }: LibraryCardProps) {
    const [expanded, setExpanded] = useState(false);
    const statusColor = itemStatusColor(row.status);

    return (
        <article
            className="clive-card"
            style={{
                padding: space(4),
                paddingLeft: space(5),
                borderLeft: `2px solid ${statusColor}`,
            }}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(2), alignItems: 'center', marginBottom: space(2) }}>
                <span
                    style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.64rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: statusColor,
                        background: `${statusColor}1A`,
                        border: `1px solid ${statusColor}55`,
                        padding: '2px 8px',
                    }}
                >
                    {row.status}
                </span>
                <span style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: fonts.mono }}>
                    {row.category || '—'}
                </span>
                <span style={{ ...microLabel, marginLeft: 'auto' }}>
                    {formatRelative(row.lastReviewed ?? row.createdAt)}
                </span>
            </div>

            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text, lineHeight: 1.35 }}>
                {row.title || 'Untitled'}
            </h3>

            <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.84rem', color: colors.textMuted, lineHeight: 1.55 }}>
                {truncate(row.canonicalText, 320)}
            </p>

            {row.packNames.length > 0 ? (
                <div style={{ marginTop: space(3), display: 'flex', flexWrap: 'wrap', gap: space(2) }}>
                    {row.packNames.map(pack => (
                        <span
                            key={pack}
                            style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                                padding: '3px 8px',
                                border: `1px solid ${colors.border}`,
                                color: colors.textMuted,
                            }}
                        >
                            {pack}
                        </span>
                    ))}
                </div>
            ) : null}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: space(3),
                    marginTop: space(3),
                }}
            >
                <Meta label="confirmed by" value={row.confirmedByHuman} />
                <Meta label="owner" value={row.owner} />
                <Meta label="authority" value={row.authority} />
                <Meta label="freshness" value={row.freshness} />
                {row.appliesTo.length > 0 ? (
                    <Meta label="applies to" value={row.appliesTo.join(', ')} />
                ) : null}
            </div>

            <div style={{ marginTop: space(3), paddingTop: space(3), borderTop: `1px solid ${colors.border}` }}>
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="clive-btn"
                    style={{ fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                    aria-expanded={expanded}
                >
                    {expanded ? 'Hide full text' : 'Show full text'}
                </button>
                {expanded ? <LibraryDetail row={row} itemsTable={itemsTable} /> : null}
            </div>
        </article>
    );
});
