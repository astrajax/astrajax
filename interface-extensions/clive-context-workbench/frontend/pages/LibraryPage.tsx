import { memo, useMemo, useState } from 'react';
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

export const LibraryPage = memo(function LibraryPage({ rows, itemsTable }: LibraryPageProps) {
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
    const confirmedCount = useMemo(
        () => approvedRows.filter(row => row.confirmedByHuman).length,
        [approvedRows],
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
            <section className="workbench-page-header">
                <div>
                    <div style={{ ...microLabel, color: colors.success }}>Approved context library</div>
                    <h2 style={{ margin: `${space(2)} 0 0`, fontSize: '1.45rem', lineHeight: 1.15, color: colors.text }}>
                        The shelf Clive is allowed to trust.
                    </h2>
                    <p style={{ margin: `${space(2)} 0 0`, fontSize: '0.92rem', color: colors.textMuted, maxWidth: 760, lineHeight: 1.6 }}>
                        This tab deliberately shows approved records only. Anything still in draft or proposed status belongs in the separate Context Items review queue before it becomes part of the working library.
                    </p>
                </div>
                <div className="workbench-stat-grid">
                    <div className="workbench-stat">
                        <div style={microLabel}>Approved</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.success }}>
                            {approvedRows.length}
                        </strong>
                    </div>
                    <div className="workbench-stat">
                        <div style={microLabel}>Confirmed</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.text }}>
                            {confirmedCount}
                        </strong>
                    </div>
                    <div className="workbench-stat">
                        <div style={microLabel}>In review elsewhere</div>
                        <strong style={{ display: 'block', marginTop: space(1), fontFamily: fonts.mono, fontSize: '1.25rem', color: colors.warm }}>
                            {inReviewCount}
                        </strong>
                    </div>
                </div>
            </section>

            {approvedRows.length === 0 ? (
                <p style={{ fontFamily: fonts.mono, fontSize: '0.82rem', color: colors.textMuted, lineHeight: 1.6 }}>
                    No approved context yet.
                    {inReviewCount > 0
                        ? ` ${inReviewCount} item(s) waiting in the review queue — approve them on the Context Items page first.`
                        : ''}
                </p>
            ) : (
                <>
                    <div className="workbench-filterbar">
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 200px' }}>
                            <span style={microLabel}>Search</span>
                            <input
                                type="search"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Title, text, pack…"
                                className="clive-select"
                                style={{ fontSize: '0.84rem', padding: '10px 12px' }}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span style={microLabel}>Pack</span>
                            <select
                                value={packFilter}
                                onChange={e => setPackFilter(e.target.value)}
                                className="clive-select"
                                style={{ fontSize: '0.84rem', padding: '10px 12px' }}
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
                                style={{ fontSize: '0.84rem', padding: '10px 12px' }}
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
                        <div className="workbench-card-list">
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
