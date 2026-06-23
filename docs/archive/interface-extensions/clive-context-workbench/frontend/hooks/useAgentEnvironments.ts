import { useMemo } from 'react';
import { useRecords } from '@airtable/blocks/interface/ui';
import { AGENT } from '../utils/constants';
import {
    cellDate,
    cellCheckbox,
    cellLinkedNames,
    cellMultiSelectNames,
    cellSelectName,
    cellStr,
} from '../utils/cells';

export interface AgentEnvironmentRow {
    id: string;
    agentName: string;
    platform: string[];
    purpose: string;
    runtimeEnvironment: string;
    skills: string;
    toolPermissions: string;
    owner: string;
    status: string;
    repoPath: string;
    packNames: string[];
    lastConfigReview: Date | null;
    notes: string;
    triggerCurator: boolean;
    triggerScanner: boolean;
    createdAt: Date | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAgentEnvironments(agentsTable: any): AgentEnvironmentRow[] | null {
    const records = useRecords(agentsTable);

    return useMemo<AgentEnvironmentRow[] | null>(() => {
        if (records === null) return null;
        return records.map(record => ({
            id: record.id,
            agentName: cellStr(record, AGENT.AGENT_NAME),
            platform: cellMultiSelectNames(record, AGENT.PLATFORM),
            purpose: cellStr(record, AGENT.PURPOSE),
            runtimeEnvironment: cellStr(record, AGENT.RUNTIME_ENVIRONMENT),
            skills: cellStr(record, AGENT.SKILLS),
            toolPermissions: cellStr(record, AGENT.TOOL_PERMISSIONS),
            owner: cellSelectName(record, AGENT.OWNER) ?? '',
            status: cellSelectName(record, AGENT.STATUS) ?? '',
            repoPath: cellStr(record, AGENT.REPO_PATH),
            packNames: cellLinkedNames(record, AGENT.CONTEXT_PACKS),
            lastConfigReview: cellDate(record, AGENT.LAST_CONFIG_REVIEW),
            notes: cellStr(record, AGENT.NOTES),
            triggerCurator: cellCheckbox(record, AGENT.TRIGGER_CURATOR),
            triggerScanner: cellCheckbox(record, AGENT.TRIGGER_SCANNER),
            createdAt: cellDate(record, AGENT.CREATED_AT),
            raw: record,
        }));
    }, [records]);
}
