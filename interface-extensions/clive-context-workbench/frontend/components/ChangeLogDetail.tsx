import { BASE_ID } from '../utils/constants';
import { formatRelative } from '../utils/cells';
import { colors, fonts, space } from '../utils/theme';
import { DetailField, DetailSection } from './DetailField';
import type { ChangeLogRow } from '../hooks/useChangeLog';

const CHANGE_LOG_TABLE_ID = 'tbl9jCEYH1mM8b7T2';

interface ChangeLogDetailProps {
    row: ChangeLogRow;
}

export function ChangeLogDetail({ row }: ChangeLogDetailProps) {
    const airtableUrl = `https://airtable.com/${BASE_ID}/${CHANGE_LOG_TABLE_ID}/${row.id}`;

    return (
        <div
            style={{
                marginTop: space(4),
                padding: space(4),
                background: '#FFFDF7',
                border: `1px solid ${colors.border}`,
            }}
        >
            <DetailSection title="Change">
                <DetailField label="Summary" value={row.changeSummary} multiline />
                <DetailField label="Type" value={row.changeType} />
                <DetailField label="Status" value={row.status} />
                <DetailField label="Destination" value={row.destination.join(', ')} />
            </DetailSection>

            <DetailSection title="People">
                <DetailField label="Changed by" value={row.changedBy} />
                <DetailField label="Approved by" value={row.approvedBy} />
                <DetailField
                    label="When"
                    value={row.createdAt ? `${row.createdAt.toISOString().slice(0, 16).replace('T', ' ')} (${formatRelative(row.createdAt)})` : ''}
                />
            </DetailSection>

            <DetailSection title="Publish trace">
                <DetailField label="Published path" value={row.publishedPath} mono multiline />
                <DetailField label="Commit SHA" value={row.commitSha} mono />
            </DetailSection>

            {row.notes ? (
                <DetailSection title="Notes">
                    <div style={{ gridColumn: '1 / -1' }}>
                        <DetailField label="Notes" value={row.notes} multiline />
                    </div>
                </DetailSection>
            ) : null}

            <DetailSection title="Audit hashes">
                <DetailField label="Prev hash" value={row.prevHash || '(genesis)'} mono multiline />
                <DetailField label="Entry hash" value={row.entryHash} mono multiline />
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
                {' '}
                (new tab — only if you need the native editor)
            </p>
        </div>
    );
}
