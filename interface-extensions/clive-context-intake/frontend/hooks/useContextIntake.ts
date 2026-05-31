import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { INTAKE } from '../utils/constants';
import {
    cellBool,
    cellDate,
    cellSelectName,
    cellStr,
} from '../utils/cells';

export interface IntakeRow {
    id: string;
    title: string;
    rawSubmission: string;
    cleanSummary: string;
    category: string;
    destination: string;
    secondaryDestination: string;
    confidence: string;
    status: string;
    submittedBy: string;
    sourceInterface: string;
    suggestedAction: string;
    nextOwner: string;
    reasoning: string;
    sourceLink: string;
    userConfirmation: boolean;
    createdAt: Date | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useContextIntake(intakeTable: any): IntakeRow[] {
    const records = useRecords(intakeTable);

    return useMemo<IntakeRow[]>(() => {
        if (!records) return [];
        const rows: IntakeRow[] = [];

        for (const r of records) {
            rows.push({
                id: r.id,
                title: cellStr(r, INTAKE.TITLE),
                rawSubmission: cellStr(r, INTAKE.RAW_SUBMISSION),
                cleanSummary: cellStr(r, INTAKE.CLEAN_SUMMARY),
                category: cellSelectName(r, INTAKE.CATEGORY) ?? '',
                destination: cellSelectName(r, INTAKE.SUGGESTED_DESTINATION) ?? '',
                secondaryDestination: cellSelectName(r, INTAKE.SECONDARY_DESTINATION) ?? '',
                confidence: cellSelectName(r, INTAKE.CONFIDENCE) ?? '',
                status: cellSelectName(r, INTAKE.STATUS) ?? '',
                submittedBy: cellSelectName(r, INTAKE.SUBMITTED_BY) ?? '',
                sourceInterface: cellSelectName(r, INTAKE.SOURCE_INTERFACE) ?? '',
                suggestedAction: cellSelectName(r, INTAKE.SUGGESTED_ACTION) ?? '',
                nextOwner: cellSelectName(r, INTAKE.NEXT_OWNER) ?? '',
                reasoning: cellStr(r, INTAKE.REASONING),
                sourceLink: cellStr(r, INTAKE.SOURCE_LINK),
                userConfirmation: cellBool(r, INTAKE.USER_CONFIRMATION),
                createdAt: cellDate(r, INTAKE.CREATED_AT),
                raw: r,
            });
        }

        rows.sort((a, b) => {
            const at = a.createdAt?.valueOf() ?? 0;
            const bt = b.createdAt?.valueOf() ?? 0;
            return bt - at;
        });

        return rows;
    }, [records]);
}
