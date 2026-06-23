import React from 'react';
import { BASE_ID, CONTEXT_INTAKE_TABLE_ID } from '../utils/constants';
import { formatRelative } from '../utils/cells';
import { colors, fonts, space } from '../utils/theme';
import { DetailField, DetailSection } from './DetailField';
import type { IntakeRow } from '../hooks/useContextIntake';

interface IntakeDetailProps {
    row: IntakeRow;
}

export function IntakeDetail({ row }: IntakeDetailProps) {
    const airtableUrl = `https://airtable.com/${BASE_ID}/${CONTEXT_INTAKE_TABLE_ID}/${row.id}`;

    return (
        <div
            style={{
                marginTop: space(3),
                padding: space(3),
                background: colors.bgInset,
                border: `1px solid ${colors.border}`,
            }}
        >
            <DetailSection title="Submission">
                <div style={{ gridColumn: '1 / -1' }}>
                    <DetailField label="Clean summary" value={row.cleanSummary} multiline />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <DetailField label="Raw submission" value={row.rawSubmission} multiline />
                </div>
            </DetailSection>

            {row.reasoning ? (
                <DetailSection title="Agent reasoning">
                    <div style={{ gridColumn: '1 / -1' }}>
                        <DetailField label="Reasoning" value={row.reasoning} multiline />
                    </div>
                </DetailSection>
            ) : null}

            <DetailSection title="Routing">
                <DetailField label="Status" value={row.status} />
                <DetailField label="Category" value={row.category} />
                <DetailField label="Destination" value={row.destination} />
                <DetailField label="Secondary destination" value={row.secondaryDestination} />
                <DetailField label="Suggested action" value={row.suggestedAction} />
                <DetailField label="Next owner" value={row.nextOwner} />
                <DetailField label="Confidence" value={row.confidence} />
            </DetailSection>

            <DetailSection title="Source">
                <DetailField label="Submitted by" value={row.submittedBy} />
                <DetailField label="Source interface" value={row.sourceInterface} />
                <DetailField label="User confirmed" value={row.userConfirmation ? 'Yes' : 'No'} />
                {row.sourceLink ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <DetailField label="Source link" value={row.sourceLink} mono />
                    </div>
                ) : null}
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
