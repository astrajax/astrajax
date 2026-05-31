import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { FIELDS } from '../utils/constants';
import { cellAttachments, cellBool, cellNum, cellSelectName, cellStr, cellUrl, type CellAttachment } from '../utils/cells';

export interface OnboardingModule {
    id: string;
    title: string;
    sortOrder: number;
    section: string;
    summary: string;
    htmlBody: string;
    readTimeMin: number;
    essential: boolean;
    slidesPdf: CellAttachment[];
    slidesUrl: string;
    videoUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOnboardingModules(onboardingTable: any): OnboardingModule[] {
    const records = useRecords(onboardingTable);

    return useMemo(() => {
        if (!records) return [];
        const rows: OnboardingModule[] = records.map(r => ({
            id: r.id,
            title: cellStr(r, FIELDS.TITLE),
            sortOrder: cellNum(r, FIELDS.SORT_ORDER) ?? 999,
            section: cellSelectName(r, FIELDS.SECTION) ?? 'Reference',
            summary: cellStr(r, FIELDS.SUMMARY),
            htmlBody: cellStr(r, FIELDS.HTML_BODY),
            readTimeMin: cellNum(r, FIELDS.READ_TIME) ?? 5,
            essential: cellBool(r, FIELDS.ESSENTIAL),
            slidesPdf: cellAttachments(r, FIELDS.SLIDES_PDF),
            slidesUrl: cellUrl(r, FIELDS.SLIDES_URL),
            videoUrl: cellUrl(r, FIELDS.VIDEO_URL),
        }));
        rows.sort((a, b) => a.sortOrder - b.sortOrder);
        return rows;
    }, [records]);
}
