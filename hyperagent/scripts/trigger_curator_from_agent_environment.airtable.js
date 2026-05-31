// @ts-nocheck
/**
 * Agent Environments automation: Trigger Curator checkbox → Hyperagent Curator webhook.
 *
 * Trigger: When record matches → Trigger Curator is checked
 * Action: Run script
 *
 * Input variables:
 *   recordId = {{recordId}}
 *   webhookUrl = Hyperagent Clive Curator /receive URL
 *   target = optional override (default maps from Agent Name)
 *   checks = optional (default stale,conflicts,duplicates,unsupported,risky)
 *
 * Secret: HYPERAGENT_WEBHOOK_SECRET
 *
 * Setup: hyperagent/docs/clive-curator-webhook-setup.md
 */

const TABLE_NAME = 'Agent Environments';
const TRIGGER_FIELD = 'Trigger Curator';
const AGENT_NAME_FIELD = 'Agent Name';

const TARGET_BY_AGENT = {
    'Clive Curator': 'curator',
    'Clive Intake': 'clive-core',
    'Clive Agent Factory': 'agent-factory',
    'Clive Publisher': 'context-packs',
    'Clive Scanner': 'clive-core',
    'Clive Hyperagent Release Scanner': 'hyperagent-platform',
};

const cfg = input.config();

function pickStr(obj, keys, fallback = '') {
    for (const key of keys) {
        const value = obj[key];
        if (value != null && String(value).trim() !== '') return String(value).trim();
    }
    return fallback;
}

function readSecret() {
    const names = ['HYPERAGENT_WEBHOOK_SECRET', 'CLIVE_CURATOR_WEBHOOK_SECRET'];
    if (input.secret && typeof input.secret === 'function') {
        for (const name of names) {
            try {
                const value = input.secret(name);
                if (value != null && String(value).trim() !== '') {
                    return String(value).trim();
                }
            } catch (_) {
                // not linked
            }
        }
    }
    return pickStr(cfg, ['webhookSecret', 'hyperagentWebhookSecret']);
}

const recordId = pickStr(cfg, ['recordId']);
if (!recordId) throw new Error('Missing recordId input variable.');

const webhookUrl = pickStr(cfg, ['webhookUrl', 'hyperagentWebhookUrl']);
if (!webhookUrl) throw new Error('Missing webhookUrl input variable.');

const secret = readSecret();
if (!secret) {
    throw new Error('HYPERAGENT_WEBHOOK_SECRET not set on Secrets tab.');
}

const table = base.getTable(TABLE_NAME);
const record = await table.selectRecordAsync(recordId);
if (!record) throw new Error(`Record not found: ${recordId}`);

const agentName = pickStr({ n: record.getCellValueAsString(AGENT_NAME_FIELD) }, ['n']);
const target = pickStr(cfg, ['target'], TARGET_BY_AGENT[agentName] || 'daily');
const checks = pickStr(cfg, ['checks'], 'stale,conflicts,duplicates,unsupported,risky');

const payload = {
    mode: 'curator-audit',
    target,
    checks,
    requestedBy: 'Clive Workbench',
    source: 'airtable-agent-environments-trigger-curator',
    agentName,
    recordId,
    requestedAt: new Date().toISOString(),
    message: `Curator audit from Agent Environments (${agentName || 'unknown'}) target=${target}`,
};

const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Hyperagent-Webhook-Secret': secret,
    },
    body: JSON.stringify(payload),
});

const body = await response.text().catch(() => '');
if (response.status < 200 || response.status >= 300) {
    throw new Error(`Hyperagent curator webhook HTTP ${response.status}: ${body.slice(0, 300)}`);
}

let runId = null;
try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed.runId === 'string') runId = parsed.runId;
} catch (_) {
    // ignore
}

await table.updateRecordAsync(recordId, { [TRIGGER_FIELD]: false });

output.set('webhookOk', true);
output.set('webhookStatus', response.status);
output.set('webhookRunId', runId);
output.set('target', target);
output.set('agentName', agentName);
output.set('response', body.slice(0, 500));
