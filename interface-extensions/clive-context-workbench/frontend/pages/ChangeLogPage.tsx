import React, { useEffect, useMemo, useState } from 'react';
import { ChangeLogDetail } from '../components/ChangeLogDetail';
import { validateChangeLogChain, type ChainValidationResult } from '../utils/changeLogChain';
import { formatRelative } from '../utils/cells';
import { colors, fonts, microLabel, space } from '../utils/theme';
import type { ChangeLogRow } from '../hooks/useChangeLog';

interface ChangeLogPageProps {
    rows: ChangeLogRow[];
}

function ChainBanner({ result, loading }: { result: ChainValidationResult | null; loading: boolean }) {
    if (loading) {
        return (
            <div style={{ padding: space(3), border: `1px solid ${colors.border}`, marginBottom: space(4) }}>
                <span style={microLabel}>Checking hash chain…</span>
            </div>
        );
    }
    if (!result) return null;

    const tone = result.ok ? colors.success : colors.danger;
    return (
        <div
            style={{
                padding: space(3),
                marginBottom: space(4),
                border: `1px solid ${tone}55`,
                background: `${tone}14`,
            }}
        >
            <div style={{ ...microLabel, color: tone }}>
                Audit chain:
                {' '}
                {result.ok ? 'Intact' : 'Broken'}
            </div>
            <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.82rem', color: colors.textMuted, lineHeight: 1.5 }}>
                {result.detail}
            </p>
        </div>
    );
}

export const ChangeLogPage = React.memo(function ChangeLogPage({ rows }: ChangeLogPageProps) {
    const [chainResult, setChainResult] = useState<ChainValidationResult | null>(null);
    const [chainLoading, setChainLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const sorted = useMemo(
        () => [...rows].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
        [rows],
    );

    useEffect(() => {
        let cancelled = false;
        setChainLoading(true);
        validateChangeLogChain(rows.map(row => ({
            id: row.id,
            fields: row.chainFields,
            sortKey: row.sortKey,
        })))
            .then(result => {
                if (!cancelled) setChainResult(result);
            })
            .catch(error => {
                if (!cancelled) {
                    setChainResult({ ok: false, detail: String(error) });
                }
            })
            .finally(() => {
                if (!cancelled) setChainLoading(false);
            });
        return () => { cancelled = true; };
    }, [rows]);

    return (
        <div>
            <p style={{ margin: `0 0 ${space(4)}`, fontSize: '0.82rem', color: colors.textMuted, maxWidth: 720, lineHeight: 1.5 }}>
                Read-only audit trail. The banner above checks the tamper-evident hash chain — not just the row list.
                Publisher is deferred; expect few entries until publishing starts.
            </p>

            <ChainBanner result={chainResult} loading={chainLoading} />

            {sorted.length === 0 ? (
                <p style={{ fontFamily: fonts.mono, fontSize: '0.82rem', color: colors.textMuted }}>
                    No change log entries yet.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: space(3) }}>
                    {sorted.map(row => (
                        <article
                            key={row.id}
                            className="clive-card"
                            style={{ padding: space(4) }}
                        >
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(2), marginBottom: space(2) }}>
                                <span style={{ ...microLabel, color: colors.clive }}>{row.changeType || '—'}</span>
                                <span style={{ ...microLabel }}>{row.status || '—'}</span>
                                <span style={{ ...microLabel, marginLeft: 'auto' }}>
                                    {formatRelative(row.createdAt)}
                                </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
                                {row.changeSummary || 'Untitled change'}
                            </h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: space(3),
                                    marginTop: space(3),
                                    fontSize: '0.78rem',
                                    color: colors.textMuted,
                                    fontFamily: fonts.mono,
                                }}
                            >
                                <div><span style={microLabel}>Changed by</span><br />{row.changedBy || '—'}</div>
                                <div><span style={microLabel}>Approved by</span><br />{row.approvedBy || '—'}</div>
                                <div><span style={microLabel}>Published path</span><br />{row.publishedPath || '—'}</div>
                            </div>
                            {row.entryHash ? (
                                <p style={{ margin: `${space(3)} 0 0`, fontSize: '0.68rem', color: colors.textDim, fontFamily: fonts.mono, wordBreak: 'break-all' }}>
                                    Entry hash: {row.entryHash.slice(0, 16)}…
                                </p>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                className="clive-btn"
                                style={{ marginTop: space(3), fontSize: '0.7rem', padding: `${space(2)} ${space(3)}` }}
                                aria-expanded={expandedId === row.id}
                            >
                                {expandedId === row.id ? 'Hide details' : 'Show details'}
                            </button>
                            {expandedId === row.id ? <ChangeLogDetail row={row} /> : null}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
});
