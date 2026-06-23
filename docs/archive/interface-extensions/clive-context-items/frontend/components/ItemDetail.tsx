import React from 'react';
import { BASE_ID, CONTEXT_ITEMS_TABLE_ID } from '../utils/constants';
import { formatRelative } from '../utils/cells';
import { colors, fonts, space } from '../utils/theme';
import { CanonicalTextEditor } from './CanonicalTextEditor';
import { DetailField, DetailSection } from './DetailField';
import type { ContextItemRow } from '../hooks/useContextItems';

interface ItemDetailProps {
    row: ContextItemRow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemsTable: any;
}

export function ItemDetail({ row, itemsTable }: ItemDetailProps) {
    const airtableUrl = `https://airtable.com/${BASE_ID}/${CONTEXT_ITEMS_TABLE_ID}/${row.id}`;

    return (
        <div
            style={{
                marginTop: space(3),
                padding: space(3),
                background: colors.bgInset,
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

            <DetailSection title="Provenance">
                <DetailField label="Proposed by agent" value={row.proposedByAgent} />
                <DetailField label="Created by" value={row.createdBy} />
                <DetailField label="Confirmed by" value={row.confirmedByHuman} />
                <DetailField label="Confirmation method" value={row.confirmationMethod} />
                <DetailField label="Bootstrap source" value={row.bootstrapSource} mono />
                <DetailField label="Source notes" value={row.sourceNotes} multiline />
            </DetailSection>

            <DetailSection title="Governance">
                <DetailField label="Status" value={row.status} />
                <DetailField label="Category" value={row.category} />
                <DetailField label="Owner" value={row.owner} />
                <DetailField label="Authority" value={row.authority} />
                <DetailField label="Freshness" value={row.freshness} />
                <DetailField
                    label="Created"
                    value={row.createdAt ? formatRelative(row.createdAt) : ''}
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
