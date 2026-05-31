import { useMemo, useState } from 'react';
import type { CategoryTab } from '../utils/constants';
import { matchesSearch } from '../utils/cells';
import { colors, fonts, microLabel, space } from '../utils/theme';
import type { EmailRow } from '../hooks/useEmails';
import { sortByNewest } from '../hooks/useEmails';
import { EmailCard } from '../components/EmailCard';

interface InboxPageProps {
    rows: EmailRow[];
    activeTab: CategoryTab;
}

export function InboxPage({ rows, activeTab }: InboxPageProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        let list = rows;

        if (activeTab !== 'all') {
            list = list.filter(row => (row.emailCategory || 'Uncategorised') === activeTab);
        }

        if (searchQuery.trim()) {
            list = list.filter(row => matchesSearch(
                searchQuery,
                row.subject,
                row.from,
                row.fromEmail,
                row.aiSummary,
                row.bodyExcerpt,
                row.body,
            ));
        }

        return sortByNewest(list);
    }, [rows, activeTab, searchQuery]);

    const countLabel = `${filtered.length} email${filtered.length === 1 ? '' : 's'}`;

    return (
        <div style={{ fontFamily: fonts.sans }}>
            <div
                className="email-search-row"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(260px, 1fr) auto',
                    gap: space(3),
                    alignItems: 'center',
                    marginBottom: space(5),
                    padding: space(3),
                    background: colors.bgRaised,
                    border: `1px solid ${colors.border}`,
                }}
            >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={microLabel}>search subject, sender, summary, or body</span>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        placeholder="e.g. Hyperagent, invoice, Cursor"
                        className="clive-input"
                        style={{ fontSize: '0.9rem', padding: '12px 14px', width: '100%' }}
                    />
                </label>

                <span
                    style={{
                        ...microLabel,
                        color: colors.textMuted,
                        justifySelf: 'end',
                        padding: `${space(2)} ${space(3)}`,
                        border: `1px solid ${colors.border}`,
                        background: colors.bgInset,
                    }}
                >
                    {countLabel}
                </span>
            </div>

            {filtered.length === 0 ? (
                <div
                    style={{
                        padding: space(8),
                        textAlign: 'center',
                        fontFamily: fonts.mono,
                        fontSize: '0.8rem',
                        color: colors.textMuted,
                        background: colors.bgRaised,
                        border: `1px dashed ${colors.border}`,
                    }}
                >
                    No emails match this category and search.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: space(3) }}>
                    {filtered.map(row => (
                        <EmailCard key={row.id} row={row} />
                    ))}
                </div>
            )}
        </div>
    );
}
