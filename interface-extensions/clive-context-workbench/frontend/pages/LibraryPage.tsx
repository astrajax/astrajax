import React, { useMemo, useState } from 'react';
import { LibraryCard } from '../components/LibraryCard';
import { matchesSearch } from '../utils/cells';
import { IN_REVIEW_STATUSES, ITEM_STATUS } from '../utils/constants';
import { colors, fonts, microLabel, space } from '../utils/theme';
import type { LibraryItemRow } from '../hooks/useLibraryItems';

interface LibraryPageProps {
    rows: LibraryItemRow[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export const LibraryPage = React.memo(function LibraryPage({ rows, itemsTable }: LibraryPageProps) {
    const [search, setSearch] = useState('');
    const [packFilter, setPackFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const inReviewCount = useMemo(
        () => rows.filter(row => IN_REVIEW_STATUSES.includes(row.status as typeof IN_REVIEW_STATUSES[number])).length,
        [rows],
    );

    const approvedRows = useMemo(
        () => rows.filter(row => row.status === ITEM_STATUS.APPROVED),
        [rows],
    );

    const packOptions = useMemo(() => {
        const set = new Set<string>();
        for (const row of approvedRows) {
            for (const pack of row.packNames) set.add(pack);
        }
        return Array.from(set).sort();
    }, [approvedRows]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const row of approvedRows) {
            if (row.category) set.add(row.category);
        }
        return Array.from(set).sort();
    }, [approvedRows]);

    const filtered = useMemo(() => {
        return approvedRows
            .filter(row => !packFilter || row.packNames.includes(packFilter))
            .filter(row => !categoryFilter || row.category === categoryFilter)
            .filter(row => matchesSearch(search, row.title, row.canonicalText, row.packNames.join(' ')))
            .sort((a, b) => (b.lastReviewed?.valueOf() ?? b.createdAt?.valueOf() ?? 0)
                - (a.lastReviewed?.valueOf() ?? a.createdAt?.valueOf() ?? 0));
    }, [approvedRows, search, packFilter, categoryFilter]);

    return (
        <div>
            <div
                style={{
                    marginBottom: space(4),
                    padding: space(3),
                    background: colors.bgRaised,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: space(4),
                    alignItems: 'center',
                }}
            >
                <div>
                    <div style={microLabel}>Approved (canonical)</div>
                    <span style={{ fontFamily: fonts.mono, fontSize: '1.1rem', color: colors.success }}>
                        {approvedRows.length}
                    </span>
                </div>
                <div>
                    <div style={microLabel}>In review</div>
                    <span style={{ fontFamily: fonts.mono, fontSize: '1.1rem', color: colors.warm }}>
                        {inReviewCount}
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: colors.textMuted, flex: '1 1 240px', lineHeight: 1.5 }}>
                    This library shows
                    {' '}
                    <strong style={{ color: colors.text }}>Approved</strong>
                    {' '}
                    items only. Published status appears after the Publisher is built — not shown here yet.
                </p>
            </div>

            {approvedRows.length === 0 ? (
                <p style={{ fontFamily: fonts.mono, fontSize: '0.82rem', color: colors.textMuted, lineHeight: 1.6 }}>
                    No approved context yet.
                    {inReviewCount > 0
                        ? ` ${inReviewCount} item(s) waiting in the review queue — approve them on the Context Items page first.`
                        : ''}
                </p>
            ) : (
                <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space(3), marginBottom: space(4) }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 200px' }}>
                            <span style={microLabel}>Search</span>
                            <input
                                type="search"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Title, text, pack…"
                                className="clive-select"
                                style={{ fontSize: '0.74rem', padding: '8px 10px' }}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={microLabel}>Pack</span>
                            <select
                                value={packFilter}
                                onChange={e => setPackFilter(e.target.value)}
                                className="clive-select"
                                style={{ fontSize: '0.74rem', padding: '8px 10px' }}
                            >
                                <option value="">All packs</option>
                                {packOptions.map(pack => (
                                    <option key={pack} value={pack}>{pack}</option>
                                ))}
                            </select>
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={microLabel}>Category</span>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="clive-select"
                                style={{ fontSize: '0.74rem', padding: '8px 10px' }}
                            >
                                <option value="">All</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {filtered.length === 0 ? (
                        <p style={{ fontFamily: fonts.mono, fontSize: '0.82rem', color: colors.textMuted }}>
                            No approved items match this filter.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space(4) }}>
                            {filtered.map(row => (
                                <LibraryCard key={row.id} row={row} itemsTable={itemsTable} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
});
