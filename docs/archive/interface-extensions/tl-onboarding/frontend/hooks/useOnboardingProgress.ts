import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { PROGRESS_FIELDS } from '../utils/constants';
import { cellBool, cellLinkedIds, cellSelectName, cellStr } from '../utils/cells';

export interface ModuleProgress {
    id: string;
    moduleId: string;
    completed: boolean;
    tlNotes: string;
    question: string;
    questionStatus: string | null;
    matthewReply: string;
}

export type ProgressByModuleId = Map<string, ModuleProgress>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOnboardingProgress(progressTable: any): ProgressByModuleId {
    const records = useRecords(progressTable);

    return useMemo(() => {
        const map: ProgressByModuleId = new Map();
        if (!records) return map;

        for (const r of records) {
            const moduleIds = cellLinkedIds(r, PROGRESS_FIELDS.MODULE);
            const moduleId = moduleIds[0];
            if (!moduleId) continue;

            map.set(moduleId, {
                id: r.id,
                moduleId,
                completed: cellBool(r, PROGRESS_FIELDS.COMPLETED),
                tlNotes: cellStr(r, PROGRESS_FIELDS.TL_NOTES),
                question: cellStr(r, PROGRESS_FIELDS.QUESTION),
                questionStatus: cellSelectName(r, PROGRESS_FIELDS.QUESTION_STATUS),
                matthewReply: cellStr(r, PROGRESS_FIELDS.MATTHEW_REPLY),
            });
        }
        return map;
    }, [records]);
}

export function countCompleted(progress: ProgressByModuleId): number {
    let n = 0;
    progress.forEach(p => { if (p.completed) n += 1; });
    return n;
}

export function countOpenQuestions(progress: ProgressByModuleId): number {
    let n = 0;
    progress.forEach(p => {
        if (p.questionStatus === 'Open') n += 1;
    });
    return n;
}
