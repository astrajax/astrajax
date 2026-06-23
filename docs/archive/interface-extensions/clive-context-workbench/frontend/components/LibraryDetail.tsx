import { BASE_ID } from '../utils/constants';
import { formatRelative } from '../utils/cells';
import { colors, fonts, space } from '../utils/theme';
import { CanonicalTextEditor } from './CanonicalTextEditor';
import { DetailField, DetailSection } from './DetailField';
import type { LibraryItemRow } from '../hooks/useLibraryItems';

const CONTEXT_ITEMS_TABLE_ID = 'tblisiZJQmQuBqEef';

interface LibraryDetailProps {
    row: LibraryItemRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export function LibraryDetail({ row, itemsTable }: LibraryDetailProps) {
    const airtableUrl = `https://airtable.com/${BASE_ID}/${CONTEXT_ITEMS_TABLE_ID}/${row.id}`;

    return (
        <div
            style={{
                marginTop: space(4),
                padding: space(4),
                background: '#FFFDF7',
                border: `1px solid ${colors.border}`,
            }}
        >
            <DetailSection title="Canonical text">
                <CanonicalTextEditor
                    recordId={row.id}
                    value={row.canonicalText}
                    itemsTable={itemsTable}
                />
            </DetailSection>

            <DetailSection title="Governance">
                <DetailField label="Confirmed by" value={row.confirmedByHuman} />
                <DetailField label="Owner" value={row.owner} />
                <DetailField label="Authority" value={row.authority} />
                <DetailField label="Freshness" value={row.freshness} />
                <DetailField label="Applies to" value={row.appliesTo.join(', ')} />
                <DetailField label="Packs" value={row.packNames.join(', ')} />
                <DetailField
                    label="Last reviewed"
                    value={row.lastReviewed ? formatRelative(row.lastReviewed) : ''}
                />
            </DetailSection>

            <p style={{ margin: `${space(3)} 0 0`, fontSize: '0.68rem', color: colors.textDim, fontFamily: fonts.mono }}>
                Record ID: {row.id}
                {' · '}
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
