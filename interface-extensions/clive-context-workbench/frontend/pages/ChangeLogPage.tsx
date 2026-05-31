import { memo, useEffect, useMemo, useState } from 'react';
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
            <div style={{ padding: space(4), border: `1px solid ${colors.border}`, marginBottom: space(4), background: colors.bgRaised }}>
                <span style={microLabel}>Checking tamper alarm...</span>
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
                Tamper check:
                {' '}
                {result.ok ? 'Intact' : 'Broken'}
            </div>
            <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.82rem', color: colors.textMuted, lineHeight: 1.5 }}>
                {result.detail}
            </p>
        </div>
    );
}

export const ChangeLogPage = memo(function ChangeLogPage({ rows }: ChangeLogPageProps) {
    const [chainResult, setChainResult] = useState<ChainValidationResult | null>(null);
    const [chainLoading, setChainLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const sorted = useMemo(
        () => [...rows].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
        [rows],
    );
    const publishedCount = useMemo(
        () => rows.filter(row => row.publishedPath || row.commitSha).length,
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
            <section className="workbench-page-header">
                <div>
                    <div style={{ ...microLabel, color: colors.clive }}>Paper trail</div>
                    <h2 style={{ margin: `${space(2)} 0 0`, fontSize: '1.45rem', lineHeight: 1.15, color: colors.text }}>
                        Every approved change should leave a trail.
                    </h2>
                    <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.92rem', color: colors.textMuted, maxWidth: 760, lineHeight: 1.6 }}>
                        This is read-only. The tamper check is the alarm: if a log record was edited later, the numbers should stop lining up.
                    </p>
                </div>
                <div className="workbench-stat-grid">
                    <div className="workbench-stat">
                        <div style={microLabel}>Entries</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.text }}>
                            {rows.length}
                        </strong>
                    </div>
                    <div className="workbench-stat">
                        <div style={microLabel}>Published traces</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.success }}>
                            {publishedCount}
                        </strong>
                    </div>
                    <div className="workbench-stat">
                        <div style={microLabel}>Tamper check</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: chainResult?.ok ? colors.success : colors.warm }}>
                            {chainLoading ? '...' : chainResult?.ok ? 'OK' : 'Check'}
                        </strong>
                    </div>
                </div>
            </section>

            <ChainBanner result={chainResult} loading={chainLoading} />

            {sorted.length === 0 ? (
                <p style={{ fontFamily: fonts.mono, fontSize: '0.82rem', color: colors.textMuted }}>
                    No change log entries yet.
                </p>
            ) : (
                <div className="workbench-card-list">
                    {sorted.map(row => (
                        <article
                            key={row.id}
                            className={`clive-card${expandedId === row.id ? ' clive-card--focus' : ''}`}
                            style={{ padding: space(5), borderLeft: `4px solid ${row.entryHash ? colors.success : colors.warm}` }}
                        >
                            <div className="workbench-card-topline">
                                <span style={{ ...microLabel, color: colors.clive }}>{row.changeType || '—'}</span>
                                <span style={{ ...microLabel }}>{row.status || '—'}</span>
                                <span style={{ ...microLabel, marginLeft: 'auto' }}>
                                    {formatRelative(row.createdAt)}
                                </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 700, color: colors.text, lineHeight: 1.28 }}>
                                {row.changeSummary || 'Untitled change'}
                            </h3>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: space(3),
                                    marginTop: space(4),
                                    padding: space(3),
                                    background: colors.bgRaised,
                                    border: `1px solid ${colors.border}`,
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
                                style={{ marginTop: space(4), fontSize: '0.72rem', minHeight: 44, padding: `${space(2)} ${space(4)}` }}
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
