// @ts-nocheck
/**
 * Agent Environments automation: Trigger Scanner checkbox → Hyperagent Context Scanner webhook.
 *
 * Trigger: When record matches → Trigger Scanner is checked
 * Action: Run script
 *
 * Input variables:
 *   recordId = {{recordId}}
 *   webhookUrl = Hyperagent Clive Context Scanner /receive URL
 *   previewOnly = optional "true" to gather and preview claims only (no Intake creates)
 *
 * Secret: HYPERAGENT_WEBHOOK_SECRET (or CLIVE_SCANNER_WEBHOOK_SECRET)
 *
 * Hyperagent webhook instructions (paste on the Scanner agent trigger):
 *   Always run Clive Context Scanner immediately. Pass the full JSON POST body as the user message.
 *   Treat mode=manual as a Workbench manual scan. Do not post to Slack unless mode=scheduled.
 *
 * Setup: hyperagent/docs/clive-scanner-webhook-setup.md
 */

const TABLE_NAME = 'Agent Environments';
const TRIGGER_FIELD = 'Trigger Scanner';
const AGENT_NAME_FIELD = 'Agent Name';
const EXPECTED_AGENT = 'Clive Scanner';

const cfg = input.config();

function pickStr(obj, keys, fallback = '') {
    for (const key of keys) {
        const value = obj[key];
        if (value != null && String(value).trim() !== '') return String(value).trim();
    }
    return fallback;
}

function pickBool(obj, keys, fallback = false) {
    for (const key of keys) {
        const value = obj[key];
        if (value === true || value === false) return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
    }
    return fallback;
}

function readSecret() {
    const names = [
        'HYPERAGENT_WEBHOOK_SECRET',
        'CLIVE_SCANNER_WEBHOOK_SECRET',
        'CLIVE_CURATOR_WEBHOOK_SECRET',
    ];
    if (input.secret && typeof input.secret === 'function') {
        for (const name of names) {
            try {
                const value = input.secret(name);
                if (value != null && String(value).trim() !== '') {
                    return { secret: String(value).trim(), source: `secrets:${name}` };
                }
            } catch (_) {
                // not linked
            }
        }
    }
    const fromInput = pickStr(cfg, ['webhookSecret', 'hyperagentWebhookSecret']);
    if (fromInput) return { secret: fromInput, source: 'input-variable' };
    return { secret: '', source: 'none' };
}

const recordId = pickStr(cfg, ['recordId']);
if (!recordId) throw new Error('Missing recordId input variable.');

const webhookUrl = pickStr(cfg, ['webhookUrl', 'hyperagentWebhookUrl', 'scannerWebhookUrl']);
if (!webhookUrl) throw new Error('Missing webhookUrl input variable.');

const secretInfo = readSecret();
if (!secretInfo.secret) {
    throw new Error(
        'HYPERAGENT_WEBHOOK_SECRET not set on Secrets tab (or CLIVE_SCANNER_WEBHOOK_SECRET).',
    );
}

const table = base.getTable(TABLE_NAME);
const record = await table.selectRecordAsync(recordId);
if (!record) throw new Error(`Record not found: ${recordId}`);

const agentName = pickStr({ n: record.getCellValueAsString(AGENT_NAME_FIELD) }, ['n']);
if (agentName && agentName !== EXPECTED_AGENT) {
    throw new Error(
        `Trigger Scanner fired on "${agentName}" — expected row "${EXPECTED_AGENT}". `
        + 'Point this automation at the Clive Scanner Agent Environment record only.',
    );
}

const previewOnly = pickBool(cfg, ['previewOnly', 'preview_only'], false);
const requestedBy = pickStr(cfg, ['requestedBy'], 'Clive Workbench');

const payload = {
    mode: 'manual',
    previewOnly,
    requestedBy,
    source: 'airtable-agent-environments-trigger-scanner',
    agentName: agentName || EXPECTED_AGENT,
    recordId,
    requestedAt: new Date().toISOString(),
    message: previewOnly
        ? 'Manual Scanner run (preview only). Gather material, apply the analyst standard, preview kept claims and reasons. Do not create Context Intake rows. Do not post to Slack.'
        : 'Manual Scanner run from Clive Workbench. Gather material, apply the analyst standard, preview kept claims, then create Context Intake rows for strong candidates through the pinned create script. Do not post to Slack.',
};

const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Hyperagent-Webhook-Secret': secretInfo.secret,
    },
    body: JSON.stringify(payload),
});

const body = await response.text().catch(() => '');
if (response.status < 200 || response.status >= 300) {
    if (response.status === 403 && /invalid webhook secret/i.test(body)) {
        throw new Error(
            'Hyperagent HTTP 403: Invalid webhook secret. Re-copy from the Scanner agent webhook '
            + 'and set HYPERAGENT_WEBHOOK_SECRET on Secrets tab only.',
        );
    }
    throw new Error(`Hyperagent scanner webhook HTTP ${response.status}: ${body.slice(0, 300)}`);
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
output.set('secretSource', secretInfo.source);
output.set('previewOnly', previewOnly);
output.set('agentName', agentName || EXPECTED_AGENT);
output.set('response', body.slice(0, 500));
